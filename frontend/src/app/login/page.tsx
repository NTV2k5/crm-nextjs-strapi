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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2, ShieldCheck, Globe } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, signInWithGoogle } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsPending(true);
    try {
      await login(data.email, data.password);
    } catch (error) {
      // toast is already triggered inside login context function
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 bg-background overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[60%] left-[70%] w-[35%] h-[35%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-[440px] space-y-8">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 rotate-3">
             <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight uppercase">CRM NEXT</h1>
            <p className="text-muted-foreground font-medium">Cổng thông tin quản trị doanh nghiệp</p>
          </div>
        </div>

        <Card className="glass-card border-border/50 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 px-8 pt-8">
            <CardTitle className="text-2xl font-bold tracking-tight">Đăng nhập</CardTitle>
            <CardDescription className="text-sm font-medium">
              Vui lòng sử dụng tài khoản doanh nghiệp để truy cập.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email nhân viên</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  className="h-12 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
                  {...register('email')}
                />
                {errors.email && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mật khẩu</Label>
                  <Link href="/forgot-password" title="password" className="text-[11px] font-bold text-primary hover:underline">
                    Quên mật khẩu?
                  </Link>
                </div>
                <PasswordInput 
                  id="password"
                  placeholder="••••••••"
                  className="h-12 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
                  {...register('password')}
                />
                {errors.password && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl btn-gradient font-bold shadow-lg shadow-primary/20">
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Xác nhận đăng nhập'}
              </Button>
            </form>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-tighter">
                <span className="bg-background/80 px-3 text-muted-foreground backdrop-blur-sm">
                  Phương thức khác
                </span>
              </div>
            </div>
            
            <Button variant="outline" type="button" onClick={signInWithGoogle} className="w-full h-12 border-border bg-background rounded-xl font-bold shadow-sm hover:bg-muted/50 transition-all">
              <Globe className="mr-2 h-4 w-4 text-primary" /> Google Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
