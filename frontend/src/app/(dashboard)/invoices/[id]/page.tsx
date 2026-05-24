"use client";
import { useEffect, useState } from "react";
export default function InvoicePage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState("pending");
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/invoices/" + params.id + "/status");
      const data = await res.json();
      if (data.status === "paid") { setStatus("paid"); clearInterval(interval); }
    }, 3000);
    return () => clearInterval(interval);
  }, [params.id]);
  return (
    <div>
      <h1>Hoa don #{params.id}</h1>
      <p>Trang thai: {status === "paid" ? "Da thanh toan" : "Cho thanh toan"}</p>
    </div>
  );
}
