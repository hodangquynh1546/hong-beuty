import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { ProductsPage } from './features/products/products.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Hong Beauty | Vẻ đẹp theo cách riêng' },
  { path: 'products', component: ProductsPage, title: 'Sản phẩm | Hong Beauty' },
  { path: '**', redirectTo: '' },
];
