"use client";
import { useEffect, useState } from "react";
interface Activity { id: string; message: string; time: string }
export default function ActivityFeed() {
  const [items, setItems] = useState<Activity[]>([]);
  useEffect(() => {
    fetch("/api/activities/recent").then(r => r.json()).then(setItems);
  }, []);
  return <ul>{items.map(a => <li key={a.id}>{a.message} - {a.time}</li>)}</ul>;
}
