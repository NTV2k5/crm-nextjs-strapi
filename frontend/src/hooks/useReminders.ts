import { useState, useEffect, useCallback } from 'react';
import { strapiFetch, unwrap } from '@/lib/strapi';
import { useAuth } from '@/contexts/AuthContext';

export interface Reminder {
  id: string;
  documentId: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  createdAt: string;
  customer?: {
    id: number;
    documentId: string;
    name: string;
  };
  assignedTo?: {
    id: number;
    username: string;
  };
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userData, loading: authLoading } = useAuth();

  const fetchReminders = useCallback(async () => {
    if (authLoading || !userData) return;
    setLoading(true);
    try {
      // Fetch pending reminders assigned to current user, ordered by due date ascending
      const queryPath = `/reminders?filters[assignedTo][id][$eq]=${userData.id}&filters[status][$eq]=pending&populate=*&sort[0]=dueDate:asc`;
      
      const res = await strapiFetch(queryPath);
      const data = unwrap<Reminder[]>(res);
      setReminders(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching reminders:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userData, authLoading]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { reminders, loading, error, refetch: fetchReminders };
}
