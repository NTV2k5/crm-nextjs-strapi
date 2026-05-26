'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/hooks/useCustomers';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock, User,
  Check, Trash2, Briefcase, Phone, Banknote, ClipboardCheck
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { strapiFetch, unwrap } from '@/lib/strapi';

interface EventReminder {
  id: string | number;
  documentId: string;
  title: string;
  dueDate: string; // ISO date string
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low';
  type: 'meeting' | 'call' | 'task' | 'payment';
  description?: string;
  customer?: {
    id: number;
    documentId: string;
    name: string;
  };
  assignedTo?: {
    id: number;
    username: string;
    name?: string;
    email: string;
  };
}

export default function CalendarPage() {
  const { userData } = useAuth();
  const { theme } = useTheme();
  const { customers } = useCustomers();
  const { users } = useUsers();

  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('09:00');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newType, setNewType] = useState<'meeting' | 'call' | 'task' | 'payment'>('task');
  const [newDescription, setNewDescription] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');

  // Prevent hydration error by ensuring date and mount alignment
  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }, []);

  const fetchAllReminders = useCallback(async () => {
    if (!userData) return;
    setLoading(true);
    try {
      let queryPath = '/reminders?populate=*&sort[0]=dueDate:asc';

      // If sales role, restrict to their own reminders only
      if (userData.role !== 'admin' && userData.role !== 'manager') {
        queryPath = `/reminders?filters[assignedTo][id][$eq]=${userData.id}&populate=*&sort[0]=dueDate:asc`;
      }

      const res = await strapiFetch(queryPath);
      const data = unwrap<EventReminder[]>(res);
      setReminders(data || []);
    } catch (err: any) {
      console.error("Error fetching reminders:", err);
      toast.error("Không thể tải danh sách lịch hẹn");
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (mounted && userData) {
      fetchAllReminders();
    }
  }, [mounted, userData, fetchAllReminders]);

  // Set default assigned user in modal when open
  useEffect(() => {
    if (userData && isModalOpen) {
      setNewAssignedTo(userData.id);
    }
  }, [userData, isModalOpen]);

  // Month Math helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  // Convert string timestamp to JS Date
  const getEventDate = (dueDate: string): Date | null => {
    if (!dueDate) return null;
    return new Date(dueDate);
  };

  // Filter reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter(reminder => {
      const evDate = getEventDate(reminder.dueDate);
      if (!evDate) return false;

      // Filter by priority
      if (priorityFilter !== 'all' && reminder.priority !== priorityFilter) return false;

      // Filter by status
      if (statusFilter !== 'all' && reminder.status !== statusFilter) return false;

      // Filter by employee (Admin / Manager only)
      if (userData?.role !== 'sales' && employeeFilter !== 'all' && String(reminder.assignedTo?.id) !== employeeFilter) return false;

      return true;
    });
  }, [reminders, priorityFilter, statusFilter, employeeFilter, userData]);

  // Reminders map for calendar grid highlighting
  const eventsByDay = useMemo(() => {
    const map: Record<string, EventReminder[]> = {};
    filteredReminders.forEach(reminder => {
      const evDate = getEventDate(reminder.dueDate);
      if (evDate) {
        const key = `${evDate.getFullYear()}-${evDate.getMonth()}-${evDate.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(reminder);
      }
    });
    return map;
  }, [filteredReminders]);

  // Reminders for selected day
  const selectedDayReminders = useMemo(() => {
    if (!mounted) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    const dayEvents = eventsByDay[key] || [];
    // Sort chronologically
    return [...dayEvents].sort((a, b) => {
      const timeA = getEventDate(a.dueDate)?.getTime() || 0;
      const timeB = getEventDate(b.dueDate)?.getTime() || 0;
      return timeA - timeB;
    });
  }, [selectedDate, eventsByDay, mounted]);

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và ngày hẹn.');
      return;
    }

    try {
      const [dueHours, dueMinutes] = newDueTime.split(':').map(Number);
      const finalDateTime = new Date(newDueDate);
      finalDateTime.setHours(dueHours || 9, dueMinutes || 0, 0, 0);

      const reminderPayload = {
        title: newTitle,
        dueDate: finalDateTime.toISOString(),
        status: 'pending',
        priority: newPriority,
        type: newType,
        description: newDescription,
        customer: newCustomerId && newCustomerId !== 'other' ? newCustomerId : null, // relation is documentId
        assignedTo: newAssignedTo ? Number(newAssignedTo) : (userData ? Number(userData.id) : null), // relation is user numeric ID
      };

      await strapiFetch('/reminders', {
        method: 'POST',
        body: JSON.stringify({ data: reminderPayload })
      });

      toast.success('Đã lên lịch nhiệm vụ thành công!');
      
      // Reset Form states
      setNewTitle('');
      setNewCustomerId('');
      setNewDescription('');
      setIsModalOpen(false);
      
      // Refresh list
      fetchAllReminders();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu lịch hẹn: ' + err.message);
    }
  };

  const handleToggleStatus = async (reminder: EventReminder) => {
    const nextStatus = reminder.status === 'pending' ? 'completed' : 'pending';
    try {
      await strapiFetch(`/reminders/${reminder.documentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: { status: nextStatus }
        })
      });
      toast.success(nextStatus === 'completed' ? 'Đã hoàn thành nhiệm vụ!' : 'Đã đưa nhiệm vụ về trạng thái đang làm.');
      fetchAllReminders();
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleDeleteReminder = async (reminder: EventReminder) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn/nhiệm vụ này không?')) {
      try {
        await strapiFetch(`/reminders/${reminder.documentId}`, {
          method: 'DELETE'
        });
        toast.success('Đã xóa lịch hẹn thành công.');
        fetchAllReminders();
      } catch (err: any) {
        toast.error('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const config = {
      high: 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]',
      medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    };
    const labels = {
      high: 'Quan trọng - Cao',
      medium: 'Trung bình',
      low: 'Thấp'
    };
    return (
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", config[priority])}>
        {labels[priority]}
      </span>
    );
  };

  const getTypeIcon = (type: 'meeting' | 'call' | 'task' | 'payment') => {
    const config = {
      meeting: { icon: Briefcase, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' },
      call: { icon: Phone, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
      payment: { icon: Banknote, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' },
      task: { icon: ClipboardCheck, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
    };
    const details = config[type] || config.task;
    const Icon = details.icon;
    return (
      <div className={cn("p-1.5 rounded-lg shrink-0", details.color)}>
        <Icon className="h-4 w-4" />
      </div>
    );
  };

  // Build calendar days array
  const calendarDays = useMemo(() => {
    if (!mounted) return [];
    const days = [];
    
    // Add empty slots for days of the week before month starts
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Align to Mon = 0
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, key: `empty-${i}` });
    }

    // Add days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`;
      const dayEvents = eventsByDay[key] || [];
      days.push({
        day: d,
        key,
        events: dayEvents,
        isToday: d === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
        isSelected: d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, eventsByDay, selectedDate, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-bold tracking-widest animate-pulse">LOADING CALENDAR...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      {/* HEADER */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
              <span className="w-8 h-[2px] bg-primary"></span>
              Workspace Calendar
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Lịch làm việc & Lịch hẹn</h1>
            <p className="text-muted-foreground font-medium">Bố trí thời gian hợp lý, quản lý lịch gọi điện, lịch gặp mặt và nhiệm vụ chăm sóc khách hàng.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl h-12 px-6 btn-gradient font-bold shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" /> Lên lịch hẹn mới
          </Button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-3xl bg-card/40 backdrop-blur-sm border border-border">
        <div className="space-y-1.5 text-left">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Mức độ ưu tiên</Label>
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || 'all')}>
            <SelectTrigger className="h-10 bg-background/50 border-border rounded-xl">
              <span data-slot="select-value" className="flex flex-1 text-left truncate line-clamp-1">
                {priorityFilter === 'all' && 'Tất cả mức ưu tiên'}
                {priorityFilter === 'high' && 'Quan trọng - Cao'}
                {priorityFilter === 'medium' && 'Trung bình'}
                {priorityFilter === 'low' && 'Thấp'}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả mức ưu tiên</SelectItem>
              <SelectItem value="high">Quan trọng - Cao</SelectItem>
              <SelectItem value="medium">Trung bình</SelectItem>
              <SelectItem value="low">Thấp</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 text-left">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Trạng thái công việc</Label>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
            <SelectTrigger className="h-10 bg-background/50 border-border rounded-xl">
              <span data-slot="select-value" className="flex flex-1 text-left truncate line-clamp-1">
                {statusFilter === 'all' && 'Tất cả trạng thái'}
                {statusFilter === 'pending' && 'Đang thực hiện (Pending)'}
                {statusFilter === 'completed' && 'Đã hoàn thành'}
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Đang thực hiện (Pending)</SelectItem>
              <SelectItem value="completed">Đã hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {userData?.role !== 'sales' && (
          <div className="space-y-1.5 text-left">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nhân sự phụ trách</Label>
            <Select value={employeeFilter} onValueChange={(val) => setEmployeeFilter(val || 'all')}>
              <SelectTrigger className="h-10 bg-background/50 border-border rounded-xl">
                <span data-slot="select-value" className="flex flex-1 text-left truncate line-clamp-1">
                  {employeeFilter === 'all' ? 'Cả đội ngũ' : (users.find(u => u.id === employeeFilter)?.name || employeeFilter)}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Cả đội ngũ</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-end justify-end md:col-start-4">
          <div className="text-xs font-bold text-muted-foreground uppercase py-2.5 px-4 rounded-xl bg-muted/40 border border-border">
            Tìm thấy: <span className="text-primary font-black">{filteredReminders.length} sự kiện</span>
          </div>
        </div>
      </div>

      {/* CALENDAR BODY GRID AND SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* CALENDAR PANEL */}
        <Card className="lg:col-span-2 border-border shadow-xl rounded-3xl overflow-hidden bg-card/30 backdrop-blur-sm">
          <CardHeader className="border-b border-border p-6 flex flex-row items-center justify-between bg-card/60">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold tracking-tight">
                Tháng {month + 1}, {year}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-9 w-9 rounded-xl">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="h-9 rounded-xl text-xs font-bold px-3">
                Hôm nay
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-9 w-9 rounded-xl">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div>T2</div>
              <div>T3</div>
              <div>T4</div>
              <div>T5</div>
              <div>T6</div>
              <div>T7</div>
              <div className="text-red-500 dark:text-red-400">CN</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[350px]">
              {calendarDays.map((item, idx) => {
                if (item.day === null) {
                  return <div key={item.key} className="bg-muted/10 rounded-2xl border border-transparent" />;
                }

                const isSunday = (idx + 1) % 7 === 0;

                // Priority colors present on this day
                const hasHigh = item.events?.some(e => e.priority === 'high' && e.status === 'pending');
                const hasMedium = item.events?.some(e => e.priority === 'medium' && e.status === 'pending');
                const hasLow = item.events?.some(e => e.priority === 'low' && e.status === 'pending');

                return (
                  <div
                    key={item.key}
                    onClick={() => handleSelectDay(item.day!)}
                    className={cn(
                      "min-h-[70px] sm:min-h-[85px] p-2 rounded-2xl border bg-background/30 cursor-pointer flex flex-col justify-between hover:scale-[1.02] hover:bg-muted/30 active:scale-95 transition-all relative group",
                      item.isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border',
                      item.isToday && !item.isSelected ? 'border-amber-500 bg-amber-500/5' : ''
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs sm:text-sm font-extrabold flex items-center justify-center w-6 h-6 rounded-lg",
                        item.isToday ? 'bg-amber-500 text-white font-black' : 'text-foreground',
                        isSunday && !item.isToday ? 'text-red-500' : ''
                      )}>
                        {item.day}
                      </span>
                      
                      {item.events && item.events.length > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 uppercase tracking-tighter">
                          {item.events.length} việc
                        </span>
                      )}
                    </div>

                    {/* Small event indicator dots */}
                    <div className="flex gap-1.5 h-1.5 items-end justify-center mb-0.5">
                      {hasHigh && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse" />}
                      {hasMedium && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      {hasLow && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* DETAILS SIDEBAR PANEL */}
        <Card className="border-border shadow-xl rounded-3xl overflow-hidden bg-card/30 backdrop-blur-sm flex flex-col h-[525px] sm:h-[570px]">
          <CardHeader className="border-b border-border p-6 bg-card/60">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
              <Clock className="h-4 w-4" />
              Chi tiết công việc
            </div>
            <CardTitle className="text-xl font-bold tracking-tight mt-1">
              {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Có {selectedDayReminders.length} nhiệm vụ được lên lịch hẹn.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedDayReminders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-60">
                <CalendarIcon className="h-10 w-10 text-muted/30 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Không có sự kiện</p>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">Hãy chọn ngày khác hoặc click để thêm mới nhiệm vụ cho hôm nay.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="rounded-xl text-xs font-bold h-9">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Tạo việc
                </Button>
              </div>
            ) : (
              selectedDayReminders.map(reminder => {
                const assignedStaff = users.find(u => Number(u.id) === reminder.assignedTo?.id);
                const evTime = getEventDate(reminder.dueDate)?.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) || '--:--';
                
                return (
                  <div
                    key={reminder.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all relative group flex gap-3.5 items-start",
                      reminder.status === 'completed' 
                        ? 'bg-muted/10 border-border opacity-70' 
                        : reminder.priority === 'high'
                          ? 'border-red-200/50 dark:border-red-500/20 bg-red-500/5 hover:border-red-500/30'
                          : 'border-border bg-background/50 hover:border-primary/20'
                    )}
                  >
                    {/* Event Type Icon */}
                    {getTypeIcon(reminder.type)}

                    <div className="min-w-0 flex-1 space-y-1 text-left">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(
                          "text-xs font-bold",
                          reminder.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                        )}>
                          {reminder.title}
                        </span>
                      </div>
                      
                      {reminder.customer && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                          <User className="h-3 w-3" />
                          <span>Đối tác: {reminder.customer.name}</span>
                        </div>
                      )}

                      {reminder.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-2 rounded-lg mt-1 font-medium">
                          {reminder.description}
                        </p>
                      )}

                      {/* Meta Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{evTime}</span>
                        </div>
                        {assignedStaff && (
                          <div className="bg-muted/40 px-1.5 py-0.5 rounded border border-border/50">
                            {assignedStaff.name}
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 flex items-center justify-between">
                        {getPriorityBadge(reminder.priority)}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleStatus(reminder)}
                            className={cn(
                              "h-7 w-7 rounded-lg border",
                              reminder.status === 'completed' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'border-border text-muted-foreground hover:text-emerald-500'
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteReminder(reminder)}
                            className="h-7 w-7 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ADD DIALOG MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[460px] bg-background border-border shadow-2xl rounded-3xl overflow-y-auto max-h-[90vh] md:max-h-[85vh] p-0 scrollbar-thin">
          <div className="bg-primary/5 px-8 py-6 border-b border-border text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Lên lịch hẹn & Nhiệm vụ</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground font-medium">
                Thiết lập lịch gặp, gọi tư vấn hoặc công việc quan trọng cho đội ngũ.
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleAddEventSubmit} className="p-8 space-y-5 text-left">
            <div className="space-y-2">
              <Label htmlFor="event-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Tên công việc / Lịch hẹn</Label>
              <Input
                id="event-title"
                placeholder="Ví dụ: Gọi điện báo giá dự án CRM, Họp trực tiếp..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Loại công việc</Label>
                <Select value={newType} onValueChange={(val: any) => val && setNewType(val)}>
                  <SelectTrigger id="event-type" className="h-11 bg-muted/20 border-border rounded-xl">
                    <span className="flex flex-1 text-left truncate line-clamp-1">
                      {newType === 'task' && 'Nhiệm vụ chăm sóc'}
                      {newType === 'meeting' && 'Lịch họp trực tiếp'}
                      {newType === 'call' && 'Điện thoại tư vấn'}
                      {newType === 'payment' && 'Thu hồi công nợ'}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="task">Nhiệm vụ chăm sóc</SelectItem>
                    <SelectItem value="meeting">Lịch họp trực tiếp</SelectItem>
                    <SelectItem value="call">Điện thoại tư vấn</SelectItem>
                    <SelectItem value="payment">Thu hồi công nợ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-priority" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Mức độ ưu tiên</Label>
                <Select value={newPriority} onValueChange={(val: any) => val && setNewPriority(val)}>
                  <SelectTrigger id="event-priority" className="h-11 bg-muted/20 border-border rounded-xl">
                    <span className="flex flex-1 text-left truncate line-clamp-1">
                      {newPriority === 'high' && 'Quan trọng - Cao'}
                      {newPriority === 'medium' && 'Trung bình'}
                      {newPriority === 'low' && 'Thấp'}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="high">Quan trọng - Cao</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="low">Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-customer" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Liên quan đến khách hàng</Label>
              <Select value={newCustomerId} onValueChange={(val) => setNewCustomerId(val || '')}>
                <SelectTrigger id="event-customer" className="h-11 bg-muted/20 border-border rounded-xl">
                  <span className={cn("flex flex-1 text-left truncate line-clamp-1", !newCustomerId && "text-muted-foreground")}>
                    {newCustomerId ? (newCustomerId === 'other' ? 'Khác / Không liên kết' : (customers.find(c => c.documentId === newCustomerId)?.name || newCustomerId)) : "Chọn khách hàng liên quan"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="other">--- Khác / Không liên kết ---</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.documentId} value={c.documentId}>{c.name} ({c.company || 'Cá nhân'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Ngày thực hiện</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-time" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Giờ bắt đầu</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={newDueTime}
                  onChange={(e) => setNewDueTime(e.target.value)}
                  className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20"
                  required
                />
              </div>
            </div>

            {userData?.role !== 'sales' && (
              <div className="space-y-2">
                <Label htmlFor="event-assignee" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nhân sự phụ trách</Label>
                <Select value={newAssignedTo} onValueChange={(val) => setNewAssignedTo(val || '')}>
                  <SelectTrigger id="event-assignee" className="h-11 bg-muted/20 border-border rounded-xl">
                    <span className={cn("flex flex-1 text-left truncate line-clamp-1", !newAssignedTo && "text-muted-foreground")}>
                      {newAssignedTo ? (users.find(u => u.id === newAssignedTo)?.name || newAssignedTo) : "Chọn nhân sự"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.role.toUpperCase()})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="event-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Ghi chú chi tiết</Label>
              <Textarea
                id="event-description"
                placeholder="Nhập nội dung mô tả, yêu cầu cần đạt được..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="bg-muted/20 border-border rounded-xl focus:ring-primary/20 min-h-[80px]"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl h-11 px-6 font-bold">
                Hủy bỏ
              </Button>
              <Button type="submit" className="rounded-xl h-11 px-8 btn-gradient font-bold shadow-lg shadow-primary/20">
                Lên lịch hẹn
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
