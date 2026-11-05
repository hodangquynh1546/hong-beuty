import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-email-verification-page',
  imports: [RouterLink],
  template: `
    <section class="simple-page">
      <span class="eyebrow">HONG BEAUTY / TÀI KHOẢN</span>
      <h1>Xác nhận email</h1>
      @if (!token) {
        <div class="notice error" role="alert">Liên kết xác nhận không hợp lệ. Bạn có thể yêu cầu gửi lại từ trang tài khoản.</div>
      } @else if (success()) {
        <div class="notice success" role="status">Email của bạn đã được xác nhận.</div>
      } @else {
        <p>Nhấn nút bên dưới để xác nhận địa chỉ email của bạn.</p>
        @if (error()) { <div class="notice error" role="alert">{{ error() }}</div> }
        <button type="button" (click)="confirm()" [disabled]="loading()">{{ loading() ? 'Đang xác nhận…' : 'Xác nhận email' }}</button>
      }
      <a class="back" routerLink="/account">← Về tài khoản</a>
    </section>
  `,
  styleUrl: './simple-auth.scss',
})
export class EmailVerificationPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly loading = signal(false);
  readonly success = signal(false);
  readonly error = signal('');

  confirm(): void {
    if (this.loading() || !this.token) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.confirmVerification(this.token).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); this.auth.refresh().subscribe(); },
      error: error => {
        this.loading.set(false);
        this.error.set(error instanceof HttpErrorResponse && error.status === 400
          ? 'Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.'
          : authErrorMessage(error, 'Không thể xác nhận email. Vui lòng thử lại.'));
      },
    });
  }
}
