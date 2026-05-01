import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'categorias',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/categorias/categorias-lista/categorias-lista.component')
            .then(m => m.CategoriasListaComponent)
      },
      {
        path: 'novo',
        loadComponent: () =>
          import('./pages/categorias/categorias-form/categorias-form.component')
            .then(m => m.CategoriasFormComponent)
      },
      {
        path: ':id/editar',
        loadComponent: () =>
          import('./pages/categorias/categorias-form/categorias-form.component')
            .then(m => m.CategoriasFormComponent)
      }
    ]
  },
  {
    path: 'receitas',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/receitas/receitas.component').then(m => m.ReceitasComponent)
      },
      {
        path: 'novo',
        loadComponent: () =>
          import('./pages/receitas-form/receitas-form.component').then(m => m.ReceitasFormComponent)
      },
      {
        path: ':id/editar',
        loadComponent: () =>
          import('./pages/receitas-form/receitas-form.component').then(m => m.ReceitasFormComponent)
      }
    ]
  },
  {
    path: 'despesas',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/despesas/despesas.component').then(m => m.DespesasComponent)
      },
      {
        path: 'novo',
        loadComponent: () =>
          import('./pages/despesas-form/despesas-form.component').then(m => m.DespesasFormComponent)
      },
      {
        path: ':id/editar',
        loadComponent: () =>
          import('./pages/despesas-form/despesas-form.component').then(m => m.DespesasFormComponent)
      }
    ]
  },
  {
    path: 'cartoes',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/cartoes/cartoes.component').then(m => m.CartoesComponent)
      },
      {
        path: 'novo',
        loadComponent: () =>
          import('./pages/cartoes-form/cartoes-form.component').then(m => m.CartoesFormComponent)
      },
      {
        path: ':id/editar',
        loadComponent: () =>
          import('./pages/cartoes-form/cartoes-form.component').then(m => m.CartoesFormComponent)
      }
    ]
  },
  {
    path: 'orcamentos',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/orcamentos/orcamentos.component').then(m => m.OrcamentosComponent)
      },
      {
        path: 'novo',
        loadComponent: () =>
          import('./pages/orcamentos-form/orcamentos-form.component').then(m => m.OrcamentosFormComponent)
      },
      {
        path: ':id/editar',
        loadComponent: () =>
          import('./pages/orcamentos-form/orcamentos-form.component').then(m => m.OrcamentosFormComponent)
      }
    ]
  },
  {
    path: 'more',
    loadComponent: () =>
      import('./pages/more-menu/more-menu.component').then(m => m.MoreMenuComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
