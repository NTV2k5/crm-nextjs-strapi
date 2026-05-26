'use client';

import { useState } from 'react';
import { UserData, useUsers } from '@/hooks/useUsers';
import { UserModal } from '@/components/UserModal';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, Search, Plus, Edit, Trash2, Shield, Mail, Calendar, ArrowLeft,
  UserCheck, UserCog, UserCircle, Users, Sun, Moon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { strapiFetch } from '@/lib/strapi';

export default function AdminUsers() {
  const { users, loading, refetch } = useUsers();
  const { userData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  // Protect route client-side in addition to middleware
  if (userData?.role !== 'admin' && userData?.role !== 'manager') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Truy cập bị từ chối</h1>
          <p className="text-muted-foreground">Bạn không có quyền truy cập vào trang này.</p>
          <Button onClick={() => router.push('/')}>Quay lại Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhân sự này khỏi hệ thống?')) {
      try {
        await strapiFetch(`/users/${id}`, {
          method: 'DELETE'
        });
        toast.success('Đã xóa người dùng thành công.');
        refetch(); // Reload user list
      } catch (error: any) {
        toast.error('Lỗi khi xóa người dùng: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string, color: string, icon: any }> = {
      admin: { label: 'Admin', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20', icon: Shield },
      manager: { label: 'Manager', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', icon: UserCog },
      sales: { label: 'Sales', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', icon: UserCheck },
    };

    const config = roles[role] || roles.sales;
    const Icon = config.icon;

    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight border",
        config.color
      )}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase">
              <span className="w-8 h-[2px] bg-primary"></span>
              Team Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Quản lý đội ngũ</h1>
            <p className="text-muted-foreground font-medium">Phân quyền và quản lý tài khoản nhân sự trong hệ thống.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={handleAddNew} className="rounded-xl btn-gradient h-11 px-6 shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Thêm nhân sự mới
          </Button>
        </div>
      </header>

      <Card className="border-border overflow-hidden rounded-3xl shadow-lg bg-card/40 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 pb-6 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm tên hoặc email nhân viên..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-background border-border rounded-xl focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {users.length} thành viên
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 border-border hover:bg-muted/20">
                    <TableHead className="w-[350px] font-bold text-foreground">Thành viên</TableHead>
                    <TableHead className="font-bold text-foreground">Vai trò</TableHead>
                    <TableHead className="font-bold text-foreground">Ngày gia nhập</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Không tìm thấy nhân sự nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id} className="border-border hover:bg-muted/30 transition-all group">
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                              <UserCircle className="h-6 w-6" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-bold text-foreground">{u.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {u.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(u.role)}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 opacity-60" />
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '---'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(u)} className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {userData?.id !== u.id && (
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserModal 
        open={isModalOpen} 
        onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) refetch(); // Reload user list when user modal is closed
        }} 
        initialData={editingUser}
      />
    </div>
  );
}
