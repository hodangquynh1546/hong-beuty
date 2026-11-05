import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-copy"><span class="eyebrow">HONG BEAUTY · EST. 2026</span><h1>Vẻ đẹp bắt đầu từ sự <em>thấu hiểu.</em></h1>
        <p>Một không gian dành cho bạn khám phá sản phẩm và dịch vụ chăm sóc sắc đẹp theo nhu cầu riêng.</p>
        <a class="primary" routerLink="/products">Khám phá sản phẩm <span aria-hidden="true">↗</span></a>
      </div>
      <div class="hero-art" aria-hidden="true"><div class="arch"><div class="orb"></div><div class="line"></div></div><span>01 / BEAUTY RITUALS</span></div>
    </section>
    <section id="about" class="intro"><span class="eyebrow">LỜI GIỚI THIỆU</span><h2>Dành thời gian cho chính mình là một cách yêu thương.</h2><p>Hong Beauty đang xây dựng một trải nghiệm mua sắm và đặt lịch thuận tiện. Thông tin sản phẩm và dịch vụ sẽ được cập nhật từ hệ thống quản lý khi sẵn sàng.</p></section>
    <section id="services" class="feature"><div class="feature-art" aria-hidden="true"><span>HONG BEAUTY</span></div><div><span class="eyebrow">DỊCH VỤ LÀM ĐẸP</span><h2>Khoảnh khắc của riêng bạn.</h2><p>Khám phá dịch vụ và lịch hẹn trực tuyến khi danh mục dịch vụ được mở.</p><a class="text-link" routerLink="/products">Xem sản phẩm hiện có ↗</a></div></section>
    <section id="contact" class="closing"><span class="eyebrow">HONG BEAUTY</span><h2>Chăm sóc bản thân, mỗi ngày.</h2><p>Thông tin liên hệ và địa chỉ cửa hàng sẽ được cập nhật sau khi xác minh.</p></section>
  `,
  styles: [`
    .eyebrow { letter-spacing: .22em; font-size: .7rem; color: #a3746c; font-weight: 700; }
    .hero { max-width: 1320px; min-height: 650px; margin: auto; display: grid; grid-template-columns: 1fr 1fr; padding: 2rem 4vw 4rem; gap: 3rem; }
    .hero-copy { align-self: center; max-width: 560px; }
    h1 { font-size: clamp(3.5rem, 5.5vw, 6.1rem); line-height: 1.07; margin: 1.2rem 0; letter-spacing: -.035em; }
    h1 em { color: #a77576; font-weight: 400; }
    p { line-height: 1.8; color: #736763; }
    .hero-copy p { max-width: 430px; font-size: 1.05rem; }
    .primary { display: inline-flex; gap: 2rem; align-items: center; background: #342a2b; color: #fff; text-decoration: none; padding: 1.1rem 1.4rem; margin-top: 1.6rem; font-size: .85rem; }
    .hero-art { min-height: 580px; position: relative; background: #e8d8ce; display: grid; place-items: center; overflow: hidden; }
    .hero-art:before { content: ''; position: absolute; inset: 5%; border: 1px solid #f7ede7; }
    .arch { width: 64%; height: 82%; background: linear-gradient(155deg,#b78880,#e7c9bb 70%,#f6e5d8); border-radius: 50% 50% 0 0; position: relative; box-shadow: 25px 25px 50px #b99c9280; overflow: hidden; }
    .orb { width: 60%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 30% 25%,#fff8e8,#d7a592 55%,#8c615e); position: absolute; top: 25%; left: 20%; box-shadow: 30px 35px 35px #805d5966; }
    .line { width: 110%; height: 50%; border: 1px solid #fff7ef9c; border-radius: 50%; position: absolute; bottom: -28%; left: -5%; transform: rotate(-20deg); }
    .hero-art > span { position: absolute; bottom: 1.3rem; right: 1.5rem; color: #fff; letter-spacing: .2em; font-size: .65rem; }
    .intro { padding: 8rem 4vw; max-width: 850px; margin: auto; text-align: center; }
    .intro h2,.feature h2,.closing h2 { font-size: clamp(2.2rem,4vw,4rem); line-height: 1.2; margin: 1rem 0; }
    .feature { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: clamp(3rem,8vw,8rem); background: #f3eae4; padding: 5rem max(4vw, calc((100vw - 1214px)/2)); }
    .feature-art { min-height: 440px; background: linear-gradient(145deg,#d6b3a5,#a87671); display: grid; place-items: center; }
    .feature-art span { border: 1px solid #fff9; color: #fff; padding: 5rem 3rem; font-family: 'Playfair Display',serif; font-size: 2.8rem; letter-spacing: .08em; text-align: center; }
    .text-link { color: #654641; text-decoration: none; border-bottom: 1px solid; padding-bottom: .3rem; }
    .closing { text-align: center; padding: 7rem 4vw; }
    @media(max-width:760px){ .hero,.feature { grid-template-columns: 1fr; } .hero { gap: 1rem; } .hero-art { min-height: 360px; } .intro { padding: 5rem 5vw; } .feature { padding: 4rem 5vw; } .feature-art { min-height: 300px; } }
  `],
})
export class HomePage {}
