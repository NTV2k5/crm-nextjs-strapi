import { strapiFetch } from '@/lib/strapi';

export type AuditAction = 
  | 'CREATE_CUSTOMER' 
  | 'UPDATE_CUSTOMER' 
  | 'DELETE_CUSTOMER'
  | 'CREATE_DEAL'
  | 'UPDATE_DEAL_STAGE'
  | 'ADD_NOTE'
  | 'CREATE_CONTRACT'
  | 'UPDATE_CONTRACT'
  | 'DELETE_CONTRACT';

interface AuditParams {
  action: AuditAction;
  entityId: string;
  entityName?: string;
  performedByEmail: string;
  performedByUid: string;
  details?: string;
  metadata?: any;
}

/**
 * Logs an action to the 'audit-logs' collection.
 */
export async function logAudit({
  action,
  entityId,
  entityName,
  performedByEmail,
  performedByUid,
  details,
  metadata
}: AuditParams) {
  try {
    await strapiFetch('/audit-logs', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          action,
          entityId,
          entityName: entityName || '',
          performedByEmail,
          performedByUid,
          details: details || '',
          metadata: metadata || {},
        }
      })
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
    // We don't throw here to avoid breaking the main UI flow
  }
}
