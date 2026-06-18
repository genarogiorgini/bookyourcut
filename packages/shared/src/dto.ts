/** Request/response DTOs shared between web and api. */
import type { Appointment, AppointmentStatus, Slot } from './models';

export interface AvailabilityResponse {
  barberId: string;
  date: string; // YYYY-MM-DD
  slots: Slot[];
}

export interface CreateBookingRequest {
  barberId: string;
  startsAt: string; // ISO datetime of the chosen slot
  clientName: string;
  clientPhone: string;
}

export interface CreateBookingResponse {
  appointmentId: string;
  whatsappUrl: string; // wa.me deep link with prefilled summary
  pendingExpiresAt: string;
}

export interface UpsertAppointmentRequest {
  barberId: string;
  clientName: string;
  clientPhone: string;
  startsAt: string;
  endsAt?: string; // derived from barber duration if omitted
  status?: AppointmentStatus;
  price?: number | null;
  notes?: string | null;
}

export interface ReminderDue {
  appointment: Appointment;
  barberName: string;
  whatsappUrl: string; // wa.me link to the CLIENT
}

export interface BarberAnalytics {
  barberId: string;
  barberName: string;
  appointmentCount: number;
  revenue: number;
  occupancyPct: number; // 0..100
  availableMinutes: number;
  bookedMinutes: number;
  noShowCount: number;
  avgPerDay: number;
  busiestWeekday: number | null;
  busiestHour: number | null;
}

export interface AnalyticsResponse {
  from: string;
  to: string;
  barbers: BarberAnalytics[];
}
