import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account-page',
  imports: [RouterLink],
  template: `
    <section class="account-page">
      <span class="eyebrow">HONG BEAUTY / TÀI KHOẢN</span>
      <h1>Tài khoản của bạn</h1>
      @if (auth.status() === 'loading') {
        <p role="status">Đang tải thông tin tài khoản…</p>
      } @else if (auth.user(); as user) {
        <div class="card">
          <span class="label">HỌ VÀ TÊN</span><strong>{{ user.fullName }}</strong>
          <span class="label">EMAIL</span><span>{{ user.email }}</span>
        </div>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button type="button" (click)="logout()" [disabled]="busy()">{{ busy() ? 'Đang đăng xuất…' : 'Đăng xuất' }}</button>
      } @else {
        <p>Bạn cần đăng nhập để xem thông tin tài khoản.</p>
        <a class="primary" routerLink="/login">Đăng nhập</a>
      }
    </section>
  `,
  styles: [`
    .account-page { max-width: 980px; min-height: 65vh; padding: 5rem 4vw 8rem; margin: auto; }
    .eyebrow, .label { letter-spacing: .2em; color: #a3746c; font-size: .7rem; font-weight: 700; }
    h1 { font-size: clamp(2.6rem, 5vw, 4.5rem); margin: .8rem 0 2.5rem; }
    p { color: #786b66; line-height: 1.7; }
    .card { background: #f3eae4; padding: clamp(1.5rem, 4vw, 3rem); display: grid; gap: .7rem; max-width: 600px; }
    .card strong { font-size: 1.3rem; font-weight: 600; margin-bottom: 1.2rem; }
    .card span:last-child { overflow-wrap: anywhere; }
    button, .primary { display: inline-block; margin-top: 2rem; border: 0; background: #342a2b; color: #fff; padding: 1rem 1.5rem; cursor: pointer; text-decoration: none; }
    button:disabled { opacity: .6; cursor: wait; }
    .error { color: #a33f42; }
  `],
})
export class AccountPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');

  logout(): void {
    if (this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    this.auth.logout().subscribe({
      next: () => { this.busy.set(false); void this.router.navigateByUrl('/'); },
      error: error => { this.busy.set(false); this.error.set(authErrorMessage(error, 'Không thể đăng xuất. Vui lòng thử lại.')); },
    });
  }
}
