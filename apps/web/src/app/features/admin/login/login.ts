import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  template: `
    <div class="flex min-h-dvh items-center justify-center px-5">
      <div class="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <h1 class="mb-1 text-2xl font-semibold">BackOffice</h1>
        <p class="mb-6 text-sm text-muted">Ingresá para gestionar los turnos.</p>

        @if (!auth.isConfigured) {
          <p class="rounded-xl border border-amber-700/40 bg-amber-900/20 p-3 text-sm text-amber-200">
            Configurá <code>supabaseUrl</code> y <code>supabaseAnonKey</code> en el
            environment para habilitar el login.
          </p>
        }

        <form (ngSubmit)="submit()" class="space-y-3">
          <input
            [(ngModel)]="email"
            name="email"
            type="email"
            placeholder="Email"
            autocomplete="username"
            class="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
          />
          <input
            [(ngModel)]="password"
            name="password"
            type="password"
            placeholder="Contraseña"
            autocomplete="current-password"
            class="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 outline-none focus:border-[color:var(--accent)]"
          />
          @if (error()) {
            <p class="text-sm text-red-300">{{ error() }}</p>
          }
          <button
            type="submit"
            [disabled]="loading()"
            class="accent-bg w-full rounded-xl py-3 font-medium text-[color:var(--color-accent-ink)] disabled:opacity-60"
          >
            {{ loading() ? 'Ingresando…' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AdminLogin {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.signIn(this.email.trim(), this.password);
      const slug = this.route.parent?.parent?.snapshot.paramMap.get('slug') ?? '';
      await this.router.navigate([slug, 'admin', 'dashboard']);
    } catch (err: unknown) {
      this.error.set((err as Error)?.message ?? 'No se pudo iniciar sesión.');
    } finally {
      this.loading.set(false);
    }
  }
}
