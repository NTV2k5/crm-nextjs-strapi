'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsPending(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Yêu cầu khôi phục mật khẩu thất bại');
      }

      setIsSent(true);
      toast.success('Đã gửi email khôi phục mật khẩu thành công!');
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 bg-background overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-[440px] space-y-8">
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-sm border border-primary/20">
             <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Khôi phục quyền truy cập</h1>
            <p className="text-muted-foreground font-medium">Bảo mật tài khoản CRM</p>
          </div>
        </div>

        <Card className="glass-card border-border/50 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 px-8 pt-8">
            <CardTitle className="text-2xl font-bold tracking-tight">Quên mật khẩu</CardTitle>
            <CardDescription className="text-sm font-medium">
              {isSent 
                ? 'Kiểm tra hộp thư đến của bạn để nhận liên kết khôi phục.' 
                : 'Nhập email tài khoản của bạn để nhận liên kết thiết lập lại mật khẩu.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            {!isSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email tài khoản</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    className="h-12 bg-muted/20 border-border rounded-xl focus:ring-primary/20 transition-all"
                    {...register('email')}
                  />
                  {errors.email && <p className="text-[11px] font-bold text-destructive mt-1 ml-1">{errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl btn-gradient font-bold shadow-lg shadow-primary/20">
                  {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Gửi yêu cầu khôi phục'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  ✓
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Chúng tôi đã gửi email hướng dẫn khôi phục mật khẩu. Vui lòng kiểm tra email của bạn.
                </p>
              </div>
            )}

            <div className="pt-2 text-center border-t border-border/50">
               <Link href="/login" className="inline-flex items-center gap-2 text-sm text-primary font-bold hover:underline transition-colors">
                 <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
               </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
