import { useState, useEffect, useCallback } from 'react';
import { strapiFetch, unwrap } from '@/lib/strapi';
import { useAuth } from '@/contexts/AuthContext';

export interface Customer {
  id: string;
  documentId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'lead' | 'consulting' | 'closed' | 'former';
  source?: string;
  createdAt: string;
  assignedTo?: {
    id: number;
    username: string;
    email: string;
  };
  contractUrl?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userData, loading: authLoading } = useAuth();

  const fetchCustomers = useCallback(async () => {
    if (authLoading || !userData) return;
    setLoading(true);
    try {
      let queryPath = '/customers?populate=*&sort[0]=createdAt:desc';
      
      // If user is sales, filter by assignedTo
      if (userData.role !== 'admin' && userData.role !== 'manager') {
        queryPath = `/customers?filters[assignedTo][id][$eq]=${userData.id}&populate=*&sort[0]=createdAt:desc`;
      }

      const res = await strapiFetch(queryPath);
      const data = unwrap<Customer[]>(res);
      setCustomers(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userData, authLoading]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, error, refetch: fetchCustomers };
}
