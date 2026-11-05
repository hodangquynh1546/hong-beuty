import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Order, OrderApiService } from '../../core/api/order-api.service';

@Component({
  selector: 'app-orders-page', standalone: true, imports: [CommonModule, RouterLink],
  template: `<main class="orders-page">
    <a routerLink="/">← Trang chủ</a>
    <h1>{{ admin ? 'Quản trị đơn hàng' : 'Đơn hàng của tôi' }}</h1>
    @if (loading) { <p role="status">Đang tải đơn hàng…</p> }
    @if (error) { <p class="error" role="alert">{{ error }}</p> }
    @if (notice) { <p role="status">{{ notice }}</p> }
    @if (!loading && orders.length === 0) { <p>Chưa có đơn hàng nào.</p> }
    @for (order of orders; track order.id) {
      <article>
        <div class="heading"><div><small>{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</small><h2>Đơn {{ order.id.slice(0, 8) }}</h2></div><strong>{{ order.total | number }} ₫</strong></div>
        <p>Trạng thái: <b>{{ statusLabel(order.status) }}</b> · Thanh toán: {{ order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}</p>
        <p>Nhận hàng: {{ order.address.recipient }} · {{ order.address.phone }}<br>{{ order.address.addressLine }}</p>
        <button type="button" class="details-toggle" (click)="selectedOrder = selectedOrder === order.id ? null : order.id" [attr.aria-expanded]="selectedOrder === order.id">{{ selectedOrder === order.id ? 'Ẩn chi tiết' : 'Xem chi tiết đơn' }}</button>
        @if (selectedOrder === order.id) { <div class="details"><h3>Sản phẩm trong đơn</h3>@for (item of order.items; track item.productId) { <div class="order-item">@if (item.imageUrl) { <img [src]="item.imageUrl" [alt]="item.productName" loading="lazy" /> }<div><strong>{{ item.productName }}</strong><small>{{ item.unitPrice | number }} ₫ × {{ item.quantity }}</small></div><b>{{ item.lineTotal | number }} ₫</b></div> }<p>Tạm tính: {{ order.subtotal | number }} ₫ · Phí vận chuyển: {{ order.shippingFee | number }} ₫</p></div> }
        @if (!admin && (order.status === 'Pending' || order.status === 'Confirmed')) { <button type="button" [disabled]="busy" (click)="cancel(order)">Hủy đơn</button> }
        @if (admin && nextStatus(order.status); as next) { <button type="button" [disabled]="busy" (click)="advance(order, next)">Chuyển sang {{ statusLabel(next) }}</button> }
        @if (admin && order.status !== 'Cancelled' && order.paymentStatus !== 'Paid') { <button type="button" [disabled]="busy" (click)="markPaid(order)">Đã nhận chuyển khoản</button> }
      </article>
    }
  </main>`,
  styles: [`.orders-page{max-width:920px;margin:auto;padding:2rem 1.2rem 5rem;color:#382b31}.orders-page>a{color:#935b71}h1,h2{font-family:Georgia,serif;font-weight:400}h1{font-size:clamp(2rem,5vw,3.5rem)}article{padding:1.4rem;border:1px solid #eadde0;background:#fff;margin:1rem 0}.heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.heading h2{margin:.3rem 0}.heading strong{white-space:nowrap}small{color:#756771}p{line-height:1.5}button{background:#6f394f;color:#fff;border:0;padding:.75rem 1rem;cursor:pointer;margin:.25rem .35rem .25rem 0}button:disabled{opacity:.5}.details-toggle{background:#f3e9ec;color:#58384a}.details{margin:1rem 0;padding:1rem;background:#faf6f7;border-radius:10px}.details h3{margin:0 0 .7rem}.order-item{display:flex;align-items:center;gap:.8rem;padding:.6rem 0;border-top:1px solid #e9dce1}.order-item img{width:48px;height:48px;object-fit:cover;border-radius:6px}.order-item div{flex:1}.order-item small{display:block}.error{color:#962f46}@media(max-width:500px){.heading{align-items:start;flex-direction:column}}`],
})
export class OrdersPage implements OnInit {
  private readonly api = inject(OrderApiService);
  private readonly route = inject(ActivatedRoute);
  readonly admin = this.route.snapshot.data['admin'] === true;
  orders: Order[] = [];
  selectedOrder: string | null = null;
  loading = true; busy = false; error = ''; notice = '';

  ngOnInit(): void {
    const request = this.admin ? this.api.adminOrders() : this.api.orders();
    request.subscribe({
      next: orders => { this.orders = orders; this.loading = false; },
      error: () => { this.error = 'Không tải được đơn hàng. Vui lòng kiểm tra quyền truy cập và thử lại.'; this.loading = false; },
    });
  }
  statusLabel(status: string): string {
    return ({ Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Shipped: 'Đang giao', Completed: 'Hoàn tất', Cancelled: 'Đã hủy' } as Record<string, string>)[status] || status;
  }
  nextStatus(status: string): string | null {
    return ({ Pending: 'Confirmed', Confirmed: 'Shipped', Shipped: 'Completed' } as Record<string, string>)[status] || null;
  }
  cancel(order: Order): void {
    if (this.busy || !window.confirm('Hủy đơn hàng này?')) return;
    this.busy = true; this.error = ''; this.notice = '';
    this.api.cancel(order.id).subscribe({
      next: updated => { this.replace(updated); this.notice = 'Đơn hàng đã được hủy.'; this.busy = false; },
      error: () => { this.error = 'Không hủy được đơn hàng ở trạng thái hiện tại.'; this.busy = false; },
    });
  }
  advance(order: Order, status: string): void {
    if (this.busy) return;
    this.busy = true; this.error = ''; this.notice = '';
    this.api.updateStatus(order.id, status).subscribe({
      next: updated => { this.replace(updated); this.notice = 'Đã cập nhật trạng thái đơn hàng.'; this.busy = false; },
      error: () => { this.error = 'Không cập nhật được trạng thái đơn hàng.'; this.busy = false; },
    });
  }
  markPaid(order: Order): void {
    if (this.busy || !window.confirm('Chỉ xác nhận sau khi đã kiểm tra tiền vào tài khoản. Đánh dấu đơn này đã thanh toán?')) return;
    this.busy = true; this.error = ''; this.notice = '';
    this.api.markPaid(order.id).subscribe({
      next: updated => { this.replace(updated); this.notice = 'Đã ghi nhận thanh toán.'; this.busy = false; },
      error: () => { this.error = 'Không ghi nhận được thanh toán.'; this.busy = false; },
    });
  }
  private replace(updated: Order): void { this.orders = this.orders.map(order => order.id === updated.id ? updated : order); }
}
