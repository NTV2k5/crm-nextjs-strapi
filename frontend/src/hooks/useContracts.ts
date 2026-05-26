import { useState, useEffect, useCallback } from 'react';
import { strapiFetch, unwrap } from '@/lib/strapi';
import { useAuth } from '@/contexts/AuthContext';

export interface Contract {
  id: string;
  documentId: string;
  contractNumber: string;
  title: string;
  value: number;
  startDate?: string;
  endDate?: string;
  signedDate?: string;
  status: 'draft' | 'pending_signature' | 'active' | 'expired' | 'terminated';
  fileUrl?: string;
  fileName?: string;
  notes?: string;
  content?: string;
  createdAt: string;
  customer?: {
    id: number;
    documentId: string;
    name: string;
    email: string;
  };
  deal?: {
    id: number;
    documentId: string;
    title: string;
  };
  createdBy?: {
    id: number;
    username: string;
  };
  assignedTo?: {
    id: number;
    username: string;
  };
}

export function useContracts(customerId?: string) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { userData, loading: authLoading } = useAuth();

  const fetchContracts = useCallback(async () => {
    if (authLoading || !userData) return;
    setLoading(true);
    try {
      let queryPath = '';

      if (customerId) {
        // Query by customer ID
        // Note: customers relation could match by id or documentId, let's filter by customer.id or customer.documentId
        queryPath = `/contracts?filters[customer][documentId][$eq]=${customerId}&populate=*&sort[0]=createdAt:desc`;
      } else {
        // Query by role
        if (userData.role === 'admin' || userData.role === 'manager') {
          queryPath = '/contracts?populate=*&sort[0]=createdAt:desc';
        } else {
          queryPath = `/contracts?filters[assignedTo][id][$eq]=${userData.id}&populate=*&sort[0]=createdAt:desc`;
        }
      }

      const res = await strapiFetch(queryPath);
      const data = unwrap<Contract[]>(res);
      setContracts(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userData, authLoading, customerId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  return { contracts, loading, error, refetch: fetchContracts };
}
