import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductsPage } from '../products/products.page';
import { BeautyService, ServiceApiService } from '../../core/api/service-api.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProductsPage],
  template: `
    <section class="hero">
      <div class="hero-copy"><span class="eyebrow">HONG BEAUTY</span><h1>Vẻ đẹp bắt đầu từ sự <em>thấu hiểu.</em></h1>
        <p>Một không gian dành cho bạn khám phá sản phẩm và dịch vụ chăm sóc sắc đẹp theo nhu cầu riêng.</p>
        <a class="primary" routerLink="/products">Khám phá sản phẩm <span aria-hidden="true">↗</span></a>
      </div>
      <div class="hero-art"><img src="/beauty-editorial.webp" alt="Tinh chất chăm sóc da trong không gian ấm áp" fetchpriority="high" /><span>HONG BEAUTY · BEAUTY RITUALS</span></div>
    </section>
    <section id="about" class="intro"><span class="eyebrow">CÂU CHUYỆN CỦA CHÚNG TÔI</span><h2>Dành thời gian cho chính mình là một cách yêu thương.</h2><p>Những lựa chọn chăm sóc tinh tế, dành cho nhịp sống và cảm nhận rất riêng của bạn. Khám phá sản phẩm, lưu địa chỉ và theo dõi đơn hàng thuận tiện trong một nơi.</p></section>
    <app-products-page />
    <section id="services" class="feature"><div class="feature-art" aria-hidden="true"><span>HONG BEAUTY</span></div><div><span class="eyebrow">CHĂM SÓC THEO CÁCH RIÊNG</span><h2>Khoảnh khắc của riêng bạn.</h2><p>Khám phá các dịch vụ chăm sóc sắc đẹp phù hợp với thời gian và nhu cầu của bạn.</p><a class="text-link" routerLink="/services">Khám phá dịch vụ ↗</a></div></section>
    @if (services().length) { <section class="home-products"><div class="section-heading"><div><span class="eyebrow">DỊCH VỤ HONG BEAUTY</span><h2>Dành riêng cho bạn</h2></div><a routerLink="/services">Xem tất cả ↗</a></div><div class="product-grid">@for (service of services(); track service.id) { <a class="product-card" routerLink="/services"><div class="product-photo">@if (service.imageUrl) { <img [src]="service.imageUrl" [alt]="service.name" loading="lazy" /> } @else { <span>HONG BEAUTY</span> }</div><div class="product-info"><h3>{{ service.name }}</h3><p>{{ service.durationMinutes }} phút · {{ service.description }}</p><strong>{{ service.price }} ₫</strong></div></a> }</div></section> }
    <section id="contact" class="closing"><span class="eyebrow">HONG BEAUTY</span><h2>Chăm sóc bản thân, mỗi ngày.</h2><p>Mỗi ngày đều là một dịp để bạn yêu thương chính mình.</p><a class="primary" routerLink="/products">Bắt đầu khám phá <span aria-hidden="true">↗</span></a></section>
  `,
  styles: [`
    .eyebrow { letter-spacing: .22em; font-size: .7rem; color: #a3746c; font-weight: 700; }
    .hero { max-width: 1440px; min-height: 680px; margin: auto; display: grid; grid-template-columns: 1fr 1fr; padding: 2rem 4vw 4rem; gap: 3rem; }
    .hero-copy { align-self: center; }
    h1 { font-size: clamp(3.5rem, 5.5vw, 6.1rem); line-height: 1.03; margin: 1.2rem 0; letter-spacing: -.055em; }
    h1 em { color: #a77576; font-weight: 400; }
    p { line-height: 1.8; color: #736763; }
    .primary { display: inline-flex; gap: 2rem; align-items: center; background: #3c2833; color: #fff; text-decoration: none; padding: 1.1rem 1.4rem; margin-top: 1.6rem; font-size: .85rem; border-radius: 4px; box-shadow: 0 14px 30px #3c283326; transition: transform .3s, box-shadow .3s, background .3s; }
    .primary:hover { transform: translateY(-4px); background: #734559; box-shadow: 0 20px 36px #3c28333b; }
    .hero-art { min-height: 580px; position: relative; background: #b88d77; display: grid; place-items: center; overflow: hidden; border-radius: 260px 260px 8px 8px; box-shadow: 0 24px 54px #6f4a4226; }
    .hero-art img { width: 100%; height: 100%; position: absolute; inset: 0; object-fit: cover; object-position: center 57%; animation: hero-in 1.2s ease both; }
    .hero-art:before { content: ''; position: absolute; inset: 4%; border: 1px solid #f7ede7a8; border-radius: 240px 240px 2px 2px; z-index: 1; }
    .hero-art > span { position: absolute; bottom: 1.8rem; right: 2rem; color: #fff; letter-spacing: .2em; font-size: .65rem; z-index: 1; text-shadow: 0 2px 12px #55372e; }
    .intro { padding: 8rem 4vw; max-width: 850px; margin: auto; text-align: center; }
    .home-products { max-width: 1440px; padding: 2rem 4vw 7rem; margin: auto; }.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 1rem; margin-bottom: 2rem; }.section-heading h2 { font-size: clamp(2.2rem,4vw,4rem); margin: .5rem 0 0; }.section-heading a { color: #6f394f; }.product-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 1.2rem; }.product-card { display: block; color: inherit; background: #fff; text-decoration: none; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 30px #392b2a12; transition: transform .25s,box-shadow .25s; }.product-card:hover { transform: translateY(-5px); box-shadow: 0 18px 38px #392b2a24; }.product-photo { aspect-ratio: 4/4.5; background: #eadbd6; display: grid; place-items: center; overflow: hidden; color: #9f7772; letter-spacing: .15em; font-size: .75rem; }.product-photo img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }.product-card:hover img { transform: scale(1.04); }.product-info { padding: 1.1rem; }.product-info h3 { font-size: 1.1rem; margin: 0; }.product-info p { font-size: .82rem; height: 2.7em; overflow: hidden; line-height: 1.4; }.product-info strong { color: #774b58; }
    .intro h2,.feature h2,.closing h2 { font-size: clamp(2.2rem,4vw,4rem); line-height: 1.2; margin: 1rem 0; }
    .feature { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: clamp(3rem,8vw,8rem); background: #f3eae4; padding: 5rem max(4vw, calc((100vw - 1214px)/2)); }
    .feature-art { min-height: 440px; background: linear-gradient(145deg,#3d2833a8,#3d283337),url('/beauty-editorial.webp') center 55%/cover; display: grid; place-items: center; border-radius: 6px; box-shadow: 0 20px 40px #6f4a4229; }
    .feature-art span { border: 1px solid #fff9; color: #fff; padding: 5rem 3rem; font-family: 'Playfair Display',serif; font-size: 2.8rem; letter-spacing: .08em; text-align: center; }
    .text-link { color: #654641; text-decoration: none; border-bottom: 1px solid; padding-bottom: .3rem; }
    .closing { text-align: center; padding: 7rem 4vw; background: #3d2833; color: #fff; }
    .closing p { color: #dac8ca; }
    .closing .eyebrow { color: #e0b6ac; }
    .closing .primary { background: #f5e9df; color: #3d2833; }
    .closing .primary:hover { background: #fff; }
    @keyframes hero-in { from { opacity: .5; transform: scale(1.05); } to { opacity: 1; transform: scale(1); } }
    @media(max-width:900px){ .product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
    @media(max-width:760px){ .hero,.feature { grid-template-columns: 1fr; } .hero { gap: 1rem; } .hero-art { min-height: 360px; } .intro { padding: 5rem 5vw; } .feature { padding: 4rem 5vw; } .feature-art { min-height: 300px; } }
    @media(max-width:420px){ .product-grid { gap: .65rem; }.product-info { padding: .7rem; } }
    @media(prefers-reduced-motion:reduce){ .product-card,.product-photo img { transition: none; } }
  `],
})
export class HomePage implements OnInit {
  private readonly serviceApi = inject(ServiceApiService);
  readonly services = signal<BeautyService[]>([]);
  ngOnInit(): void {
    this.serviceApi.list().subscribe({ next: items => this.services.set(items.slice(0, 4)) });
  }
}
