import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

export interface BeautyService {
  id: string; name: string; slug: string; description: string; price: number;
  durationMinutes: number; imageUrl: string | null; isActive: boolean;
}
export type ServiceInput = Omit<BeautyService, 'id'>;

@Injectable({ providedIn: 'root' })
export class ServiceApiService {
  private readonly http = inject(HttpClient);
  private cached?: { expires: number; value: Observable<BeautyService[]> };
  private invalidate(): void { this.cached = undefined; }
  list(): Observable<BeautyService[]> {
    if (this.cached && this.cached.expires > Date.now()) return this.cached.value;
    const value = this.http.get<BeautyService[]>('/api/v1/services').pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.cached = { expires: Date.now() + 30_000, value };
    return value;
  }
  adminList(): Observable<BeautyService[]> { return this.http.get<BeautyService[]>('/api/v1/admin/services', { withCredentials: true }); }
  create(input: ServiceInput): Observable<BeautyService> { return this.http.post<BeautyService>('/api/v1/admin/services', input, { withCredentials: true }).pipe(tap(() => this.invalidate())); }
  update(id: string, input: ServiceInput): Observable<BeautyService> { return this.http.put<BeautyService>(`/api/v1/admin/services/${id}`, input, { withCredentials: true }).pipe(tap(() => this.invalidate())); }
  hide(id: string): Observable<void> { return this.http.delete<void>(`/api/v1/admin/services/${id}`, { withCredentials: true }).pipe(tap(() => this.invalidate())); }
}
