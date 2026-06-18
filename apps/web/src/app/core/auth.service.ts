import { Injectable, signal } from '@angular/core';
import {
  createClient,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Admin authentication via Supabase Auth (email + password).
 * The access token is attached to /admin API calls by authInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client: SupabaseClient | null;
  readonly session = signal<Session | null>(null);

  constructor() {
    this.client =
      environment.supabaseUrl && environment.supabaseAnonKey
        ? createClient(environment.supabaseUrl, environment.supabaseAnonKey)
        : null;

    if (this.client) {
      void this.client.auth.getSession().then(({ data }) => {
        this.session.set(data.session);
      });
      this.client.auth.onAuthStateChange((_event, session) => {
        this.session.set(session);
      });
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  get accessToken(): string | null {
    return this.session()?.access_token ?? null;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!this.client) throw new Error('Supabase no está configurado.');
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    this.session.set(data.session);
  }

  async signOut(): Promise<void> {
    await this.client?.auth.signOut();
    this.session.set(null);
  }
}
