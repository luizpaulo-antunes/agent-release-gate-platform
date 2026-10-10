import type { Request } from "express";

import { isRole, type Actor } from "../auth/types.js";

export function actorFromRequest(request: Request): Actor | undefined {
  const userId = request.header("x-user-id");
  const tenantId = request.header("x-tenant-id");
  const role = request.header("x-role");

  if (!userId || !tenantId || !role || !isRole(role)) {
    return undefined;
  }
  return { userId, tenantId, role };
}
