import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AddressInput, DeliveryAddress, OrderApiService } from '../../core/api/order-api.service';

@Component({
  selector: 'app-addresses-page', standalone: true, imports: [CommonModule, FormsModule, RouterLink],
  template: `<main class="addresses-page"><a routerLink="/cart">← Giỏ hàng</a><h1>Địa chỉ giao hàng</h1>
    @if (loading) { <p>Đang tải…</p> }
    @if (error) { <p role="alert" class="error">{{error}}</p> }
    @if (notice) { <p role="status">{{notice}}</p> }
    @if (!loading && addresses.length === 0) { <p>Chưa có địa chỉ giao hàng.</p> }
    @for (address of addresses; track address.id) { <article><strong>{{address.recipient}}</strong> · {{address.phone}}<p>{{address.line1}}, {{address.ward}}, {{address.district}}, {{address.province}}</p><button type="button" (click)="remove(address.id)" [disabled]="busy">Xóa</button></article> }
    <h2>Thêm địa chỉ</h2><form (ngSubmit)="save()">
      <label>Họ tên<input name="recipient" [(ngModel)]="draft.recipient" required maxlength="120" /></label>
      <label>Số điện thoại<input name="phone" [(ngModel)]="draft.phone" required maxlength="20" /></label>
      <label>Địa chỉ<input name="line1" [(ngModel)]="draft.line1" required maxlength="240" /></label>
      <label>Phường / Xã<input name="ward" [(ngModel)]="draft.ward" required maxlength="120" /></label>
      <label>Quận / Huyện<input name="district" [(ngModel)]="draft.district" required maxlength="120" /></label>
      <label>Tỉnh / Thành phố<input name="province" [(ngModel)]="draft.province" required maxlength="120" /></label>
      <button type="submit" [disabled]="busy">{{busy ? 'Đang lưu…' : 'Lưu địa chỉ'}}</button>
    </form></main>`,
  styles: [`.addresses-page{max-width:780px;margin:auto;padding:2rem 1.2rem 5rem;color:#382b31}h1,h2{font-family:Georgia,serif;font-weight:400}h1{font-size:clamp(2rem,5vw,3.6rem)}a{color:#935b71}article{border:1px solid #eadde0;padding:1rem;margin:1rem 0;background:#fff}article button{border:0;background:none;color:#935b71;cursor:pointer}form{display:grid;grid-template-columns:1fr 1fr;gap:1rem}label{display:grid;gap:.35rem}input{padding:.75rem;border:1px solid #dac9cf;font:inherit}form button{padding:1rem;background:#6f394f;color:white;border:0;cursor:pointer}button:disabled{opacity:.5}.error{color:#962f46}@media(max-width:650px){form{grid-template-columns:1fr}}`],
})
export class AddressesPage implements OnInit {
  private readonly api = inject(OrderApiService);
  private readonly router = inject(Router);
  addresses: DeliveryAddress[] = [];
  draft: AddressInput = { recipient: '', phone: '', line1: '', ward: '', district: '', province: '' };
  loading = true; busy = false; error = ''; notice = '';
  ngOnInit(): void { this.reload(); }
  reload(): void {
    this.loading = true;
    this.api.addresses().subscribe({next: addresses => { this.addresses = addresses; this.loading = false; }, error: () => { this.loading = false; this.error = 'Không tải được địa chỉ.'; }});
  }
  save(): void {
    if (Object.values(this.draft).some(value => !value.trim())) { this.error = 'Vui lòng điền đầy đủ địa chỉ.'; return; }
    this.busy = true; this.error = ''; this.notice = '';
    this.api.createAddress(this.draft).subscribe({next: address => { this.addresses = [...this.addresses, address]; this.draft = { recipient: '', phone: '', line1: '', ward: '', district: '', province: '' }; this.busy = false; this.notice = 'Đã lưu địa chỉ.'; const previous = history.state?.returnUrl; void this.router.navigateByUrl(typeof previous === 'string' && previous.startsWith('/') && !previous.startsWith('//') ? previous : '/cart'); }, error: () => { this.busy = false; this.error = 'Không lưu được địa chỉ.'; }});
  }
  remove(id: string): void {
    this.busy = true; this.error = ''; this.notice = '';
    this.api.removeAddress(id).subscribe({next: () => { this.addresses = this.addresses.filter(x => x.id !== id); this.busy = false; this.notice = 'Đã xóa địa chỉ.'; }, error: () => { this.busy = false; this.error = 'Không xóa được địa chỉ.'; }});
  }
}
