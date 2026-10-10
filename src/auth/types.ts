export const roles = ["viewer", "analyst", "admin"] as const;
export type Role = (typeof roles)[number];

export interface Actor {
  userId: string;
  tenantId: string;
  role: Role;
}

export function isRole(value: string): value is Role {
  return roles.includes(value as Role);
}
