import { PERMISSIONS, Role } from "./roles";
export function usePermission(action: string, role: Role | undefined) {
  if (!role) return false;
  const perms = PERMISSIONS[role] ?? [];
  return perms.includes(action) || perms.some(p => p.endsWith(":*") && action.startsWith(p.split(":")[0]));
}
