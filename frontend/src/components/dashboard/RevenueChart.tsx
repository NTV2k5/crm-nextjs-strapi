"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
export default function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" /><YAxis /><Tooltip />
        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
