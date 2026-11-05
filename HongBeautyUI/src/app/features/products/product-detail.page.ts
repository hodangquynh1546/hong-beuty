import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product, ProductApiService } from '../../core/api/product-api.service';

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
    .visual { min-height: 570px; background: linear-gradient(145deg, #eadbd3, #c49d91); display: grid; place-items: center; position: relative; overflow: hidden; }
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
    button { border: 0; background: #332b2b; color: #fff; padding: .7rem 1rem; cursor: pointer; }
    @media (max-width: 760px) { .page { padding: 2rem 5vw 5rem; } .detail { grid-template-columns: 1fr; gap: 2.5rem; } .visual { min-height: 360px; } }
  `],
})
export class ProductDetailPage {
  private readonly api = inject(ProductApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private id = '';
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly error = signal(false);
  readonly product = signal<Product | null>(null);

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
