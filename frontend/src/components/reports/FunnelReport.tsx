"use client";
interface Stage { name: string; count: number; rate: number }
export default function FunnelReport({ stages }: { stages: Stage[] }) {
  return (
    <div className="funnel">
      {stages.map((s, i) => (
        <div key={s.name} className="funnel-stage" style={{ width: (100 - i * 15) + "%" }}>
          <span>{s.name}</span><span>{s.count} ({s.rate}%)</span>
        </div>
      ))}
    </div>
  );
}
