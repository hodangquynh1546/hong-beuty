import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-auth-form-page',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-page">
      <div class="art" aria-hidden="true"><div class="art-frame"><span>HONG<br />BEAUTY</span></div></div>
      <div class="content">
        <span class="eyebrow">HONG BEAUTY / TÀI KHOẢN</span>
        <h1>{{ isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại' }}</h1>
        <p>{{ isRegister ? 'Đăng ký để quản lý thông tin của bạn.' : 'Đăng nhập để tiếp tục hành trình chăm sóc bản thân.' }}</p>
        <form #authForm="ngForm" (ngSubmit)="submit(authForm)" novalidate>
          @if (isRegister) {
            <label for="fullName">Họ và tên</label>
            <input id="fullName" name="fullName" type="text" [(ngModel)]="fullName" required minlength="2" maxlength="120" autocomplete="name" #nameField="ngModel" />
            @if (nameField.invalid && (nameField.touched || submitted())) { <small class="field-error">Vui lòng nhập họ tên từ 2 ký tự.</small> }
          }
          <label for="email">Email</label>
          <input id="email" name="email" type="email" [(ngModel)]="email" required email maxlength="254" autocomplete="email" #emailField="ngModel" />
          @if (emailField.invalid && (emailField.touched || submitted())) { <small class="field-error">Vui lòng nhập email hợp lệ.</small> }
          <label for="password">Mật khẩu</label>
          <input id="password" name="password" type="password" [(ngModel)]="password" required [minlength]="isRegister ? 12 : 1" [autocomplete]="isRegister ? 'new-password' : 'current-password'" #passwordField="ngModel" />
          @if (passwordField.invalid && (passwordField.touched || submitted())) { <small class="field-error">{{ isRegister ? 'Mật khẩu cần ít nhất 12 ký tự.' : 'Vui lòng nhập mật khẩu.' }}</small> }
          @if (isRegister) {
            <label for="confirmPassword">Nhập lại mật khẩu</label>
            <input id="confirmPassword" name="confirmPassword" type="password" [(ngModel)]="confirmPassword" required autocomplete="new-password" />
            @if (submitted() && password !== confirmPassword) { <small class="field-error">Hai mật khẩu chưa khớp.</small> }
          }
          @if (error()) { <div class="message error" role="alert">{{ error() }}</div> }
          <button type="submit" [disabled]="loading()">{{ loading() ? 'Đang xử lý…' : (isRegister ? 'Tạo tài khoản' : 'Đăng nhập') }}</button>
        </form>
        <div class="switch">{{ isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?' }} <a [routerLink]="isRegister ? '/login' : '/register'">{{ isRegister ? 'Đăng nhập' : 'Đăng ký' }}</a></div>
      </div>
    </section>
  `,
  styleUrl: './auth.scss',
})
export class AuthFormPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly isRegister = this.router.url.startsWith('/register');
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly error = signal('');

  submit(form: NgForm): void {
    this.submitted.set(true);
    this.error.set('');
    if (this.loading() || form.invalid || (this.isRegister && this.password !== this.confirmPassword)) return;
    this.loading.set(true);
    const request = this.isRegister
      ? this.auth.register({ fullName: this.fullName.trim(), email: this.email.trim(), password: this.password })
      : this.auth.login({ email: this.email.trim(), password: this.password });
    request.subscribe({
      next: () => { this.loading.set(false); void this.router.navigateByUrl('/account'); },
      error: error => {
        this.loading.set(false);
        this.error.set(authErrorMessage(error, this.isRegister ? 'Không thể tạo tài khoản. Vui lòng kiểm tra thông tin và thử lại.' : 'Email hoặc mật khẩu không đúng.'));
      },
    });
  }
}
