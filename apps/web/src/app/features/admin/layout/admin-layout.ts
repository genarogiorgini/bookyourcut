import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ShopStore } from '../../../core/shop.store';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-dvh">
      <header
        class="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-canvas/90 px-4 py-3 backdrop-blur"
      >
        <div>
          <p class="text-xs text-muted">BackOffice</p>
          <h1 class="font-semibold">{{ store.shop()?.name ?? 'Turnero' }}</h1>
        </div>
        <button
          type="button"
          (click)="signOut()"
          class="rounded-lg border border-border px-3 py-1.5 text-sm text-muted"
        >
          Salir
        </button>
      </header>

      <nav class="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-2">
        @for (item of nav; track item.path) {
          <a
            [routerLink]="['/', slug(), 'admin', item.path]"
            routerLinkActive="accent-bg !text-[color:var(--color-accent-ink)]"
            class="shrink-0 rounded-lg px-3 py-1.5 text-sm text-muted"
          >
            {{ item.label }}
          </a>
        }
      </nav>

      <main class="mx-auto w-full max-w-5xl px-4 py-5">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayout implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(ShopStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly slug = signal('');
  protected readonly nav = [
    { path: 'dashboard', label: 'Agenda' },
    { path: 'reminders', label: 'Recordatorios' },
    { path: 'analytics', label: 'Métricas' },
    { path: 'settings', label: 'Ajustes' },
  ];

  async ngOnInit(): Promise<void> {
    const slug = this.route.parent?.snapshot.paramMap.get('slug') ?? '';
    this.slug.set(slug);
    await this.store.load(slug);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate([this.slug(), 'admin', 'login']);
  }
}
