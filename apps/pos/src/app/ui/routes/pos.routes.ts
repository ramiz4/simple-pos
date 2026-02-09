import { Routes } from '@angular/router';

export const POS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/pos/order-type-selection.component').then(
        (m) => m.OrderTypeSelectionComponent,
      ),
    data: { title: 'Order Type' },
  },
  {
    path: 'table-selection',
    loadComponent: () =>
      import('../pages/pos/table-selection.component').then((m) => m.TableSelectionComponent),
    data: { title: 'Select Table' },
  },
  {
    path: 'product-selection',
    loadComponent: () =>
      import('../pages/pos/product-selection.component').then((m) => m.ProductSelectionComponent),
    data: { title: 'Add Products' },
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('../pages/pos/cart-view.component').then((m) => m.CartViewComponent),
    data: { title: 'Cart' },
  },
  {
    path: 'payment',
    loadComponent: () => import('../pages/pos/payment.component').then((m) => m.PaymentComponent),
    data: { title: 'Payment' },
  },
];
