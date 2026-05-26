/**
 * SePay Payment Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Kiến trúc KHÔNG cần server/webhook (phù hợp Firebase Spark plan):
 *
 *   1. Tạo QR code → hiển thị cho khách scan (instant, no API)
 *   2. Polling SePay API mỗi 5s để kiểm tra giao dịch
 *   3. Khi phát hiện tiền vào → callback → cập nhật Firestore từ client
 *
 * ⚠️  VITE_SEPAY_API_TOKEN lộ ra client — chấp nhận được vì:
 *     - Token chỉ có quyền READ transactions (không thể rút tiền)
 *     - Firestore Security Rules bảo vệ data write
 *     - Nâng Blaze plan trong tương lai → chuyển sang Cloud Function
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentItem {
  name: string;
  description?: string;
  quantity: number;
  price: number; // VND
}

export interface SePayQRParams {
  accountNumber: string;
  bank: string;
  amount: number;
  description: string;
  size?: number;
}

export interface SePayQRResult {
  success: true;
  qrImageUrl: string;
  description: string;
  amount: number;
}

export interface SePayTransaction {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount: string | null;
  code: string | null;
  content: string;
  transferType: 'in' | 'out';
  description: string;
  transferAmount: number;
  referenceCode: string;
  accumulated: number;
}

export interface PollingOptions {
  /** Interval giữa các lần poll (ms). Mặc định 5000 */
  intervalMs?: number;
  /** Timeout tối đa chờ thanh toán (ms). Mặc định 10 phút */
  timeoutMs?: number;
  /** Callback khi tìm thấy giao dịch hợp lệ */
  onSuccess: (transaction: SePayTransaction) => void | Promise<void>;
  /** Callback khi timeout */
  onTimeout?: () => void;
  /** Callback mỗi lần poll (để update countdown UI) */
  onPoll?: (attempt: number) => void;
}

export interface PollingController {
  /** Dừng polling */
  stop: () => void;
  /** Polling đang chạy? */
  isRunning: () => boolean;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SEPAY_ACCOUNT   = process.env.NEXT_PUBLIC_SEPAY_BANK_ACCOUNT || '';
const SEPAY_BANK      = process.env.NEXT_PUBLIC_SEPAY_BANK_NAME    || '';
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN    || '';
const SEPAY_API_BASE  = 'https://my.sepay.vn/userapi';
const SEPAY_QR_BASE   = 'https://qr.sepay.vn/img';

// ---------------------------------------------------------------------------
// QR Generation (client-safe, no API key)
// ---------------------------------------------------------------------------

export function generateOrderCode(): string {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DH${ts}${rand}`;
}

export function buildSePayQRUrl(params: SePayQRParams): string {
  const url = new URL(SEPAY_QR_BASE);
  url.searchParams.set('acc',    params.accountNumber);
  url.searchParams.set('bank',   params.bank);
  url.searchParams.set('amount', String(params.amount));
  url.searchParams.set('des',    params.description);
  if (params.size) url.searchParams.set('size', String(params.size));
  return url.toString();
}

export function createSePayPayment(
  orderCode: string,
  amount: number,
  extraDescription?: string
): SePayQRResult {
  if (!SEPAY_ACCOUNT || !SEPAY_BANK) {
    throw new Error('SePay not configured: set VITE_SEPAY_BANK_ACCOUNT và VITE_SEPAY_BANK_NAME');
  }
  const description = extraDescription ?? `Thanh toan don hang ${orderCode}`;
  const qrImageUrl  = buildSePayQRUrl({
    accountNumber: SEPAY_ACCOUNT,
    bank:          SEPAY_BANK,
    amount,
    description,
    size:          300,
  });
  return { success: true, qrImageUrl, description, amount };
}

// ---------------------------------------------------------------------------
// SePay REST API — Fetch transaction
// ---------------------------------------------------------------------------

/**
 * Truy vấn danh sách giao dịch từ SePay API.
 * Rate limit: 3 req/s
 */
export async function fetchSePayTransaction(
  orderCode: string
): Promise<SePayTransaction | null> {
  if (!SEPAY_API_TOKEN) {
    console.warn('VITE_SEPAY_API_TOKEN chưa đặt. Không thể kiểm tra giao dịch.');
    return null;
  }

  try {
    const targetUrl = new URL(`${SEPAY_API_BASE}/transactions/list`);
    targetUrl.searchParams.set('transaction_content', orderCode);
    targetUrl.searchParams.set('limit', '10');

    // Dùng corsproxy.io để vượt qua lỗi CORS của browser khi không có backend
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl.toString())}`;

    const res = await fetch(proxyUrl, {
      headers: {
        Authorization:  `Bearer ${SEPAY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      // Rate limited — đợi theo header
      const retryAfter = Number(res.headers.get('x-sepay-userapi-retry-after') ?? 1);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      return fetchSePayTransaction(orderCode); // retry
    }

    if (!res.ok) {
      console.error('SePay API error:', res.status, res.statusText);
      return null;
    }

    const json = await res.json();
    const transactions: SePayTransaction[] = json?.transactions ?? [];

    // Tìm giao dịch tiền VÀO khớp orderCode
    return transactions.find(
      t => t.transferType === 'in' && t.content?.includes(orderCode)
    ) ?? null;
  } catch (err) {
    console.error('SePay fetch error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Polling — thay thế webhook cho Spark plan
// ---------------------------------------------------------------------------

/**
 * Bắt đầu polling SePay API để phát hiện thanh toán.
 *
 * Trả về PollingController để dừng khi cần (ví dụ: unmount component).
 *
 * @example
 * const ctrl = pollSePayPayment('DHABC123', {
 *   onSuccess: async (tx) => {
 *     await updateDoc(invoiceRef, { status: 'paid', ... });
 *   },
 *   onTimeout: () => toast.error('Hết giờ thanh toán'),
 * });
 *
 * // Cleanup
 * return () => ctrl.stop();
 */
export function pollSePayPayment(
  orderCode: string,
  options: PollingOptions
): PollingController {
  const {
    intervalMs = 5000,
    timeoutMs  = 10 * 60 * 1000, // 10 phút
    onSuccess,
    onTimeout,
    onPoll,
  } = options;

  let running   = true;
  let attempt   = 0;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  // Timeout tổng
  const timeoutId = setTimeout(() => {
    if (!running) return;
    running = false;
    if (timerId) clearTimeout(timerId);
    console.warn(`[SePay Poll] ⏰  Timeout sau ${timeoutMs / 1000}s — ${orderCode}`);
    onTimeout?.();
  }, timeoutMs);

  async function poll() {
    if (!running) return;

    attempt++;
    onPoll?.(attempt);

    try {
      const tx = await fetchSePayTransaction(orderCode);
      if (tx) {
        running = false;
        clearTimeout(timeoutId);
        console.log(`[SePay Poll] ✅  Thanh toán ${tx.transferAmount.toLocaleString('vi-VN')}đ — ${orderCode}`);
        await onSuccess(tx);
        return;
      }
    } catch (err) {
      console.error('[SePay Poll] ❌  Poll error:', err);
    }

    if (running) {
      timerId = setTimeout(poll, intervalMs);
    }
  }

  // Bắt đầu sau 3s (để người dùng có thời gian scan QR)
  timerId = setTimeout(poll, 3000);

  return {
    stop:      () => { running = false; if (timerId) clearTimeout(timerId); clearTimeout(timeoutId); },
    isRunning: () => running,
  };
}
