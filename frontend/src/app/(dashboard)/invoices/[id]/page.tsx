"use client";
import { useEffect, useState, use } from "react";
export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [status, setStatus] = useState("pending");
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/invoices/" + id + "/status");
      const data = await res.json();
      if (data.status === "paid") { setStatus("paid"); clearInterval(interval); }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);
  return (
    <div>
      <h1>Hoa don #{id}</h1>
      <p>Trang thai: {status === "paid" ? "Da thanh toan" : "Cho thanh toan"}</p>
    </div>
  );
}
