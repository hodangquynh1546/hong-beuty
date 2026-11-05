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
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  list(search = ''): Observable<Product[]> {
    return this.http.get<Product[]>('/api/v1/products', { params: search ? { search } : {} });
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/v1/products/${encodeURIComponent(id)}`);
  }
}
