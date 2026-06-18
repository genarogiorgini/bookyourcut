/** A recurring working-hours window in local clock time, e.g. 10:00–14:00. */
export interface ScheduleWindow {
  startTime: string; // 'HH:mm' or 'HH:mm:ss'
  endTime: string;
}

/** An absolute busy interval (appointment or time-off). */
export interface BusyInterval {
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
}

export interface ComputeSlotsArgs {
  /** Target day in the tenant timezone, YYYY-MM-DD. */
  date: string;
  /** IANA timezone of the tenant, e.g. 'America/Argentina/Buenos_Aires'. */
  timezone: string;
  /** Slot length in minutes (barber's default duration). */
  durationMin: number;
  /** Working windows for that weekday. */
  windows: ScheduleWindow[];
  /** Appointments (pending+confirmed) and time-off that block slots. */
  busy: BusyInterval[];
  /** Reference "now" for hiding past slots. Defaults to current time. */
  now?: Date;
}
