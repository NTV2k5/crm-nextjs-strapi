"use client";
export default function CustomerForm() {
  return (
    <form>
      <input name="name" placeholder="Ten khach hang" required />
      <input name="email" type="email" placeholder="Email" />
      <input name="phone" placeholder="So dien thoai" />
    </form>
  );
}