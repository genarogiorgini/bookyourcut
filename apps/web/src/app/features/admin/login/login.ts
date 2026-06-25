import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule],
  template: `
    <div class="flex min-h-dvh items-center justify-center px-5">
      <div class="card-soft w-full max-w-sm p-7">
        <p class="eyebrow mb-2">BackOffice</p>
        <h1 class="font-display text-3xl">Ingresá a tu agenda</h1>
        <p class="mb-6 mt-2 text-sm text-[color:var(--color-muted)]">
          Gestioná turnos, barberos y recordatorios.
        </p>

        @if (!auth.isConfigured) {
          <p class="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
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
            class="w-full rounded-2xl border border-[color:var(--color-border)] bg-surface px-4 py-3 outline-none transition focus:border-[color:var(--color-ink)]"
          />
          <input
            [(ngModel)]="password"
            name="password"
            type="password"
            placeholder="Contraseña"
            autocomplete="current-password"
            class="w-full rounded-2xl border border-[color:var(--color-border)] bg-surface px-4 py-3 outline-none transition focus:border-[color:var(--color-ink)]"
          />
          @if (error()) {
            <p class="text-sm text-red-700">{{ error() }}</p>
          }
          <button
            type="submit"
            [disabled]="loading()"
            class="btn-pill btn-primary w-full disabled:opacity-60"
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
