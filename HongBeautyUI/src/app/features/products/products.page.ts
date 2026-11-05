import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Product, ProductApiService } from '../../core/api/product-api.service';

@Component({
  selector: 'app-products-page',
  imports: [CurrencyPipe],
  template: `<section class="page"><span class="eyebrow">HONG BEAUTY / SẢN PHẨM</span><h1>Chọn điều phù hợp với bạn.</h1>
    <p>Danh mục được cập nhật trực tiếp từ hệ thống.</p>
    <label class="search">Tìm sản phẩm <input type="search" placeholder="Nhập tên sản phẩm" #term (input)="load(term.value)" /></label>
    @if (loading()) { <div class="message" role="status">Đang tải sản phẩm…</div> }
    @else if (error()) { <div class="message error" role="alert">Không tải được sản phẩm. <button (click)="load(term.value)">Thử lại</button></div> }
    @else if (products().length === 0) { <div class="message">Chưa có sản phẩm phù hợp.</div> }
    @else { <div class="grid">@for (product of products(); track product.id) { <article><div class="tile" aria-hidden="true">HB</div><h2>{{ product.name }}</h2><p>{{ product.description }}</p><strong>{{ (product.salePrice ?? product.price) | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></article> }</div> }
  </section>`,
  styles: [`
    .page { max-width: 1250px; margin: auto; padding: 5rem 4vw 8rem; min-height: 65vh; }
    .eyebrow { letter-spacing: .2em; color: #a3746c; font-size: .7rem; font-weight: 700; }
    h1 { font-size: clamp(2.6rem,5vw,4.5rem); margin: .8rem 0; }
    p { color: #786b66; }
    .search { display: block; font-size: .8rem; margin: 3rem 0 2rem; }
    input { display: block; margin-top: .6rem; padding: 1rem; border: 1px solid #d5c5bd; width: min(100%,450px); background: white; }
    .message { padding: 3rem; background: #f1e6e0; color: #594f4b; }
    .error { background: #f8e2e1; }
    button { border: 0; background: #332b2b; color: white; padding: .5rem 1rem; cursor: pointer; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 2rem; }
    article { background: white; padding-bottom: 1.5rem; }
    article h2,article p,article strong { margin-left: 1rem; margin-right: 1rem; }
    article h2 { font-size: 1.4rem; }
    .tile { aspect-ratio: 1; display: grid; place-items: center; background: linear-gradient(145deg,#eadbd3,#b68f88); color: #fff9; letter-spacing: .3em; font-family: 'Playfair Display',serif; font-size: 3rem; }
  `],
})
export class ProductsPage implements OnInit {
  private readonly api = inject(ProductApiService);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly products = signal<Product[]>([]);
  ngOnInit(): void { this.load(''); }
  load(search: string): void {
    this.loading.set(true); this.error.set(false);
    this.api.list(search).subscribe({
      next: products => { this.products.set(products); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }
}
