"use client";
import { useState } from "react";
export default function NotificationBell() {
  const [count] = useState(3);
  return (
    <button className="notification-bell" aria-label="Thong bao">
      Bell {count > 0 && <span className="badge" style={{ background: "red", borderRadius: "50%" }}>{count}</span>}
    </button>
  );
}
