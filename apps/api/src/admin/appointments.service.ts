import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import type { Appointment } from '@turnero/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { mapAppointment } from './mappers';
import type {
  UpdateAppointmentDto,
  UpsertAppointmentDto,
} from './dto/upsert-appointment.dto';

const SELECT = '*';

@Injectable()
export class AppointmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(
    tenantId: string,
    from?: string,
    to?: string,
    barberId?: string,
  ): Promise<Appointment[]> {
    let q = this.supabase.admin
      .from('appointments')
      .select(SELECT)
      .eq('tenant_id', tenantId)
      .order('starts_at', { ascending: true });
    if (from) q = q.gte('starts_at', from);
    if (to) q = q.lt('starts_at', to);
    if (barberId) q = q.eq('barber_id', barberId);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(mapAppointment);
  }

  async create(tenantId: string, dto: UpsertAppointmentDto): Promise<Appointment> {
    const endsAt = dto.endsAt ?? (await this.deriveEnd(tenantId, dto.barberId, dto.startsAt));
    const { data, error } = await this.supabase.admin
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        barber_id: dto.barberId,
        client_name: dto.clientName,
        client_phone: dto.clientPhone,
        starts_at: dto.startsAt,
        ends_at: endsAt,
        status: dto.status ?? 'confirmed',
        price: dto.price ?? null,
        notes: dto.notes ?? null,
        created_via: 'admin',
        pending_expires_at: null,
      })
      .select(SELECT)
      .single();
    if (error) {
      if (error.code === '23P01') throw new ConflictException('Overlapping appointment');
      throw error;
    }
    return mapAppointment(data);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    await this.ensureExists(tenantId, id);

    const patch: Record<string, unknown> = {};
    if (dto.barberId !== undefined) patch.barber_id = dto.barberId;
    if (dto.clientName !== undefined) patch.client_name = dto.clientName;
    if (dto.clientPhone !== undefined) patch.client_phone = dto.clientPhone;
    if (dto.startsAt !== undefined) patch.starts_at = dto.startsAt;
    if (dto.endsAt !== undefined) patch.ends_at = dto.endsAt;
    if (dto.price !== undefined) patch.price = dto.price;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.status !== undefined) {
      patch.status = dto.status;
      // Once an admin acts on it, drop the pending hold timer.
      if (dto.status !== 'pending') patch.pending_expires_at = null;
    }
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const { data, error } = await this.supabase.admin
      .from('appointments')
      .update(patch)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select(SELECT)
      .single();
    if (error) {
      if (error.code === '23P01') throw new ConflictException('Overlapping appointment');
      throw error;
    }
    return mapAppointment(data);
  }

  /** Soft action: mark cancelled (keeps history, frees the slot). */
  async cancel(tenantId: string, id: string): Promise<Appointment> {
    return this.update(tenantId, id, { status: 'cancelled' });
  }

  private async ensureExists(tenantId: string, id: string): Promise<void> {
    const { data } = await this.supabase.admin
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .maybeSingle();
    if (!data) throw new NotFoundException('Appointment not found');
  }

  private async deriveEnd(
    tenantId: string,
    barberId: string,
    startsAt: string,
  ): Promise<string> {
    const { data: barber } = await this.supabase.admin
      .from('barbers')
      .select('default_duration_min')
      .eq('tenant_id', tenantId)
      .eq('id', barberId)
      .single();
    const duration = barber?.default_duration_min ?? 30;
    const start = DateTime.fromISO(startsAt);
    if (!start.isValid) throw new BadRequestException('Invalid startsAt');
    return start.plus({ minutes: duration }).toUTC().toISO()!;
  }
}
