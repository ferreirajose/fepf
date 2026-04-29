import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarService } from './shared/services/sidebar.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fepf');
  sidebarService = inject(SidebarService);

  get isCollapsed() {
    return this.sidebarService.isCollapsed;
  }
}
