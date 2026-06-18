import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShopStore } from '../../../core/shop.store';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <section class="relative min-h-dvh w-full overflow-hidden">
      <!-- Blurred looping video backdrop -->
      @if (videoUrl()) {
        <video
          class="absolute inset-0 h-full w-full scale-110 object-cover blur-[6px] brightness-50"
          [src]="videoUrl()!"
          autoplay
          muted
          loop
          playsinline
        ></video>
      } @else {
        <div
          class="absolute inset-0 bg-gradient-to-b from-surface-2 via-canvas to-black"
        ></div>
      }
      <div class="absolute inset-0 bg-black/40"></div>

      <!-- Foreground -->
      <div
        class="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      >
        @if (store.loading()) {
          <p class="text-muted">Cargando…</p>
        } @else if (store.error()) {
          <p class="text-red-300">{{ store.error() }}</p>
        } @else if (shop(); as s) {
          @if (s.logoUrl) {
            <img [src]="s.logoUrl" alt="" class="mb-6 h-20 w-20 rounded-full object-cover" />
          }
          <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">{{ s.name }}</h1>
          <p class="mt-3 max-w-sm text-muted">
            Elegí tu barbero y reservá tu turno en segundos.
          </p>
          <a
            [routerLink]="['book']"
            class="accent-bg mt-10 rounded-2xl px-8 py-4 text-lg font-medium text-[color:var(--color-accent-ink)] shadow-lg transition active:scale-95"
          >
            Reservar turno
          </a>
          <a
            [routerLink]="['admin']"
            class="mt-6 text-sm text-muted underline-offset-4 hover:underline"
          >
            Soy de la barbería
          </a>
        }
      </div>
    </section>
  `,
})
export class Landing implements OnInit {
  protected readonly store = inject(ShopStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly shop = this.store.shop;
  protected readonly videoUrl = computed(() => this.shop()?.heroVideoUrl ?? null);
  private readonly slug = signal('');

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.slug.set(slug);
    await this.store.load(slug);
  }
}
