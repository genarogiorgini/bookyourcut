import { Routes } from '@angular/router';

export const routes: Routes = [
  // Demo default shop — replace or make a shop picker for production.
  { path: '', pathMatch: 'full', redirectTo: 'barberia-central' },
  {
    path: ':slug',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/client/landing/landing').then((m) => m.Landing),
      },
      {
        path: 'book',
        loadComponent: () =>
          import('./features/client/booking/booking').then((m) => m.Booking),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
