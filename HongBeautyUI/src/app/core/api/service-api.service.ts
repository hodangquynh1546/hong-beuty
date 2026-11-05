import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BeautyService {
  id: string; name: string; slug: string; description: string; price: number;
  durationMinutes: number; imageUrl: string | null; isActive: boolean;
}
export type ServiceInput = Omit<BeautyService, 'id'>;

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly http = inject(HttpClient);
  list(): Observable<BeautyService[]> { return this.http.get<BeautyService[]>('/api/v1/services'); }
  adminList(): Observable<BeautyService[]> { return this.http.get<BeautyService[]>('/api/v1/admin/services', { withCredentials: true }); }
  create(input: ServiceInput): Observable<BeautyService> { return this.http.post<BeautyService>('/api/v1/admin/services', input, { withCredentials: true }); }
  update(id: string, input: ServiceInput): Observable<BeautyService> { return this.http.put<BeautyService>(`/api/v1/admin/services/${id}`, input, { withCredentials: true }); }
  hide(id: string): Observable<void> { return this.http.delete<void>(`/api/v1/admin/services/${id}`, { withCredentials: true }); }
}
