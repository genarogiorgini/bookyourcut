/** Core domain models shared between the Angular web app and the NestJS API. */

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export type CreatedVia = 'client' | 'admin';

export type AdminRole = 'owner' | 'manager';

/** Day of week, 0 = Sunday .. 6 = Saturday (matches JS Date.getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  whatsappNumber: string; // E.164, digits only (no +) for wa.me
  heroVideoUrl: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  timezone: string;
}

export interface Barber {
  id: string;
  tenantId: string;
  name: string;
  photoUrl: string | null;
  instagram: string | null;
  bio: string | null;
  pricePerCut: number;
  defaultDurationMin: number;
  active: boolean;
  sortOrder: number;
}

export interface BarberSchedule {
  id: string;
  barberId: string;
  weekday: Weekday;
  startTime: string; // 'HH:mm' local to tenant timezone
  endTime: string; // 'HH:mm'
}

export interface TimeOff {
  id: string;
  barberId: string;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
  reason: string | null;
}

export interface Appointment {
  id: string;
  tenantId: string;
  barberId: string;
  clientName: string;
  clientPhone: string;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
  status: AppointmentStatus;
  price: number | null;
  notes: string | null; // private admin note
  createdVia: CreatedVia;
  pendingExpiresAt: string | null;
  createdAt: string;
}

/** Public-facing slot — never carries client PII. */
export type SlotStatus = 'free' | 'occupied';

export interface Slot {
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
  status: SlotStatus;
}

/** Public tenant branding payload (no appointment data). */
export interface PublicShop {
  id: string;
  slug: string;
  name: string;
  whatsappNumber: string;
  heroVideoUrl: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  timezone: string;
  barbers: PublicBarber[];
}

export type PublicBarber = Pick<
  Barber,
  'id' | 'name' | 'photoUrl' | 'instagram' | 'bio' | 'pricePerCut' | 'defaultDurationMin'
>;
