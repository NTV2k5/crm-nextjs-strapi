import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText, X, ShieldAlert, BadgeCheck, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Contract } from '@/hooks/useContracts';
import { logAudit } from '@/lib/audit';
import { cn } from '@/lib/utils';
import { strapiFetch, unwrap } from '@/lib/strapi';
import { generateDefaultContractContent, printContract } from '@/lib/contracts';

const contractSchema = z.object({
  contractNumber: z.string().min(3, 'Số hợp đồng không hợp lệ'),
  title: z.string().min(5, 'Tiêu đề phải ít nhất 5 ký tự'),
  value: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Giá trị phải là số lớn hơn hoặc bằng 0'),
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  status: z.enum(['draft', 'pending_signature', 'active', 'expired', 'terminated']),
  notes: z.string().optional(),
  content: z.string().min(10, 'Nội dung hợp đồng quá ngắn'),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerAssignedTo?: string;
  initialData?: Contract;
  trigger?: React.ReactElement;
}

export function ContractModal({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerAssignedTo,
  initialData,
  trigger
}: ContractModalProps) {
  const { userData } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleAutoGenerateContent = () => {
    // Get current form values
    const values = control._formValues;
    const genContent = generateDefaultContractContent({
      contractNumber: values.contractNumber || 'HĐ-2026-XXXX',
      customerName,
      dealTitle: values.title || 'Dịch vụ cung cấp sản phẩm',
      dealValue: Number(values.value) || 0,
      startDate: values.startDate || new Date().toISOString().split('T')[0],
      endDate: values.endDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
    });
    setValue('content', genContent);
    toast.success('Đã tự động tạo nội dung hợp đồng chuẩn pháp lý!');
  };

  const handlePrint = () => {
    const values = control._formValues;
    printContract({
      contractNumber: values.contractNumber || 'HĐ-2026-XXXX',
      title: values.title || 'Hợp đồng dịch vụ',
      value: Number(values.value) || 0,
      startDate: values.startDate,
      endDate: values.endDate,
      customerName,
      content: values.content || '',
    });
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contractNumber: '',
      title: '',
      value: '0',
      startDate: '',
      endDate: '',
      status: 'draft',
      notes: '',
      content: '',
    }
  });

  // Load initialData or generate defaults
  useEffect(() => {
    if (open) {
      setFile(null);
      setUploadProgress(null);
      
      if (initialData) {
        // Parse dates from Strapi to yyyy-MM-dd
        const parseTimestamp = (ts: any) => {
          if (!ts) return '';
          const d = new Date(ts);
          return d.toISOString().split('T')[0];
        };

        reset({
          contractNumber: initialData.contractNumber,
          title: initialData.title,
          value: String(initialData.value),
          startDate: parseTimestamp(initialData.startDate),
          endDate: parseTimestamp(initialData.endDate),
          status: initialData.status,
          notes: initialData.notes || '',
          content: initialData.content || '',
        });
      } else {
        // Generate automatic contract number HĐ-YYYY-XXXX
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        reset({
          contractNumber: `HĐ-${year}-${rand}`,
          title: '',
          value: '0',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          status: 'draft',
          notes: '',
          content: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const onSubmit = async (data: ContractFormValues) => {
    if (!userData) return;

    startTransition(async () => {
      try {
        let fileUrl = initialData?.fileUrl || '';
        let fileName = initialData?.fileName || '';

        // 1. Upload file if selected to Strapi Media Library
        if (file) {
          setUploadProgress(10);
          const formData = new FormData();
          formData.append('files', file);

          setUploadProgress(30);
          const uploadRes = await fetch('/api/strapi/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || 'Tải file scan lên Strapi Media Library thất bại');
          }

          setUploadProgress(80);
          const uploadedFiles = await uploadRes.json();
          if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
            const rawUrl = uploadedFiles[0].url;
            const strapiBaseUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
            fileUrl = rawUrl.startsWith('/') ? `${strapiBaseUrl}${rawUrl}` : rawUrl;
            fileName = file.name;
          }
          setUploadProgress(100);
        }

        // 2. Prepare Strapi contract record
        const contractData = {
          contractNumber: data.contractNumber,
          title: data.title,
          value: Number(data.value),
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          notes: data.notes || '',
          content: data.content,
          fileUrl,
          fileName,
          customer: customerId, // Bind to customer documentId
          assignedTo: customerAssignedTo ? Number(customerAssignedTo) : Number(userData.id),
        };

        if (initialData) {
          // Edit existing contract
          await strapiFetch(`/contracts/${initialData.documentId}`, {
            method: 'PUT',
            body: JSON.stringify({ data: contractData }),
          });

          await logAudit({
            action: 'UPDATE_CONTRACT',
            entityId: initialData.documentId,
            entityName: data.contractNumber,
            performedByEmail: userData.email || 'Unknown',
            performedByUid: userData.id,
            details: `Cập nhật hợp đồng ${data.contractNumber} của khách hàng ${customerName}`
          });

          toast.success('Cập nhật hợp đồng thành công!');
        } else {
          // Create new contract
          const res = await strapiFetch('/contracts', {
            method: 'POST',
            body: JSON.stringify({ data: contractData }),
          });
          const createdContract = unwrap<any>(res);

          await logAudit({
            action: 'CREATE_CONTRACT',
            entityId: createdContract?.documentId || '',
            entityName: data.contractNumber,
            performedByEmail: userData.email || 'Unknown',
            performedByUid: userData.id,
            details: `Tạo mới hợp đồng ${data.contractNumber} cho khách hàng ${customerName}`
          });

          toast.success('Tạo hợp đồng thành công!');
        }

        onOpenChange(false);
      } catch (err: any) {
        console.error("Submit error:", err);
        toast.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      } finally {
        setUploadProgress(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="sm:max-w-[600px] bg-background border-border shadow-2xl rounded-3xl overflow-hidden p-0">
        <div className="bg-primary/5 px-8 py-6 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {initialData ? 'Cập nhật hợp đồng' : 'Tạo hợp đồng mới'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Khách hàng: <span className="text-foreground font-bold">{customerName}</span>
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5 overflow-y-auto max-h-[80vh] custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="contractNumber" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Số hợp đồng</Label>
              <Input id="contractNumber" placeholder="HĐ-2026-XXXX" {...register('contractNumber')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all font-mono font-bold" />
              {errors.contractNumber && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.contractNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Trạng thái pháp lý</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                      <SelectItem value="draft">Bản nháp (Draft)</SelectItem>
                      <SelectItem value="pending_signature">Chờ ký kết</SelectItem>
                      <SelectItem value="active">Hiệu lực (Active)</SelectItem>
                      <SelectItem value="expired">Hết hạn (Expired)</SelectItem>
                      <SelectItem value="terminated">Hủy bỏ / Đơn phương chấm dứt</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Tiêu đề hợp đồng</Label>
            <Input id="title" placeholder="Hợp đồng cung cấp giải pháp phần mềm CRM..." {...register('title')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all" />
            {errors.title && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 whitespace-nowrap">Giá trị hợp đồng (VNĐ)</Label>
              <Input id="value" type="number" placeholder="50000000" {...register('value')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all font-bold" />
              {errors.value && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.value.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Ngày bắt đầu</Label>
              <Input id="startDate" type="date" {...register('startDate')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 dark:[color-scheme:dark]" />
              {errors.startDate && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Ngày hết hạn</Label>
              <Input id="endDate" type="date" {...register('endDate')} className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 dark:[color-scheme:dark]" />
              {errors.endDate && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* File Upload to Strapi */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Bản scan hợp đồng đính kèm (PDF/Word/Ảnh)</Label>
            
            {!file && !initialData?.fileUrl && (
              <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <p className="text-xs font-bold text-foreground">Kéo thả file hoặc click để tải lên</p>
                <p className="text-[10px] text-muted-foreground mt-1">Chấp nhận .pdf, .docx, hình ảnh (tối đa 15MB)</p>
              </div>
            )}

            {(file || initialData?.fileUrl) && (
              <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate text-foreground">{file ? file.name : initialData?.fileName}</p>
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Bản scan đã tải lên'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {initialData?.fileUrl && !file && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                      <BadgeCheck className="h-3.5 w-3.5" /> Sẵn có
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 relative"
                  >
                    <X className="h-4 w-4" />
                    {initialData?.fileUrl && !file && (
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Upload progress indicator */}
            {uploadProgress !== null && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-primary animate-pulse">Đang upload tài liệu lên Cloud...</span>
                  <span className="text-muted-foreground">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary btn-gradient transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between ml-1">
              <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nội dung chi tiết hợp đồng</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAutoGenerateContent}
                  className="h-7 text-[10px] font-bold text-primary hover:text-primary/80 bg-primary/5 rounded-lg px-2 cursor-pointer"
                >
                  Tự động sinh nội dung
                </Button>
                {control._formValues.content && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePrint}
                    className="h-7 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 rounded-lg px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="h-3 w-3" /> In & Xuất PDF
                  </Button>
                )}
              </div>
            </div>
            <Textarea 
              id="content" 
              placeholder="Nội dung điều khoản kinh tế, đại diện các bên, nghĩa vụ cam kết..." 
              {...register('content')} 
              className="min-h-[220px] bg-muted/20 border-border rounded-xl focus:ring-primary/20 p-4 text-xs font-mono leading-relaxed transition-all" 
            />
            {errors.content && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.content.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Điều khoản & Ghi chú thêm</Label>
            <Textarea id="notes" placeholder="Quy định tiến độ thanh toán, thời hạn bảo hành, phạm vi SOW..." {...register('notes')} className="min-h-[80px] resize-none bg-muted/20 border-border rounded-xl focus:ring-primary/20 p-3 text-xs transition-all" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11 px-6 font-bold text-xs"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isPending || uploadProgress !== null}
              className="rounded-xl h-11 px-8 btn-gradient font-bold shadow-lg shadow-primary/20 text-xs"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Cập nhật hợp đồng' : 'Tạo hợp đồng'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
