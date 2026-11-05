import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  permissions: string[];
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<AuthUser | null>(null);
  readonly status = signal<'loading' | 'authenticated' | 'anonymous'>('loading');

  refresh(): Observable<AuthUser | null> {
    this.status.set('loading');
    return this.http.get<AuthUser>('/api/v1/auth/me', { withCredentials: true }).pipe(
      tap(user => { this.user.set(user); this.status.set('authenticated'); }),
      catchError(() => { this.user.set(null); this.status.set('anonymous'); return of(null); }),
    );
  }

  register(data: RegisterRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>('/api/v1/auth/register', data, { withCredentials: true }).pipe(
      tap(user => { this.user.set(user); this.status.set('authenticated'); }),
    );
  }

  login(data: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>('/api/v1/auth/login', data, { withCredentials: true }).pipe(
      tap(user => { this.user.set(user); this.status.set('authenticated'); }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/v1/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => { this.user.set(null); this.status.set('anonymous'); }),
    );
  }

  clearSession(): void { this.user.set(null); this.status.set('anonymous'); }

  requestVerification(): Observable<void> {
    return this.http.post<void>('/api/v1/auth/verification/request', {}, { withCredentials: true });
  }

  confirmVerification(token: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/verification/confirm', { token }, { withCredentials: true });
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/password/forgot', { email }, { withCredentials: true });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/password/reset', { token, newPassword }, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>('/api/v1/auth/password/change', { currentPassword, newPassword }, { withCredentials: true }).pipe(
      tap(() => this.clearSession()),
    );
  }
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return 'Không kết nối được máy chủ. Vui lòng thử lại sau.';
  if (error.status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
  if (error.status === 429) return 'Bạn đã thử quá nhiều lần. Vui lòng đợi một chút rồi thử lại.';
  if (error.status === 400 || error.status === 422) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra và thử lại.';
  const body = error.error;
  if (typeof body === 'object' && body !== null) {
    const detail = (body as { detail?: unknown }).detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    const title = (body as { title?: unknown }).title;
    if (typeof title === 'string' && title.trim()) return title;
  }
  return fallback;
}
