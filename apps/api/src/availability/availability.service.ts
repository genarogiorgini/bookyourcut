import { Injectable } from '@nestjs/common';
import { DateTime, Interval } from 'luxon';
import type { Slot } from '@turnero/shared';
import type { ComputeSlotsArgs } from './availability.types';

/**
 * Pure slot computation. No DB access — callers pass in the schedule windows,
 * busy intervals (appointments + time-off) and the date. This is the trickiest
 * piece of domain logic, so it lives alone and is unit tested.
 *
 * Availability = schedule windows, sliced into `durationMin` slots,
 *   minus slots overlapping any busy interval,
 *   minus slots that start in the past.
 */
@Injectable()
export class AvailabilityService {
  computeSlots(args: ComputeSlotsArgs): Slot[] {
    const { date, timezone, durationMin, windows, busy } = args;
    const now = DateTime.fromJSDate(args.now ?? new Date());

    const busyIntervals = busy
      .map((b) =>
        Interval.fromDateTimes(
          DateTime.fromISO(b.startsAt),
          DateTime.fromISO(b.endsAt),
        ),
      )
      .filter((i) => i.isValid);

    const slots: Slot[] = [];

    for (const w of windows) {
      const windowStart = this.atTime(date, w.startTime, timezone);
      const windowEnd = this.atTime(date, w.endTime, timezone);
      if (!windowStart.isValid || !windowEnd.isValid) continue;

      let cursor = windowStart;
      while (cursor.plus({ minutes: durationMin }) <= windowEnd) {
        const slotEnd = cursor.plus({ minutes: durationMin });
        const slotInterval = Interval.fromDateTimes(cursor, slotEnd);

        // Skip slots that have already started.
        if (cursor > now) {
          const occupied = busyIntervals.some((b) => b.overlaps(slotInterval));
          slots.push({
            startsAt: cursor.toUTC().toISO()!,
            endsAt: slotEnd.toUTC().toISO()!,
            status: occupied ? 'occupied' : 'free',
          });
        }

        cursor = slotEnd;
      }
    }

    slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return slots;
  }

  private atTime(date: string, time: string, zone: string): DateTime {
    const [h, m] = time.split(':');
    return DateTime.fromISO(date, { zone }).set({
      hour: parseInt(h ?? '0', 10),
      minute: parseInt(m ?? '0', 10),
      second: 0,
      millisecond: 0,
    });
  }
}
