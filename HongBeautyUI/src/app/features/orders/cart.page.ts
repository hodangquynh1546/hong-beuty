import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cart, DeliveryAddress, OrderApiService } from '../../core/api/order-api.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="commerce-page">
      <a routerLink="/products" class="back">← Tiếp tục mua sắm</a>
      <h1>Giỏ hàng</h1>
      @if (loading) { <p role="status">Đang tải giỏ hàng…</p> }
      @if (error) { <p class="message error" role="alert">{{ error }}</p> }
      @if (notice) { <p class="message" role="status">{{ notice }}</p> }
      @if (!loading && cart && cart.items.length === 0) {
        <div class="empty">Giỏ hàng đang trống. <a routerLink="/products">Khám phá sản phẩm</a></div>
      }
      @if (cart && cart.items.length > 0) {
        <div class="layout">
          <section class="items" aria-label="Sản phẩm trong giỏ">
            @for (item of cart.items; track item.productId) {
              <article class="item">
                @if (item.imageUrl) { <img [src]="item.imageUrl" [alt]="item.name" /> }
                <div><h2>{{ item.name }}</h2><p>{{ item.unitPrice | number }} ₫ / sản phẩm</p></div>
                <label>Số lượng <input type="number" min="0" [max]="99" [ngModel]="item.quantity" (ngModelChange)="changeQuantity(item.productId, $event)" [disabled]="busy" /></label>
                <strong>{{ item.lineTotal | number }} ₫</strong>
                <button type="button" (click)="changeQuantity(item.productId, 0)" [disabled]="busy">Xóa</button>
              </article>
            }
          </section>
          <aside class="summary">
            <h2>Đơn hàng của bạn</h2>
            <p>Tạm tính <strong>{{ cart.subtotal | number }} ₫</strong></p>
            <small>Phí vận chuyển và tổng thanh toán do hệ thống tính khi tạo đơn.</small>
            <h3>Địa chỉ giao hàng</h3>
            @if (addresses.length === 0) { <p>Chưa có địa chỉ nhận hàng.</p> }
            @for (address of addresses; track address.id) {
              <label class="address"><input type="radio" name="address" [value]="address.id" [(ngModel)]="addressId" />
                {{ address.recipient }} · {{ address.phone }}<br />{{ address.line1 }}, {{ address.ward }}, {{ address.district }}, {{ address.province }}
              </label>
            }
            <button class="primary" type="button" [disabled]="busy || !addressId" (click)="checkout()">{{ busy ? 'Đang xử lý…' : 'Đặt hàng' }}</button>
            <a routerLink="/account/addresses">Thêm địa chỉ giao hàng</a>
          </aside>
        </div>
      }
    </main>
  `,
  styles: [`
    .commerce-page{max-width:1180px;margin:auto;padding:2rem 1.2rem 5rem;color:#382b31}.back{color:#935b71;text-decoration:none}h1{font-family:Georgia,serif;font-size:clamp(2.2rem,5vw,4rem);font-weight:400;margin:1.5rem 0 2rem}.layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:2rem}.items,.summary{background:#fff;border:1px solid #eadde0}.item{display:grid;grid-template-columns:72px minmax(0,1fr) 92px 110px auto;align-items:center;gap:1rem;padding:1.2rem;border-bottom:1px solid #f1e7e9}.item img{width:72px;height:72px;object-fit:cover}.item h2,.summary h2{font-family:Georgia,serif;font-weight:400;margin:0 0 .5rem}.item p{margin:0;color:#756771}.item input{width:70px;padding:.5rem}.item button{background:none;border:0;color:#935b71;cursor:pointer}.summary{padding:1.4rem;align-self:start}.summary p{display:flex;justify-content:space-between}.summary small{color:#756771}.summary h3{margin-top:1.8rem}.address{display:block;padding:.8rem 0;border-top:1px solid #f1e7e9;line-height:1.5}.primary{width:100%;padding:1rem;margin:1rem 0;background:#6f394f;color:#fff;border:0;cursor:pointer}.primary:disabled{opacity:.5;cursor:not-allowed}.summary a{color:#935b71}.message,.empty{padding:1rem;background:#f8f0f2}.error{color:#962f46}@media(max-width:800px){.layout{grid-template-columns:1fr}.item{grid-template-columns:56px 1fr;gap:.7rem}.item img{width:56px;height:56px}.item label,.item strong,.item button{grid-column:2}}
  `],
})
export class CartPage implements OnInit {
  private readonly api = inject(OrderApiService);
  cart: Cart | null = null;
  addresses: DeliveryAddress[] = [];
  addressId = '';
  loading = true;
  busy = false;
  error = '';
  notice = '';

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.api.cart().subscribe({
      next: cart => { this.cart = cart; this.loading = false; },
      error: () => { this.error = 'Không tải được giỏ hàng. Vui lòng đăng nhập và thử lại.'; this.loading = false; },
    });
    this.api.addresses().subscribe({
      next: addresses => { this.addresses = addresses; this.addressId ||= addresses[0]?.id || ''; },
      error: () => { this.error = 'Không tải được địa chỉ giao hàng.'; },
    });
  }

  changeQuantity(productId: string, raw: number): void {
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) { this.error = 'Số lượng phải từ 0 đến 99.'; return; }
    this.busy = true; this.error = ''; this.notice = '';
    this.api.setQuantity(productId, quantity).subscribe({
      next: cart => { this.cart = cart; this.busy = false; this.notice = 'Giỏ hàng đã được cập nhật.'; },
      error: () => { this.busy = false; this.error = 'Không thể cập nhật giỏ hàng.'; },
    });
  }

  checkout(): void {
    if (!this.addressId || this.busy) return;
    this.busy = true; this.error = ''; this.notice = '';
    this.api.checkout(this.addressId).subscribe({
      next: order => { this.busy = false; this.cart = { items: [], subtotal: 0 }; this.notice = `Đặt hàng thành công. Mã đơn: ${order.id}`; },
      error: () => { this.busy = false; this.error = 'Không thể đặt hàng. Vui lòng kiểm tra tồn kho và địa chỉ.'; },
    });
  }
}
