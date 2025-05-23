export const ROLES = { ADMIN: "admin", MANAGER: "manager", SALES: "sales" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
export const PERMISSIONS: Record<Role, string[]> = {
  admin:   ["customers:*","deals:*","reports:*","settings:*","users:*"],
  manager: ["customers:read","customers:write","deals:*","reports:read"],
  sales:   ["customers:read","customers:write","deals:read","deals:write"],
};
