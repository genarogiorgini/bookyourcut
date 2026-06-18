import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import {
  buildReminderMessage,
  buildWhatsappUrl,
  type ReminderDue,
} from '@turnero/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { mapAppointment } from './mappers';

@Injectable()
export class RemindersService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Confirmed appointments coming up within `hours` (default 48), each with a
   * prebuilt wa.me link to the CLIENT so the manager can send the reminder by
   * hand. (No Cloud API — human stays in the loop.)
   */
  async due(tenantId: string, hours = 48): Promise<ReminderDue[]> {
    const now = DateTime.now();
    const until = now.plus({ hours }).toUTC().toISO()!;

    const { data: tenant } = await this.supabase.admin
      .from('tenants')
      .select('name, timezone')
      .eq('id', tenantId)
      .single();

    const { data, error } = await this.supabase.admin
      .from('appointments')
      .select('*, barbers!inner(name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'confirmed')
      .gte('starts_at', now.toUTC().toISO())
      .lte('starts_at', until)
      .order('starts_at', { ascending: true });
    if (error) throw error;

    const shopName = tenant?.name ?? '';
    const timezone = tenant?.timezone ?? 'UTC';

    return (data ?? []).map((row) => {
      const barberName = (row.barbers as { name: string }).name;
      const appointment = mapAppointment(row);
      const message = buildReminderMessage({
        shopName,
        barberName,
        clientName: appointment.clientName,
        startsAt: new Date(appointment.startsAt),
        timezone,
      });
      return {
        appointment,
        barberName,
        whatsappUrl: buildWhatsappUrl(appointment.clientPhone, message),
      };
    });
  }
}
