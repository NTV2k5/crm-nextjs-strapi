interface VietQRParams {
  bankId: string;
  accountNo: string;
  amount: number;
  description: string;
  accountName: string;
}
export function generateVietQRUrl(params: VietQRParams): string {
  const { bankId, accountNo, amount, description, accountName } = params;
  const base = "https://img.vietqr.io/image";
  return `${base}/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;
}
