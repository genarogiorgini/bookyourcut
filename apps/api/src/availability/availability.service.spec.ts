import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  const svc = new AvailabilityService();
  // Fix "now" well in the past so no slot is filtered as past, unless a test wants it.
  const farPast = new Date('2000-01-01T00:00:00Z');

  it('slices a single window into duration-sized slots', () => {
    const slots = svc.computeSlots({
      date: '2030-06-10',
      timezone: 'UTC',
      durationMin: 30,
      windows: [{ startTime: '10:00', endTime: '12:00' }],
      busy: [],
      now: farPast,
    });
    expect(slots).toHaveLength(4); // 10:00, 10:30, 11:00, 11:30
    expect(slots.every((s) => s.status === 'free')).toBe(true);
    expect(slots[0].startsAt).toBe('2030-06-10T10:00:00.000Z');
    expect(slots[3].endsAt).toBe('2030-06-10T12:00:00.000Z');
  });

  it('does not emit a partial slot that overflows the window', () => {
    const slots = svc.computeSlots({
      date: '2030-06-10',
      timezone: 'UTC',
      durationMin: 45,
      windows: [{ startTime: '10:00', endTime: '12:00' }],
      busy: [],
      now: farPast,
    });
    // 10:00-10:45, 10:45-11:30 -> next would be 11:30-12:15 (overflow) => excluded
    expect(slots).toHaveLength(2);
  });

  it('marks slots overlapping a busy interval as occupied', () => {
    const slots = svc.computeSlots({
      date: '2030-06-10',
      timezone: 'UTC',
      durationMin: 30,
      windows: [{ startTime: '10:00', endTime: '12:00' }],
      busy: [{ startsAt: '2030-06-10T10:30:00.000Z', endsAt: '2030-06-10T11:00:00.000Z' }],
      now: farPast,
    });
    const byStart = Object.fromEntries(slots.map((s) => [s.startsAt, s.status]));
    expect(byStart['2030-06-10T10:00:00.000Z']).toBe('free');
    expect(byStart['2030-06-10T10:30:00.000Z']).toBe('occupied');
    expect(byStart['2030-06-10T11:00:00.000Z']).toBe('free');
  });

  it('handles split shifts (multiple windows)', () => {
    const slots = svc.computeSlots({
      date: '2030-06-10',
      timezone: 'UTC',
      durationMin: 60,
      windows: [
        { startTime: '10:00', endTime: '12:00' },
        { startTime: '15:00', endTime: '17:00' },
      ],
      busy: [],
      now: farPast,
    });
    expect(slots.map((s) => s.startsAt)).toEqual([
      '2030-06-10T10:00:00.000Z',
      '2030-06-10T11:00:00.000Z',
      '2030-06-10T15:00:00.000Z',
      '2030-06-10T16:00:00.000Z',
    ]);
  });

  it('excludes slots that start in the past', () => {
    const slots = svc.computeSlots({
      date: '2030-06-10',
      timezone: 'UTC',
      durationMin: 60,
      windows: [{ startTime: '10:00', endTime: '13:00' }],
      busy: [],
      now: new Date('2030-06-10T11:30:00Z'), // 10:00 & 11:00 already passed
    });
    expect(slots.map((s) => s.startsAt)).toEqual(['2030-06-10T12:00:00.000Z']);
  });

  it('respects the tenant timezone when interpreting clock times', () => {
    // 10:00 in Buenos Aires (UTC-3) == 13:00 UTC
    const slots = svc.computeSlots({
      date: '2030-06-10',
      timezone: 'America/Argentina/Buenos_Aires',
      durationMin: 60,
      windows: [{ startTime: '10:00', endTime: '11:00' }],
      busy: [],
      now: farPast,
    });
    expect(slots[0].startsAt).toBe('2030-06-10T13:00:00.000Z');
  });
});
