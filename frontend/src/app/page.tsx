'use client';

import { useState, useMemo } from 'react';
import { Customer, useCustomers } from '@/hooks/useCustomers';
import { useReminders } from '@/hooks/useReminders';
import { useDeals } from '@/hooks/useDeals';
import { CustomerModal } from '@/components/CustomerModal';
import { ImportCsvModal } from '@/components/ImportCsvModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { exportCustomersCsv } from '@/lib/exportCsv';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Loader2, Users, LogOut, MoreHorizontal, Edit, Trash2, Eye, Plus,
  Bell, CalendarIcon, Download, Sun, Moon, Search, Upload,
  TrendingUp, CheckCircle2, Building2
} from 'lucide-react';
import { strapiFetch } from '@/lib/strapi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { customers, loading, refetch } = useCustomers();
  const { reminders } = useReminders();
  const { deals } = useDeals();
  const { user, userData, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter] = useState('all');
  const [companyFilter] = useState('all');

  // Stats calculation
  const stats = useMemo(() => {
    const getId = (item: any) => item.documentId || String(item.id);

    // 1. Tập hợp ID của các khách hàng có ít nhất 1 deal thành công
    const customersWithClosedDeals = new Set(
      deals
        .filter(d => d.stage === 'closed' && d.customer)
        .map(d => getId(d.customer))
    );

    let leadsCount = 0;
    let closedCount = 0;

    customers.forEach(c => {
      const cId = getId(c);
      const hasClosedDeal = customersWithClosedDeals.has(cId);
      const isManuallyClosed = c.status === 'closed' || c.status === 'former';

      // Khách hàng cũ (Đã hoàn thành): Đã có giao dịch thành công hoặc được gán nhãn thủ công
      if (hasClosedDeal || isManuallyClosed) {
        closedCount++;
      } 
      // Khách tiềm năng: Chưa có giao dịch thành công nào và đang trong phễu
      else if (c.status === 'lead' || c.status === 'consulting') {
        leadsCount++;
      }
    });

    return {
      total: customers.length,
      leads: leadsCount,
      closed: closedCount,
      companies: new Set(customers.map(c => c.company).filter(Boolean)).size,
    };
  }, [customers, deals]);

  // Handlers
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá khách hàng này?')) {
      try {
        await strapiFetch(`/customers/${id}`, { method: 'DELETE' });
        toast.success('Đã xoá khách hàng.');
        refetch();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const normalizeSearch = (str: string) => str.toLowerCase().replace(/[\s\-().+]/g, '');

  const filteredCustomers = customers.filter(c => {
    const q = normalizeSearch(searchQuery);
    if (q) {
      const matchesName = normalizeSearch(c.name).includes(q);
      const matchesEmail = normalizeSearch(c.email).includes(q);
      const matchesPhone = normalizeSearch(c.phone || '').includes(q);
      const matchesCompany = normalizeSearch(c.company || '').includes(q);
      if (!matchesName && !matchesEmail && !matchesPhone && !matchesCompany) return false;
    }
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || c.source === sourceFilter;
    const matchesCompanyFilter = companyFilter === 'all' || c.company === companyFilter;
    return matchesStatus && matchesSource && matchesCompanyFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      lead: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20",
      consulting: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20",
      closed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20",
      former: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-500/20",
    };
    
    const labels: Record<string, string> = {
      lead: "Tiềm năng",
      consulting: "Đang tư vấn",
      closed: "Đã chốt",
      former: "Khách cũ",
    };

    return (
      <span className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
        styles[status] || styles.former
      )}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
            <span className="w-8 h-[2px] bg-primary"></span>
            Tổng quan
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Bảng điều khiển
          </h1>
          <p className="text-muted-foreground max-w-lg">
            Chào mừng {userData?.name || 'bạn'} trở lại. Hệ thống đang hoạt động ổn định với đầy đủ dữ liệu thời gian thực.
          </p>
        </div>
      </header>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: userData?.role === 'admin' ? 'Tổng khách hàng' : 'Khách hàng của tôi', value: stats.total, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Khách tiềm năng', value: stats.leads, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Đã hoàn thành', value: stats.closed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: userData?.role === 'admin' ? 'Đối tác doanh nghiệp' : 'Công ty phụ trách', value: stats.companies, icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((s, i) => (
          <Card key={i} className="enterprise-shadow border-border overflow-hidden relative group">
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500", s.bg)} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg", s.bg)}>
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold tracking-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
        {/* MAIN DATA TABLE */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="enterprise-shadow border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="px-6 pt-6 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold">Cơ sở dữ liệu khách hàng</CardTitle>
                  <CardDescription>Tìm kiếm và quản lý thông tin khách hàng của bạn.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   {userData?.role === 'admin' && (
                    <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="h-9 px-4 rounded-xl border-dashed">
                      <Upload className="mr-2 h-4 w-4" /> Nhập liệu
                    </Button>
                  )}
                  <CustomerModal 
                    open={isModalOpen} 
                    onOpenChange={setIsModalOpen} 
                    initialData={editingCustomer}
                    refetch={refetch}
                    trigger={
                      <Button size="sm" onClick={handleAddNew} className="h-9 px-4 rounded-xl btn-gradient">
                        <Plus className="mr-2 h-4 w-4 font-bold" /> Thêm khách hàng
                      </Button>
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Tìm kiếm thông minh..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 bg-muted/30 border-border rounded-xl focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)}>
                    <SelectTrigger className="w-[140px] h-10 rounded-xl bg-muted/30 border-border">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="lead">Tiềm năng</SelectItem>
                      <SelectItem value="consulting">Đang tư vấn</SelectItem>
                      <SelectItem value="closed">Đã chốt</SelectItem>
                      <SelectItem value="former">Khách cũ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      exportCustomersCsv(filteredCustomers);
                      toast.success('Đã xuất file CSV thành công!');
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="h-10 w-10 rounded-xl border-border bg-muted/30"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border">
                        <TableHead className="w-[300px] font-bold text-foreground h-12">Khách hàng</TableHead>
                        <TableHead className="font-bold text-foreground">Liên hệ</TableHead>
                        <TableHead className="font-bold text-foreground">Trạng thái</TableHead>
                        <TableHead className="text-right font-bold text-foreground">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="border-border hover:bg-muted/30 transition-all cursor-pointer group" onClick={() => router.push(`/customers/${customer.documentId || customer.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {customer.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">{customer.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{customer.company || 'Cá nhân'}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{customer.email}</div>
                            <div className="text-xs text-muted-foreground">{customer.phone || '---'}</div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(customer.status)}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity")}>
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-xl border-border shadow-xl">
                                <DropdownMenuItem onClick={() => router.push(`/customers/${customer.documentId || customer.id}`)} className="rounded-lg py-2">
                                  <Eye className="mr-2 h-4 w-4 text-blue-500" /> Xem hồ sơ
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(customer)} className="rounded-lg py-2">
                                  <Edit className="mr-2 h-4 w-4 text-amber-500" /> Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(customer.documentId || customer.id)} className="rounded-lg py-2 text-destructive focus:bg-destructive/10">
                                  <Trash2 className="mr-2 h-4 w-4" /> Xoá khách hàng
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR: REMINDERS */}
        <div className="flex flex-col">
          <Card className="enterprise-shadow border-border bg-card/50 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg">
                    <Bell className="h-4 w-4 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg font-bold">Lịch hẹn</CardTitle>
                </div>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full uppercase">
                  {reminders.length} mới
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-6 space-y-3">
              {reminders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-50">
                  <CalendarIcon className="h-10 w-10 text-muted/30 mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Không có lịch nhắc</p>
                </div>
              ) : (
                reminders.slice(0, 10).map(reminder => {
                  const dueDateObj = reminder.dueDate ? new Date(reminder.dueDate) : null;
                  const isOverdue = dueDateObj ? dueDateObj < new Date() : false;
                  return (
                    <Link key={reminder.id} href={`/customers/${reminder.customer?.documentId || reminder.customer?.id}`} className="block group">
                      <div className="p-3 rounded-xl border border-border bg-background/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground group-hover:text-amber-600 transition-colors truncate">{reminder.customer?.name || 'Khách hàng'}</p>
                            <p className="text-[11px] text-muted-foreground truncate leading-relaxed">{reminder.title}</p>
                          </div>
                          {isOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                          <CalendarIcon className="h-3 w-3" />
                          <span className={isOverdue ? "text-red-500" : ""}>
                            {dueDateObj ? dueDateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''} • {dueDateObj ? dueDateObj.toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ImportCsvModal 
        open={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen} 
        refetch={refetch}
      />
    </div>
  );
}

export default function HomePage() {
  return <main><h1>CRM Dashboard</h1></main>;
}