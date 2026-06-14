import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BillingWorkflow, PaymentSession, BillingDetails } from '@/lib/services/BillingWorkflow';
import { PollingController } from '@/lib/services/sepay';
import { CreditCard, FileText, Loader2, CheckCircle2,
  QrCode, X, RefreshCw, Clock, FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { strapiFetch } from '@/lib/strapi';

interface BillingActionProps {
  customerName:  string;
  customerEmail: string;
  /** Tên thương vụ/dự án — hiển thị trong nội dung QR và hóa đơn */
  dealTitle?: string;
  /** Firestore deal ID — dùng để update deal.stage khi paid */
  dealId?: string;
  /** Số tiền thanh toán (VND) — lấy từ deal.value */
  amount?: number;
  /** Tên nhân viên phụ trách */
  salespersonName?: string;
  /** Callback khi thanh toán hoàn tất — parent nên refetch data */
  onPaymentComplete?: () => void;
}

type Step = 'idle' | 'qr_shown' | 'paid' | 'finalizing' | 'done' | 'timeout';


export const BillingAction: React.FC<BillingActionProps> = ({
  customerName, customerEmail, dealId, dealTitle, amount, salespersonName, onPaymentComplete,
}) => {
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState<Step>('idle');
  const [session,  setSession]  = useState<PaymentSession | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(600); // 10 phút

  const controllerRef = useRef<PollingController | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.stop();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── BƯỚC 1: Tạo thanh toán ─────────────────────────────────────────────
  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      // Items dựa trên deal value thực
      const dealAmount = amount ?? 0;
      const itemName = dealTitle ? `TT: ${dealTitle}` : 'Thanh toán deal';
      const billingItems: BillingDetails['items'] = [{
        name: itemName,
        quantity: 1,
        price: dealAmount,
      }];

      const result = await BillingWorkflow.initiatePayment({
        customerName,
        customerEmail,
        dealTitle,
        items: billingItems,
      });

      setSession(result);
      setStep('qr_shown');
      setTimeLeft(600);

      toast.success(
        result.emailSent
          ? 'Đã tạo mã QR và gửi email cho khách hàng!'
          : 'Đã tạo mã QR (cần cấu hình Resend để gửi email).'
      );

      // ── BƯỚC 2: Bắt đầu polling tự động ──────────────────────────────
      controllerRef.current = BillingWorkflow.waitForPayment(
        result,
        async (_tx) => {
          setStep('paid');
          if (countdownRef.current) clearInterval(countdownRef.current);
          toast('💰 Thanh toán thành công!', { icon: null });

          // Deal stage, email and contract are now safely handled by the SePay Webhook.

          // Tự động tạo invoice sau 1s
          setTimeout(() => handleFinalizeInvoice(result), 1000);
        },
        () => {
          setStep('timeout');
          if (countdownRef.current) clearInterval(countdownRef.current);
          toast.error('Hết thời gian thanh toán. Vui lòng thử lại.');
        }
      );

      // Countdown UI
      let remaining = 600;
      countdownRef.current = setInterval(() => {
        remaining--;
        setTimeLeft(remaining);
        setPollCount(c => c + 1); // cập nhật UI
        if (remaining <= 0 && countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      }, 1000);

    } catch (error: unknown) {
      toast.error('Lỗi tạo thanh toán: ' + (error instanceof Error ? error.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  // ── BƯỚC 3: Tạo PDF invoice ────────────────────────────────────────────
  const handleFinalizeInvoice = async (s: PaymentSession) => {
    setLoading(true);
    setStep('finalizing');
    try {
      const invoiceItems: BillingDetails['items'] = [{
        name: dealTitle ? `TT: ${dealTitle}` : 'Thanh toán deal',
        quantity: 1,
        price: amount ?? s.amount,
      }];
      const result = await BillingWorkflow.finalizeInvoice(s.orderCode, {
        customerName,
        customerEmail,
        dealTitle,
        salespersonName,
        items: invoiceItems,
      }, true);

      if (result.emailSent) {
        toast.success(`Hóa đơn ${result.invoiceNumber} đã xuất thành công và gửi tới email ${customerEmail}!`);
      } else {
        const errorMsg = result.emailError ? `: ${result.emailError}` : '';
        toast.warning(`Hóa đơn ${result.invoiceNumber} đã xuất thành công (nhưng không gửi được email${errorMsg}). Vui lòng kiểm tra cấu hình Resend.`);
      }
      setStep('done');

      // Notify parent to refresh deal data (stage should now be 'closed')
      onPaymentComplete?.();

      // Auto-download PDF
      const url  = URL.createObjectURL(result.pdfBlob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${result.invoiceNumber}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error: unknown) {
      toast.error('Lỗi tạo hóa đơn: ' + (error instanceof Error ? error.message : 'Unknown'));
      setStep('paid');
    } finally {
      setLoading(false);
    }
  };

  // ── [DEV] Test Email + PDF không cần thanh toán thật ──────────────────
  const handleTestMode = async () => {
    setLoading(true);
    try {
      const fakeOrderCode = `TEST-${Date.now().toString(36).toUpperCase()}`;
      const itemName = dealTitle ? `TT: ${dealTitle}` : 'Test Invoice';
      const fakeSession: PaymentSession = {
        orderCode:   fakeOrderCode,
        qrImageUrl:  '',
        amount:      amount ?? 100000,
        description: fakeOrderCode,
        emailSent:   false,
        invoiceId:   '',
      };

      toast.info('🧪 Chạy test Resend + react-pdf...');
      const invoiceItems: BillingDetails['items'] = [{
        name: itemName,
        quantity: 1,
        price: amount ?? 100000,
      }];
      const result = await BillingWorkflow.finalizeInvoice(fakeOrderCode, {
        customerName,
        customerEmail,
        dealTitle,
        items: invoiceItems,
      });

      toast.success(`✅ Test OK! Invoice ${result.invoiceNumber} ${
        result.emailSent ? `đã gửi tới ${customerEmail}` : '(email chưa cấu hình)'
      }`);
      setStep('done');

      // Download PDF để xem trực tiếp
      const url  = URL.createObjectURL(result.pdfBlob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `${result.invoiceNumber}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      void fakeSession; // avoid unused warning
    } catch (err: unknown) {
      toast.error('Test thất bại: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    controllerRef.current?.stop();
    if (countdownRef.current) clearInterval(countdownRef.current);
    setStep('idle');
    setSession(null);
    setPollCount(0);
    setTimeLeft(600);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (step === 'done') {
    return (
      <div className="flex items-center gap-2 text-emerald-600 font-medium text-xs">
        <CheckCircle2 className="h-4 w-4" /> Hoàn tất thanh toán
      </div>
    );
  }

  if (step === 'finalizing') {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-xs">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo hóa đơn...
      </div>
    );
  }

  if (step === 'paid') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs max-w-[220px]">
        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          Thanh toán thành công!
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => session && handleFinalizeInvoice(session)}
          disabled={loading}
          className="h-7 rounded-lg border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 gap-1.5 text-xs"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
          Xuất hóa đơn PDF
        </Button>
      </div>
    );
  }

  if (step === 'timeout') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-red-200/50 bg-red-50/30 dark:bg-red-950/20 text-xs max-w-[220px]">
        <p className="text-red-500 font-medium flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Hết thời gian thanh toán
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreatePayment}
          className="h-7 rounded-lg gap-1.5 text-xs"
        >
          <RefreshCw className="h-3 w-3" /> Tạo lại QR
        </Button>
      </div>
    );
  }

  if (step === 'qr_shown' && session) {
    const amountFormatted = new Intl.NumberFormat('vi-VN', {
      style: 'currency', currency: 'VND',
    }).format(session.amount);

    const mins = Math.floor(timeLeft / 60);
    const secs = String(timeLeft % 60).padStart(2, '0');

    return (
      <div className="flex flex-col gap-2 p-3 rounded-xl border border-blue-200/50 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800/30 text-xs max-w-[220px]">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5" /> SePay QR
          </span>
          <button
            className="text-slate-400 hover:text-slate-600"
            onClick={handleCancel}
            aria-label="Đóng"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <img
          src={session.qrImageUrl}
          alt="SePay VietQR"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
        />

        <p className="text-slate-600 dark:text-slate-300 text-center font-semibold">
          {amountFormatted}
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-center font-mono truncate">
          {session.orderCode}
        </p>

        {/* Countdown + polling status */}
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
            Đang kiểm tra...
          </span>
          <span className="font-mono text-amber-500">
            {mins}:{secs}
          </span>
        </div>
        <p className="text-center text-slate-400 text-[10px]">
          Scan QR → chuyển khoản → tự động xác nhận
        </p>
      </div>
    );
  }

  // ── Idle ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreatePayment}
        disabled={loading}
        className="h-8 rounded-lg border-primary/20 text-primary hover:bg-primary/5 gap-1.5"
      >
        {loading
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : <CreditCard className="h-3.5 w-3.5" />
        }
        Thanh toán SePay
      </Button>

      {/* Nút test chỉ hiện khi đang dev */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTestMode}
          disabled={loading}
          title={`Gửi test invoice tới: ${customerEmail}`}
          className="h-7 rounded-lg text-amber-600 hover:bg-amber-500/10 gap-1.5 text-[11px]"
        >
          <FlaskConical className="h-3 w-3" />
          Test Email + PDF
        </Button>
      )}
    </div>
  );
};
