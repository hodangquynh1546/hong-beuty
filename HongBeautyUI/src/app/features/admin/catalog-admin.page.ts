import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductApiService, Product, ProductInput, Category, CategoryInput } from '../../core/api/product-api.service';
import { AuthService, authErrorMessage } from '../../core/auth/auth.service';

const emptyProduct = (): ProductInput => ({
  categoryId: null, name: '', slug: '', description: '', price: 0, salePrice: null,
  stock: 0, isActive: true, imageUrl: null,
});
const emptyCategory = (): CategoryInput => ({ name: '', slug: '', description: '', isActive: true });
const makeSlug = (name: string): string => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 150);
const uniqueSlug = (name: string, existing: { slug: string }[]): string => {
  const base = makeSlug(name) || `muc-${Date.now()}`;
  const used = new Set(existing.map(item => item.slug));
  let slug = base;
  for (let index = 2; used.has(slug); index++) slug = `${base}-${index}`;
  return slug;
};

@Component({
  selector: 'app-catalog-admin-page',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  templateUrl: './catalog-admin.page.html',
  styleUrl: './catalog-admin.page.scss',
})
export class CatalogAdminPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ProductApiService);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly activeTab = signal<'products' | 'categories'>('products');
  productForm = emptyProduct();
  categoryForm = emptyCategory();
  productEditId: string | null = null;
  categoryEditId: string | null = null;

  get canManageProducts(): boolean { return this.auth.user()?.permissions.includes('catalog.write') ?? false; }
  get canManageCategories(): boolean { return this.auth.user()?.permissions.includes('catalog.write') ?? false; }
  get canManage(): boolean { return this.canManageProducts || this.canManageCategories; }

  ngOnInit(): void {
    if (this.auth.status() === 'loading') {
      this.auth.refresh().subscribe(() => this.load());
    } else this.load();
  }

  load(): void {
    if (!this.canManage) { this.loading.set(false); return; }
    this.loading.set(true);
    this.error.set('');
    forkJoin({ categories: this.api.adminCategories(), products: this.api.adminProducts() }).subscribe({
      next: ({ categories, products }) => { this.categories.set(categories); this.products.set(products); this.loading.set(false); },
      error: error => { this.error.set(authErrorMessage(error, 'Không tải được dữ liệu quản trị.')); this.loading.set(false); },
    });
  }

  private loadProducts(): void {
    if (!this.canManageProducts) { this.loading.set(false); return; }
    this.api.adminProducts().subscribe({
      next: products => { this.products.set(products); this.loading.set(false); },
      error: error => { this.error.set(authErrorMessage(error, 'Không tải được sản phẩm.')); this.loading.set(false); },
    });
  }

  showTab(tab: 'products' | 'categories'): void {
    this.activeTab.set(tab);
    this.notice.set('');
    this.error.set('');
  }

  editProduct(product: Product): void {
    this.productEditId = product.id;
    this.productForm = {
      categoryId: product.categoryId ?? null, name: product.name, slug: product.slug,
      description: product.description, price: product.price, salePrice: product.salePrice,
      stock: product.stock, isActive: product.isActive ?? true, imageUrl: product.imageUrl ?? null,
    };
    this.notice.set('');
  }

  resetProduct(): void { this.productEditId = null; this.productForm = emptyProduct(); }

  saveProduct(): void {
    this.error.set(''); this.notice.set('');
    const input: ProductInput = {
      ...this.productForm,
      name: this.productForm.name.trim(), slug: this.productEditId ? this.productForm.slug.trim() : uniqueSlug(this.productForm.name, this.products()),
      description: this.productForm.description.trim(),
      categoryId: this.productForm.categoryId || null,
      imageUrl: this.productForm.imageUrl?.trim() || null,
      price: Number(this.productForm.price), stock: Number(this.productForm.stock),
      salePrice: this.productForm.salePrice == null || String(this.productForm.salePrice).trim() === ''
        ? null : Number(this.productForm.salePrice),
    };
    if (!input.name || !input.slug || input.price < 0 || !Number.isFinite(input.price) ||
        !Number.isInteger(input.stock) || input.stock < 0 ||
        (input.salePrice !== null && (!Number.isFinite(input.salePrice) || input.salePrice < 0 || input.salePrice > input.price))) {
      this.error.set('Kiểm tra tên, đường dẫn, giá bán, giá khuyến mãi và tồn kho.'); return;
    }
    this.saving.set(true);
    const request = this.productEditId
      ? this.api.updateProduct(this.productEditId, input)
      : this.api.createProduct(input);
    request.subscribe({
      next: product => { this.saving.set(false); this.notice.set('Đã lưu sản phẩm.'); this.products.update(items => this.productEditId ? items.map(x => x.id === product.id ? product : x) : [...items, product].sort((a, b) => a.name.localeCompare(b.name, 'vi'))); this.resetProduct(); },
      error: error => { this.saving.set(false); this.error.set(authErrorMessage(error, 'Không lưu được sản phẩm.')); },
    });
  }

  deactivateProduct(product: Product): void {
    if (!confirm(`Ngừng hiển thị sản phẩm “${product.name}”?`)) return;
    this.error.set(''); this.notice.set('');
    this.api.deactivateProduct(product.id).subscribe({
      next: () => { this.notice.set('Đã ngừng hiển thị sản phẩm.'); this.loadProducts(); },
      error: error => this.error.set(authErrorMessage(error, 'Không cập nhật được sản phẩm.')),
    });
  }

  editCategory(category: Category): void {
    this.categoryEditId = category.id;
    this.categoryForm = { name: category.name, slug: category.slug, description: category.description, isActive: category.isActive };
    this.notice.set('');
  }

  resetCategory(): void { this.categoryEditId = null; this.categoryForm = emptyCategory(); }

  saveCategory(): void {
    this.error.set(''); this.notice.set('');
    const input: CategoryInput = {
      ...this.categoryForm, name: this.categoryForm.name.trim(),
      slug: this.categoryEditId ? this.categoryForm.slug.trim() : uniqueSlug(this.categoryForm.name, this.categories()), description: this.categoryForm.description.trim(),
    };
    if (!input.name || !input.slug) { this.error.set('Nhập tên và đường dẫn danh mục.'); return; }
    this.saving.set(true);
    const request = this.categoryEditId
      ? this.api.updateCategory(this.categoryEditId, input)
      : this.api.createCategory(input);
    request.subscribe({
      next: category => { this.saving.set(false); this.notice.set('Đã lưu danh mục.'); this.categories.update(items => this.categoryEditId ? items.map(x => x.id === category.id ? category : x) : [...items, category].sort((a, b) => a.name.localeCompare(b.name, 'vi'))); this.resetCategory(); },
      error: error => { this.saving.set(false); this.error.set(authErrorMessage(error, 'Không lưu được danh mục.')); },
    });
  }

  deactivateCategory(category: Category): void {
    if (!confirm(`Ngừng hiển thị danh mục “${category.name}”?`)) return;
    this.error.set(''); this.notice.set('');
    this.api.deactivateCategory(category.id).subscribe({
      next: () => { this.notice.set('Đã ngừng hiển thị danh mục.'); this.load(); },
      error: error => this.error.set(authErrorMessage(error, 'Không cập nhật được danh mục.')),
    });
  }

  categoryName(id: string | null | undefined): string {
    return this.categories().find(category => category.id === id)?.name ?? 'Chưa phân loại';
  }
}
