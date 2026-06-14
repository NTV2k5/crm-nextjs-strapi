'use client';

import { useState, useActionState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { autoCreateContractFromDeal } from '@/lib/contracts';
import { Loader2, Briefcase, User, Banknote, ClipboardCheck, FilePlus } from 'lucide-react';
import { BillingAction } from '@/components/BillingAction';
import { Deal } from '@/hooks/useDeals';
import { useCustomers } from '@/hooks/useCustomers';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';
import { strapiFetch, unwrap } from '@/lib/strapi';

interface FormState {
  error?: string;
  success?: boolean;
}

interface DealModalProps {
  initialData?: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactElement;
  refetch?: () => void;
}

export function DealModal({ initialData, open, onOpenChange, trigger, refetch }: DealModalProps) {
  const { userData } = useAuth();
  const { customers } = useCustomers();
  const { users } = useUsers();
  const [uploading, setUploading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialData?.customer?.documentId || '');
  const [selectedAssignedTo, setSelectedAssignedTo] = useState(
    initialData?.assignedTo ? String(initialData.assignedTo.id) : (userData ? String(userData.id) : '')
  );

  useEffect(() => {
    if (open) {
      setSelectedCustomerId(initialData?.customer?.documentId || '');
      setSelectedAssignedTo(
        initialData?.assignedTo ? String(initialData.assignedTo.id) : (userData ? String(userData.id) : '')
      );
    }
  }, [open, initialData, userData]);

  // Track deal stage in live state so it can update when payment webhook changes it
  const [liveDealStage, setLiveDealStage] = useState(initialData?.stage || '');
  useEffect(() => {
    setLiveDealStage(initialData?.stage || '');
  }, [initialData?.stage]);

  // Callback when payment is complete — refetch deal from server to get updated stage
  const handlePaymentComplete = useCallback(async () => {
    try {
      if (initialData?.documentId) {
        const res = await strapiFetch(`/deals/${initialData.documentId}?_t=${Date.now()}`);
        const updatedDeal = unwrap<any>(res);
        if (updatedDeal?.stage) {
          setLiveDealStage(updatedDeal.stage);
        }
      }
    } catch (e) {
      console.error('Failed to re-fetch deal after payment:', e);
    }
    // Also trigger parent list refresh
    if (refetch) refetch();
  }, [initialData?.documentId, refetch]);
  
  const [state, formAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData): Promise<FormState> => {
      try {
        if (!userData) {
          return { error: 'Bạn cần đăng nhập để thực hiện tác vụ này.' };
        }

        const title = formData.get('title') as string;
        const customerId = formData.get('customerId') as string;
        const valueStr = formData.get('value') as string;
        const stage = formData.get('stage') as string;
        const assignedTo = formData.get('assignedTo') as string;
        const contractFile = formData.get('contract') as File;

        if (!title || !customerId || !valueStr) {
          return { error: 'Tiêu đề, Khách hàng và Giá trị là bắt buộc.' };
        }

        const customer = customers.find(c => c.documentId === customerId);
        if (!customer) return { error: 'Khách hàng không tồn tại' };

        const value = Number(valueStr);

        let contractUrl = initialData?.contractUrl || '';

        if (contractFile && contractFile.size > 0) {
          setUploading(true);
          const formDataObj = new FormData();
          formDataObj.append('files', contractFile);

          const uploadRes = await fetch('/api/strapi/upload', {
            method: 'POST',
            body: formDataObj,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Tải file đính kèm thất bại');
          }

          const uploadedFiles = await uploadRes.json();
          if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
            const rawUrl = uploadedFiles[0].url;
            const strapiBaseUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
            contractUrl = rawUrl.startsWith('/') ? `${strapiBaseUrl}${rawUrl}` : rawUrl;
          }
          setUploading(false);
        }

        const dataPayload = {
          title,
          customer: customerId, // Bind to customer documentId
          value,
          stage: stage || 'survey',
          contractUrl,
          assignedTo: assignedTo ? Number(assignedTo) : Number(userData.id), // Bind to user numeric ID
        };

        if (initialData?.documentId) {
          const wasClosed = initialData.stage === 'closed';
          const isClosedNow = stage === 'closed';

          await strapiFetch(`/deals/${initialData.documentId}`, {
            method: 'PUT',
            body: JSON.stringify({ data: dataPayload }),
          });

          let targetCustomerStatus = '';
          if (stage === 'closed') {
            targetCustomerStatus = 'former'; // Khách cũ
          } else if (['quote', 'negotiation', 'waiting_payment'].includes(stage)) {
            targetCustomerStatus = 'consulting'; // Đang tư vấn
          }
          
          if (targetCustomerStatus) {
            await strapiFetch(`/customers/${customerId}`, {
              method: 'PUT',
              body: JSON.stringify({ data: { status: targetCustomerStatus } })
            }).catch(e => console.error('Failed to auto-update customer status:', e));
          }

          if (isClosedNow && !wasClosed) {
            try {
              await autoCreateContractFromDeal({
                customerId,
                customerName: customer.name,
                dealTitle: title,
                dealValue: value,
                dealId: initialData.documentId,
                assignedTo: String(dataPayload.assignedTo),
                userId: userData.id,
                userEmail: userData.email || 'unknown',
              });
            } catch (contractError) {
              console.error('Error auto-creating contract inside modal:', contractError);
            }
          }
        } else {
          const res = await strapiFetch('/deals', {
            method: 'POST',
            body: JSON.stringify({ data: dataPayload }),
          });
          const createdDeal = unwrap<any>(res);

          let targetCustomerStatus = '';
          if (stage === 'closed') {
            targetCustomerStatus = 'former'; // Khách cũ
          } else if (['quote', 'negotiation', 'waiting_payment'].includes(stage)) {
            targetCustomerStatus = 'consulting'; // Đang tư vấn
          }
          
          if (targetCustomerStatus) {
            await strapiFetch(`/customers/${customerId}`, {
              method: 'PUT',
              body: JSON.stringify({ data: { status: targetCustomerStatus } })
            }).catch(e => console.error('Failed to auto-update customer status:', e));
          }

          if (stage === 'closed') {
            try {
              await autoCreateContractFromDeal({
                customerId,
                customerName: customer.name,
                dealTitle: title,
                dealValue: value,
                dealId: createdDeal.documentId,
                assignedTo: String(dataPayload.assignedTo),
                userId: userData.id,
                userEmail: userData.email || 'unknown',
              });
            } catch (contractError) {
              console.error('Error auto-creating contract inside modal:', contractError);
            }
          }

          const deadline = new Date();
          deadline.setHours(deadline.getHours() + 24);

          await strapiFetch('/reminders', {
            method: 'POST',
            body: JSON.stringify({
              data: {
                title: `Gọi điện tư vấn: ${title}`,
                dueDate: deadline.toISOString(),
                status: 'pending',
                customer: customerId,
                assignedTo: dataPayload.assignedTo,
              }
            })
          });
        }

        return { success: true };
      } catch (error: any) {
        setUploading(false);
        return { error: error.message };
      }
    },
    {} as FormState
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(initialData ? 'Cập nhật Deal thành công!' : 'Tạo Deal thành công!');
      if (refetch) refetch();
      onOpenChange(false);
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, initialData, onOpenChange, refetch]);

  // Lấy thông tin khách hàng cho BillingAction
  const selectedCustomer = customers.find(c => c.documentId === (initialData?.customer?.documentId || selectedCustomerId));
  const assignedUser = users.find(u => String(u.id) === String(selectedAssignedTo));
  const salespersonName = assignedUser?.name || initialData?.assignedTo?.username || userData?.name || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-[480px] bg-background border-border shadow-2xl rounded-3xl overflow-hidden p-0">
        <div className="bg-primary/5 px-8 py-6 border-b border-border text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {initialData ? 'Cập nhật cơ hội' : 'Tạo cơ hội mới'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Thiết lập thông tin thương vụ để theo dõi doanh số.
            </p>
          </DialogHeader>
        </div>

        <form action={formAction} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Tên thương vụ</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={initialData?.title} 
                  placeholder="Ví dụ: Dự án cung cấp thiết bị Q2" 
                  required 
                  className="pl-10 h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all" 
                />
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="customerId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Khách hàng liên quan</Label>
              <Select name="customerId" value={selectedCustomerId} onValueChange={(val) => setSelectedCustomerId(val || '')}>
                <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                  <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    <User className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <span className={cn("flex flex-1 text-left truncate line-clamp-1", !selectedCustomerId && "text-muted-foreground")}>
                      {selectedCustomerId ? (customers.find(c => c.documentId === selectedCustomerId)?.name || selectedCustomerId) : "Chọn đối tác / khách hàng"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                  {customers.map(c => (
                    <SelectItem key={c.documentId} value={c.documentId} className="rounded-lg">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-1">
              <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Giá trị dự kiến</Label>
              <div className="relative">
                 <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                 <Input 
                  id="value" 
                  name="value" 
                  type="number" 
                  defaultValue={initialData?.value} 
                  placeholder="VND" 
                  required 
                  className="pl-10 h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all" 
                />
              </div>
            </div>
            
            <div className="space-y-2 col-span-1">
              <Label htmlFor="stage" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Giai đoạn</Label>
              <Select name="stage" defaultValue={initialData?.stage || 'survey'}>
                <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground/50" />
                    <SelectValue placeholder="Trạng thái" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-xl">
                  <SelectItem value="survey">Khảo sát</SelectItem>
                  <SelectItem value="quote">Báo giá</SelectItem>
                  <SelectItem value="negotiation">Thương lượng</SelectItem>
                  <SelectItem value="waiting_payment">Chờ thanh toán</SelectItem>
                  <SelectItem value="closed">Đã chốt (Win)</SelectItem>
                  <SelectItem value="lost">Huỷ (Lost)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {userData?.role === 'admin' && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="assignedTo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Người phụ trách (Admin Only)</Label>
                <Select name="assignedTo" value={selectedAssignedTo} onValueChange={(val) => setSelectedAssignedTo(val || '')}>
                  <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                    <span data-slot="select-value" className={cn("flex flex-1 text-left truncate line-clamp-1", !selectedAssignedTo && "text-muted-foreground")}>
                      {selectedAssignedTo ? (users.find(u => u.id === selectedAssignedTo)?.name || selectedAssignedTo) : "Chọn nhân viên Sales"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-xl">
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label htmlFor="contract" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Tài liệu / Hợp đồng (PDF)</Label>
              <div className="flex flex-col gap-2">
                {initialData?.contractUrl && (
                  <a href={initialData.contractUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[11px] font-bold text-primary hover:underline gap-1">
                    <ClipboardCheck className="h-3 w-3" /> Xem hợp đồng hiện tại
                  </a>
                )}
                <div className="relative group">
                  <Input 
                    id="contract" 
                    name="contract" 
                    type="file" 
                    accept="application/pdf" 
                    className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" 
                  />
                  <FilePlus className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border mt-2">
            {liveDealStage === 'waiting_payment' && selectedCustomer && initialData && (
              <BillingAction
                customerName={selectedCustomer.name}
                customerEmail={selectedCustomer.email}
                dealId={initialData.documentId}
                dealTitle={initialData.title}
                amount={initialData.value}
                salespersonName={salespersonName}
                onPaymentComplete={handlePaymentComplete}
              />
            )}
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
              disabled={isPending || uploading} 
              className="rounded-xl h-11 px-8 btn-gradient font-bold shadow-lg shadow-primary/20"
            >
              {(isPending || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? 'Đang tải lên...' : initialData ? 'Lưu thay đổi' : 'Kích hoạt Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
