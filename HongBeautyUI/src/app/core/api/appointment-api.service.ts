import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BeautyAppointment {
  id: string; serviceId: string; serviceName: string; price: number;
  startsAt: string; endsAt: string; status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  customerName?: string; customerEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  private readonly http = inject(HttpClient);
  mine(): Observable<BeautyAppointment[]> { return this.http.get<BeautyAppointment[]>('/api/v1/appointments', { withCredentials: true }); }
  book(serviceId: string, startsAt: string): Observable<BeautyAppointment> {
    return this.http.post<BeautyAppointment>('/api/v1/appointments', { serviceId, startsAt }, { withCredentials: true });
  }
  cancel(id: string): Observable<BeautyAppointment> { return this.http.post<BeautyAppointment>(`/api/v1/appointments/${id}/cancel`, {}, { withCredentials: true }); }
  adminList(): Observable<BeautyAppointment[]> { return this.http.get<BeautyAppointment[]>('/api/v1/admin/appointments', { withCredentials: true }); }
  setStatus(id: string, status: BeautyAppointment['status']): Observable<BeautyAppointment> {
    return this.http.patch<BeautyAppointment>(`/api/v1/admin/appointments/${id}/status`, { status }, { withCredentials: true });
  }
}
