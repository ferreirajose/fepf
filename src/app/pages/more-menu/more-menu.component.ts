import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface MenuItem {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-more-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './more-menu.component.html',
  styleUrls: ['./more-menu.component.css']
})
export class MoreMenuComponent {
  menuItems: MenuItem[] = [
    {
      title: 'Orçamentos',
      description: 'Planeje e acompanhe seus orçamentos mensais',
      icon: 'pie-chart',
      route: '/orcamentos',
      color: '#10B981',
      bgColor: '#ECFDF5'
    },
    {
      title: 'Categorias',
      description: 'Organize receitas e despesas por categorias',
      icon: 'folder',
      route: '/categorias',
      color: '#059669',
      bgColor: '#e6f7f1'
    },
    {
      title: 'Cartões',
      description: 'Gerencie seus cartões de crédito e débito',
      icon: 'bank-card',
      route: '/cartoes',
      color: '#DC2626',
      bgColor: '#FEE2E2'
    }
  ];

  quickActions = [
    {
      title: 'Nova Despesa',
      icon: 'subtract',
      route: '/despesas/novo',
      color: '#DC2626'
    },
    {
      title: 'Nova Receita',
      icon: 'money-dollar',
      route: '/receitas/novo',
      color: '#059669'
    },
    {
      title: 'Novo Orçamento',
      icon: 'file-list',
      route: '/orcamentos/novo',
      color: '#10B981'
    }
  ];
}
