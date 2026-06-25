import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ShopStore } from '../../../core/shop.store';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <main class="min-h-dvh w-full">
      <!-- HERO -->
      <section class="hero-blush relative overflow-hidden">
        <!-- top bar -->
        <header
          class="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-6 sm:py-5"
        >
          <span class="font-display text-xl tracking-tight sm:text-2xl">{{ shop()?.name ?? 'Turnero' }}</span>
          <a
            [routerLink]="['admin']"
            class="rounded-full border border-[color:var(--color-ink)] px-3 py-1.5 text-xs font-medium sm:px-4 sm:text-sm"
          >
            Soy de la barbería
          </a>
        </header>

        <!-- optional subtle backdrop video -->
        @if (videoUrl()) {
          <video
            class="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 mix-blend-multiply"
            [src]="videoUrl()!"
            autoplay
            muted
            loop
            playsinline
          ></video>
        }

        <div
          class="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-5 pb-16 pt-6 text-center sm:px-6 sm:pb-32 sm:pt-16"
        >
          @if (store.loading()) {
            <p class="text-muted">Cargando…</p>
          } @else if (store.error()) {
            <p class="text-red-700">{{ store.error() }}</p>
          } @else if (shop(); as s) {
            <p class="eyebrow mb-5">Reservas online · Barbería</p>

            <h1 class="headline-xl">
              Tu próximo corte,
              <span class="italic" style="font-family: var(--font-display);">en segundos.</span>
            </h1>

            <p class="mt-5 max-w-xl text-[15px] leading-relaxed text-[color:var(--color-muted)] sm:mt-6 sm:text-lg">
              Elegí tu barbero, mirá los horarios disponibles y confirmá tu turno
              por WhatsApp. Sin llamadas, sin esperas.
            </p>

            <div class="mt-8 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center">
              <a [routerLink]="['book']" class="btn-pill btn-primary w-full sm:w-auto">
                Reservar turno
              </a>
              <a [routerLink]="['book']" class="btn-pill btn-outline w-full sm:w-auto">
                Ver disponibilidad
              </a>
            </div>

            @if (s.logoUrl) {
              <img
                [src]="s.logoUrl"
                alt=""
                class="mt-10 h-14 w-14 rounded-full border border-white/60 object-cover shadow-sm sm:mt-14 sm:h-16 sm:w-16"
              />
            }
          }
        </div>
      </section>

      <!-- FEATURES STRIP -->
      @if (shop(); as s) {
        <section class="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 sm:py-24">
          <div class="grid gap-4 sm:grid-cols-3 sm:gap-6">
            <article class="card-soft p-5 sm:p-6">
              <p class="eyebrow mb-3">01</p>
              <h3 class="font-display text-xl sm:text-2xl">Elegí tu barbero</h3>
              <p class="mt-2 text-sm text-[color:var(--color-muted)]">
                Conocé al equipo y reservá con quien quieras.
              </p>
            </article>
            <article class="card-soft p-5 sm:p-6">
              <p class="eyebrow mb-3">02</p>
              <h3 class="font-display text-xl sm:text-2xl">Mirá los horarios</h3>
              <p class="mt-2 text-sm text-[color:var(--color-muted)]">
                Disponibilidad en tiempo real para los próximos 14 días.
              </p>
            </article>
            <article class="card-soft p-5 sm:p-6">
              <p class="eyebrow mb-3">03</p>
              <h3 class="font-display text-xl sm:text-2xl">Confirmá por WhatsApp</h3>
              <p class="mt-2 text-sm text-[color:var(--color-muted)]">
                Recibís el recordatorio y listo — nos vemos en la barbería.
              </p>
            </article>
          </div>

          <!-- Barbers preview -->
          @if (s.barbers?.length) {
            <div class="mt-14 sm:mt-20">
              <div class="mb-6 flex items-end justify-between sm:mb-8">
                <h2 class="headline-lg">El equipo</h2>
                <a [routerLink]="['book']" class="text-sm font-medium underline underline-offset-4">
                  Reservar →
                </a>
              </div>
              <div class="grid grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-6">
                @for (b of s.barbers; track b.id) {
                  <a
                    [routerLink]="['book']"
                    class="group flex flex-col items-center text-center"
                  >
                    <span
                      class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-surface-2)] text-2xl font-display ring-1 ring-[color:var(--color-border)] transition group-hover:ring-[color:var(--accent)] sm:h-24 sm:w-24"
                    >
                      @if (b.photoUrl) {
                        <img [src]="b.photoUrl" alt="" class="h-full w-full object-cover" />
                      } @else {
                        {{ b.name.charAt(0) }}
                      }
                    </span>
                    <span class="mt-3 text-xs font-medium sm:text-sm">{{ b.name }}</span>
                  </a>
                }
              </div>
            </div>
          }
        </section>

        <!-- CTA BAND -->
        <section class="px-5 pb-14 sm:px-6 sm:pb-20">
          <div
            class="mx-auto w-full max-w-6xl rounded-[1.75rem] bg-[color:var(--color-ink)] px-6 py-12 text-center text-[color:#fdfaf6] sm:rounded-[2rem] sm:px-8 sm:py-24"
          >
            <p class="eyebrow mb-4 sm:mb-5" style="color:#d9b1bd">Listo cuando vos quieras</p>
            <h2 class="headline-lg" style="color:#fdfaf6">
              Reservá tu próximo turno
              <span class="italic">hoy mismo.</span>
            </h2>
            <a [routerLink]="['book']" class="btn-pill btn-soft mt-7 w-full sm:mt-10 sm:w-auto">Reservar turno</a>
          </div>
        </section>

        <footer class="border-t border-[color:var(--color-border)] py-8 text-center text-xs text-[color:var(--color-muted)]">
          © {{ year }} {{ s.name }} · Turnero
        </footer>
      }
    </main>
  `,
})
export class Landing implements OnInit {
  protected readonly store = inject(ShopStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly shop = this.store.shop;
  protected readonly videoUrl = computed(() => this.shop()?.heroVideoUrl ?? null);
  protected readonly year = new Date().getFullYear();
  private readonly slug = signal('');

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.slug.set(slug);
    await this.store.load(slug);
  }
}
