import { useState, useEffect, useCallback } from 'react';
import { strapiFetch } from '@/lib/strapi';
import { useAuth } from '@/contexts/AuthContext';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales';
  createdAt?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userData, loading: authLoading } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (authLoading || !userData) return;
    setLoading(true);
    try {
      // In Strapi, query /users with populated role
      const data = await strapiFetch('/users?populate=role');
      if (Array.isArray(data)) {
        const results = data.map((u: any) => ({
          id: String(u.id),
          name: u.name || u.username,
          email: u.email,
          role: u.role?.type || 'sales',
          createdAt: u.createdAt,
        })) as UserData[];
        
        // Sort by createdAt descending
        results.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        setUsers(results);
      }
      setError(null);
    } catch (err: any) {
      console.error("Fetch Users Error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userData, authLoading]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
}
