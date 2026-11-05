import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

export interface DeliveryAddress {
  id: string;
  recipient: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  province: string;
}

export type AddressInput = Omit<DeliveryAddress, 'id'>;

export interface Order {
  id: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paidAt?: string | null;
  shippingStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  address: { recipient: string; phone: string; addressLine: string };
  items: (Omit<CartItem, 'name'> & { productName: string })[];
}

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly http = inject(HttpClient);
  cart(): Observable<Cart> {
    return this.http.get<Cart>('/api/v1/cart', { withCredentials: true });
  }
  setQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`/api/v1/cart/items/${encodeURIComponent(productId)}`, { quantity }, { withCredentials: true });
  }
  addresses(): Observable<DeliveryAddress[]> {
    return this.http.get<DeliveryAddress[]>('/api/v1/addresses', { withCredentials: true });
  }
  createAddress(input: AddressInput): Observable<DeliveryAddress> {
    return this.http.post<DeliveryAddress>('/api/v1/addresses', input, { withCredentials: true });
  }
  removeAddress(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/addresses/${encodeURIComponent(id)}`, { withCredentials: true });
  }
  checkout(addressId: string): Observable<Order> {
    return this.http.post<Order>('/api/v1/orders', { addressId }, { withCredentials: true });
  }
  orders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/v1/orders', { withCredentials: true });
  }
  order(id: string): Observable<Order> {
    return this.http.get<Order>(`/api/v1/orders/${encodeURIComponent(id)}`, { withCredentials: true });
  }
  cancel(id: string): Observable<Order> {
    return this.http.post<Order>(`/api/v1/orders/${encodeURIComponent(id)}/cancel`, {}, { withCredentials: true });
  }
  adminOrders(): Observable<Order[]> {
    return this.http.get<Order[]>('/api/v1/admin/orders', { withCredentials: true });
  }
  updateStatus(id: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`/api/v1/admin/orders/${encodeURIComponent(id)}/status`, { status }, { withCredentials: true });
  }
  markPaid(id: string): Observable<Order> {
    return this.http.post<Order>(`/api/v1/admin/orders/${encodeURIComponent(id)}/mark-paid`, {}, { withCredentials: true });
  }
}
