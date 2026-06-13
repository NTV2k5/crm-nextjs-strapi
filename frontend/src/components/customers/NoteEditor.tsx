"use client";
import { useState, useCallback } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
export default function NoteEditor({ customerId }: { customerId: string }) {
  const [content, setContent] = useState("");
  const save = useCallback(debounce(async (text: string) => {
    await fetch("/api/customers/" + customerId + "/notes", {
      method: "POST",
      body: JSON.stringify({ content: text }),
      headers: { "Content-Type": "application/json" },
    });
  }, 1000), [customerId]);
  return <textarea value={content} onChange={e => { setContent(e.target.value); save(e.target.value); }} />;
}
