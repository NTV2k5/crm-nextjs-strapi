"use client";
import { useState, useCallback } from "react";
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }) as T;
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
