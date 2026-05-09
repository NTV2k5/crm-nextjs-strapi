"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
export default function PipelineChart({ data }: { data: { stage: string; count: number }[] }) {
  return (
    <BarChart width={400} height={250} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="stage" /><YAxis /><Tooltip />
      <Bar dataKey="count" fill="#8b5cf6" />
    </BarChart>
  );
}
