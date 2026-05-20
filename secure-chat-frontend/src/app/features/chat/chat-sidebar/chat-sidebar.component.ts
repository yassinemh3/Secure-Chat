import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { ChatRoom, UserPresence } from '../../../core/models/models';
import { ChatService } from '../../../core/services/chat.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatListModule, MatIconModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatDialogModule,
    MatBadgeModule, MatTooltipModule
  ],
  template: `
    <div class="sidebar-content">
      <!-- Search -->
      <div class="search-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search rooms</mat-label>
          <input matInput [(ngModel)]="searchQuery" (input)="filterRooms()" id="sidebar-search">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- New Room Button -->
      <div class="section-header">
        <span class="section-title">Conversations</span>
        <button mat-icon-button (click)="createRoom()" matTooltip="New Room" id="btn-new-room" class="new-room-btn">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <!-- Room List -->
      <mat-nav-list class="room-list">
        <a mat-list-item *ngFor="let room of filteredRooms; trackBy: trackRoom"
           [routerLink]="['/chat', room.id]"
           routerLinkActive="active-room"
           class="room-item"
           [id]="'room-' + room.id">
          <div class="room-avatar" matListItemIcon>
            <span class="avatar-text">{{ getRoomInitials(room) }}</span>
            <span class="presence-dot"
                  [class.online]="getPresence(room.id) === 'ONLINE'"
                  [class.away]="getPresence(room.id) === 'AWAY'">
            </span>
          </div>
          <span matListItemTitle class="room-name">{{ room.name || 'Direct Message' }}</span>
          <span matListItemLine class="room-type">{{ room.type }} · {{ room.memberCount }} members</span>
        </a>

        <div *ngIf="filteredRooms.length === 0" class="no-rooms">
          <mat-icon>chat_bubble_outline</mat-icon>
          <p>No conversations yet</p>
          <button mat-stroked-button color="primary" (click)="createRoom()">Start one</button>
        </div>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidebar-content { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .search-bar { padding: 0.75rem; }
    .search-field { width: 100%; }
    ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1rem 0.25rem; color: var(--text-secondary); font-size: 0.8rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .new-room-btn { width: 28px; height: 28px; line-height: 28px; }
    .room-list { flex: 1; overflow-y: auto; padding: 0; }
    .room-item { border-radius: 8px; margin: 2px 4px; transition: background 0.2s;
      &.active-room { background: var(--primary-light) !important; }
    }
    .room-avatar {
      width: 40px; height: 40px; border-radius: 50%; background: var(--primary);
      display: flex; align-items: center; justify-content: center; position: relative;
      flex-shrink: 0;
    }
    .avatar-text { color: white; font-weight: 600; font-size: 0.9rem; }
    .presence-dot {
      position: absolute; bottom: 1px; right: 1px;
      width: 10px; height: 10px; border-radius: 50%; background: var(--text-disabled);
      border: 2px solid var(--sidebar-bg);
      &.online { background: #4caf50; }
      &.away   { background: #ff9800; }
    }
    .room-name { font-weight: 500; color: var(--text-primary); }
    .room-type { color: var(--text-secondary); font-size: 0.75rem; }
    .no-rooms {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      padding: 2rem 1rem; color: var(--text-secondary); text-align: center;
      mat-icon { font-size: 3rem; width: 3rem; height: 3rem; opacity: 0.4; }
    }
  `]
})
export class ChatSidebarComponent implements OnInit, OnDestroy {
  rooms: ChatRoom[] = [];
  filteredRooms: ChatRoom[] = [];
  searchQuery = '';
  presenceMap: Map<string, string> = new Map();
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private wsService: WebSocketService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRooms();

    // Subscribe to reactive room list updates
    this.chatService.roomsChanged$.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadRooms());

    // Real-time presence updates
    this.wsService.presence$.pipe(takeUntil(this.destroy$))
      .subscribe(p => this.presenceMap.set(p.userId, p.status));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRooms(): void {
    this.chatService.getMyRooms().subscribe(rooms => {
      this.rooms = rooms;
      this.filteredRooms = rooms;
    });
  }

  filterRooms(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredRooms = q
      ? this.rooms.filter(r => (r.name || '').toLowerCase().includes(q))
      : this.rooms;
  }

  createRoom(): void {
    const name = prompt('Room name (leave blank for direct message):');
    if (name !== null) {
      this.chatService.createRoom(name || undefined as any, name ? 'GROUP' : 'DIRECT', [])
        .subscribe(room => {
          this.rooms.unshift(room);
          this.filteredRooms = this.rooms;
          this.router.navigate(['/chat', room.id]);
        });
    }
  }

  getRoomInitials(room: ChatRoom): string {
    const name = room.name || 'DM';
    return name.slice(0, 2).toUpperCase();
  }

  getPresence(roomId: string): string {
    return this.presenceMap.get(roomId) || 'OFFLINE';
  }

  trackRoom(_: number, room: ChatRoom): string { return room.id; }
}
