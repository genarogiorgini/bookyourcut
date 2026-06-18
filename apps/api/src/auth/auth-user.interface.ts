import type { AdminRole } from '@turnero/shared';

export interface AuthUser {
  id: string;
  email: string | null;
  tenantId: string;
  role: AdminRole;
}

declare module 'express' {
  interface Request {
    user?: AuthUser;
  }
}
