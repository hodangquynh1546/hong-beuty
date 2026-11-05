import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { SupportApiService, SupportConversation, SupportMessage } from '../../core/api/support-api.service';

@Component({
  selector: 'app-support-admin',
  imports: [DatePipe, FormsModule],
  template: `<section class="page"><div class="heading"><span class="material-symbols-outlined">forum</span><div><h1>Tin nhắn khách hàng</h1><p>Trả lời trực tiếp từng cuộc trò chuyện.</p></div></div>
    <div class="layout"><aside aria-label="Cuộc trò chuyện">@for (item of conversations(); track item.customerId) { <button type="button" [class.active]="selected() === item.customerId" (click)="select(item.customerId)"><strong>{{ item.customerName }}</strong>@if (item.unread) { <b>{{ item.unread }}</b> }<span>{{ item.lastMessage }}</span></button> } @if (!conversations().length) { <p>Chưa có tin nhắn.</p> }</aside>
      <div class="chat">@if (selected()) { <div class="messages">@for (message of messages(); track message.id) { <div class="bubble" [class.mine]="message.fromAdmin"><span>{{ message.body }}</span><small>{{ message.createdAt | date:'dd/MM HH:mm' }}</small></div> }</div><form (submit)="send($event)"><input name="reply" [(ngModel)]="draft" maxlength="2000" placeholder="Viết phản hồi..." aria-label="Phản hồi khách hàng" /><button type="submit" [disabled]="busy() || !draft.trim()"><span class="material-symbols-outlined">send</span> Gửi</button></form> } @else { <p>Chọn cuộc trò chuyện để trả lời.</p> }</div></div>
    @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
  </section>`,
  styles: [`
    .page{max-width:1200px;margin:auto;padding:2rem 4vw 5rem}.heading{display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem}.heading>.material-symbols-outlined{font-size:2.4rem;color:#754c61}.heading h1{font-size:clamp(2rem,4vw,3.5rem);margin:0}.heading p{color:#746b69}.layout{display:grid;grid-template-columns:minmax(220px,320px) 1fr;min-height:500px;max-height:70dvh;border:1px solid #e9d9da;border-radius:18px;overflow:hidden;background:#fff}aside{overflow-y:auto;border-right:1px solid #eee}aside button{display:block;width:100%;border:0;border-bottom:1px solid #eee;background:#fff;text-align:left;padding:1rem;cursor:pointer}aside button.active{background:#f4e9ec}aside strong{font-size:.95rem}aside b{float:right;background:#a94769;color:#fff;border-radius:12px;padding:.1rem .4rem;font-size:.7rem}aside span{display:block;color:#776b6e;font-size:.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.35rem}aside p{padding:1rem}.chat{display:flex;flex-direction:column;min-height:0}.chat>p{margin:auto;color:#776b6e}.messages{flex:1;min-height:0;overflow-y:auto;padding:1.25rem;display:flex;flex-direction:column;gap:.6rem;background:#faf7f6}.bubble{max-width:75%;align-self:flex-start;background:#fff;padding:.65rem .85rem;border-radius:14px;box-shadow:0 2px 8px #0001;overflow-wrap:anywhere}.bubble.mine{align-self:flex-end;background:#e8d7df}.bubble span,.bubble small{display:block}.bubble small{font-size:.65rem;color:#7d6c72;text-align:right;margin-top:.25rem}form{display:flex;gap:.5rem;padding:.8rem}form input{flex:1;min-width:0;padding:.7rem;border:1px solid #ddd;border-radius:9px;font:inherit}form button{border:0;border-radius:9px;background:#58384a;color:#fff;padding:.6rem 1rem;display:flex;align-items:center;gap:.3rem;cursor:pointer}form button:disabled{opacity:.45}.error{color:#b52626}@media(max-width:650px){.page{padding:1rem 3vw}.layout{grid-template-columns:1fr;grid-template-rows:150px minmax(0,1fr);height:calc(100dvh - 210px);max-height:none}aside{border-right:0;border-bottom:1px solid #eee}}
  `],
})
export class SupportAdminPage implements OnInit {
  private readonly api = inject(SupportApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly conversations = signal<SupportConversation[]>([]);
  readonly messages = signal<SupportMessage[]>([]);
  readonly selected = signal<string | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  draft = '';
  private poll?: Subscription;
  ngOnInit(): void { this.refresh(); this.poll = interval(5000).subscribe(() => this.refresh()); this.destroyRef.onDestroy(() => this.poll?.unsubscribe()); }
  refresh(): void { this.api.conversations().subscribe({ next: rows => this.conversations.set(rows), error: () => this.error.set('Không tải được cuộc trò chuyện.') }); const id = this.selected(); if (id) this.api.messages(id).subscribe({ next: rows => this.messages.set(rows) }); }
  select(id: string): void { this.selected.set(id); this.messages.set([]); this.refresh(); this.api.adminRead(id).subscribe({ next: () => this.refresh() }); }
  send(event: Event): void { event.preventDefault(); const id = this.selected(); const body = this.draft.trim(); if (!id || !body || this.busy()) return; this.busy.set(true); this.api.adminSend(id, body).subscribe({ next: () => { this.draft = ''; this.busy.set(false); this.refresh(); }, error: () => { this.busy.set(false); this.error.set('Không gửi được tin nhắn.'); } }); }
}
