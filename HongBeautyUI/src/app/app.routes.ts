import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { ProductsPage } from './features/products/products.page';
import { ProductDetailPage } from './features/products/product-detail.page';
import { AuthFormPage } from './features/auth/auth-form.page';
import { AccountPage } from './features/auth/account.page';
import { PasswordRecoveryPage } from './features/auth/password-recovery.page';
import { EmailVerificationPage } from './features/auth/email-verification.page';
import { CatalogAdminPage } from './features/admin/catalog-admin.page';
import { CartPage } from './features/orders/cart.page';
import { AddressesPage } from './features/orders/addresses.page';
import { OrdersPage } from './features/orders/orders.page';
import { ServicesPage } from './features/services/services.page';
import { ServicesAdminPage } from './features/admin/services-admin.page';
import { AppointmentsPage } from './features/services/appointments.page';
import { ReportsPage } from './features/admin/reports.page';
import { SupportAdminPage } from './features/admin/support-admin.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Hong Beauty | Vẻ đẹp theo cách riêng' },
  { path: 'products', component: ProductsPage, title: 'Sản phẩm | Hong Beauty' },
  { path: 'services', component: ServicesPage, title: 'Dịch vụ | Hong Beauty' },
  { path: 'account/appointments', component: AppointmentsPage, title: 'Lịch hẹn | Hong Beauty' },
  { path: 'products/:id', component: ProductDetailPage, title: 'Chi tiết sản phẩm | Hong Beauty' },
  { path: 'login', component: AuthFormPage, title: 'Đăng nhập | Hong Beauty' },
  { path: 'register', component: AuthFormPage, title: 'Đăng ký | Hong Beauty' },
  { path: 'account', component: AccountPage, title: 'Tài khoản | Hong Beauty' },
  { path: 'forgot-password', component: PasswordRecoveryPage, title: 'Quên mật khẩu | Hong Beauty' },
  { path: 'reset-password', component: PasswordRecoveryPage, title: 'Đặt lại mật khẩu | Hong Beauty' },
  { path: 'verify-email', component: EmailVerificationPage, title: 'Xác nhận email | Hong Beauty' },
  { path: 'admin/catalog', component: CatalogAdminPage, title: 'Quản trị danh mục | Hong Beauty' },
  { path: 'admin/services', component: ServicesAdminPage, title: 'Quản trị dịch vụ | Hong Beauty' },
  { path: 'admin/appointments', component: AppointmentsPage, title: 'Quản lý lịch hẹn | Hong Beauty' },
  { path: 'admin/reports', component: ReportsPage, title: 'Báo cáo | Hong Beauty' },
  { path: 'admin/support', component: SupportAdminPage, title: 'Tin nhắn | Hong Beauty' },
  { path: 'cart', component: CartPage, title: 'Giỏ hàng | Hong Beauty' },
  { path: 'account/addresses', component: AddressesPage, title: 'Địa chỉ giao hàng | Hong Beauty' },
  { path: 'account/orders', component: OrdersPage, title: 'Đơn hàng | Hong Beauty' },
  { path: 'admin/orders', component: OrdersPage, title: 'Quản trị đơn hàng | Hong Beauty', data: { admin: true } },
  { path: '**', redirectTo: '' },
];
