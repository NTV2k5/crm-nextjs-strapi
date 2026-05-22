"use client";
interface Row { name: string; deals: number; revenue: number }
export default function SalesReport({ data }: { data: Row[] }) {
  return (
    <table>
      <thead><tr><th>Nhan vien</th><th>Deals</th><th>Doanh thu</th></tr></thead>
      <tbody>
        {data.map(row => (
          <tr key={row.name}>
            <td>{row.name}</td><td>{row.deals}</td>
            <td>{row.revenue.toLocaleString("vi-VN")}d</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
