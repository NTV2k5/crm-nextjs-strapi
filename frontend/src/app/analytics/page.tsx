'use client';

import { useCustomers } from '@/hooks/useCustomers';
import { useDeals } from '@/hooks/useDeals';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, DollarSign, Target, Loader2, Sun, Moon, TrendingUp, PieChart as PieChartIcon, Download } from 'lucide-react';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { useEffect, useState } from 'react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

export default function Analytics() {
  const { customers, loading: loadingCustomers } = useCustomers();
  const { deals, loading: loadingDeals } = useDeals();
  const { theme, toggleTheme } = useTheme();
  
  // Hydration safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loadingCustomers || loadingDeals) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- OVERVIEW STATS ---
  const totalCustomers = customers.length;
  const closedDeals = deals.filter(d => d.stage === 'closed');
  const totalRevenue = closedDeals.reduce((sum, d) => sum + d.value, 0);
  const finishedDeals = deals.filter(d => d.stage === 'closed' || d.stage === 'lost');
  const winRate = finishedDeals.length > 0 ? (closedDeals.length / finishedDeals.length) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // --- PIE CHART (Customer Sources) ---
  const sourceCounts = {
    facebook: 0,
    website: 0,
    referral: 0,
    other: 0,
  };
  customers.forEach(c => {
    if (c.source === 'facebook') sourceCounts.facebook++;
    else if (c.source === 'website') sourceCounts.website++;
    else if (c.source === 'referral') sourceCounts.referral++;
    else sourceCounts.other++;
  });

  const pieData = [
    { name: 'Facebook', value: sourceCounts.facebook },
    { name: 'Website', value: sourceCounts.website },
    { name: 'Giới thiệu', value: sourceCounts.referral },
    { name: 'Khác', value: sourceCounts.other },
  ].filter(item => item.value > 0);

  // --- BAR CHART (Revenue by Month) ---
  const revenueMap: Record<string, number> = {};
  closedDeals.forEach(deal => {
    const date = deal.createdAt ? new Date(deal.createdAt) : new Date();
    const month = `Th ${date.getMonth() + 1}`;
    revenueMap[month] = (revenueMap[month] || 0) + deal.value;
  });
  
  const barData = Object.keys(revenueMap).map(key => ({
    name: key,
    revenue: revenueMap[key]
  }));

  // --- LINE CHART (Customer Growth) ---
  const customerMap: Record<string, number> = {};
  customers.forEach(c => {
    const date = c.createdAt ? new Date(c.createdAt) : new Date();
    const month = `Th ${date.getMonth() + 1}`;
    customerMap[month] = (customerMap[month] || 0) + 1;
  });
  
  const lineData = Object.keys(customerMap).map(key => ({
    name: key,
    customers: customerMap[key]
  }));

  const handleExportCSV = () => {
    // Thêm BOM (Byte Order Mark) để Excel mở tiếng Việt UTF-8 không bị lỗi font
    const BOM = "\uFEFF";
    let csvContent = BOM;

    // 1. Dữ liệu Tổng quan
    csvContent += "BÁO CÁO TỔNG QUAN\n";
    csvContent += "Tổng khách hàng,Tổng doanh thu (VNĐ),Tỉ lệ chốt (%)\n";
    csvContent += `${totalCustomers},${totalRevenue},${winRate.toFixed(1)}%\n\n`;

    // 2. Dữ liệu Doanh thu theo tháng
    csvContent += "DOANH THU THEO THÁNG\n";
    csvContent += "Tháng,Doanh thu (VNĐ)\n";
    barData.forEach(item => {
      csvContent += `${item.name},${item.revenue}\n`;
    });
    csvContent += "\n";

    // 3. Khách hàng theo nguồn
    csvContent += "NGUỒN KHÁCH HÀNG\n";
    csvContent += "Nguồn,Số lượng\n";
    pieData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += "\n";

    // Khởi tạo file và tự động tải xuống
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Tên file theo ngày hiện tại
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    link.setAttribute("download", `Bao_Cao_CRM_${dateString}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
              <span className="w-8 h-[2px] bg-primary"></span>
              Business Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Báo cáo & Phân tích</h1>
            <p className="text-muted-foreground font-medium">Tầm nhìn chiến lược thông qua dữ liệu doanh nghiệp.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} className="rounded-xl h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold gap-2">
            <Download className="h-4 w-4" />
            Xuất CSV
          </Button>
        </div>
      </header>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group rounded-3xl shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tổng khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold">{totalCustomers}</div>
            <p className="text-[11px] font-bold text-primary mt-1 uppercase tracking-tight">Tăng trưởng ổn định</p>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group rounded-3xl shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tổng doanh thu (Win)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</div>
            <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-tight">Từ {closedDeals.length} hợp đồng đã ký</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50 backdrop-blur-sm relative overflow-hidden group rounded-3xl shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tỉ lệ chốt (Win Rate)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{winRate.toFixed(1)}%</div>
            <p className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-tight">Trên tổng số Deal kết thúc</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Bar Chart */}
        <Card className="border-border bg-card/50 backdrop-blur-sm lg:col-span-2 rounded-3xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Dòng tiền doanh thu
              </CardTitle>
              <CardDescription>Thống kê doanh số theo từng tháng trong năm.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'currentColor', fontSize: 11, fontWeight: 600}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'currentColor', fontSize: 11, fontWeight: 600}}
                    tickFormatter={(val) => new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(val)}
                  />
                  <RechartsTooltip 
                    cursor={{fill: 'currentColor', opacity: 0.05}} 
                    contentStyle={{backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), "Doanh thu"]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <p className="font-bold">Chưa có dữ liệu giao dịch</p>
                <p className="text-xs">Dữ liệu sẽ hiển thị sau khi các Deal được chuyển sang "Closed".</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Line Chart */}
        <Card className="border-border bg-card/50 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Tăng trưởng khách hàng mới
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor', fontSize: 11, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'currentColor', fontSize: 11, fontWeight: 600}} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px'}}
                  />
                  <Line type="monotone" dataKey="customers" name="Khách hàng" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2}} activeDot={{r: 6, strokeWidth: 0}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-bold">Nội dung trống</div>
            )}
          </CardContent>
        </Card>

        {/* Source Pie Chart */}
        <Card className="border-border bg-card/50 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-amber-500" />
              Phân bổ nguồn khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px'}}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 700, paddingTop: '20px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground font-bold">Chưa có dữ liệu phân bổ</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
