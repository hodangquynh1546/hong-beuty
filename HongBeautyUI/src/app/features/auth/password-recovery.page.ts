import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-password-recovery-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="simple-page">
      <span class="eyebrow">HONG BEAUTY / TÀI KHOẢN</span>
      <h1>{{ isReset ? 'Đặt lại mật khẩu' : 'Quên mật khẩu?' }}</h1>
      @if (success()) {
        <div class="notice success" role="status">{{ isReset ? 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.' : 'Nếu email có tài khoản, hướng dẫn đặt lại mật khẩu sẽ được gửi tới hộp thư.' }}</div>
        <a class="text-link" routerLink="/login">Đến trang đăng nhập →</a>
      } @else if (isReset && !token) {
        <div class="notice error" role="alert">Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu liên kết mới.</div>
        <a class="text-link" routerLink="/forgot-password">Yêu cầu liên kết mới →</a>
      } @else {
        <p>{{ isReset ? 'Nhập mật khẩu mới để tiếp tục.' : 'Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.' }}</p>
        <form #form="ngForm" (ngSubmit)="submit(form)" novalidate>
          @if (!isReset) {
            <label for="recoveryEmail">Email</label>
            <input id="recoveryEmail" name="email" type="email" [(ngModel)]="email" required email maxlength="254" autocomplete="email" #emailField="ngModel" />
            @if (emailField.invalid && (emailField.touched || submitted())) { <small>Vui lòng nhập email hợp lệ.</small> }
          } @else {
            <label for="newPassword">Mật khẩu mới</label>
            <input id="newPassword" name="newPassword" type="password" [(ngModel)]="newPassword" required minlength="12" maxlength="128" autocomplete="new-password" #passwordField="ngModel" />
            @if (passwordField.invalid && (passwordField.touched || submitted())) { <small>Mật khẩu cần từ 12 đến 128 ký tự.</small> }
            <label for="confirmPassword">Nhập lại mật khẩu mới</label>
            <input id="confirmPassword" name="confirmPassword" type="password" [(ngModel)]="confirmPassword" required autocomplete="new-password" />
            @if (submitted() && newPassword !== confirmPassword) { <small>Hai mật khẩu chưa khớp.</small> }
          }
          @if (error()) { <div class="notice error" role="alert">{{ error() }}</div> }
          <button type="submit" [disabled]="loading()">{{ loading() ? 'Đang xử lý…' : (isReset ? 'Đặt lại mật khẩu' : 'Gửi hướng dẫn') }}</button>
        </form>
      }
      <a class="back" routerLink="/login">← Quay lại đăng nhập</a>
    </section>
  `,
  styleUrl: './simple-auth.scss',
})
export class PasswordRecoveryPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly isReset = this.router.url.startsWith('/reset-password');
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  email = '';
  newPassword = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly success = signal(false);
  readonly error = signal('');

  submit(form: NgForm): void {
    this.submitted.set(true);
    this.error.set('');
    if (this.loading() || form.invalid || (this.isReset && this.newPassword !== this.confirmPassword)) return;
    this.loading.set(true);
    const request = this.isReset ? this.auth.resetPassword(this.token, this.newPassword) : this.auth.forgotPassword(this.email.trim());
    request.subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: error => {
        this.loading.set(false);
        this.error.set(this.isReset && error instanceof HttpErrorResponse && error.status === 400
          ? 'Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.'
          : authErrorMessage(error, 'Chưa gửi được yêu cầu. Vui lòng thử lại.'));
      },
    });
  }
}
