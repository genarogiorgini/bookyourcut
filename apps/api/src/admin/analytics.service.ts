import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { AnalyticsResponse, BarberAnalytics } from '@turnero/shared';
import { SupabaseService } from '../supabase/supabase.service';

/** Statuses that count as real, revenue-generating appointments. */
const EFFECTIVE = new Set(['confirmed', 'completed']);

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Per-barber stats over [from, to] (inclusive dates, tenant-local).
   * Occupancy ignores time-off (treated as an approximation of demand).
   */
  async compute(tenantId: string, from: string, to: string): Promise<AnalyticsResponse> {
    const { data: tenant } = await this.supabase.admin
      .from('tenants')
      .select('timezone')
      .eq('id', tenantId)
      .single();
    const zone = tenant?.timezone ?? 'UTC';

    const fromDay = DateTime.fromISO(from, { zone }).startOf('day');
    const toDay = DateTime.fromISO(to, { zone }).startOf('day');
    if (!fromDay.isValid || !toDay.isValid || toDay < fromDay) {
      throw new BadRequestException('Invalid from/to range');
    }
    const rangeStartUtc = fromDay.toUTC().toISO()!;
    const rangeEndUtc = toDay.plus({ days: 1 }).toUTC().toISO()!;
    const dayCount = Math.round(toDay.diff(fromDay, 'days').days) + 1;

    // Count weekday occurrences (0=Sun..6=Sat) within the range.
    const weekdayOccurrences = new Array(7).fill(0) as number[];
    for (let d = fromDay; d <= toDay; d = d.plus({ days: 1 })) {
      weekdayOccurrences[d.weekday % 7] += 1;
    }

    const [{ data: barbers }, { data: schedules }, { data: appts }] = await Promise.all([
      this.supabase.admin
        .from('barbers')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true }),
      this.supabase.admin
        .from('barber_schedules')
        .select('barber_id, weekday, start_time, end_time'),
      this.supabase.admin
        .from('appointments')
        .select('barber_id, starts_at, ends_at, status, price')
        .eq('tenant_id', tenantId)
        .gte('starts_at', rangeStartUtc)
        .lt('starts_at', rangeEndUtc),
    ]);

    const barberList = barbers ?? [];
    const barberIds = new Set(barberList.map((b) => b.id));

    // Available minutes per barber from the weekly schedule × weekday occurrences.
    const availableMinutes = new Map<string, number>();
    for (const s of schedules ?? []) {
      if (!barberIds.has(s.barber_id)) continue;
      const mins = clockMinutes(s.start_time, s.end_time) * weekdayOccurrences[s.weekday];
      availableMinutes.set(s.barber_id, (availableMinutes.get(s.barber_id) ?? 0) + mins);
    }

    const stats = new Map<string, MutableStats>();
    for (const b of barberList) {
      stats.set(b.id, {
        appointmentCount: 0,
        revenue: 0,
        bookedMinutes: 0,
        noShowCount: 0,
        weekdayTally: new Array(7).fill(0),
        hourTally: new Array(24).fill(0),
      });
    }

    for (const a of appts ?? []) {
      const s = stats.get(a.barber_id);
      if (!s) continue;
      if (a.status === 'no_show') s.noShowCount += 1;
      if (!EFFECTIVE.has(a.status)) continue;

      const start = DateTime.fromISO(a.starts_at);
      const end = DateTime.fromISO(a.ends_at);
      s.appointmentCount += 1;
      s.revenue += a.price === null || a.price === undefined ? 0 : Number(a.price);
      s.bookedMinutes += Math.max(0, end.diff(start, 'minutes').minutes);

      const local = start.setZone(zone);
      s.weekdayTally[local.weekday % 7] += 1;
      s.hourTally[local.hour] += 1;
    }

    const result: BarberAnalytics[] = barberList.map((b) => {
      const s = stats.get(b.id)!;
      const available = availableMinutes.get(b.id) ?? 0;
      return {
        barberId: b.id,
        barberName: b.name,
        appointmentCount: s.appointmentCount,
        revenue: s.revenue,
        availableMinutes: available,
        bookedMinutes: Math.round(s.bookedMinutes),
        occupancyPct: available > 0 ? round1((s.bookedMinutes / available) * 100) : 0,
        noShowCount: s.noShowCount,
        avgPerDay: round1(s.appointmentCount / dayCount),
        busiestWeekday: argmax(s.weekdayTally),
        busiestHour: argmax(s.hourTally),
      };
    });

    return { from, to, barbers: result };
  }
}

interface MutableStats {
  appointmentCount: number;
  revenue: number;
  bookedMinutes: number;
  noShowCount: number;
  weekdayTally: number[];
  hourTally: number[];
}

function clockMinutes(start: string, end: string): number {
  return Math.max(0, toMinutes(end) - toMinutes(start));
}
function toMinutes(t: string): number {
  const [h, m] = t.split(':');
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10);
}
function argmax(arr: number[]): number | null {
  let best = -1;
  let idx: number | null = null;
  arr.forEach((v, i) => {
    if (v > best) {
      best = v;
      idx = i;
    }
  });
  return best > 0 ? idx : null;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
