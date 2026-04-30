import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FeatherModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  currentDate = new Date();
  userName = 'Usuário';

  formatDate(): string {
    return this.currentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
