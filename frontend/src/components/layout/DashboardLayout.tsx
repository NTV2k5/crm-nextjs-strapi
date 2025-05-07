export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[240px_1fr] h-screen"><aside className="sidebar" /><main>{children}</main></div>;
}