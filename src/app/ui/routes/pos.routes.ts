import { Routes } from '@angular/router';
import { PosShellComponent } from '../layouts/pos-shell/pos-shell.component';

export const POS_ROUTES: Routes = [
  {
    path: '',
    component: PosShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../pages/pos/order-type-selection.component').then(
            (m) => m.OrderTypeSelectionComponent,
          ),
      },
      {
        path: 'table-selection',
        loadComponent: () =>
          import('../pages/pos/table-selection.component').then((m) => m.TableSelectionComponent),
      },
      {
        path: 'product-selection',
        loadComponent: () =>
          import('../pages/pos/product-selection.component').then(
            (m) => m.ProductSelectionComponent,
          ),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('../pages/pos/cart-view.component').then((m) => m.CartViewComponent),
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('../pages/pos/payment.component').then((m) => m.PaymentComponent),
      },
    ],
  },
];
