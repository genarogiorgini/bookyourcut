import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthUser } from './auth-user.interface';
import type { AdminRole } from '@turnero/shared';

/**
 * Validates the `Authorization: Bearer <jwt>` header against Supabase Auth,
 * then loads the user's profile (tenant_id + role) and attaches it to the
 * request as `req.user`. Every /admin route is scoped by this tenant.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.supabase.verifyToken(token);

    const { data: profile, error } = await this.supabase.admin
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      throw new UnauthorizedException('No profile linked to this user');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email ?? null,
      tenantId: profile.tenant_id as string,
      role: profile.role as AdminRole,
    };
    req.user = authUser;
    return true;
  }
}
