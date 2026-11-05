import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
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
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
}

export type CategoryInput = Omit<Category, 'id'>;

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  list(search = '', categoryId = ''): Observable<Product[]> {
    return this.http.get<Product[]>('/api/v1/products', {
      params: {
        ...(search ? { search } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
    });
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/v1/products/${encodeURIComponent(id)}`);
  }

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/v1/categories');
  }

  adminProducts(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/v1/admin/products', { withCredentials: true });
  }

  createProduct(input: ProductInput): Observable<Product> {
    return this.http.post<Product>('/api/v1/admin/products', input, { withCredentials: true });
  }

  updateProduct(id: string, input: ProductInput): Observable<Product> {
    return this.http.put<Product>(`/api/v1/admin/products/${encodeURIComponent(id)}`, input, { withCredentials: true });
  }

  deactivateProduct(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/products/${encodeURIComponent(id)}`, { withCredentials: true });
  }

  adminCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/v1/admin/categories', { withCredentials: true });
  }

  createCategory(input: CategoryInput): Observable<Category> {
    return this.http.post<Category>('/api/v1/admin/categories', input, { withCredentials: true });
  }

  updateCategory(id: string, input: CategoryInput): Observable<Category> {
    return this.http.put<Category>(`/api/v1/admin/categories/${encodeURIComponent(id)}`, input, { withCredentials: true });
  }

  deactivateCategory(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/categories/${encodeURIComponent(id)}`, { withCredentials: true });
  }
}
