import KpiCard from "@/components/dashboard/KpiCard";
export default async function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <div className="kpi-grid">
        <KpiCard title="Khach hang" value="248" delta="+12%" icon="peo" />
        <KpiCard title="Active Deals" value="34" delta="+5%" icon="bri" />
        <KpiCard title="Doanh thu" value="480M" delta="+8%" icon="cha" />
      </div>
    </div>
  );
}
