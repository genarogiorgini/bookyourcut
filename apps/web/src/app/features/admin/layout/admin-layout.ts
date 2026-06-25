import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { ShopStore } from '../../../core/shop.store';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-dvh pb-[env(safe-area-inset-bottom)]">
      <header
        class="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-canvas)]/85 px-4 py-3 backdrop-blur sm:px-5 sm:py-4"
      >
        <div class="min-w-0">
          <p class="eyebrow">BackOffice</p>
          <h1 class="truncate font-display text-lg sm:text-2xl">{{ store.shop()?.name ?? 'Turnero' }}</h1>
        </div>
        <button
          type="button"
          (click)="signOut()"
          class="shrink-0 rounded-full border border-[color:var(--color-border)] px-3 py-1.5 text-xs text-[color:var(--color-muted)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] sm:px-4 sm:text-sm"
        >
          Salir
        </button>
      </header>

      <nav class="scroll-rail sticky top-[57px] z-10 flex gap-1 overflow-x-auto border-b border-[color:var(--color-border)] bg-surface px-3 py-2 sm:top-[73px] sm:py-3">
        @for (item of nav; track item.path) {
          <a
            [routerLink]="['/', slug(), 'admin', item.path]"
            routerLinkActive="!bg-[color:var(--color-ink)] !text-[color:#fdfaf6]"
            class="shrink-0 rounded-full px-4 py-1.5 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-ink)]"
          >
            {{ item.label }}
          </a>
        }
      </nav>

      <main class="mx-auto w-full max-w-5xl px-4 py-5 sm:px-5 sm:py-7">
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
