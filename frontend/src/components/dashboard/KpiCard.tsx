interface Props { title: string; value: string; delta: string; icon: string }
export default function KpiCard({ title, value, delta, icon }: Props) {
  return (
    <div className="kpi-card glass-card">
      <span>{icon}</span>
      <div><p>{title}</p><p>{value}</p><p>{delta}</p></div>
    </div>
  );
}
