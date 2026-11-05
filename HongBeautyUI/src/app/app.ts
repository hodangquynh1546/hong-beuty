import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { SupportWidget } from './features/support/support-widget';
import { SupportApiService } from './core/api/support-api.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, SupportWidget],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly auth = inject(AuthService);
  private readonly support = inject(SupportApiService);
  readonly menuOpen = signal(false);
  readonly unreadSupport = signal(0);
  constructor() {
    this.auth.refresh().subscribe({ next: () => this.refreshSupportCount() });
    interval(10000).subscribe(() => this.refreshSupportCount());
  }
  private refreshSupportCount(): void {
    if (!this.auth.user()?.permissions.includes('orders.manage')) { this.unreadSupport.set(0); return; }
    this.support.conversations().subscribe({ next: rows => this.unreadSupport.set(rows.reduce((sum, row) => sum + row.unread, 0)) });
  }
}
