import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account-page',
  imports: [RouterLink, FormsModule],
  template: `
    <section class="account-page">
      <span class="eyebrow">HONG BEAUTY / TÀI KHOẢN</span>
      <h1>Tài khoản của bạn</h1>
      @if (passwordChanged()) { <div class="success" role="status">Mật khẩu đã đổi. Vui lòng đăng nhập lại.</div> }
      @if (auth.status() === 'loading') {
        <p role="status">Đang tải thông tin tài khoản…</p>
      } @else if (auth.user(); as user) {
        <div class="card">
          <span class="label">HỌ VÀ TÊN</span><strong>{{ user.fullName }}</strong>
          <span class="label">EMAIL</span><span>{{ user.email }}</span>
          <span class="label">XÁC NHẬN EMAIL</span><span>{{ user.emailVerified ? 'Đã xác nhận' : 'Chưa xác nhận' }}</span>
        </div>
        @if (!user.emailVerified) {
          <div class="section">
            <h2>Xác nhận email</h2>
            <p>Gửi liên kết xác nhận tới địa chỉ email của bạn.</p>
            @if (verificationSent()) { <p class="success" role="status">Đã nhận yêu cầu. Vui lòng kiểm tra hộp thư.</p> }
            @if (verificationError()) { <p class="error" role="alert">{{ verificationError() }}</p> }
            <button type="button" (click)="requestVerification()" [disabled]="verificationBusy()">{{ verificationBusy() ? 'Đang gửi…' : 'Gửi liên kết xác nhận' }}</button>
          </div>
        }
        <div class="section">
          <h2>Đổi mật khẩu</h2>
          <form #changeForm="ngForm" (ngSubmit)="changePassword(changeForm)" novalidate>
            <label for="currentPassword">Mật khẩu hiện tại</label>
            <input id="currentPassword" name="currentPassword" type="password" [(ngModel)]="currentPassword" required autocomplete="current-password" />
            <label for="newPassword">Mật khẩu mới</label>
            <input id="newPassword" name="newPassword" type="password" [(ngModel)]="newPassword" required minlength="12" maxlength="128" autocomplete="new-password" />
            <label for="confirmPassword">Nhập lại mật khẩu mới</label>
            <input id="confirmPassword" name="confirmPassword" type="password" [(ngModel)]="confirmPassword" required autocomplete="new-password" />
            @if (changeSubmitted() && newPassword !== confirmPassword) { <small class="error">Hai mật khẩu mới chưa khớp.</small> }
            @if (changeSubmitted() && changeForm.invalid) { <small class="error">Vui lòng nhập mật khẩu mới từ 12 đến 128 ký tự.</small> }
            @if (changeError()) { <p class="error" role="alert">{{ changeError() }}</p> }
            <button type="submit" [disabled]="changeBusy()">{{ changeBusy() ? 'Đang đổi…' : 'Đổi mật khẩu' }}</button>
          </form>
        </div>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button type="button" (click)="logout()" [disabled]="busy()">{{ busy() ? 'Đang đăng xuất…' : 'Đăng xuất' }}</button>
      } @else {
        <p>{{ passwordChanged() ? 'Phiên đăng nhập cũ đã kết thúc.' : 'Bạn cần đăng nhập để xem thông tin tài khoản.' }}</p>
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
    .success { background: #e7eee6; color: #3b6545; padding: 1rem 1.2rem; max-width: 600px; }
    .section { max-width: 600px; padding: 2rem 0; border-bottom: 1px solid #e7d9d2; }
    .section h2 { font-size: 1.7rem; margin: 0; }
    form { display: flex; flex-direction: column; }
    label { font-size: .83rem; font-weight: 600; margin: 1rem 0 .5rem; }
    input { width: 100%; border: 1px solid #d7c6be; background: #fff; padding: .9rem 1rem; outline-color: #a77576; border-radius: 0; }
  `],
})
export class AccountPage {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly verificationBusy = signal(false);
  readonly verificationSent = signal(false);
  readonly verificationError = signal('');
  readonly changeBusy = signal(false);
  readonly changeSubmitted = signal(false);
  readonly changeError = signal('');
  readonly passwordChanged = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  requestVerification(): void {
    if (this.verificationBusy()) return;
    this.verificationBusy.set(true);
    this.verificationError.set('');
    this.auth.requestVerification().subscribe({
      next: () => { this.verificationBusy.set(false); this.verificationSent.set(true); },
      error: error => { this.verificationBusy.set(false); this.verificationError.set(authErrorMessage(error, 'Chưa gửi được liên kết. Vui lòng thử lại.')); },
    });
  }

  changePassword(form: NgForm): void {
    this.changeSubmitted.set(true);
    this.changeError.set('');
    if (this.changeBusy() || form.invalid || this.newPassword !== this.confirmPassword) return;
    this.changeBusy.set(true);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => { this.changeBusy.set(false); this.passwordChanged.set(true); this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = ''; },
      error: error => {
        this.changeBusy.set(false);
        this.changeError.set(error instanceof HttpErrorResponse && error.status === 400
          ? 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ.'
          : authErrorMessage(error, 'Không thể đổi mật khẩu. Vui lòng thử lại.'));
      },
    });
  }

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
