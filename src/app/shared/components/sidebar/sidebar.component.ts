import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  sidebarService = inject(SidebarService);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Receitas', route: '/receitas', icon: 'arrow-up' },
    { label: 'Despesas', route: '/despesas', icon: 'arrow-down' },
    { label: 'Categorias', route: '/categorias', icon: 'price-tag-3' },
    { label: 'Cartões', route: '/cartoes', icon: 'bank-card' },
    { label: 'Orçamentos', route: '/orcamentos', icon: 'pie-chart' },
  ];

  toggleSidebar() {
    this.sidebarService.toggle();
  }

  get isCollapsed() {
    return this.sidebarService.isCollapsed;
  }
}
