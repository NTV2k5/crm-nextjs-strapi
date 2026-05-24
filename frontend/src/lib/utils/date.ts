export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("vi-VN");
}
export function isExpired(date: string | Date): boolean {
  return new Date(date) < new Date();
}
