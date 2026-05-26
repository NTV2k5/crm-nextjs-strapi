'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export interface UserData {
  id: string;
  role: 'admin' | 'manager' | 'sales';
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: any;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string, role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check user session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setUserData({
              id: String(data.user.id),
              role: data.user.role,
              name: data.user.name,
              email: data.user.email,
            });
          } else {
            setUser(null);
            setUserData(null);
          }
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [pathname]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập thất bại');
      }

      setUser(data.user);
      setUserData({
        id: String(data.user.id),
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
      });

      toast.success('Đăng nhập thành công');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const registerUser = async (name: string, email: string, password: string, role: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký thất bại');
      }

      toast.success('Đăng ký tài khoản thành công');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    window.location.href = `${process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337'}/api/connect/google`;
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setUserData(null);
      toast.success('Đã đăng xuất');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signInWithGoogle,
        signOut,
        login,
        registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
