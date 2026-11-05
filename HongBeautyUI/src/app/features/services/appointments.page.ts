import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppointmentApiService, BeautyAppointment } from '../../core/api/appointment-api.service';
import { authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-appointments-page',
  imports: [DatePipe, CurrencyPipe, RouterLink],
  template: `
    <section class="page"><span class="eyebrow">HONG BEAUTY / LỊCH HẸN</span><h1>{{ admin ? 'Quản lý lịch hẹn' : 'Lịch hẹn của bạn' }}</h1><p>{{ admin ? 'Xác nhận và theo dõi lịch dịch vụ.' : 'Theo dõi hoặc hủy lịch trước giờ bắt đầu.' }}</p>
      <a routerLink="/services">← Xem dịch vụ</a>
      @if (loading()) { <p role="status">Đang tải lịch hẹn…</p> }
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (!loading() && !appointments().length) { <p class="empty">Chưa có lịch hẹn nào.</p> }
      <div class="list">@for (item of appointments(); track item.id) { <article><div><span class="date">{{ item.startsAt | date:'dd/MM/yyyy HH:mm' }}</span><h2>{{ item.serviceName }}</h2>@if (admin) { <p>{{ item.customerName }} · {{ item.customerEmail }}</p> }<p>{{ item.price | currency:'VND':'symbol':'1.0-0':'vi' }} · {{ label(item.status) }}</p></div><div class="actions">@if (admin && item.status === 'Pending') { <button type="button" (click)="change(item, 'Confirmed')">Xác nhận</button> }@if (admin && item.status === 'Confirmed') { <button type="button" (click)="change(item, 'Completed')">Hoàn tất</button> }@if (item.status === 'Pending' || item.status === 'Confirmed') { <button type="button" class="secondary" (click)="change(item, 'Cancelled')">Hủy lịch</button> }</div></article> }</div>
    </section>
  `,
  styles: [`
    .page{max-width:1000px;margin:auto;padding:4rem 4vw 7rem;min-height:70vh}.eyebrow{letter-spacing:.2em;font-size:.7rem;color:#a3746c;font-weight:700}h1{font-size:clamp(2.4rem,5vw,4rem);margin:1rem 0}p{color:#756b68}.page>a{color:#76505d}.list{display:grid;gap:1rem;margin-top:2rem}.list article{display:flex;justify-content:space-between;gap:1rem;align-items:center;background:#fff;border:1px solid #eaded7;border-radius:14px;padding:1.3rem 1.6rem}.list h2{margin:.4rem 0;font-size:1.3rem}.date{font-size:.8rem;color:#9a6575}.actions{display:flex;gap:.5rem;flex-wrap:wrap}.actions button{border:0;border-radius:7px;background:#3d2833;color:white;padding:.7rem 1rem;cursor:pointer}.actions .secondary{background:#f1e7e3;color:#6e4350}.alert,.empty{padding:1.2rem;background:#f6e8e4;border-radius:10px}@media(max-width:600px){.page{padding:3rem 5vw 5rem}.list article{display:block}.actions{margin-top:1rem}}
  `],
})
export class AppointmentsPage implements OnInit {
  private readonly api = inject(AppointmentApiService);
  private readonly router = inject(Router);
  readonly admin = this.router.url.startsWith('/admin/');
  readonly appointments = signal<BeautyAppointment[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit(): void {
    const request = this.admin ? this.api.adminList() : this.api.mine();
    request.subscribe({ next: items => { this.appointments.set(items); this.loading.set(false); },
      error: error => { this.error.set(authErrorMessage(error, 'Không tải được lịch hẹn.')); this.loading.set(false); } });
  }
  label(status: BeautyAppointment['status']): string { return ({ Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Completed: 'Hoàn tất', Cancelled: 'Đã hủy' })[status]; }
  change(item: BeautyAppointment, status: BeautyAppointment['status']): void {
    if (status === 'Cancelled' && !confirm('Hủy lịch hẹn này?')) return;
    const request = this.admin ? this.api.setStatus(item.id, status) : this.api.cancel(item.id);
    request.subscribe({ next: updated => this.appointments.update(items => items.map(x => x.id === updated.id ? updated : x)),
      error: error => this.error.set(authErrorMessage(error, 'Không cập nhật được lịch hẹn.')) });
  }
}
