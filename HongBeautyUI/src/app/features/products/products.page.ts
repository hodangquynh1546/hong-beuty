import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { Category, Product, ProductApiService } from '../../core/api/product-api.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products-page',
  imports: [CurrencyPipe, RouterLink],
  template: `<section class="page"><span class="eyebrow">HONG BEAUTY / SẢN PHẨM</span><h1>Chọn điều phù hợp với bạn.</h1>
    <p>Danh mục được cập nhật trực tiếp từ hệ thống.</p>
    <div class="filters"><label class="search">Tìm sản phẩm <input type="search" placeholder="Nhập tên sản phẩm" #term (input)="load(term.value, category.value)" /></label>
      <label class="search">Danh mục <select #category (change)="load(term.value, category.value)"><option value="">Tất cả danh mục</option>@for (item of categories(); track item.id) { <option [value]="item.id">{{ item.name }}</option> }</select></label></div>
    @if (loading()) { <div class="message" role="status">Đang tải sản phẩm…</div> }
    @else if (error()) { <div class="message error" role="alert">Không tải được sản phẩm. <button (click)="load(term.value, category.value)">Thử lại</button></div> }
    @else if (products().length === 0) { <div class="message">Chưa có sản phẩm phù hợp.</div> }
    @else { <div class="grid">@for (product of products(); track product.id) { <article><a class="product-link" [routerLink]="['/products', product.id]" [attr.aria-label]="'Xem chi tiết ' + product.name"><div class="tile">@if (product.imageUrl) { <img [src]="product.imageUrl" [alt]="product.name" /> } @else { <span aria-hidden="true">HÌNH ẢNH ĐANG CẬP NHẬT</span> }</div><h2>{{ product.name }}</h2></a><p>{{ product.description }}</p><strong>{{ (product.salePrice ?? product.price) | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></article> }</div> }
  </section>`,
  styles: [`
    .page { max-width: 1250px; margin: auto; padding: 5rem 4vw 8rem; min-height: 65vh; }
    .eyebrow { letter-spacing: .2em; color: #a3746c; font-size: .7rem; font-weight: 700; }
    h1 { font-size: clamp(2.6rem,5vw,4.5rem); margin: .8rem 0; }
    p { color: #786b66; }
    .filters { display: flex; gap: 1rem; margin: 3rem 0 2rem; flex-wrap: wrap; }
    .search { display: block; font-size: .8rem; min-width: min(100%,260px); }
    input,select { display: block; margin-top: .6rem; padding: 1rem; border: 1px solid #d5c5bd; width: min(100%,450px); background: white; }
    .message { padding: 3rem; background: #f1e6e0; color: #594f4b; }
    .error { background: #f8e2e1; }
    button { border: 0; background: #332b2b; color: white; padding: .5rem 1rem; cursor: pointer; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 2rem; }
    article { background: white; padding-bottom: 1.5rem; }
    article h2,article p,article strong { margin-left: 1rem; margin-right: 1rem; }
    article h2 { font-size: 1.4rem; }
    .product-link { color: inherit; text-decoration: none; display: block; }
    .product-link:hover h2, .product-link:focus-visible h2 { color: #a3746c; }
    .tile { aspect-ratio: 1; display: grid; place-items: center; background: linear-gradient(145deg,#eadbd3,#b68f88); color: #fff; letter-spacing: .13em; font-size: .7rem; text-align: center; }
    .tile img { width: 100%; height: 100%; object-fit: cover; }
  `],
})
export class ProductsPage implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  constructor() { this.destroyRef.onDestroy(() => this.request?.unsubscribe()); }
  ngOnInit(): void {
    this.api.categories().subscribe({ next: categories => this.categories.set(categories) });
    this.load('', '');
  }
  load(search: string, categoryId: string): void {
    this.request?.unsubscribe();
    this.loading.set(true); this.error.set(false);
    this.request = this.api.list(search, categoryId).subscribe({
      next: products => { this.products.set(products); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
