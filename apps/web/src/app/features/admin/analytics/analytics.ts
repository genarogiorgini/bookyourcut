import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import type { BarberAnalytics } from '@turnero/shared';
import { ApiService } from '../../../core/api.service';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

@Component({
  selector: 'app-analytics',
  imports: [FormsModule],
  template: `
    <h2 class="mb-4 text-xl font-medium">Métricas por barbero</h2>

    <div class="mb-5 flex flex-wrap items-end gap-3">
      <label class="text-sm">
        <span class="mb-1 block text-muted">Desde</span>
        <input
          type="date"
          [(ngModel)]="from"
          class="rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      <label class="text-sm">
        <span class="mb-1 block text-muted">Hasta</span>
        <input
          type="date"
          [(ngModel)]="to"
          class="rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      <button
        type="button"
        (click)="load()"
        class="accent-bg rounded-lg px-4 py-2 text-sm font-medium text-[color:var(--color-accent-ink)]"
      >
        Aplicar
      </button>
    </div>

    @if (loading()) {
      <p class="text-muted">Calculando…</p>
    } @else {
      <div class="grid gap-4 sm:grid-cols-2">
        @for (b of rows(); track b.barberId) {
          <div class="rounded-2xl border border-border bg-surface p-5">
            <h3 class="mb-3 text-lg font-semibold">{{ b.barberName }}</h3>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-muted">Turnos</p>
                <p class="text-2xl font-semibold">{{ b.appointmentCount }}</p>
              </div>
              <div>
                <p class="text-muted">Ingresos</p>
                <p class="text-2xl font-semibold">\${{ b.revenue }}</p>
              </div>
              <div>
                <p class="text-muted">Ocupación</p>
                <p class="text-2xl font-semibold">{{ b.occupancyPct }}%</p>
              </div>
              <div>
                <p class="text-muted">Prom./día</p>
                <p class="text-2xl font-semibold">{{ b.avgPerDay }}</p>
              </div>
            </div>
            <div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                class="accent-bg h-full"
                [style.width.%]="b.occupancyPct"
              ></div>
            </div>
            <p class="mt-3 text-xs text-muted">
              Día más activo: {{ weekday(b.busiestWeekday) }} ·
              Hora pico: {{ hour(b.busiestHour) }} ·
              No-show: {{ b.noShowCount }}
            </p>
          </div>
        }
      </div>
    }
  `,
})
export class Analytics {
  private readonly api = inject(ApiService);
  protected readonly rows = signal<BarberAnalytics[]>([]);
  protected readonly loading = signal(false);

  protected from = DateTime.now().startOf('month').toISODate()!;
  protected to = DateTime.now().toISODate()!;

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.analytics(this.from, this.to));
      this.rows.set(res.barbers);
    } catch {
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  weekday(d: number | null): string {
    return d === null ? '—' : WEEKDAYS[d];
  }
  hour(h: number | null): string {
    return h === null ? '—' : `${String(h).padStart(2, '0')}:00`;
  }
}
