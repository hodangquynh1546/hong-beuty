import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SupportMessage { id: string; customerId: string; fromAdmin: boolean; body: string; createdAt: string; readAt: string | null; }
export interface SupportConversation { customerId: string; customerName: string; lastMessage: string | null; lastAt: string | null; unread: number; }

@Injectable({ providedIn: 'root' })
export class SupportApiService {
  private readonly http = inject(HttpClient);
  mine(): Observable<SupportMessage[]> { return this.http.get<SupportMessage[]>('/api/v1/support/messages', { withCredentials: true }); }
  send(body: string): Observable<SupportMessage> { return this.http.post<SupportMessage>('/api/v1/support/messages', { body }, { withCredentials: true }); }
  readMine(): Observable<void> { return this.http.post<void>('/api/v1/support/read', {}, { withCredentials: true }); }
  conversations(): Observable<SupportConversation[]> { return this.http.get<SupportConversation[]>('/api/v1/admin/support/conversations', { withCredentials: true }); }
  messages(customerId: string): Observable<SupportMessage[]> { return this.http.get<SupportMessage[]>(`/api/v1/admin/support/${customerId}/messages`, { withCredentials: true }); }
  adminSend(customerId: string, body: string): Observable<SupportMessage> { return this.http.post<SupportMessage>(`/api/v1/admin/support/${customerId}/messages`, { body }, { withCredentials: true }); }
  adminRead(customerId: string): Observable<void> { return this.http.post<void>(`/api/v1/admin/support/${customerId}/read`, {}, { withCredentials: true }); }
}
