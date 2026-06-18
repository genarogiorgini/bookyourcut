import { Injectable, NotFoundException } from '@nestjs/common';
import type { Barber, BarberSchedule, TimeOff } from '@turnero/shared';
import { SupabaseService } from '../supabase/supabase.service';
import type {
  CreateTimeOffDto,
  ReplaceScheduleDto,
  UpsertBarberDto,
} from './dto/barber.dto';

@Injectable()
export class BarbersService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(tenantId: string): Promise<Barber[]> {
    const { data, error } = await this.supabase.admin
      .from('barbers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapBarber);
  }

  async create(tenantId: string, dto: UpsertBarberDto): Promise<Barber> {
    const { data, error } = await this.supabase.admin
      .from('barbers')
      .insert({ tenant_id: tenantId, ...toRow(dto) })
      .select('*')
      .single();
    if (error) throw error;
    return mapBarber(data);
  }

  async update(tenantId: string, id: string, dto: UpsertBarberDto): Promise<Barber> {
    const { data, error } = await this.supabase.admin
      .from('barbers')
      .update(toRow(dto))
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    if (!data) throw new NotFoundException('Barber not found');
    return mapBarber(data);
  }

  async remove(tenantId: string, id: string): Promise<{ id: string }> {
    const { error } = await this.supabase.admin
      .from('barbers')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', id);
    if (error) throw error;
    return { id };
  }

  // --- schedules ------------------------------------------------------------

  async getSchedule(tenantId: string, barberId: string): Promise<BarberSchedule[]> {
    await this.ensureBarber(tenantId, barberId);
    const { data, error } = await this.supabase.admin
      .from('barber_schedules')
      .select('*')
      .eq('barber_id', barberId)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      barberId: r.barber_id,
      weekday: r.weekday,
      startTime: r.start_time,
      endTime: r.end_time,
    }));
  }

  /** Replace the whole weekly schedule for a barber atomically-ish. */
  async replaceSchedule(
    tenantId: string,
    barberId: string,
    dto: ReplaceScheduleDto,
  ): Promise<BarberSchedule[]> {
    await this.ensureBarber(tenantId, barberId);
    const del = await this.supabase.admin
      .from('barber_schedules')
      .delete()
      .eq('barber_id', barberId);
    if (del.error) throw del.error;

    if (dto.windows.length) {
      const ins = await this.supabase.admin.from('barber_schedules').insert(
        dto.windows.map((w) => ({
          barber_id: barberId,
          weekday: w.weekday,
          start_time: w.startTime,
          end_time: w.endTime,
        })),
      );
      if (ins.error) throw ins.error;
    }
    return this.getSchedule(tenantId, barberId);
  }

  // --- time off -------------------------------------------------------------

  async listTimeOff(tenantId: string, barberId: string): Promise<TimeOff[]> {
    await this.ensureBarber(tenantId, barberId);
    const { data, error } = await this.supabase.admin
      .from('time_off')
      .select('*')
      .eq('barber_id', barberId)
      .order('starts_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      barberId: r.barber_id,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      reason: r.reason ?? null,
    }));
  }

  async addTimeOff(
    tenantId: string,
    barberId: string,
    dto: CreateTimeOffDto,
  ): Promise<TimeOff> {
    await this.ensureBarber(tenantId, barberId);
    const { data, error } = await this.supabase.admin
      .from('time_off')
      .insert({
        barber_id: barberId,
        starts_at: dto.startsAt,
        ends_at: dto.endsAt,
        reason: dto.reason ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      barberId: data.barber_id,
      startsAt: data.starts_at,
      endsAt: data.ends_at,
      reason: data.reason ?? null,
    };
  }

  async removeTimeOff(
    tenantId: string,
    barberId: string,
    id: string,
  ): Promise<{ id: string }> {
    await this.ensureBarber(tenantId, barberId);
    const { error } = await this.supabase.admin
      .from('time_off')
      .delete()
      .eq('barber_id', barberId)
      .eq('id', id);
    if (error) throw error;
    return { id };
  }

  private async ensureBarber(tenantId: string, barberId: string): Promise<void> {
    const { data } = await this.supabase.admin
      .from('barbers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', barberId)
      .maybeSingle();
    if (!data) throw new NotFoundException('Barber not found');
  }
}

function toRow(dto: UpsertBarberDto): Record<string, unknown> {
  return {
    name: dto.name,
    photo_url: dto.photoUrl ?? null,
    instagram: dto.instagram ?? null,
    bio: dto.bio ?? null,
    price_per_cut: dto.pricePerCut,
    default_duration_min: dto.defaultDurationMin,
    ...(dto.active !== undefined ? { active: dto.active } : {}),
    ...(dto.sortOrder !== undefined ? { sort_order: dto.sortOrder } : {}),
  };
}

function mapBarber(r: Record<string, any>): Barber {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    photoUrl: r.photo_url ?? null,
    instagram: r.instagram ?? null,
    bio: r.bio ?? null,
    pricePerCut: Number(r.price_per_cut),
    defaultDurationMin: r.default_duration_min,
    active: r.active,
    sortOrder: r.sort_order,
  };
}
