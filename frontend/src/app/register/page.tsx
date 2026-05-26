'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Tên phải ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
  role: z.enum(['admin', 'sales']),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { registerUser } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'sales',
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsPending(true);
    try {
      await registerUser(data.name, data.email, data.password, data.role);
    } catch (error) {
      // toast is already triggered inside context function
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 bg-background overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-[460px] space-y-8">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm border border-primary/20">
             <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Gia nhập hệ thống</h1>
            <p className="text-muted-foreground font-medium">Khởi tạo định danh nhân sự CRM</p>
          </div>
        </div>

        <Card className="glass-card border-border/50 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 px-8 pt-8 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Đăng ký tài khoản</CardTitle>
            <CardDescription className="text-sm font-medium">
              Thiết lập hồ sơ truy cập cho nhân viên mới.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Họ và tên</Label>
                  <Input 
                    id="name" 
                    placeholder="Nguyễn Văn A" 
                    className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Vai trò</Label>
                  <Select onValueChange={(val) => setValue('role', val as any)} defaultValue="sales">
                    <SelectTrigger className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border shadow-xl">
                      <SelectItem value="sales">Sales (Nhân viên)</SelectItem>
                      <SelectItem value="admin">Admin (Quản trị viên)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email doanh nghiệp</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@company.com" 
                  className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
                  {...register('email')}
                />
                {errors.email && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Thiết lập mật khẩu</Label>
                <PasswordInput 
                  id="password" 
                  placeholder="••••••••"
                  className="h-11 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
                  {...register('password')}
                />
                {errors.password && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.password.message}</p>}
              </div>

              <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl btn-gradient font-bold shadow-lg shadow-primary/20">
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Tạo tài khoản ngay'}
              </Button>
            </form>

            <div className="pt-2 text-center">
               <p className="text-sm text-muted-foreground font-medium">
                Đã có tài khoản?{' '}
                <Link href="/login" className="text-primary font-bold hover:underline transition-colors">
                  Đăng nhập tại đây
                </Link>
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
