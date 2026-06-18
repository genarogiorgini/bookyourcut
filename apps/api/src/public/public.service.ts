import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import {
  buildBookingMessage,
  buildWhatsappUrl,
  type AvailabilityResponse,
  type CreateBookingResponse,
  type PublicShop,
  type Slot,
} from '@turnero/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { AvailabilityService } from '../availability/availability.service';
import type { AppConfig } from '../config/configuration';
import type { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly availability: AvailabilityService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /** Public branding + active barbers for a shop, by slug. No appointment data. */
  async getShop(slug: string): Promise<PublicShop> {
    const { data: tenant, error } = await this.supabase.admin
      .from('tenants')
      .select(
        'id, slug, name, whatsapp_number, hero_video_url, logo_url, primary_color, timezone',
      )
      .eq('slug', slug)
      .single();
    if (error || !tenant) throw new NotFoundException('Shop not found');

    const { data: barbers } = await this.supabase.admin
      .from('barbers')
      .select('id, name, photo_url, instagram, bio, price_per_cut, default_duration_min')
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .order('sort_order', { ascending: true });

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      whatsappNumber: tenant.whatsapp_number,
      heroVideoUrl: tenant.hero_video_url,
      logoUrl: tenant.logo_url,
      primaryColor: tenant.primary_color,
      timezone: tenant.timezone,
      barbers: (barbers ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        photoUrl: b.photo_url,
        instagram: b.instagram,
        bio: b.bio,
        pricePerCut: Number(b.price_per_cut),
        defaultDurationMin: b.default_duration_min,
      })),
    };
  }

  /** Computed slots for a barber on a given day (sanitized — no client data). */
  async getAvailability(barberId: string, date: string): Promise<AvailabilityResponse> {
    const barber = await this.loadBarber(barberId);
    const slots = await this.computeSlotsFor(barber, date);
    return { barberId, date, slots };
  }

  /** Hold a slot as pending and return the WhatsApp deep link for the client. */
  async createBooking(dto: CreateBookingDto): Promise<CreateBookingResponse> {
    const barber = await this.loadBarber(dto.barberId);
    const start = DateTime.fromISO(dto.startsAt);
    if (!start.isValid) throw new BadRequestException('Invalid startsAt');
    const end = start.plus({ minutes: barber.default_duration_min });

    // Re-validate the slot against live availability (must exist and be free).
    const date = start.setZone(barber.timezone).toISODate()!;
    const slots = await this.computeSlotsFor(barber, date);
    const match = slots.find((s) => DateTime.fromISO(s.startsAt).equals(start.toUTC()));
    if (!match) throw new BadRequestException('Slot is not on the schedule');
    if (match.status !== 'free') throw new ConflictException('Slot is no longer available');

    const holdMinutes = this.config.get('pendingHoldMinutes', { infer: true });
    const pendingExpiresAt = DateTime.now().plus({ minutes: holdMinutes }).toUTC().toISO()!;

    const { data: inserted, error } = await this.supabase.admin
      .from('appointments')
      .insert({
        tenant_id: barber.tenant_id,
        barber_id: barber.id,
        client_name: dto.clientName,
        client_phone: dto.clientPhone,
        starts_at: start.toUTC().toISO(),
        ends_at: end.toUTC().toISO(),
        status: 'pending',
        price: barber.price_per_cut,
        created_via: 'client',
        pending_expires_at: pendingExpiresAt,
      })
      .select('id')
      .single();

    if (error) {
      // Exclusion constraint => someone grabbed the slot first.
      if (error.code === '23P01') {
        throw new ConflictException('Slot is no longer available');
      }
      throw error;
    }

    const message = buildBookingMessage({
      shopName: barber.shop_name,
      barberName: barber.name,
      clientName: dto.clientName,
      startsAt: start.toUTC().toJSDate(),
      timezone: barber.timezone,
    });
    const whatsappUrl = buildWhatsappUrl(barber.whatsapp_number, message);

    return { appointmentId: inserted.id, whatsappUrl, pendingExpiresAt };
  }

  // -------------------------------------------------------------------------

  private async loadBarber(barberId: string): Promise<BarberContext> {
    const { data: barber, error } = await this.supabase.admin
      .from('barbers')
      .select('id, tenant_id, name, price_per_cut, default_duration_min')
      .eq('id', barberId)
      .single();
    if (error || !barber) throw new NotFoundException('Barber not found');

    const { data: tenant, error: tErr } = await this.supabase.admin
      .from('tenants')
      .select('name, whatsapp_number, timezone')
      .eq('id', barber.tenant_id)
      .single();
    if (tErr || !tenant) throw new NotFoundException('Shop not found');

    return {
      id: barber.id,
      tenant_id: barber.tenant_id,
      name: barber.name,
      price_per_cut: Number(barber.price_per_cut),
      default_duration_min: barber.default_duration_min,
      shop_name: tenant.name,
      whatsapp_number: tenant.whatsapp_number,
      timezone: tenant.timezone,
    };
  }

  private async computeSlotsFor(barber: BarberContext, date: string): Promise<Slot[]> {
    const zone = barber.timezone;
    const day = DateTime.fromISO(date, { zone });
    if (!day.isValid) throw new BadRequestException('Invalid date');
    const jsWeekday = day.weekday % 7; // luxon 1..7 (Mon..Sun) -> 0..6 (Sun..Sat)
    const dayStart = day.startOf('day').toUTC().toISO()!;
    const dayEnd = day.plus({ days: 1 }).startOf('day').toUTC().toISO()!;
    const nowIso = DateTime.now().toUTC().toISO()!;

    const [{ data: windows }, { data: appts }, { data: off }] = await Promise.all([
      this.supabase.admin
        .from('barber_schedules')
        .select('start_time, end_time')
        .eq('barber_id', barber.id)
        .eq('weekday', jsWeekday),
      this.supabase.admin
        .from('appointments')
        .select('starts_at, ends_at, status, pending_expires_at')
        .eq('barber_id', barber.id)
        .lt('starts_at', dayEnd)
        .gt('ends_at', dayStart)
        .or(`status.eq.confirmed,and(status.eq.pending,pending_expires_at.gt.${nowIso})`),
      this.supabase.admin
        .from('time_off')
        .select('starts_at, ends_at')
        .eq('barber_id', barber.id)
        .lt('starts_at', dayEnd)
        .gt('ends_at', dayStart),
    ]);

    const busy = [
      ...(appts ?? []).map((a) => ({ startsAt: a.starts_at, endsAt: a.ends_at })),
      ...(off ?? []).map((o) => ({ startsAt: o.starts_at, endsAt: o.ends_at })),
    ];

    return this.availability.computeSlots({
      date,
      timezone: zone,
      durationMin: barber.default_duration_min,
      windows: (windows ?? []).map((w) => ({
        startTime: w.start_time,
        endTime: w.end_time,
      })),
      busy,
    });
  }
}

interface BarberContext {
  id: string;
  tenant_id: string;
  name: string;
  price_per_cut: number;
  default_duration_min: number;
  shop_name: string;
  whatsapp_number: string;
  timezone: string;
}
