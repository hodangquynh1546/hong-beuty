import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BeautyService, ServiceApiService } from '../../core/api/service-api.service';
import { AppointmentApiService } from '../../core/api/appointment-api.service';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-services-page',
  imports: [CurrencyPipe, FormsModule, RouterLink],
  template: `
    <section class="services-page"><span class="eyebrow">HONG BEAUTY / DỊCH VỤ</span><h1>Dành thời gian cho chính mình.</h1><p>Khám phá các dịch vụ chăm sóc sắc đẹp được cửa hàng cập nhật.</p>
      @if (loading()) { <p role="status">Đang tải dịch vụ…</p> }
      @else if (error()) { <p role="alert">{{ error() }}</p> }
      @else if (!services().length) { <p>Chưa có dịch vụ đang hiển thị.</p> }
      @else { <div class="grid">@for (service of services(); track service.id) { <article><div class="photo">@if (service.imageUrl) { <img [src]="service.imageUrl" [alt]="service.name" loading="lazy" /> } @else { <span>HONG BEAUTY</span> }</div><div class="body"><span>{{ service.durationMinutes }} phút</span><h2>{{ service.name }}</h2><p>{{ service.description }}</p><strong>{{ service.price | currency:'VND':'symbol':'1.0-0':'vi' }}</strong><button type="button" (click)="selectService(service.id)">✦ Đặt lịch</button>
        @if (selectedService() === service.id) { <div class="booking"><label>Chọn ngày và giờ <input type="datetime-local" [(ngModel)]="startLocal" [min]="minimumLocal()" /></label><button type="button" [disabled]="bookingBusy() || !startLocal" (click)="book(service.id)">{{ bookingBusy() ? 'Đang đặt…' : 'Xác nhận đặt lịch' }}</button><small>Cần đăng nhập để đặt lịch. <a routerLink="/account/appointments">Xem lịch của tôi</a></small>@if (bookingError()) { <p role="alert">{{ bookingError() }}</p> }@if (bookingNotice()) { <p role="status">{{ bookingNotice() }}</p> }</div> }
        </div></article> }</div> }
    </section>
  `,
  styles: [`
    .services-page{max-width:1400px;margin:auto;padding:4rem 4vw 8rem;min-height:70vh}.eyebrow{letter-spacing:.2em;font-size:.72rem;color:#a3746c;font-weight:700}h1{font-size:clamp(2.6rem,5vw,5rem);max-width:850px;margin:1rem 0}p{color:#756b68;line-height:1.7}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem;margin-top:3rem}.grid article{background:#fff;border:1px solid #eee1dd;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px #3c28330d}.photo{aspect-ratio:4/3;background:#eadbd6;display:grid;place-items:center;color:#9e7771;letter-spacing:.16em}.photo img{width:100%;height:100%;object-fit:cover}.body{padding:1.5rem}.body span{font-size:.75rem;letter-spacing:.12em;color:#9f7278}.body h2{font-size:1.6rem;margin:.6rem 0}.body p{min-height:4.5em}.body strong{color:#6f394f}.body button{display:block;border:0;border-radius:8px;background:#3d2833;color:#fff;padding:.8rem 1rem;margin-top:1.1rem;cursor:pointer}.booking{margin-top:1rem;padding:1rem;background:#faf4f1;border-radius:10px}.booking label,.booking small{display:block}.booking input{width:100%;padding:.7rem;margin-top:.5rem;border:1px solid #d6c6c6;border-radius:6px}.booking a{color:#6f394f}@media(max-width:850px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.grid{grid-template-columns:1fr}.services-page{padding:3rem 5vw 5rem}}
  `],
})
export class ServicesPage implements OnInit {
  private readonly api = inject(ServiceApiService);
  private readonly appointments = inject(AppointmentApiService);
  readonly auth = inject(AuthService);
  readonly services = signal<BeautyService[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selectedService = signal<string | null>(null);
  readonly bookingBusy = signal(false);
  readonly bookingError = signal('');
  readonly bookingNotice = signal('');
  startLocal = '';
  minimumLocal(): string { const d = new Date(Date.now() + 30 * 60_000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
  selectService(id: string): void { this.selectedService.set(this.selectedService() === id ? null : id); this.bookingError.set(''); this.bookingNotice.set(''); }
  book(serviceId: string): void {
    if (this.bookingBusy() || !this.startLocal) return;
    const date = new Date(this.startLocal);
    if (Number.isNaN(date.getTime())) { this.bookingError.set('Chọn ngày giờ hợp lệ.'); return; }
    this.bookingBusy.set(true); this.bookingError.set('');
    this.appointments.book(serviceId, date.toISOString()).subscribe({ next: () => { this.bookingBusy.set(false); this.bookingNotice.set('Đã đặt lịch. Vui lòng chờ cửa hàng xác nhận.'); this.startLocal = ''; },
      error: error => { this.bookingBusy.set(false); this.bookingError.set(authErrorMessage(error, 'Không đặt được lịch. Vui lòng chọn giờ khác hoặc đăng nhập.')); } });
  }
  ngOnInit(): void { this.api.list().subscribe({ next: items => { this.services.set(items); this.loading.set(false); },
    error: () => { this.error.set('Không tải được dịch vụ.'); this.loading.set(false); } }); }
}
