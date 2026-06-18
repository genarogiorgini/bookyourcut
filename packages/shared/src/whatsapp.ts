/** Pure helpers for building WhatsApp click-to-chat (wa.me) deep links. */

/** Strip everything but digits so the number is wa.me-safe (no +, spaces, dashes). */
export function normalizePhone(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

export function buildWhatsappUrl(phone: string, message: string): string {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export interface BookingSummary {
  shopName: string;
  barberName: string;
  clientName: string;
  startsAt: Date;
  timezone: string;
}

/** Format the message the CLIENT sends to the SHOP when requesting a booking. */
export function buildBookingMessage(s: BookingSummary): string {
  const when = formatDateTime(s.startsAt, s.timezone);
  return [
    `Hola ${s.shopName}! 👋`,
    `Quiero reservar un turno:`,
    `• Barbero: ${s.barberName}`,
    `• Cliente: ${s.clientName}`,
    `• Fecha y hora: ${when}`,
    ``,
    `Quedo a la espera de la confirmación. ¡Gracias!`,
  ].join('\n');
}

export interface ReminderSummary {
  shopName: string;
  barberName: string;
  clientName: string;
  startsAt: Date;
  timezone: string;
}

/** Format the reminder message the SHOP sends to the CLIENT ~24h before. */
export function buildReminderMessage(s: ReminderSummary): string {
  const when = formatDateTime(s.startsAt, s.timezone);
  return [
    `Hola ${s.clientName}! 👋`,
    `Te recordamos tu turno en ${s.shopName}:`,
    `• Barbero: ${s.barberName}`,
    `• Fecha y hora: ${when}`,
    ``,
    `Si no podés asistir, avisanos así liberamos el turno. ¡Te esperamos!`,
  ].join('\n');
}

function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date);
}
