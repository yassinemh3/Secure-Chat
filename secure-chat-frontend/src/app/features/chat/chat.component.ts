import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ChatSidebarComponent } from './chat-sidebar/chat-sidebar.component';
import { NotificationPanelComponent } from './notification-panel/notification-panel.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink,
    MatSidenavModule, MatToolbarModule, MatIconModule,
    MatButtonModule, MatTooltipModule,
    ChatSidebarComponent, NotificationPanelComponent
  ],
  template: `
    <div class="chat-layout" [class.dark]="themeService.theme() === 'dark'">
      <mat-sidenav-container class="sidenav-container">

        <!-- Sidebar -->
        <mat-sidenav #sidenav mode="side" [opened]="sidenavOpen" class="sidenav">
          <div class="sidenav-header">
            <mat-icon class="brand-icon">lock</mat-icon>
            <span class="brand-name">SecureChat</span>
          </div>
          <app-chat-sidebar></app-chat-sidebar>
          <div class="sidenav-footer">
            <button mat-icon-button [routerLink]="['/profile']" matTooltip="Profile" id="btn-profile">
              <mat-icon>account_circle</mat-icon>
            </button>
            <button mat-icon-button (click)="themeService.toggle()" matTooltip="Toggle Theme" id="btn-theme">
              <mat-icon>{{ themeService.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            <button mat-icon-button (click)="logout()" matTooltip="Logout" id="btn-logout" class="logout-btn">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="main-content">
          <mat-toolbar class="toolbar">
            <button mat-icon-button (click)="sidenavOpen = !sidenavOpen" id="btn-toggle-sidebar">
              <mat-icon>{{ sidenavOpen ? 'menu_open' : 'menu' }}</mat-icon>
            </button>
            <span class="toolbar-title">Messages</span>
            <span class="spacer"></span>
            <app-notification-panel></app-notification-panel>
          </mat-toolbar>
          <div class="content-area">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>

      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .chat-layout { height: 100vh; display: flex; flex-direction: column; }
    .sidenav-container { flex: 1; }
    .sidenav {
      width: 280px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }
    .sidenav-header {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1.25rem 1rem; border-bottom: 1px solid var(--border);
      .brand-icon { color: var(--primary); }
      .brand-name { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); }
    }
    .sidenav-footer {
      margin-top: auto; padding: 0.75rem;
      display: flex; align-items: center; gap: 0.25rem;
      border-top: 1px solid var(--border);
      .logout-btn { color: var(--error); margin-left: auto; }
    }
    .toolbar {
      background: var(--surface); border-bottom: 1px solid var(--border);
      color: var(--text-primary); box-shadow: none;
    }
    .toolbar-title { font-size: 1.1rem; font-weight: 600; }
    .spacer { flex: 1; }
    .main-content { background: var(--bg); }
    .content-area { height: calc(100vh - 64px); }
  `]
})
export class ChatComponent {
  sidenavOpen = true;

  constructor(
    public authService: AuthService,
    public themeService: ThemeService
  ) {}

  logout(): void {
    this.authService.logout();
  }
}
