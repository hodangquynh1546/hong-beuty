import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Product, ProductApiService } from '../../core/api/product-api.service';
import { SavedProductsApiService } from '../../core/api/saved-products-api.service';

@Component({
  selector: 'app-saved-products',
  imports: [CurrencyPipe, RouterLink],
  template: `<section class="page"><div class="heading"><span class="material-symbols-outlined">favorite</span><div><h1>Sản phẩm đã lưu</h1><p>Danh sách yêu thích của bạn.</p></div></div>
    @if (loading()) { <p role="status">Đang tải sản phẩm đã lưu…</p> }
    @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
    @if (!loading() && !products().length) { <div class="empty">Bạn chưa lưu sản phẩm nào. <a routerLink="/products">Khám phá sản phẩm</a></div> }
    <div class="grid">@for (product of products(); track product.id) { <article><a [routerLink]="['/products',product.id]">@if (product.imageUrl) { <img [src]="product.imageUrl" [alt]="product.name" loading="lazy" /> } @else { <div class="placeholder">HONG BEAUTY</div> }<h2>{{ product.name }}</h2></a><strong>{{ (product.salePrice ?? product.price) | currency:'VND':'symbol':'1.0-0':'vi' }}</strong><small><span class="material-symbols-outlined">favorite</span> {{ product.savedCount ?? 0 }} · <span class="material-symbols-outlined">shopping_bag</span> {{ product.purchaseCount ?? 0 }}</small><button type="button" (click)="remove(product.id)">Bỏ lưu</button></article> }</div>
  </section>`,
  styles: [`
    .page{max-width:1250px;margin:auto;padding:2rem 4vw 5rem;min-height:65vh}.heading{display:flex;align-items:center;gap:1rem;margin-bottom:2rem}.heading>.material-symbols-outlined{font-size:2.5rem;color:#a34464}.heading h1{font-size:clamp(2rem,4vw,3.5rem);margin:0}.heading p{color:#766a6d}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.2rem}article{background:#fff;border:1px solid #eadce0;border-radius:12px;overflow:hidden;padding-bottom:1rem}article a{text-decoration:none;color:#382b31}article img,.placeholder{width:100%;aspect-ratio:1;object-fit:cover;background:#eadbd6;display:grid;place-items:center;color:#a47a76}article h2{font-size:1.1rem;margin:.8rem 1rem}article strong,article small{display:block;margin:.4rem 1rem}article small{display:flex;align-items:center;gap:.25rem;color:#776b6e}.material-symbols-outlined{font-size:1rem}article button{margin:.5rem 1rem;border:0;background:#f4e9ed;color:#63384f;padding:.55rem .8rem;border-radius:7px;cursor:pointer}.empty{padding:2rem;background:#faf2f4}.empty a{color:#63384f}.error{color:#b52727}@media(max-width:560px){.page{padding:1.5rem 4vw}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem}article h2{font-size:.95rem}article strong{font-size:.85rem}}
  `],
})
export class SavedProductsPage implements OnInit {
  private readonly api = inject(ProductApiService);
  private readonly saved = inject(SavedProductsApiService);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit(): void { forkJoin({ ids: this.saved.load(), products: this.api.list() }).subscribe({ next: ({ ids, products }) => { const set = new Set(ids); this.products.set(products.filter(x => set.has(x.id))); this.loading.set(false); }, error: () => { this.error.set('Không tải được sản phẩm đã lưu. Vui lòng đăng nhập và thử lại.'); this.loading.set(false); } }); }
  remove(id: string): void { this.saved.remove(id).subscribe({ next: () => this.products.update(rows => rows.filter(x => x.id !== id)), error: () => this.error.set('Không thể bỏ lưu sản phẩm.') }); }
}
