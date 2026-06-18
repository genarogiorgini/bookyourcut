import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { AppConfig } from '../config/configuration';

/**
 * Wraps the Supabase clients.
 *  - `admin` uses the service-role key and BYPASSES RLS. All API DB access goes
 *    through it; tenant scoping is enforced in our own guards/services.
 *  - `verifyToken` validates an admin's Supabase JWT and returns the auth user.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private serviceClient!: SupabaseClient;
  private anonClient!: SupabaseClient;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const { url, serviceRoleKey, anonKey } = this.config.get('supabase', { infer: true });
    this.serviceClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /** Service-role client — bypasses RLS. Use for all server-side DB access. */
  get admin(): SupabaseClient {
    return this.serviceClient;
  }

  /** Validate a bearer JWT issued by Supabase Auth; throws if invalid. */
  async verifyToken(token: string): Promise<User> {
    const { data, error } = await this.anonClient.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return data.user;
  }
}
