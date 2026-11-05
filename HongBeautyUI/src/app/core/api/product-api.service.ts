import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice?: number;
  salePrice: number | null;
  stock: number;
  savedCount?: number;
  purchaseCount?: number;
  categoryId?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}

export interface ProductInput {
  categoryId: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  costPrice?: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
}

export type CategoryInput = Omit<Category, 'id'>;

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private featuredCache?: { expires: number; value: Observable<Product[]> };
  private categoryCache?: { expires: number; value: Observable<Category[]> };
  private invalidate(): void { this.featuredCache = undefined; this.categoryCache = undefined; }
  list(search = '', categoryId = ''): Observable<Product[]> {
    if (!search && !categoryId && this.featuredCache && this.featuredCache.expires > Date.now()) return this.featuredCache.value;
    const request = this.http.get<Product[]>('/api/v1/products', {
      params: {
        ...(search ? { search } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
    });
    if (!search && !categoryId) {
      const value = request.pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.featuredCache = { expires: Date.now() + 30_000, value };
      return value;
    }
    return request;
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/v1/products/${encodeURIComponent(id)}`);
  }

  categories(): Observable<Category[]> {
    if (this.categoryCache && this.categoryCache.expires > Date.now()) return this.categoryCache.value;
    const value = this.http.get<Category[]>('/api/v1/categories').pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.categoryCache = { expires: Date.now() + 60_000, value };
    return value;
  }

  adminProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/v1/admin/products', { withCredentials: true });
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>('/api/v1/product-images', form, { withCredentials: true });
  }

  createProduct(input: ProductInput): Observable<Product> {
    return this.http.post<Product>('/api/v1/admin/products', input, { withCredentials: true }).pipe(tap(() => this.invalidate()));
  }

  updateProduct(id: string, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`/api/v1/admin/products/${encodeURIComponent(id)}`, input, { withCredentials: true }).pipe(tap(() => this.invalidate()));
  }

  deactivateProduct(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/products/${encodeURIComponent(id)}`, { withCredentials: true }).pipe(tap(() => this.invalidate()));
  }

  adminCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/v1/admin/categories', { withCredentials: true });
  }

  createCategory(input: CategoryInput): Observable<Category> {
    return this.http.post<Category>('/api/v1/admin/categories', input, { withCredentials: true }).pipe(tap(() => this.invalidate()));
  }

  updateCategory(id: string, input: CategoryInput): Observable<Category> {
    return this.http.put<Category>(`/api/v1/admin/categories/${encodeURIComponent(id)}`, input, { withCredentials: true }).pipe(tap(() => this.invalidate()));
  }

  deactivateCategory(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/categories/${encodeURIComponent(id)}`, { withCredentials: true }).pipe(tap(() => this.invalidate()));
  }
}
