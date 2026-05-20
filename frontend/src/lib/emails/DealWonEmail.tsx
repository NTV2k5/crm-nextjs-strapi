// React Email template for deal won notification
export default function DealWonEmail({ dealTitle, value }: { dealTitle: string; value: number }) {
  return (
    <div>
      <h1>Deal thanh cong!</h1>
      <p>Deal "{dealTitle}" voi gia tri {value.toLocaleString("vi-VN")}d da duoc chot.</p>
    </div>
  );
}
