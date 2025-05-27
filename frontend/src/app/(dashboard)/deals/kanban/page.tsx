import dynamic from "next/dynamic";
const KanbanBoard = dynamic(() => import("@/components/kanban/KanbanBoard"), { ssr: false });
export default function KanbanPage() {
  return <KanbanBoard initialDeals={[]} />;
}
