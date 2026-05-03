import { Customer } from "@/types/customer";
export default function CustomerTable({ data }: { data: Customer[] }) {
  return (
    <table>
      <thead><tr><th>Ten</th><th>Email</th><th>Trang thai</th></tr></thead>
      <tbody>{data.map(c => <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.status}</td></tr>)}</tbody>
    </table>
  );
}