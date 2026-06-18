import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  AnalyticsResponse,
  Appointment,
  AvailabilityResponse,
  Barber,
  BarberSchedule,
  CreateBookingRequest,
  CreateBookingResponse,
  PublicShop,
  ReminderDue,
  TimeOff,
  UpsertAppointmentRequest,
} from '@turnero/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // --- public ---------------------------------------------------------------

  getShop(slug: string): Observable<PublicShop> {
    return this.http.get<PublicShop>(`${this.base}/public/shops/${slug}`);
  }

  getAvailability(barberId: string, date: string): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(
      `${this.base}/public/barbers/${barberId}/availability`,
      { params: new HttpParams().set('date', date) },
    );
  }

  createBooking(body: CreateBookingRequest): Observable<CreateBookingResponse> {
    return this.http.post<CreateBookingResponse>(`${this.base}/public/bookings`, body);
  }

  // --- admin: appointments --------------------------------------------------

  listAppointments(from: string, to: string, barberId?: string): Observable<Appointment[]> {
    let params = new HttpParams().set('from', from).set('to', to);
    if (barberId) params = params.set('barberId', barberId);
    return this.http.get<Appointment[]>(`${this.base}/admin/appointments`, { params });
  }

  createAppointment(body: UpsertAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.base}/admin/appointments`, body);
  }

  updateAppointment(
    id: string,
    body: Partial<UpsertAppointmentRequest>,
  ): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.base}/admin/appointments/${id}`, body);
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.delete<Appointment>(`${this.base}/admin/appointments/${id}`);
  }

  // --- admin: barbers / schedules / time-off --------------------------------

  listBarbers(): Observable<Barber[]> {
    return this.http.get<Barber[]>(`${this.base}/admin/barbers`);
  }

  getSchedule(barberId: string): Observable<BarberSchedule[]> {
    return this.http.get<BarberSchedule[]>(`${this.base}/admin/barbers/${barberId}/schedule`);
  }

  listTimeOff(barberId: string): Observable<TimeOff[]> {
    return this.http.get<TimeOff[]>(`${this.base}/admin/barbers/${barberId}/time-off`);
  }

  // --- admin: reminders & analytics -----------------------------------------

  remindersDue(hours = 48): Observable<ReminderDue[]> {
    return this.http.get<ReminderDue[]>(`${this.base}/admin/reminders/due`, {
      params: new HttpParams().set('hours', hours),
    });
  }

  analytics(from: string, to: string): Observable<AnalyticsResponse> {
    return this.http.get<AnalyticsResponse>(`${this.base}/admin/analytics`, {
      params: new HttpParams().set('from', from).set('to', to),
    });
  }
}
