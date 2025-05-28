import { memo } from "react";
interface Deal { documentId: string; title: string; value: number }
const KanbanCard = memo(function KanbanCard({ deal }: { deal: Deal }) {
  return (
    <div className="kanban-card glass-card">
      <h4>{deal.title}</h4>
      <span>{deal.value?.toLocaleString("vi-VN")}d</span>
    </div>
  );
});
export default KanbanCard;
