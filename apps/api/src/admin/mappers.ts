import type { Appointment } from '@turnero/shared';

/** Maps a raw `appointments` row (snake_case) to the shared Appointment type. */
export function mapAppointment(row: Record<string, any>): Appointment {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    barberId: row.barber_id,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    notes: row.notes ?? null,
    createdVia: row.created_via,
    pendingExpiresAt: row.pending_expires_at ?? null,
    createdAt: row.created_at,
  };
}
