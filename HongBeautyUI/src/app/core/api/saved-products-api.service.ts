import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SavedProductsApiService {
  private readonly http = inject(HttpClient);
  readonly ids = signal<Set<string>>(new Set());
  load(): Observable<string[]> {
    return this.http.get<string[]>('/api/v1/saved-products', { withCredentials: true })
      .pipe(tap(ids => this.ids.set(new Set(ids))));
  }
  save(id: string): Observable<void> {
    return this.http.put<void>(`/api/v1/saved-products/${encodeURIComponent(id)}`, {}, { withCredentials: true })
      .pipe(tap(() => this.ids.update(current => new Set([...current, id]))));
  }
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/saved-products/${encodeURIComponent(id)}`, { withCredentials: true })
      .pipe(tap(() => this.ids.update(current => { const next = new Set(current); next.delete(id); return next; })));
  }
}
