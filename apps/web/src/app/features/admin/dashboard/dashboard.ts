import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import {
  Calendar,
  type CalendarOptions,
  type DateSelectArg,
  type EventClickArg,
  type EventInput,
} from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { Appointment, AppointmentStatus, Barber } from '@turnero/shared';
import { ApiService } from '../../../core/api.service';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: '#b8860b',
  confirmed: '#5b6c8f',
  completed: '#3f4756',
  cancelled: '#7a2e2e',
  no_show: '#8a3b3b',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'No vino',
};

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard implements AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly calEl = viewChild.required<ElementRef<HTMLDivElement>>('cal');
  private calendar?: Calendar;

  protected readonly barbers = signal<Barber[]>([]);
  protected readonly barberFilter = signal<string>('');
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly selected = signal<Appointment | null>(null);
  protected readonly creating = signal<{ startsAt: string } | null>(null);
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statuses: AppointmentStatus[] = [
    'pending',
    'confirmed',
    'completed',
    'no_show',
  ];

  // edit/create form fields
  protected editNotes = '';
  protected editStatus: AppointmentStatus = 'confirmed';
  protected newBarberId = '';
  protected newName = '';
  protected newPhone = '';

  private currentRange = { from: '', to: '' };

  private readonly options: CalendarOptions = {
    plugins: [timeGridPlugin, dayGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'timeGridDay,timeGridWeek,dayGridMonth',
    },
    height: 'auto',
    nowIndicator: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: false,
    selectable: true,
    locales: [esLocale],
    locale: 'es',
    firstDay: 1,
    datesSet: (arg) => {
      this.currentRange = { from: arg.startStr, to: arg.endStr };
      void this.reload();
    },
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    select: (arg: DateSelectArg) => this.onSelect(arg),
    events: [],
  };

  constructor() {
    void this.loadBarbers();
  }

  ngAfterViewInit(): void {
    this.calendar = new Calendar(this.calEl().nativeElement, this.options);
    this.calendar.render();
  }

  ngOnDestroy(): void {
    this.calendar?.destroy();
  }

  private async loadBarbers(): Promise<void> {
    try {
      this.barbers.set(await firstValueFrom(this.api.listBarbers()));
    } catch {
      this.barbers.set([]);
    }
  }

  async reload(): Promise<void> {
    if (!this.currentRange.from) return;
    try {
      const appts = await firstValueFrom(
        this.api.listAppointments(
          this.currentRange.from,
          this.currentRange.to,
          this.barberFilter() || undefined,
        ),
      );
      this.appointments.set(appts);
      this.calendar?.removeAllEventSources();
      this.calendar?.addEventSource(appts.map((a) => this.toEvent(a)));
    } catch {
      this.appointments.set([]);
    }
  }

  private toEvent(a: Appointment): EventInput {
    const barber = this.barbers().find((b) => b.id === a.barberId);
    return {
      id: a.id,
      title: `${a.clientName} · ${barber?.name ?? ''}`,
      start: a.startsAt,
      end: a.endsAt,
      backgroundColor: STATUS_COLORS[a.status],
      borderColor: STATUS_COLORS[a.status],
      extendedProps: { appointmentId: a.id },
    };
  }

  private onEventClick(arg: EventClickArg): void {
    const id = arg.event.extendedProps['appointmentId'] as string;
    const appt = this.appointments().find((a) => a.id === id) ?? null;
    if (appt) {
      this.selected.set(appt);
      this.editNotes = appt.notes ?? '';
      this.editStatus = appt.status;
      this.creating.set(null);
    }
  }

  private onSelect(arg: DateSelectArg): void {
    this.selected.set(null);
    this.creating.set({ startsAt: arg.start.toISOString() });
    this.newBarberId = this.barberFilter() || this.barbers()[0]?.id || '';
    this.newName = '';
    this.newPhone = '';
  }

  fmt(iso: string): string {
    return DateTime.fromISO(iso).setLocale('es').toFormat('cccc dd/LL HH:mm');
  }

  onFilterChange(value: string): void {
    this.barberFilter.set(value);
    void this.reload();
  }

  closePanel(): void {
    this.selected.set(null);
    this.creating.set(null);
  }

  async saveEdit(): Promise<void> {
    const appt = this.selected();
    if (!appt) return;
    await firstValueFrom(
      this.api.updateAppointment(appt.id, {
        status: this.editStatus,
        notes: this.editNotes,
      }),
    );
    this.closePanel();
    await this.reload();
  }

  async cancelAppt(): Promise<void> {
    const appt = this.selected();
    if (!appt) return;
    await firstValueFrom(this.api.cancelAppointment(appt.id));
    this.closePanel();
    await this.reload();
  }

  async createAppt(): Promise<void> {
    const c = this.creating();
    if (!c || !this.newBarberId || this.newName.length < 2) return;
    await firstValueFrom(
      this.api.createAppointment({
        barberId: this.newBarberId,
        clientName: this.newName.trim(),
        clientPhone: this.newPhone.trim() || '0000000000',
        startsAt: c.startsAt,
        status: 'confirmed',
      }),
    );
    this.closePanel();
    await this.reload();
  }
}
