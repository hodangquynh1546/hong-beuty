import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BeautyService, ServiceApiService, ServiceInput } from '../../core/api/service-api.service';
import { ProductApiService } from '../../core/api/product-api.service';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

const blank = (): ServiceInput => ({ name: '', slug: '', description: '', price: 0, durationMinutes: 60, imageUrl: null, isActive: true });
const slugify = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 150);

@Component({
  selector: 'app-services-admin-page',
  imports: [FormsModule, RouterLink, CurrencyPipe],
  template: `
    <section class="admin-page">
      <div class="heading"><div><span class="eyebrow">HONG BEAUTY / QUẢN TRỊ</span><h1>Dịch vụ</h1><p>Thêm, sửa và bật tắt dịch vụ hiển thị trên cửa hàng.</p></div><a routerLink="/services">Xem trang dịch vụ ↗</a></div>
      @if (auth.status() === 'loading' || loading()) { <p class="state">Đang tải dịch vụ…</p> }
      @else if (!canManage()) { <p class="state">Bạn cần quyền quản trị để xem trang này.</p> }
      @else {
        @if (error()) { <p class="alert error" role="alert">{{ error() }}</p> }
        @if (notice()) { <p class="alert success" role="status">{{ notice() }}</p> }
        <div class="content-grid"><form class="editor" #serviceForm="ngForm" (ngSubmit)="save(serviceForm)">
          <div class="panel-title"><h2>{{ editId ? 'Sửa dịch vụ' : 'Thêm dịch vụ' }}</h2></div>
          <label>Tên dịch vụ <input name="name" [(ngModel)]="form.name" required maxlength="180" placeholder="Ví dụ: Chăm sóc da chuyên sâu" /></label>
          <p>Đường dẫn được tạo tự động từ tên dịch vụ.</p>
          <label>Mô tả <textarea name="description" [(ngModel)]="form.description" rows="4" maxlength="5000"></textarea></label>
          <div class="field-row"><label>Giá (₫) <input name="price" type="number" [(ngModel)]="form.price" required min="0" /></label><label>Thời lượng (phút) <input name="duration" type="number" [(ngModel)]="form.durationMinutes" required min="1" max="1440" /></label></div>
          <label>Ảnh dịch vụ <input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadImage($event)" /><small>JPG, PNG hoặc WebP · tối đa 2 MB</small></label>
          @if (form.imageUrl) { <div class="image-preview"><img [src]="form.imageUrl" alt="Ảnh dịch vụ đang chọn" /><button type="button" (click)="form.imageUrl = null">Bỏ ảnh</button></div> }
          <label class="check"><input name="active" type="checkbox" [(ngModel)]="form.isActive" /> Hiển thị dịch vụ</label>
          <div class="form-actions"><button class="primary" type="submit" [disabled]="saving() || uploading() || serviceForm.invalid">{{ saving() ? 'Đang lưu…' : 'Lưu dịch vụ' }}</button><button type="button" (click)="reset()">Làm mới</button></div>
        </form><div class="list-panel"><div class="panel-title"><h2>Dịch vụ hiện có</h2><span>{{ services().length }} dịch vụ</span></div>
          @if (!services().length) { <div class="empty">Chưa có dịch vụ.</div> }
          @else { <div class="items">@for (service of services(); track service.id) { <article><div class="item-main"><div class="thumb">@if (service.imageUrl) { <img [src]="service.imageUrl" [alt]="service.name" /> } @else { <span>HB</span> }</div><div><h3>{{ service.name }}</h3><p>{{ service.durationMinutes }} phút</p><strong>{{ service.price | currency:'VND':'symbol':'1.0-0':'vi' }}</strong> @if (!service.isActive) { <span class="inactive">Tạm ẩn</span> }</div></div><div class="item-actions"><button type="button" (click)="edit(service)">Sửa</button>@if (service.isActive) { <button type="button" class="danger" (click)="hide(service)">Ngừng hiển thị</button> } @else { <button type="button" (click)="show(service)">Hiển thị lại</button> }</div></article> }</div> }
        </div></div>
      }
    </section>
  `,
  styleUrl: './catalog-admin.page.scss',
})
export class ServicesAdminPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ServiceApiService);
  private readonly images = inject(ProductApiService);
  readonly services = signal<BeautyService[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  form = blank();
  editId: string | null = null;
  readonly canManage = () => this.auth.user()?.permissions.includes('catalog.write') ?? false;

  ngOnInit(): void {
    if (this.auth.status() === 'loading') this.auth.refresh().subscribe(() => this.load());
    else this.load();
  }
  load(): void {
    if (!this.canManage()) { this.loading.set(false); return; }
    this.api.adminList().subscribe({ next: services => { this.services.set(services); this.loading.set(false); },
      error: error => { this.error.set(authErrorMessage(error, 'Không tải được dịch vụ.')); this.loading.set(false); } });
  }
  reset(): void { this.form = blank(); this.editId = null; }
  edit(service: BeautyService): void { this.form = { ...service }; this.editId = service.id; this.notice.set(''); }
  uploadImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2_000_000) {
      this.error.set('Chọn ảnh JPG, PNG hoặc WebP nhỏ hơn 2 MB.'); return;
    }
    this.uploading.set(true); this.error.set('');
    this.images.uploadImage(file).subscribe({ next: result => { this.form.imageUrl = result.url; this.uploading.set(false); },
      error: error => { this.uploading.set(false); this.error.set(authErrorMessage(error, 'Không tải được ảnh.')); } });
  }
  save(formRef: NgForm): void {
    if (formRef.invalid || this.saving()) return;
    this.error.set(''); this.notice.set('');
    const input = { ...this.form, name: this.form.name.trim(), description: this.form.description.trim(),
      slug: this.editId ? this.form.slug : this.uniqueSlug(this.form.name), price: Number(this.form.price), durationMinutes: Number(this.form.durationMinutes) };
    this.saving.set(true);
    const request = this.editId ? this.api.update(this.editId, input) : this.api.create(input);
    request.subscribe({ next: item => { this.services.update(items => this.editId ? items.map(x => x.id === item.id ? item : x) : [...items, item].sort((a,b) => a.name.localeCompare(b.name, 'vi'))); this.reset(); this.saving.set(false); this.notice.set('Đã lưu dịch vụ.'); },
      error: error => { this.saving.set(false); this.error.set(authErrorMessage(error, 'Không lưu được dịch vụ.')); } });
  }
  hide(service: BeautyService): void {
    if (!confirm(`Ngừng hiển thị dịch vụ “${service.name}”?`)) return;
    this.api.hide(service.id).subscribe({ next: () => { this.services.update(items => items.map(x => x.id === service.id ? { ...x, isActive: false } : x)); this.notice.set('Đã ẩn dịch vụ.'); },
      error: error => this.error.set(authErrorMessage(error, 'Không ẩn được dịch vụ.')) });
  }
  show(service: BeautyService): void {
    this.api.update(service.id, { ...service, isActive: true }).subscribe({ next: item => { this.services.update(items => items.map(x => x.id === item.id ? item : x)); this.notice.set('Đã hiển thị dịch vụ.'); },
      error: error => this.error.set(authErrorMessage(error, 'Không hiển thị được dịch vụ.')) });
  }
  private uniqueSlug(name: string): string {
    const base = slugify(name) || `dich-vu-${Date.now()}`;
    const used = new Set(this.services().map(x => x.slug));
    let result = base;
    for (let i = 2; used.has(result); i++) result = `${base}-${i}`;
    return result;
  }
}
