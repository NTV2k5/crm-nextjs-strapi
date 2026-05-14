"use client";
export default function KanbanColumn({ stage, deals }: { stage: string; deals: unknown[] }) {
  return (
    <div className="kanban-column glass-card">
      <h3 className="column-title">{stage}</h3>
      <div className="column-body">
        {(deals as { id: string; title: string }[]).map(deal => <div key={deal.id} className="deal-card">{deal.title}</div>)}
      </div>
    </div>
  );
}
