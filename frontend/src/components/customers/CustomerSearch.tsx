"use client";
import { useState } from "react";
interface Result { id: string; name: string }
export default function CustomerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  async function search(q: string) {
    if (!q) return;
    const res = await fetch("/api/customers/search?q=" + encodeURIComponent(q));
    setResults(await res.json());
  }
  return (
    <div>
      <input value={query} onChange={e => { setQuery(e.target.value); search(e.target.value); }} placeholder="Tim khach hang..." />
      <ul>{results.map(c => <li key={c.id}>{c.name}</li>)}</ul>
    </div>
  );
}
