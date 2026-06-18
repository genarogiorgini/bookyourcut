import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import type { PublicBarber, Slot } from '@turnero/shared';
import { ShopStore } from '../../../core/shop.store';
import { ApiService } from '../../../core/api.service';

type Step = 'barber' | 'slot' | 'summary';

@Component({
  selector: 'app-booking',
  imports: [FormsModule, RouterLink],
  templateUrl: './booking.html',
})
export class Booking implements OnInit {
  protected readonly store = inject(ShopStore);
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  protected readonly shop = this.store.shop;
  protected readonly step = signal<Step>('barber');
  protected slug = '';

  // slot picking
  protected readonly days = signal<{ iso: string; label: string }[]>([]);
  protected readonly selectedDate = signal<string>('');
  protected readonly slots = signal<Slot[]>([]);
  protected readonly loadingSlots = signal(false);
  protected readonly selectedSlot = signal<Slot | null>(null);

  // summary form
  protected clientName = '';
  protected clientPhone = '';
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly barber = this.store.selectedBarber;

  protected readonly freeSlots = computed(() =>
    this.slots().filter((s) => s.status === 'free'),
  );

  async ngOnInit(): Promise<void> {
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';
    await this.store.load(this.slug);
    this.buildDays();
  }

  // --- step 1: barber -------------------------------------------------------

  chooseBarber(b: PublicBarber): void {
    this.store.selectBarber(b);
    this.selectedSlot.set(null);
    this.step.set('slot');
    void this.loadSlots();
  }

  // --- step 2: slots --------------------------------------------------------

  private buildDays(): void {
    const zone = this.shop()?.timezone ?? 'local';
    const today = DateTime.now().setZone(zone).startOf('day');
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = today.plus({ days: i });
      return { iso: d.toISODate()!, label: d.setLocale('es').toFormat('ccc dd/LL') };
    });
    this.days.set(days);
    this.selectedDate.set(days[0].iso);
  }

  async pickDate(iso: string): Promise<void> {
    this.selectedDate.set(iso);
    this.selectedSlot.set(null);
    await this.loadSlots();
  }

  async loadSlots(): Promise<void> {
    const barber = this.barber();
    if (!barber) return;
    this.loadingSlots.set(true);
    try {
      const res = await firstValueFrom(
        this.api.getAvailability(barber.id, this.selectedDate()),
      );
      this.slots.set(res.slots);
    } catch {
      this.slots.set([]);
    } finally {
      this.loadingSlots.set(false);
    }
  }

  chooseSlot(slot: Slot): void {
    if (slot.status !== 'free') return;
    this.selectedSlot.set(slot);
    this.step.set('summary');
  }

  slotLabel(slot: Slot): string {
    const zone = this.shop()?.timezone ?? 'local';
    return DateTime.fromISO(slot.startsAt).setZone(zone).toFormat('HH:mm');
  }

  // --- step 3: summary ------------------------------------------------------

  summaryWhen(): string {
    const slot = this.selectedSlot();
    if (!slot) return '';
    const zone = this.shop()?.timezone ?? 'local';
    return DateTime.fromISO(slot.startsAt)
      .setZone(zone)
      .setLocale('es')
      .toFormat("cccc dd/LL 'a las' HH:mm");
  }

  async confirm(): Promise<void> {
    const barber = this.barber();
    const slot = this.selectedSlot();
    if (!barber || !slot) return;
    if (this.clientName.trim().length < 2 || this.clientPhone.trim().length < 6) {
      this.formError.set('Completá tu nombre y un teléfono válido.');
      return;
    }
    this.formError.set(null);
    this.submitting.set(true);
    try {
      const res = await firstValueFrom(
        this.api.createBooking({
          barberId: barber.id,
          startsAt: slot.startsAt,
          clientName: this.clientName.trim(),
          clientPhone: this.clientPhone.trim(),
        }),
      );
      // Hand off to WhatsApp — the human confirmation happens there.
      window.location.href = res.whatsappUrl;
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      this.formError.set(
        status === 409
          ? 'Ese horario ya fue tomado. Elegí otro, por favor.'
          : 'No pudimos generar la reserva. Intentá de nuevo.',
      );
      if (status === 409) {
        this.step.set('slot');
        await this.loadSlots();
      }
    } finally {
      this.submitting.set(false);
    }
  }

  back(): void {
    if (this.step() === 'summary') this.step.set('slot');
    else if (this.step() === 'slot') this.step.set('barber');
  }
}
