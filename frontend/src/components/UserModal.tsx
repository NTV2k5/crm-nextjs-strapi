import { useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordInput } from '@/components/ui/password-input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserData } from '@/hooks/useUsers';
import { strapiFetch, unwrap } from '@/lib/strapi';

const userSchema = z.object({
  name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  role: z.enum(['admin', 'manager', 'sales']),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: 'Mật khẩu phải ít nhất 6 ký tự',
  }),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: UserData;
}

export function UserModal({ open, onOpenChange, initialData }: UserModalProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'sales',
      password: '',
    }
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          email: initialData.email,
          role: initialData.role,
          password: '',
        });
      } else {
        reset({
          name: '',
          email: '',
          role: 'sales',
          password: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: UserFormValues) => {
    startTransition(async () => {
      try {
        // 1. Fetch available roles from Strapi to map string roles to role IDs
        const rolesCheck = await strapiFetch('/users-permissions/roles');
        const rolesList = rolesCheck?.roles || [];
        const matchedRole = rolesList.find((r: any) => r.type === data.role);

        if (!matchedRole) {
          throw new Error(`Không tìm thấy vai trò ${data.role} trên hệ thống backend`);
        }

        if (initialData) {
          // UPDATE EXISTING USER
          const updateData: any = {
            name: data.name,
            role: matchedRole.id,
          };

          if (data.password) {
            updateData.password = data.password;
          }

          await strapiFetch(`/users/${initialData.id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
          });

          toast.success('Cập nhật nhân sự thành công');
        } else {
          // CREATE NEW USER
          if (!data.password) {
            throw new Error('Vui lòng nhập mật khẩu khởi tạo cho nhân viên mới.');
          }

          const userPayload = {
            username: data.email,
            email: data.email,
            password: data.password,
            name: data.name,
            role: matchedRole.id,
            confirmed: true
          };

          // Note: In Strapi, User creation payload is flat at root level
          await strapiFetch('/users', {
            method: 'POST',
            body: JSON.stringify(userPayload),
          });

          toast.success('Đã tạo tài khoản nhân viên mới thành công!');
        }

        onOpenChange(false);
      } catch (error: any) {
        console.error('Error saving user:', error);
        toast.error(error.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-background border-border shadow-2xl rounded-3xl overflow-hidden p-0">
        <div className="bg-primary/5 px-8 py-6 border-b border-border text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold tracking-tight">
              {initialData ? 'Cập nhật tài khoản' : 'Thêm nhân sự'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Thiết lập thông tin truy cập hệ thống.
            </p>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          <div className="space-y-2 text-left">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Họ và tên</Label>
            <Input
              id="name"
              placeholder="Họ và tên nhân viên"
              className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
              {...register('name')}
            />
            {errors.name && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.name.message}</p>}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email doanh nghiệp</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              disabled={!!initialData}
              className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all disabled:opacity-50"
              {...register('email')}
            />
            {errors.email && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.email.message}</p>}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Vai trò hệ thống</Label>
            <Select 
              onValueChange={(val) => setValue('role', val as any)} 
              defaultValue={initialData?.role || 'sales'}
            >
              <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                <SelectItem value="sales">Sales (Nhân viên)</SelectItem>
                <SelectItem value="manager">Manager (Quản lý)</SelectItem>
                <SelectItem value="admin">Admin (Quản trị viên)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 text-left">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              {initialData ? 'Thay đổi mật khẩu' : 'Mật khẩu khởi tạo'}
            </Label>
            <PasswordInput
              id="password"
              placeholder={initialData ? "Để trống nếu không đổi" : "Tối thiểu 6 ký tự"}
              className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
              {...register('password')}
            />
            {errors.password && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border mt-2">
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
              {initialData ? 'Lưu cập nhật' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
