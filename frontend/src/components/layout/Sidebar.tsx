'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Briefcase, CalendarDays, BarChart3, ShieldCheck, Zap, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { name: 'Bảng điều khiển', href: '/', icon: LayoutDashboard },
  { name: 'Cơ hội & Doanh thu', href: '/deals', icon: Briefcase },
  { name: 'Lịch hẹn & CV', href: '/calendar', icon: CalendarDays },
  { name: 'Báo cáo', href: '/analytics', icon: BarChart3 },
];

interface SidebarProps {
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
}

export function Sidebar({ isCollapsed = false, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const { userData, loading } = useAuth();

  if (loading || !userData) return null;

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-50 bg-card/80 backdrop-blur-xl border-r border-border hidden lg:flex flex-col shadow-2xl shadow-primary/5 transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
      <div className="h-16 flex items-center px-6 border-b border-border/50 overflow-hidden shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!isCollapsed && <h1 className="text-xl font-extrabold tracking-tight text-foreground uppercase whitespace-nowrap">CRM NEXT</h1>}
        </div>
      </div>
      
      <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {!isCollapsed && <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 px-2 whitespace-nowrap">Main Menu</div>}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all relative group whitespace-nowrap",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors")} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
        
        {userData?.role === 'admin' && (
          <>
            {!isCollapsed && <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 mt-8 px-2 whitespace-nowrap">Quản trị viên</div>}
            {isCollapsed && <div className="h-px bg-border/50 my-6 mx-2" />}
            <Link
              href="/admin/users"
              title={isCollapsed ? "Quản lý đội ngũ" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all group whitespace-nowrap",
                pathname === '/admin/users'
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-0"
              )}
            >
              <ShieldCheck className={cn("h-5 w-5 shrink-0", pathname === '/admin/users' ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors")} />
              {!isCollapsed && <span>Quản lý đội ngũ</span>}
            </Link>
          </>
        )}
      </div>

      {toggleSidebar && (
        <div className="p-4 border-t border-border/50">
          <button 
            onClick={toggleSidebar}
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
            className={cn(
              "flex items-center w-full py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all group",
              isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-3"
            )}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5 shrink-0 group-hover:text-primary transition-colors" /> : <PanelLeftClose className="h-5 w-5 shrink-0 group-hover:text-primary transition-colors" />}
            {!isCollapsed && <span className="text-sm font-bold">Thu gọn</span>}
          </button>
        </div>
      )}
    </aside>
  );
}

export default function Sidebar() {
  return <aside className="sidebar"><nav>Menu</nav></aside>;
}