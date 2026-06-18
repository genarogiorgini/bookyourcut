import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Barber, BarberSchedule } from '@turnero/shared';
import { ApiService } from '../../../core/api.service';

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

@Component({
  selector: 'app-settings',
  template: `
    <h2 class="mb-1 text-xl font-medium">Ajustes</h2>
    <p class="mb-4 text-sm text-muted">Barberos, precios y horarios de atención.</p>

    @if (loading()) {
      <p class="text-muted">Cargando…</p>
    } @else {
      <ul class="space-y-3">
        @for (b of barbers(); track b.id) {
          <li class="rounded-2xl border border-border bg-surface p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">{{ b.name }}</p>
                <p class="text-sm text-muted">
                  \${{ b.pricePerCut }} · {{ b.defaultDurationMin }} min
                  @if (!b.active) {
                    <span class="text-red-300">· inactivo</span>
                  }
                </p>
              </div>
              <button
                type="button"
                (click)="toggle(b.id)"
                class="rounded-lg border border-border px-3 py-1.5 text-sm text-muted"
              >
                {{ open() === b.id ? 'Ocultar' : 'Horario' }}
              </button>
            </div>

            @if (open() === b.id) {
              <div class="mt-3 border-t border-border pt-3 text-sm">
                @if (schedule().length === 0) {
                  <p class="text-muted">Sin horario cargado.</p>
                } @else {
                  <ul class="space-y-1">
                    @for (s of schedule(); track s.id) {
                      <li class="flex justify-between">
                        <span class="text-muted">{{ weekday(s.weekday) }}</span>
                        <span>{{ s.startTime }} – {{ s.endTime }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </li>
        }
      </ul>
      <p class="mt-4 text-xs text-muted">
        La edición de barberos, horarios y bloqueos se realiza mediante la API
        (<code>/admin/barbers</code>). Próximamente con formularios aquí.
      </p>
    }
  `,
})
export class Settings {
  private readonly api = inject(ApiService);
  protected readonly barbers = signal<Barber[]>([]);
  protected readonly schedule = signal<BarberSchedule[]>([]);
  protected readonly open = signal<string | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.barbers.set(await firstValueFrom(this.api.listBarbers()));
    } catch {
      this.barbers.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(barberId: string): Promise<void> {
    if (this.open() === barberId) {
      this.open.set(null);
      return;
    }
    this.open.set(barberId);
    try {
      this.schedule.set(await firstValueFrom(this.api.getSchedule(barberId)));
    } catch {
      this.schedule.set([]);
    }
  }

  weekday(d: number): string {
    return WEEKDAYS[d];
  }
}
