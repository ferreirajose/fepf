import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.css']
})
export class BottomNavComponent {
  navItems = [
    { label: 'Início', icon: 'home', route: '/dashboard' },
    { label: 'Despesas', icon: 'shopping-bag', route: '/despesas' },
    { label: 'Receitas', icon: 'money-dollar-circle', route: '/receitas' },
    { label: 'Mais', icon: 'menu', route: '/more' }
  ];
}
