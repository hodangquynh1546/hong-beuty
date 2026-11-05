import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Report, ReportApiService } from '../../core/api/report-api.service';
import { authErrorMessage } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reports-page',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <section class="page"><span class="eyebrow">HONG BEAUTY / QUẢN TRỊ</span><h1>Báo cáo kinh doanh</h1><p>Doanh thu từ đơn đã xác nhận nhận tiền. Lợi nhuận ước tính trừ giá vốn và khoản chi đã nhập.</p>
      <div class="period"><button type="button" [class.active]="period() === 'week'" (click)="select('week')">Tuần này</button><button type="button" [class.active]="period() === 'month'" (click)="select('month')">Tháng này</button></div>
      @if (loading()) { <p role="status">Đang tải báo cáo…</p> }
      @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }
      @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
      @if (report(); as data) {
        <p class="dates">{{ data.from | date:'dd/MM/yyyy' }} – {{ data.to | date:'dd/MM/yyyy' }}</p>
        <div class="metrics"><article><span>Doanh thu đã nhận</span><strong>{{ data.revenue | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></article><article><span>Giá vốn</span><strong>{{ data.goodsCost | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></article><article><span>Khoản chi</span><strong>{{ data.expenses | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></article><article class="profit"><span>Lợi nhuận ước tính</span><strong>{{ data.estimatedProfit | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></article></div>
        <div class="counts"><span>{{ data.paidOrders }} đơn đã thanh toán</span><span>{{ data.unitsSold }} sản phẩm bán ra</span><span>{{ data.completedAppointments }} lịch dịch vụ hoàn tất</span></div>
        @if (data.productsWithoutCost) { <p class="alert">{{ data.productsWithoutCost }} sản phẩm chưa có giá vốn; lợi nhuận của các đơn chứa sản phẩm này có thể cao hơn thực tế.</p> }
        <div class="columns"><section class="panel"><h2>Sản phẩm bán ra</h2>@if (!data.productSales.length) { <p>Chưa có đơn đã thanh toán trong kỳ.</p> }@else { @for (row of data.productSales; track row.productId) { <div class="row"><span>{{ row.name }} · {{ row.units }} sản phẩm</span><strong>{{ row.revenue | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></div> } }</section>
          <section class="panel"><h2>Tồn kho thấp</h2>@if (!data.lowStock.length) { <p>Chưa có sản phẩm tồn kho từ 5 trở xuống.</p> }@else { @for (row of data.lowStock; track row.productId) { <div class="row"><span>{{ row.name }}</span><strong>{{ row.stock }} còn lại</strong></div> } }</section></div>
        <div class="columns"><section class="panel"><h2>Ghi khoản chi</h2><form #expenseForm="ngForm" (ngSubmit)="addExpense(expenseForm)"><label>Loại chi <input name="category" [(ngModel)]="category" required maxlength="100" placeholder="Nhập hàng, vận chuyển…" /></label><label>Số tiền (₫) <input name="amount" type="number" [(ngModel)]="amount" required min="1" /></label><label>Ghi chú <input name="note" [(ngModel)]="note" maxlength="500" /></label><button type="submit" [disabled]="saving() || expenseForm.invalid">{{ saving() ? 'Đang lưu…' : 'Lưu khoản chi' }}</button></form></section>
          <section class="panel"><h2>Khoản chi trong kỳ</h2>@if (!data.expenseRows.length) { <p>Chưa có khoản chi.</p> }@else { @for (row of data.expenseRows; track row.id) { <div class="row"><span>{{ row.category }}<small>{{ row.note }}</small></span><strong>{{ row.amount | currency:'VND':'symbol':'1.0-0':'vi' }}</strong></div> } }</section></div>
      }
    </section>
  `,
  styles: [`
    .page{max-width:1280px;margin:auto;padding:3rem 4vw 7rem}.eyebrow{letter-spacing:.2em;color:#a3746c;font-size:.72rem;font-weight:700}h1{font-size:clamp(2.6rem,5vw,4.5rem);margin:.7rem 0}p{color:#756b68;line-height:1.6}.period{display:flex;gap:.5rem;margin:2rem 0}.period button,form button{border:1px solid #bfa8ac;background:#fff;color:#523843;border-radius:8px;padding:.7rem 1rem;cursor:pointer}.period button.active,form button{background:#3d2833;color:#fff}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.metrics article,.panel{padding:1.5rem;background:#fff;border:1px solid #e8dcd9;border-radius:14px;box-shadow:0 8px 28px #3d28330d}.metrics span{display:block;color:#756b68;font-size:.8rem}.metrics strong{display:block;margin-top:.7rem;font-size:1.35rem}.metrics .profit{background:#3d2833;color:#fff}.profit span{color:#dfcfd3}.counts{display:flex;gap:.7rem;flex-wrap:wrap;margin:1.4rem 0}.counts span{background:#f2e9e6;padding:.7rem 1rem;border-radius:8px;font-size:.85rem}.columns{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem}.panel h2{margin:0 0 1rem;font-size:1.5rem}.row{display:flex;justify-content:space-between;gap:1rem;border-top:1px solid #eee5e1;padding:.8rem 0}.row small{display:block;color:#867977}.row strong{text-align:right}.alert{background:#fff0e4;color:#80502b;padding:1rem;border-radius:8px}.notice{background:#e9f4ea;color:#3d6745;padding:1rem;border-radius:8px}form{display:grid;gap:1rem}label{display:grid;gap:.4rem;font-size:.82rem}input{padding:.8rem;border:1px solid #d9c8c9;border-radius:8px;font:inherit}@media(max-width:800px){.metrics{grid-template-columns:repeat(2,1fr)}.columns{grid-template-columns:1fr}}@media(max-width:500px){.page{padding:2rem 5vw 5rem}.metrics{gap:.6rem}.metrics article{padding:1rem}.metrics strong{font-size:1rem}}
  `],
})
export class ReportsPage implements OnInit {
  private readonly api = inject(ReportApiService);
  readonly period = signal<'week' | 'month'>('month');
  readonly report = signal<Report | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  category = '';
  note = '';
  amount = 0;
  ngOnInit(): void { this.load(); }
  select(period: 'week' | 'month'): void { this.period.set(period); this.load(); }
  load(): void { this.loading.set(true); this.error.set(''); this.api.get(this.period()).subscribe({ next: data => { this.report.set(data); this.loading.set(false); }, error: error => { this.error.set(authErrorMessage(error, 'Không tải được báo cáo.')); this.loading.set(false); } }); }
  addExpense(form: NgForm): void {
    if (form.invalid || this.saving()) return;
    this.saving.set(true); this.error.set(''); this.notice.set('');
    this.api.addExpense({ category: this.category.trim(), note: this.note.trim(), amount: Number(this.amount), occurredAt: new Date().toISOString() }).subscribe({
      next: () => { this.saving.set(false); this.category = ''; this.note = ''; this.amount = 0; this.notice.set('Đã ghi khoản chi.'); this.load(); },
      error: error => { this.saving.set(false); this.error.set(authErrorMessage(error, 'Không lưu được khoản chi.')); },
    });
  }
}
