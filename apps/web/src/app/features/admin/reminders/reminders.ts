import { Component, inject, signal } from '@angular/core';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import type { ReminderDue } from '@turnero/shared';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-reminders',
  template: `
    <h2 class="mb-1 text-xl font-medium">Recordatorios</h2>
    <p class="mb-4 text-sm text-muted">
      Turnos confirmados en las próximas 48 h. Enviá el recordatorio por WhatsApp con un toque.
    </p>

    @if (loading()) {
      <p class="text-muted">Cargando…</p>
    } @else if (items().length === 0) {
      <p class="rounded-xl border border-border bg-surface p-4 text-muted">
        No hay turnos próximos para recordar.
      </p>
    } @else {
      <ul class="space-y-3">
        @for (r of items(); track r.appointment.id) {
          <li
            class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
          >
            <div>
              <p class="font-medium">{{ r.appointment.clientName }}</p>
              <p class="text-sm text-muted">
                {{ r.barberName }} · {{ fmt(r.appointment.startsAt) }}
              </p>
            </div>
            <a
              [href]="r.whatsappUrl"
              target="_blank"
              rel="noopener"
              class="accent-bg shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-[color:var(--color-accent-ink)]"
            >
              Enviar
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class Reminders {
  private readonly api = inject(ApiService);
  protected readonly items = signal<ReminderDue[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.items.set(await firstValueFrom(this.api.remindersDue(48)));
    } catch {
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  fmt(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat("cccc dd/LL 'a las' HH:mm");
  }
}
