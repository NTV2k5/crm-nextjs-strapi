'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, Sun, Moon, Menu, Bell, Search, PanelLeftClose, PanelLeftOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { strapiFetch, unwrap } from '@/lib/strapi';
import Link from 'next/link';

interface TopHeaderProps {
  isSidebarCollapsed?: boolean;
}

export function TopHeader({ isSidebarCollapsed }: TopHeaderProps) {
  const { userData, signOut: logoutUser, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const query = encodeURIComponent(searchQuery);
        let assignedFilter = '';
        if (userData?.role !== 'admin' && userData?.role !== 'manager') {
          assignedFilter = `&filters[assignedTo][id][$eq]=${userData?.id}`;
        }
        
        const path = `/customers?filters[$or][0][name][$containsi]=${query}&filters[$or][1][email][$containsi]=${query}&filters[$or][2][phone][$containsi]=${query}${assignedFilter}&pagination[limit]=5`;
        const res = await strapiFetch(path);
        const data = unwrap<any[]>(res);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userData]);

  if (loading || !userData) return null;

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success('Đã đăng xuất thành công');
    } catch (error) {
      toast.error('Lỗi khi đăng xuất');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-10 lg:pl-10 lg:ml-0 transition-all shadow-sm">
      {/* Mobile Menu Button - visible only on small screens */}
      <div className="lg:hidden flex items-center">
        <Button variant="ghost" size="icon" className="mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-extrabold tracking-tight text-primary">CRM NEXT</span>
      </div>

      {/* Desktop Search & Actions */}
      <div className="hidden lg:flex items-center gap-4 flex-1">
        <div ref={searchRef} className="relative max-w-md w-full ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setShowResults(true);
            }}
            placeholder="Tìm kiếm thông tin khách hàng, email, sđt..." 
            className="pl-10 bg-muted/30 border-transparent focus-visible:ring-primary h-10 rounded-xl" 
          />
          {showResults && searchQuery.trim() && (
            <div className="absolute top-full mt-2 w-full bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 flex justify-center items-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tìm kiếm...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  <div className="px-3 pb-2 pt-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    Khách hàng
                  </div>
                  {searchResults.map((customer: any) => (
                    <Link
                      key={customer.id}
                      href={`/customers/${customer.documentId}`}
                      onClick={() => setShowResults(false)}
                      className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">{customer.email || customer.phone || 'Không có liên hệ'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground font-medium">
                  Không tìm thấy kết quả nào
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 bg-background shadow-sm border-border relative hidden sm:flex">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
        </Button>
        
        <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl h-10 w-10 bg-background shadow-sm border-border">
          {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="h-10 px-3 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {userData.email?.[0] || 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start text-left max-w-[120px]">
              <span className="text-xs font-bold truncate w-full">{userData.name || 'User'}</span>
              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none bg-muted px-1.5 py-0.5 rounded-sm">{userData.role || 'GUEST'}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-border shadow-xl p-2">
            <div className="px-2 py-1.5 mb-2 border-b border-border/50">
              <p className="text-sm font-bold">{userData.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
            </div>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg font-bold">
              <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

import React from "react";
export default function TopHeader() {
  return (
    <header className="top-header">
      <div className="logo">CRM Pro</div>
    </header>
  );
}
// fix: z-index 50 on dropdown overlay to prevent sticky header overlap
