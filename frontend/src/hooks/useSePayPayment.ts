import { useCallback, useEffect, useRef, useState } from 'react';
import { strapiFetch, unwrap } from '../lib/strapi';

export type PaymentState = 'idle' | 'pending' | 'paid' | 'timeout' | 'error';

export interface UseSePayPaymentOptions {
  invoiceId?: string;
  amount: number;
  orderCode: string;
  timeoutMs?: number;
  intervalMs?: number;
  onSuccess?: () => void;
  onTimeout?: () => void;
}

export interface UseSePayPaymentReturn {
  state: PaymentState;
  qrImageUrl: string | null;
  timeLeft: number;
  pollCount: number;
  error: string | null;
  startPayment: () => void;
  cancelPayment: () => void;
}

export function useSePayPayment(options: UseSePayPaymentOptions): UseSePayPaymentReturn {
  const {
    invoiceId,
    amount,
    orderCode,
    timeoutMs = 10 * 60 * 1000,
    intervalMs = 5000,
    onSuccess,
    onTimeout,
  } = options;

  const [state, setState] = useState<PaymentState>('idle');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(Math.floor(timeoutMs / 1000));
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<PaymentState>('idle');

  // Sync ref with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback(() => {
    let remaining = Math.floor(timeoutMs / 1000);
    setTimeLeft(remaining);

    countdownRef.current = setInterval(() => {
      remaining--;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (stateRef.current === 'pending') {
          setState('timeout');
          onTimeout?.();
        }
      }
    }, 1000);
  }, [timeoutMs, onTimeout]);

  const startPayment = useCallback(() => {
    if (state === 'pending') return;

    try {
      // Generate QR URL using VietQR structure (matches SePay specifications)
      const bankAccount = process.env.NEXT_PUBLIC_SEPAY_BANK_ACCOUNT || '0000000001';
      const bankName = process.env.NEXT_PUBLIC_SEPAY_BANK_NAME || 'TPBank';
      const description = `TT ${orderCode}`;
      
      const qrUrl = `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankName}&amount=${amount}&des=${encodeURIComponent(description)}&size=300`;
      
      setQrImageUrl(qrUrl);
      setState('pending');
      setError(null);
      setPollCount(0);
      startCountdown();

      // Start polling our own database instead of SePay API
      let attempt = 0;
      pollIntervalRef.current = setInterval(async () => {
        if (stateRef.current !== 'pending') return;

        attempt++;
        setPollCount(attempt);

        try {
          // If we have invoiceId, fetch by id; otherwise filter by orderCode
          let queryPath = `/invoices?filters[orderCode][$eq]=${orderCode}`;
          if (invoiceId) {
            queryPath = `/invoices/${invoiceId}`;
          }

          const res = await strapiFetch(queryPath);
          const data = unwrap<any>(res);
          const invoice = Array.isArray(data) ? data[0] : data;

          if (invoice && invoice.status === 'paid') {
            setState('paid');
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            onSuccess?.();
          }
        } catch (err) {
          console.error('[Payment Poll Error]', err);
        }
      }, intervalMs);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khởi tạo thanh toán');
      setState('error');
    }
  }, [state, orderCode, amount, invoiceId, intervalMs, timeoutMs, onSuccess, startCountdown]);

  const cancelPayment = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setState('idle');
    setQrImageUrl(null);
    setTimeLeft(Math.floor(timeoutMs / 1000));
    setPollCount(0);
  }, [timeoutMs]);

  return { state, qrImageUrl, timeLeft, pollCount, error, startPayment, cancelPayment };
}
