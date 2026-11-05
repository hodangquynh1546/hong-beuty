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
        <div class="account-layout"><div class="profile-column"><div class="card">
          <span class="eyebrow">HỒ SƠ CỦA BẠN</span><h2>Thông tin cá nhân</h2>
          <span class="label">HỌ VÀ TÊN</span><strong>{{ user.fullName }}</strong>
          <span class="label">EMAIL</span><span>{{ user.email }}</span>
          <span class="label">VAI TRÒ</span><span>{{ user.role === 'Admin' ? 'Quản trị viên' : user.role === 'Staff' ? 'Nhân viên' : 'Khách hàng' }}</span>
          <span class="label">XÁC NHẬN EMAIL</span><span>{{ user.emailVerified ? 'Đã xác nhận' : 'Chưa xác nhận' }}</span>
        </div>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button class="logout" type="button" (click)="logout()" [disabled]="busy()">{{ busy() ? 'Đang đăng xuất…' : 'Đăng xuất' }}</button>
        </div><div class="settings-column">
        @if (!user.emailVerified) {
          <div class="section">
            <h2>✉ Xác nhận email</h2>
            <p>Gửi liên kết xác nhận tới địa chỉ email của bạn.</p>
            @if (verificationSent()) { <p class="success" role="status">Đã nhận yêu cầu. Vui lòng kiểm tra hộp thư.</p> }
            @if (verificationError()) { <p class="error" role="alert">{{ verificationError() }}</p> }
            <button type="button" (click)="requestVerification()" [disabled]="verificationBusy()">{{ verificationBusy() ? 'Đang gửi…' : 'Gửi liên kết xác nhận' }}</button>
          </div>
        }
        <div class="section">
            <h2>🔒 Đổi mật khẩu</h2>
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
        </div></div>
      } @else {
        <p>{{ passwordChanged() ? 'Phiên đăng nhập cũ đã kết thúc.' : 'Bạn cần đăng nhập để xem thông tin tài khoản.' }}</p>
        <a class="primary" routerLink="/login">Đăng nhập</a>
      }
    </section>
  `,
  styles: [`
    .account-page { max-width: 1180px; min-height: 65vh; padding: 5rem 4vw 8rem; margin: auto; }
    .account-layout { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: clamp(1.5rem, 4vw, 4rem); align-items: start; }
    .profile-column { position: sticky; top: 2rem; }.settings-column { display: grid; gap: 1.3rem; }
    .eyebrow, .label { letter-spacing: .2em; color: #a3746c; font-size: .7rem; font-weight: 700; }
    h1 { font-size: clamp(2.6rem, 5vw, 4.5rem); margin: .8rem 0 2.5rem; }
    p { color: #786b66; line-height: 1.7; }
    .card { background: linear-gradient(145deg,#f2e3df,#f9f3ee); padding: clamp(1.5rem, 4vw, 3rem); display: grid; gap: .7rem; border-radius: 20px; box-shadow: 0 18px 42px #5f3f4014; }
    .card h2 { font-size: 2rem; margin: .3rem 0 1.5rem; }.card .label { margin-top: .5rem; }
    .card strong { font-size: 1.3rem; font-weight: 600; margin-bottom: 1.2rem; }
    .card span:last-child { overflow-wrap: anywhere; }
    button, .primary { display: inline-block; margin-top: 2rem; border: 0; background: #342a2b; color: #fff; padding: 1rem 1.5rem; cursor: pointer; text-decoration: none; }
    button:disabled { opacity: .6; cursor: wait; }
    .error { color: #a33f42; }
    .success { background: #e7eee6; color: #3b6545; padding: 1rem 1.2rem; max-width: 600px; }
    .section { background: #fff; padding: clamp(1.5rem, 3vw, 2.2rem); border: 1px solid #eddfda; border-radius: 20px; box-shadow: 0 12px 34px #5f3f400b; }
    .section h2 { font-size: 1.7rem; margin: 0; }
    form { display: flex; flex-direction: column; }
    label { font-size: .83rem; font-weight: 600; margin: 1rem 0 .5rem; }
    input { width: 100%; border: 1px solid #d7c6be; background: #fff; padding: .9rem 1rem; outline-color: #a77576; border-radius: 9px; }
    .logout { background: #fff; color: #5d3c49; border: 1px solid #d8bfc7; border-radius: 8px; }
    @media(max-width:760px) { .account-page { padding: 3rem 5vw 5rem; }.account-layout { grid-template-columns: 1fr; }.profile-column { position: static; } }
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
      error: error => { this.verificationBusy.set(false); this.verificationError.set(error instanceof HttpErrorResponse && error.status === 503
        ? 'Dịch vụ gửi email của cửa hàng chưa sẵn sàng. Vui lòng thử lại sau khi quản trị viên cấu hình email.'
        : authErrorMessage(error, 'Chưa gửi được liên kết. Vui lòng thử lại.')); },
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
