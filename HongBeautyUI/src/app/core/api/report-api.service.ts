import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Report {
  from: string; to: string; revenue: number; goodsCost: number; expenses: number;
  estimatedProfit: number; paidOrders: number; unitsSold: number; completedAppointments: number;
  productsWithoutCost: number;
  productSales: { productId: string; name: string; units: number; revenue: number }[];
  lowStock: { productId: string; name: string; stock: number; costPrice: number }[];
  expenseRows: { id: string; category: string; note: string; amount: number; occurredAt: string }[];
}

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);
  get(period: 'week' | 'month'): Observable<Report> {
    return this.http.get<Report>('/api/v1/admin/reports', { params: { period }, withCredentials: true });
  }
  addExpense(input: { category: string; note: string; amount: number; occurredAt: string }): Observable<unknown> {
    return this.http.post('/api/v1/admin/reports/expenses', input, { withCredentials: true });
  }
}
