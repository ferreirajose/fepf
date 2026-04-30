import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FeatherModule } from 'angular-feather';
import { SidebarService } from '../../services/sidebar.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FeatherModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'bar-chart-2' },
    { label: 'Receitas', route: '/receitas', icon: 'trending-up' },
    { label: 'Despesas', route: '/despesas', icon: 'trending-down' },
    { label: 'Categorias', route: '/categorias', icon: 'tag' },
    { label: 'Cartões', route: '/cartoes', icon: 'credit-card' },
    { label: 'Orçamentos', route: '/orcamentos', icon: 'pie-chart' },
  ];

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  get isCollapsed() {
    return this.sidebarService.isCollapsed;
  }
}
