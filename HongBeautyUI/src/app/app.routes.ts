import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { ProductsPage } from './features/products/products.page';
import { AuthFormPage } from './features/auth/auth-form.page';
import { AccountPage } from './features/auth/account.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Hong Beauty | Vẻ đẹp theo cách riêng' },
  { path: 'products', component: ProductsPage, title: 'Sản phẩm | Hong Beauty' },
  { path: 'login', component: AuthFormPage, title: 'Đăng nhập | Hong Beauty' },
  { path: 'register', component: AuthFormPage, title: 'Đăng ký | Hong Beauty' },
  { path: 'account', component: AccountPage, title: 'Tài khoản | Hong Beauty' },
  { path: '**', redirectTo: '' },
];
