const STATUS_COLORS: Record<string, string> = { lead: "bg-blue-500", prospect: "bg-yellow-500", customer: "bg-green-500", churned: "bg-red-500" };
export default function CustomerStatusBadge({ status }: { status: string }) {
  return <span className={"badge " + (STATUS_COLORS[status] ?? "bg-gray-500")}>{status}</span>;
}
