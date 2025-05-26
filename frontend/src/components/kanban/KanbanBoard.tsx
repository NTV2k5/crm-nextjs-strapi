"use client";
import { useState } from "react";
const STAGES = ["Moi", "Du dieu kien", "De xuat", "Dam phan", "Thanh cong", "That bai"];
export default function KanbanBoard({ initialDeals }: { initialDeals: unknown[] }) {
  const [deals] = useState(initialDeals);
  return (
    <div className="kanban-board" style={{ display: "flex", gap: 16 }}>
      {STAGES.map(stage => (
        <div key={stage} className="kanban-column">
          <h3>{stage}</h3>
        </div>
      ))}
    </div>
  );
}
