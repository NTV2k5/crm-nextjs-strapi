'use client';

import { useEffect, useState, useMemo, useTransition, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, ArrowLeft, Mail, Phone, Building2, Calendar as CalendarIcon, 
  Clock, CheckCircle, Sun, Moon, MessageSquare, History, User, 
  Shield, Edit, FileText, Plus, Trash2, Download, ShieldAlert, Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CustomerModal } from '@/components/CustomerModal';
import { useContracts } from '@/hooks/useContracts';
import { ContractModal } from '@/components/ContractModal';
import { logAudit } from '@/lib/audit';
import { printContract } from '@/lib/contracts';
import { strapiFetch, unwrap } from '@/lib/strapi';
import Link from 'next/link';

interface Note {
  id: string | number;
  documentId: string;
  content: string;
  createdAt: string;
  createdBy?: {
    id: number;
    username: string;
    name?: string;
    email: string;
  };
}

interface Reminder {
  id: string | number;
  documentId: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  createdBy?: string;
}

export default function CustomerProfile() {
  const params = useParams();
  const id = params?.id as string; // Customer documentId
  const router = useRouter();

  const { userData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [customer, setCustomer] = useState<any | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any | undefined>();

  // Notes state
  const [noteContent, setNoteContent] = useState('');
  const [isNotePending, startNoteTransition] = useTransition();

  // Reminders state
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isReminderPending, startReminderTransition] = useTransition();

  // Fetch contracts
  const { contracts, loading: contractsLoading, refetch: refetchContracts } = useContracts(id);

  const fetchCustomerData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await strapiFetch(`/customers/${id}?populate=*`);
      const data = unwrap<any>(res);
      setCustomer(data);
    } catch (err: any) {
      console.error("Error fetching customer:", err);
      setCustomer(null);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    if (!id) return;
    try {
      const res = await strapiFetch(`/notes?filters[customer][documentId][$eq]=${id}&populate=*&sort[0]=createdAt:desc`);
      const data = unwrap<Note[]>(res);
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  }, [id]);

  const fetchReminders = useCallback(async () => {
    if (!id) return;
    try {
      const res = await strapiFetch(`/reminders?filters[customer][documentId][$eq]=${id}&populate=*&sort[0]=dueDate:asc`);
      const data = unwrap<Reminder[]>(res);
      setReminders(data || []);
    } catch (err) {
      console.error("Error fetching reminders:", err);
    }
  }, [id]);

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      await Promise.all([
        fetchCustomerData(),
        fetchNotes(),
        fetchReminders()
      ]);
      setLoading(false);
    }
    if (id) {
      loadAllData();
    }
  }, [id, fetchCustomerData, fetchNotes, fetchReminders]);

  const handleContractDelete = async (contractId: string, contractNum: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hợp đồng ${contractNum} khỏi hệ thống?`)) {
      try {
        await strapiFetch(`/contracts/${contractId}`, {
          method: 'DELETE',
        });

        await logAudit({
          action: 'DELETE_CONTRACT',
          entityId: contractId,
          entityName: contractNum,
          performedByEmail: userData?.email || 'Unknown',
          performedByUid: userData?.id || 'Unknown',
          details: `Xóa hợp đồng ${contractNum} của khách hàng ${customer?.name}`
        });

        toast.success('Xóa hợp đồng thành công!');
        refetchContracts();
      } catch (error: any) {
        toast.error('Lỗi khi xóa hợp đồng: ' + error.message);
      }
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      toast.error('Nội dung không được để trống');
      return;
    }

    startNoteTransition(async () => {
      try {
        await strapiFetch('/notes', {
          method: 'POST',
          body: JSON.stringify({
            data: {
              content: noteContent,
              customer: id, // Bind to customer documentId
              createdBy: userData ? Number(userData.id) : null // Bind to user numeric ID
            }
          })
        });

        toast.success('Đã thêm ghi chú');
        setNoteContent('');
        fetchNotes();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi lưu ghi chú');
      }
    });
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDate || !reminderTime) {
      toast.error('Vui lòng nhập đủ thông tin');
      return;
    }

    startReminderTransition(async () => {
      try {
        const dueDate = new Date(`${reminderDate}T${reminderTime}`);

        await strapiFetch('/reminders', {
          method: 'POST',
          body: JSON.stringify({
            data: {
              title: reminderTitle,
              dueDate: dueDate.toISOString(),
              status: 'pending',
              customer: id,
              assignedTo: userData ? Number(userData.id) : null
            }
          })
        });

        toast.success('Đã đặt lịch hẹn');
        setReminderTitle('');
        setReminderDate('');
        fetchReminders();
      } catch (error: any) {
        toast.error(error.message || 'Lỗi khi đặt lịch hẹn');
      }
    });
  };

  const handleCompleteReminder = async (reminder: Reminder) => {
    try {
      await strapiFetch(`/reminders/${reminder.documentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: { status: 'completed' }
        })
      });
      toast.success('Đã hoàn thành công việc!');
      fetchReminders();
    } catch (e: any) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
           <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Không tìm thấy khách hàng</h2>
        <Link href="/">
          <Button variant="outline" className="rounded-xl px-8">Quay lại Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <div className="mx-auto space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
                <span className="w-8 h-[2px] bg-primary"></span>
                Hồ sơ khách hàng
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{customer.name}</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-border bg-card overflow-hidden rounded-3xl shadow-lg">
              <div className="h-24 bg-primary/5 border-b border-border flex items-center justify-center">
                 <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center text-2xl font-bold text-primary">
                    {customer.name.charAt(0)}
                 </div>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trạng thái hiện tại</span>
                    <div>{getStatusBadge(customer.status)}</div>
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <div className="p-2 rounded-lg bg-muted/50"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <div className="p-2 rounded-lg bg-muted/50"><Phone className="h-4 w-4 text-muted-foreground" /></div>
                      <span>{customer.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <div className="p-2 rounded-lg bg-muted/50"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
                      <span className="truncate">{customer.company || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                      <div className="p-2 rounded-lg bg-muted/50"><Shield className="h-4 w-4 text-muted-foreground" /></div>
                      <span className="capitalize">{customer.source || 'Khác'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                   <CustomerModal 
                    open={isEditModalOpen}
                    onOpenChange={(isOpen) => {
                      setIsEditModalOpen(isOpen);
                      if (!isOpen) fetchCustomerData(); // Reload customer details when edit modal is closed
                    }}
                    initialData={customer}
                    trigger={
                      <Button variant="outline" className="w-full rounded-xl font-bold h-11" onClick={() => setIsEditModalOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa hồ sơ
                      </Button>
                    }
                   />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="notes" className="w-full flex flex-col gap-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1.5 rounded-2xl max-w-[450px] border border-border shadow-sm mb-6">
                <TabsTrigger value="notes" className="rounded-xl font-bold text-xs uppercase tracking-tight py-2.5 transition-all">
                  <MessageSquare className="h-3.5 w-3.5 mr-2 opacity-70" /> Nhật ký
                </TabsTrigger>
                <TabsTrigger value="reminders" className="rounded-xl font-bold text-xs uppercase tracking-tight py-2.5 transition-all">
                  <CalendarIcon className="h-3.5 w-3.5 mr-2 opacity-70" /> Lịch hẹn
                </TabsTrigger>
                <TabsTrigger value="contracts" className="rounded-xl font-bold text-xs uppercase tracking-tight py-2.5 transition-all">
                  <FileText className="h-3.5 w-3.5 mr-2 opacity-70" /> Hợp đồng
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="focus-visible:outline-none focus-visible:ring-0">
                {/* Notes & History Section */}
                <Card className="border-border bg-card/50 backdrop-blur-sm h-full flex flex-col rounded-3xl shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-foreground mb-1">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-bold">Ghi chú & Lịch sử</CardTitle>
                    </div>
                    <CardDescription className="text-xs font-medium">Nhật ký tương tác với khách hàng.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 flex flex-col">
                    <form onSubmit={handleAddNote} className="space-y-3">
                      <Textarea 
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Nhập nội dung tương tác mới..." 
                        className="min-h-[100px] resize-none border-border bg-background rounded-xl focus:ring-primary/20 p-3 text-sm transition-all"
                      />
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isNotePending} className="rounded-xl px-6 h-10 btn-gradient text-xs font-bold shadow-lg shadow-primary/20">
                          {isNotePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Lưu nhật ký
                        </Button>
                      </div>
                    </form>
                    
                    <div className="space-y-4 pt-2 relative flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                      <div className="absolute left-4 top-4 bottom-4 w-[1px] bg-border/50" />
                      {notes.length === 0 ? (
                        <div className="text-center py-8 opacity-50">
                           <History className="h-8 w-8 mx-auto mb-2 opacity-20" />
                           <p className="text-[10px] font-bold uppercase tracking-widest">Trống</p>
                        </div>
                      ) : (
                        notes.map(note => (
                          <div key={note.id} className="relative pl-9 pb-4">
                            <div className="absolute left-[13px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                            <div className="rounded-xl border border-border p-3 bg-background hover:bg-muted/5 transition-colors">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-foreground truncate max-w-[150px]">{note.createdBy?.name || note.createdBy?.username || 'Hệ thống'}</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reminders" className="focus-visible:outline-none focus-visible:ring-0">
                {/* Reminders Section */}
                <Card className="border-border bg-card/50 backdrop-blur-sm h-full flex flex-col rounded-3xl shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-foreground mb-1">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-bold">Lịch hẹn</CardTitle>
                    </div>
                    <CardDescription className="text-xs font-medium">Sắp xếp các cuộc gặp và lời nhắc.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 flex flex-col">
                    <form onSubmit={handleAddReminder} className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                      <div className="space-y-1.5">
                        <Label htmlFor="title" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nội dung</Label>
                        <Input 
                          id="title" 
                          value={reminderTitle}
                          onChange={(e) => setReminderTitle(e.target.value)}
                          placeholder="Tiêu đề lịch hẹn..." 
                          required 
                          className="h-9 text-xs bg-background border-border rounded-lg" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="date" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Ngày</Label>
                          <Input 
                            id="date" 
                            type="date" 
                            value={reminderDate}
                            onChange={(e) => setReminderDate(e.target.value)}
                            required 
                            className="h-9 text-xs bg-background border-border rounded-lg dark:[color-scheme:dark]" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="time" className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Giờ</Label>
                          <Input 
                            id="time" 
                            type="time" 
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            required 
                            className="h-9 text-xs bg-background border-border rounded-lg dark:[color-scheme:dark]" 
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isReminderPending} className="w-full rounded-xl h-10 btn-gradient text-xs font-bold shadow-lg shadow-primary/20 mt-2">
                        {isReminderPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Đặt lịch ngay
                      </Button>
                    </form>

                    <div className="space-y-3 pt-2 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                      <h4 className="text-[10px] font-bold text-foreground flex items-center gap-2 uppercase tracking-widest mb-3">
                         Lịch hẹn sắp tới
                      </h4>
                      {reminders.length === 0 ? (
                        <div className="text-center py-8 opacity-50 border-2 border-dashed border-border/50 rounded-2xl">
                           <p className="text-[10px] font-bold uppercase tracking-widest">Trống</p>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                           {reminders.map(reminder => (
                            <div key={reminder.id} className="flex flex-col gap-2 rounded-xl border border-border p-3 bg-card hover:border-primary/30 transition-all">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                  reminder.status === 'completed' ? 'bg-emerald-500/10' : 'bg-primary/5'
                                )}>
                                  {reminder.status === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Clock className="h-4 w-4 text-primary" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={cn(
                                    "font-bold text-xs truncate",
                                    reminder.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                  )}>
                                    {reminder.title}
                                  </div>
                                  <div className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <CalendarIcon className="h-2.5 w-2.5" />
                                    {reminder.dueDate ? new Date(reminder.dueDate).toLocaleString('vi-VN') : '...'}
                                  </div>
                                </div>
                              </div>
                              {reminder.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full rounded-lg h-7 text-[10px] font-bold"
                                  onClick={() => handleCompleteReminder(reminder)}
                                >
                                  Hoàn thành
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contracts" className="focus-visible:outline-none focus-visible:ring-0">
                {/* Contracts Section */}
                <Card className="border-border bg-card/50 backdrop-blur-sm flex flex-col rounded-3xl shadow-lg">
                  <CardHeader className="pb-3 flex flex-col items-start gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-foreground">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <CardTitle className="text-lg font-bold">Danh sách hợp đồng</CardTitle>
                      </div>
                      <CardDescription className="text-xs font-medium">Quản lý tài liệu pháp lý và giá trị cam kết của khách hàng.</CardDescription>
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingContract(undefined);
                        setIsContractModalOpen(true);
                      }} 
                      className="rounded-xl h-10 px-4 btn-gradient text-xs font-bold shadow-lg shadow-primary/20"
                    >
                      <Plus className="mr-1.5 h-4 w-4" /> Thêm hợp đồng
                    </Button>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 flex-1">
                    {contractsLoading ? (
                      <div className="flex h-48 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : contracts.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-2xl opacity-60">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Không có hợp đồng nào</p>
                        <p className="text-[9px] text-muted-foreground mt-1">Bắt đầu tạo hợp đồng hoặc upload bản scan đầu tiên.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {contracts.map(contract => {
                          const statusStyles: Record<string, string> = {
                            draft: "text-zinc-600 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200/50 dark:border-zinc-500/20",
                            pending_signature: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20",
                            active: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20",
                            expired: "text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20",
                            terminated: "text-zinc-400 bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200/30",
                          };

                          const statusLabels: Record<string, string> = {
                            draft: "Bản nháp",
                            pending_signature: "Chờ ký kết",
                            active: "Hiệu lực",
                            expired: "Hết hạn",
                            terminated: "Hủy bỏ",
                          };

                          const valueFormatted = new Intl.NumberFormat('vi-VN', {
                            style: 'currency', currency: 'VND',
                          }).format(contract.value);

                          const formatDate = (dateString: any) => {
                            if (!dateString) return '---';
                            return new Date(dateString).toLocaleDateString('vi-VN');
                          };

                          return (
                            <div key={contract.id} className="rounded-2xl border border-border p-4 bg-background hover:border-primary/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                              <div className="space-y-2 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-primary">{contract.contractNumber}</span>
                                  <span className={cn(
                                    "inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border",
                                    statusStyles[contract.status]
                                  )}>
                                    {statusLabels[contract.status]}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-foreground truncate">{contract.title}</h4>
                                
                                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[10px] text-muted-foreground font-medium">
                                  <span className="text-foreground font-bold">{valueFormatted}</span>
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3 opacity-60" />
                                    {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                                {contract.content && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => printContract({
                                      contractNumber: contract.contractNumber,
                                      title: contract.title,
                                      value: contract.value,
                                      startDate: contract.startDate || '',
                                      endDate: contract.endDate || '',
                                      customerName: customer.name,
                                      content: contract.content || '',
                                    })}
                                    className="h-8 rounded-lg text-[10px] font-bold gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 cursor-pointer"
                                  >
                                    <Printer className="h-3.5 w-3.5" /> In & Xuất PDF
                                  </Button>
                                )}

                                {contract.fileUrl ? (
                                  <a 
                                    href={contract.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center"
                                  >
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold gap-1 cursor-pointer">
                                      <Download className="h-3.5 w-3.5" /> Tải bản scan
                                    </Button>
                                  </a>
                                ) : (
                                  <Button variant="outline" size="sm" disabled className="h-8 rounded-lg text-[10px] font-bold gap-1 opacity-50">
                                    <ShieldAlert className="h-3.5 w-3.5" /> Chưa có file
                                  </Button>
                                )}

                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    setEditingContract(contract);
                                    setIsContractModalOpen(true);
                                  }}
                                  className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>

                                {userData?.role === 'admin' && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleContractDelete(contract.documentId, contract.contractNumber)}
                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <ContractModal 
        open={isContractModalOpen} 
        onOpenChange={(isOpen) => {
          setIsContractModalOpen(isOpen);
          if (!isOpen) refetchContracts(); // Reload contracts when contract modal is closed
        }} 
        customerId={id} 
        customerName={customer.name}
        customerAssignedTo={customer.assignedTo ? String(customer.assignedTo.id) : undefined}
        initialData={editingContract}
      />
    </div>
);
}
