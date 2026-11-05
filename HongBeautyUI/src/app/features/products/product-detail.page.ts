import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product, ProductApiService } from '../../core/api/product-api.service';
import { OrderApiService } from '../../core/api/order-api.service';

@Component({
  selector: 'app-product-detail-page',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <section class="page">
      <a class="back" routerLink="/products"><span aria-hidden="true">←</span> Tất cả sản phẩm</a>
      @if (loading()) {
        <div class="message" role="status">Đang tải thông tin sản phẩm…</div>
      } @else if (notFound()) {
        <div class="message"><h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm này có thể đã được gỡ khỏi danh mục.</p><a routerLink="/products">Quay về danh mục</a></div>
      } @else if (error()) {
        <div class="message error" role="alert"><h1>Chưa tải được sản phẩm</h1><p>Vui lòng kiểm tra kết nối rồi thử lại.</p><button type="button" (click)="load()">Thử lại</button></div>
      } @else if (product(); as item) {
        <div class="detail">
          <div class="visual">@if (item.imageUrl) { <img [src]="item.imageUrl" [alt]="item.name" /> } @else { <div class="visual-inner" aria-hidden="true">HONG<br />BEAUTY</div><span>HÌNH ẢNH ĐANG CẬP NHẬT</span> }</div>
          <div class="info">
            <span class="eyebrow">HONG BEAUTY / SẢN PHẨM</span>
            <h1>{{ item.name }}</h1>
            <div class="price">
              <strong>{{ (item.salePrice ?? item.price) | currency:'VND':'symbol':'1.0-0':'vi' }}</strong>
              @if (item.salePrice !== null && item.salePrice < item.price) { <del>{{ item.price | currency:'VND':'symbol':'1.0-0':'vi' }}</del> }
            </div>
            <p class="availability">{{ item.stock > 0 ? 'Còn hàng' : 'Hết hàng' }}</p>
            <div class="purchase-actions"><label for="quantity">Số lượng <input id="quantity" type="number" min="1" [max]="item.stock < 99 ? item.stock : 99" [value]="quantity()" (input)="setQuantity($event, item.stock)" /></label><button class="add-button" [class.added]="addedMotion()" type="button" [disabled]="item.stock === 0 || adding()" (click)="addToCart(item.id)"><span aria-hidden="true">🛍</span> {{ adding() ? 'Đang thêm…' : 'Thêm vào giỏ hàng' }}</button></div>
            @if (addedMotion()) { <span class="cart-spark" aria-hidden="true">✦</span> }
            @if (cartNotice()) { <p role="status">{{ cartNotice() }} <a routerLink="/cart">Xem giỏ hàng</a></p> }
            @if (cartError()) { <p role="alert">{{ cartError() }}</p> }
            <div class="description"><h2>Mô tả sản phẩm</h2><p>{{ item.description || 'Thông tin mô tả đang được cập nhật.' }}</p></div>
            <a class="catalog-link" routerLink="/products">Tiếp tục khám phá sản phẩm <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .page { max-width: 1320px; min-height: 68vh; margin: auto; padding: 2.5rem 4vw 7rem; }
    .back { color: #7c625d; font-size: .82rem; text-decoration: none; display: inline-flex; gap: .5rem; margin-bottom: 2.5rem; }
    .back:hover, .catalog-link:hover { color: #a3746c; }
    .detail { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: clamp(3rem, 7vw, 8rem); align-items: center; }
    .visual { min-height: 570px; background: linear-gradient(145deg, #eadbd3, #c49d91); display: grid; place-items: center; position: relative; overflow: hidden; border-radius: 7px; box-shadow: 0 20px 40px #3d28331a; }
    .visual img { width: 100%; height: 100%; max-height: 650px; object-fit: cover; }
    .visual:before { content: ''; position: absolute; inset: 5%; border: 1px solid #fff9; }
    .visual-inner { width: 60%; aspect-ratio: .8; border-radius: 50% 50% 0 0; display: grid; place-items: center; text-align: center; font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4vw, 4rem); letter-spacing: .15em; color: #fff9; background: linear-gradient(130deg, #b58a82, #e9cabc); box-shadow: 25px 30px 60px #8c635760; }
    .visual > span { position: absolute; bottom: 1.5rem; right: 1.5rem; color: #fff; letter-spacing: .16em; font-size: .65rem; }
    .eyebrow { letter-spacing: .2em; color: #a3746c; font-size: .7rem; font-weight: 700; }
    h1 { font-size: clamp(2.7rem, 4.5vw, 5rem); line-height: 1.12; margin: 1rem 0 1.5rem; }
    .price { display: flex; gap: 1rem; align-items: baseline; flex-wrap: wrap; }
    .price strong { font-size: 1.5rem; font-weight: 600; }
    .price del { color: #9c8d87; }
    .availability { color: #6b655a; font-size: .85rem; border-bottom: 1px solid #e7d9d2; padding-bottom: 2rem; }
    .description { margin-top: 2rem; }
    .description h2 { font-size: 1.35rem; }
    .description p { color: #786b66; white-space: pre-line; line-height: 1.8; }
    .catalog-link { display: inline-flex; margin-top: 2rem; gap: 2rem; color: #654641; border-bottom: 1px solid; padding-bottom: .5rem; text-decoration: none; font-size: .9rem; }
    .message { background: #f1e6e0; padding: 3rem; }
    .message h1 { font-size: 2rem; margin: 0 0 1rem; }
    .message p { color: #6f605a; }
    .message a { color: #654641; }
    .error { background: #f8e2e1; }
    button { border: 0; background: #3d2833; color: #fff; padding: 1rem 1.5rem; cursor: pointer; border-radius: 4px; box-shadow: 0 10px 24px #3d28332a; }
    button:hover:not(:disabled) { background: #74485a; }
    .purchase-actions { display: flex; gap: .8rem; align-items: end; flex-wrap: wrap; }.purchase-actions label { font-size: .75rem; color: #7c625d; }.purchase-actions input { display: block; width: 80px; margin-top: .4rem; padding: .9rem; border: 1px solid #d9c7c8; border-radius: 6px; font: inherit; }.add-button.added { animation: cart-pop .65s ease; }.cart-spark { position: absolute; color: #b57483; font-size: 2rem; animation: spark-away .8s ease forwards; pointer-events: none; }@keyframes cart-pop{50%{transform:scale(1.06)}}@keyframes spark-away{to{transform:translate(70px,-70px) scale(.3);opacity:0}}
    @media(prefers-reduced-motion:reduce){ .add-button.added,.cart-spark { animation: none; } }
    @media (max-width: 760px) { .page { padding: 2rem 5vw 5rem; } .detail { grid-template-columns: 1fr; gap: 2.5rem; } .visual { min-height: 360px; } }
  `],
})
export class ProductDetailPage {
  private readonly api = inject(ProductApiService);
  private readonly orders = inject(OrderApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private id = '';
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly error = signal(false);
  readonly product = signal<Product | null>(null);
  readonly adding = signal(false);
  readonly cartNotice = signal('');
  readonly cartError = signal('');
  readonly quantity = signal(1);
  readonly addedMotion = signal(false);

  setQuantity(event: Event, stock: number): void {
    const raw = Number((event.target as HTMLInputElement).value);
    this.quantity.set(Number.isInteger(raw) ? Math.max(1, Math.min(raw, stock, 99)) : 1);
  }

  addToCart(productId: string): void {
    this.adding.set(true); this.cartNotice.set(''); this.cartError.set('');
    this.orders.cart().subscribe({
      next: cart => {
        const current = cart.items.find(x => x.productId === productId)?.quantity ?? 0;
        if (current + this.quantity() > 99) { this.adding.set(false); this.cartError.set('Giỏ hàng chỉ nhận tối đa 99 sản phẩm mỗi loại.'); return; }
        this.orders.setQuantity(productId, current + this.quantity()).subscribe({
          next: () => { this.adding.set(false); this.cartNotice.set(`Đã thêm ${this.quantity()} sản phẩm vào giỏ hàng.`); this.addedMotion.set(true); setTimeout(() => this.addedMotion.set(false), 900); },
          error: () => { this.adding.set(false); this.cartError.set('Không thể thêm sản phẩm. Vui lòng đăng nhập hoặc kiểm tra tồn kho.'); },
        });
      },
      error: () => { this.adding.set(false); this.cartError.set('Vui lòng đăng nhập để thêm sản phẩm.'); },
    });
  }

  constructor() {
    this.route.paramMap.subscribe(params => { this.id = params.get('id') ?? ''; this.load(); });
    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  load(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.notFound.set(false);
    this.product.set(null);
    this.request = this.api.get(this.id).subscribe({
      next: product => { this.product.set(product); this.loading.set(false); },
      error: err => {
        this.notFound.set(err instanceof HttpErrorResponse && err.status === 404);
        this.error.set(!(err instanceof HttpErrorResponse && err.status === 404));
        this.loading.set(false);
      },
    });
  }
}
