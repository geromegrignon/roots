import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./family-tree/pages/family-tree-page.component').then((m) => m.FamilyTreePageComponent),
  },
];
