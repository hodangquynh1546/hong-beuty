import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { SupportApiService, SupportMessage } from '../../core/api/support-api.service';

@Component({
  selector: 'app-support-widget',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="support-shell">
      @if (open()) { <section class="panel" aria-label="Nhắn tin với cửa hàng">
        <header><div><strong>HONG BEAUTY</strong><small>Hỗ trợ khách hàng</small></div><button type="button" (click)="open.set(false)" aria-label="Đóng chat">×</button></header>
        @if (!auth.user()) { <div class="login-note">Đăng nhập để nhắn tin và xem lại cuộc trò chuyện.<a routerLink="/login" (click)="open.set(false)">Đăng nhập</a></div> }
        @else { <div class="messages" aria-live="polite">@for (message of messages(); track message.id) { <div class="bubble" [class.mine]="!message.fromAdmin"><span>{{ message.body }}</span><small>{{ message.createdAt | date:'HH:mm' }}</small></div> } @if (!messages().length) { <p>Chào bạn! Hãy để lại lời nhắn, cửa hàng sẽ phản hồi sớm.</p> }</div>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <form (submit)="send($event)"><input type="text" name="message" [(ngModel)]="draft" maxlength="2000" placeholder="Viết tin nhắn..." aria-label="Nội dung tin nhắn" /><button type="submit" [disabled]="busy() || !draft.trim()" aria-label="Gửi tin nhắn"><span class="material-symbols-outlined">send</span></button></form> }
      </section> }
      <button class="launcher" type="button" (click)="toggle()" [attr.aria-expanded]="open()" aria-label="Chat với cửa hàng"><span class="material-symbols-outlined">{{ open() ? 'close' : 'chat' }}</span></button>
    </div>
  `,
  styles: [`
    .support-shell{position:fixed;right:1.25rem;bottom:1.25rem;z-index:1000}.launcher{width:58px;height:58px;border:0;border-radius:50%;background:#58384a;color:#fff;box-shadow:0 12px 32px #3d283355;display:grid;place-items:center;cursor:pointer}.panel{width:min(360px,calc(100vw - 2rem));height:min(520px,calc(100dvh - 6rem));margin-bottom:.75rem;background:#fff;border-radius:18px;box-shadow:0 20px 60px #3d283344;display:flex;flex-direction:column;overflow:hidden}.panel header{display:flex;justify-content:space-between;align-items:center;background:#58384a;color:#fff;padding:1rem 1.1rem}.panel header strong,.panel header small{display:block}.panel header small{opacity:.8;font-size:.75rem}.panel header button{background:none;border:0;color:#fff;font-size:1.7rem;cursor:pointer}.messages{flex:1;overflow-y:auto;padding:1rem;background:#faf6f4;display:flex;flex-direction:column;gap:.55rem}.messages p{color:#766a68;font-size:.85rem}.bubble{align-self:flex-start;max-width:82%;background:#fff;padding:.55rem .75rem;border-radius:14px;box-shadow:0 2px 8px #0001;overflow-wrap:anywhere}.bubble.mine{align-self:flex-end;background:#ead6dc}.bubble span,.bubble small{display:block}.bubble small{text-align:right;font-size:.65rem;color:#806e72;margin-top:.2rem}.panel form{display:flex;gap:.4rem;padding:.7rem;border-top:1px solid #eee}.panel input{flex:1;min-width:0;border:1px solid #ddd;border-radius:20px;padding:.65rem .9rem;font:inherit}.panel form button{border:0;background:#58384a;color:#fff;border-radius:50%;width:40px;cursor:pointer}.panel form button:disabled{opacity:.4}.login-note{padding:1.25rem;line-height:1.6}.login-note a{display:block;color:#58384a;font-weight:700}.error{color:#a22626;padding:0 .75rem;font-size:.8rem}@media(max-width:560px){.support-shell{right:.7rem;bottom:.7rem}.launcher{width:50px;height:50px}}
  `],
})
export class SupportWidget {
  readonly auth = inject(AuthService);
  private readonly api = inject(SupportApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly open = signal(false);
  readonly messages = signal<SupportMessage[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  draft = '';
  private poll?: Subscription;
  constructor() { this.destroyRef.onDestroy(() => this.poll?.unsubscribe()); }
  toggle(): void { this.open.set(!this.open()); if (this.open() && this.auth.user()) { this.load(); this.poll ??= interval(5000).subscribe(() => { if (this.open()) this.load(); }); } }
  load(): void { this.api.mine().subscribe({ next: items => { this.messages.set(items); this.api.readMine().subscribe(); }, error: () => this.error.set('Không tải được tin nhắn.') }); }
  send(event: Event): void { event.preventDefault(); const body = this.draft.trim(); if (!body || this.busy()) return; this.busy.set(true); this.error.set(''); this.api.send(body).subscribe({ next: () => { this.draft = ''; this.busy.set(false); this.load(); }, error: () => { this.busy.set(false); this.error.set('Không gửi được tin nhắn.'); } }); }
}
