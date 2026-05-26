import { useState, useEffect, useCallback } from 'react';
import { strapiFetch, unwrap } from '@/lib/strapi';
import { useAuth } from '@/contexts/AuthContext';

export interface Deal {
  id: string;
  documentId: string;
  title: string;
  value: number;
  stage: 'survey' | 'quote' | 'negotiation' | 'waiting_payment' | 'closed' | 'lost';
  contractUrl?: string;
  createdAt: string;
  customer?: {
    id: number;
    documentId: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: number;
    username: string;
  };
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userData, loading: authLoading } = useAuth();

  const fetchDeals = useCallback(async () => {
    if (authLoading || !userData) return;
    setLoading(true);
    try {
      let queryPath = '/deals?populate=*&sort[0]=createdAt:desc';

      if (userData.role !== 'admin' && userData.role !== 'manager') {
        queryPath = `/deals?filters[assignedTo][id][$eq]=${userData.id}&populate=*&sort[0]=createdAt:desc`;
      }

      const res = await strapiFetch(queryPath);
      const data = unwrap<Deal[]>(res);
      setDeals(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching deals:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userData, authLoading]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return { deals, loading, error, refetch: fetchDeals };
}
