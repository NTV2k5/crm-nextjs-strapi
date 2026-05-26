
import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText, X, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Customer } from '@/hooks/useCustomers';
import { useUsers } from '@/hooks/useUsers';
import { logAudit } from '@/lib/audit';
import { cn } from '@/lib/utils';
import { strapiFetch, unwrap } from '@/lib/strapi';

const customerSchema = z.object({
  name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(10, 'SĐT không hợp lệ'),
  company: z.string().optional(),
  status: z.enum(['lead', 'consulting', 'closed', 'former']),
  source: z.string().min(1, 'Vui lòng chọn nguồn'),
  assignedTo: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Customer;
  trigger?: React.ReactElement;
  refetch?: () => void;
}

export function CustomerModal({ open, onOpenChange, initialData, trigger, refetch }: CustomerModalProps) {
  const { user, userData } = useAuth();
  const { users } = useUsers();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'lead',
      source: 'other',
      assignedTo: userData ? String(userData.id) : '',
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          email: initialData.email,
          phone: initialData.phone,
          company: initialData.company || '',
          status: initialData.status,
          source: initialData.source || 'other',
          assignedTo: initialData.assignedTo ? String(initialData.assignedTo.id) : (userData ? String(userData.id) : ''),
        });
      } else {
        reset({
          name: '',
          email: '',
          phone: '',
          company: '',
          status: 'lead',
          source: 'other',
          assignedTo: userData ? String(userData.id) : '',
        });
      }
    }
  }, [open, initialData, reset, userData]);

  const onSubmit = async (data: CustomerFormValues) => {
    if (!userData) return;

    startTransition(async () => {
      try {
        // 1. Duplicate Detection (Only for new customers)
        if (!initialData) {
          const emailCheck = await strapiFetch(`/customers?filters[email][$eq]=${encodeURIComponent(data.email)}`);
          const phoneCheck = await strapiFetch(`/customers?filters[phone][$eq]=${encodeURIComponent(data.phone)}`);
          
          const emailData = unwrap<any[]>(emailCheck);
          const phoneData = unwrap<any[]>(phoneCheck);

          if (emailData && emailData.length > 0) throw new Error('Email này đã tồn tại trong hệ thống!');
          if (phoneData && phoneData.length > 0) throw new Error('Số điện thoại này đã tồn tại!');
        }

        // 2. Prepare Data
        const customerData = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company || '',
          status: data.status,
          source: data.source,
          assignedTo: data.assignedTo ? Number(data.assignedTo) : Number(userData.id),
        };

        if (initialData) {
          await strapiFetch(`/customers/${initialData.documentId}`, {
            method: 'PUT',
            body: JSON.stringify({ data: customerData }),
          });
          
          await logAudit({
            action: 'UPDATE_CUSTOMER',
            entityId: initialData.documentId,
            entityName: data.name,
            performedByEmail: userData.email || 'Unknown',
            performedByUid: userData.id,
            details: `Cập nhật thông tin khách hàng: ${data.name}`
          });
          
          toast.success('Cập nhật khách hàng thành công');
        } else {
          const res = await strapiFetch('/customers', {
            method: 'POST',
            body: JSON.stringify({ data: customerData }),
          });
          
          const createdCustomer = unwrap<any>(res);

          await logAudit({
            action: 'CREATE_CUSTOMER',
            entityId: createdCustomer?.documentId || '',
            entityName: data.name,
            performedByEmail: userData.email || 'Unknown',
            performedByUid: userData.id,
            details: `Tạo mới khách hàng: ${data.name}`
          });

          // Send FCM Notification via API
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: customerData.assignedTo,
              title: 'Khách hàng mới!',
              body: `Bạn vừa được gán khách hàng: ${data.name}`,
            })
          }).catch(e => console.error("FCM Error:", e));

          toast.success('Thêm khách hàng thành công');
        }
        if (refetch) refetch();
        onOpenChange(false);
      } catch (error: any) {
        toast.error(error.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-[550px] bg-background border-border shadow-2xl rounded-3xl overflow-hidden p-0">
        <div className="bg-primary/5 px-8 py-6 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {initialData ? 'Cập nhật hồ sơ' : 'Thêm khách hàng'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">
              {initialData ? 'Thay đổi thông tin chi tiết của khách hàng.' : 'Tạo hồ sơ khách hàng mới vào hệ thống.'}
            </p>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Họ và tên</Label>
              <Input id="name" placeholder="Nguyễn Văn A" {...register('name')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all" />
              {errors.name && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Số điện thoại</Label>
              <Input id="phone" placeholder="0901234567" {...register('phone')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all" />
              {errors.phone && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
            <Input id="email" type="email" placeholder="email@vi-du.com" {...register('email')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all" />
            {errors.email && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Công ty / Tổ chức</Label>
            <Input id="company" placeholder="Tên đơn vị công tác" {...register('company')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Trạng thái</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                      <SelectItem value="lead">Tiềm năng (Lead)</SelectItem>
                      <SelectItem value="consulting">Đang tư vấn</SelectItem>
                      <SelectItem value="closed">Đã chốt (Closed)</SelectItem>
                      <SelectItem value="former">Khách hàng cũ</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nguồn khách</Label>
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Chọn nguồn" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Giới thiệu</SelectItem>
                      <SelectItem value="other">Nguồn khác</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          {userData?.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Người phụ trách (Admin Only)</Label>
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={(val) => field.onChange(val || '')} value={field.value}>
                    <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                      <span data-slot="select-value" className={cn("flex flex-1 text-left truncate line-clamp-1", !field.value && "text-muted-foreground")}>
                        {field.value ? (users.find(u => u.id === field.value)?.name || field.value) : "Chọn nhân viên Sales"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}



          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11 px-6 font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl h-11 px-8 btn-gradient font-bold shadow-lg shadow-primary/20"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
