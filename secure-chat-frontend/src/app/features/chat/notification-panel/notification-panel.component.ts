import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatBadgeModule, MatMenuModule, MatDividerModule,
    MatTooltipModule, TimeAgoPipe
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="notifMenu"
            id="btn-notifications"
            [matTooltip]="'Notifications'"
            [matBadge]="unreadCount > 0 ? unreadCount : null"
            matBadgeColor="warn"
            matBadgeSize="small">
      <mat-icon>notifications</mat-icon>
    </button>

    <mat-menu #notifMenu="matMenu" class="notifications-menu">
      <div class="notif-header" (click)="$event.stopPropagation()">
        <span class="notif-title">Notifications</span>
        <button mat-button (click)="markAllRead()" *ngIf="unreadCount > 0"
                id="btn-mark-all-read" class="mark-all-btn">
          Mark all read
        </button>
      </div>

      <mat-divider></mat-divider>

      <div class="notif-list" (click)="$event.stopPropagation()">
        <div *ngIf="notifications.length === 0" class="notif-empty">
          <mat-icon>notifications_none</mat-icon>
          <p>All caught up!</p>
        </div>

        <div *ngFor="let n of notifications"
             class="notif-item"
             [class.unread]="!n.isRead"
             [id]="'notif-' + n.id"
             (click)="markRead(n)">
          <div class="notif-icon-wrap">
            <mat-icon class="notif-icon">{{ getIcon(n.type) }}</mat-icon>
            <span class="unread-dot" *ngIf="!n.isRead"></span>
          </div>
          <div class="notif-body">
            <p class="notif-text">{{ getLabel(n) }}</p>
            <span class="notif-time">{{ n.createdAt | timeAgo }}</span>
          </div>
        </div>
      </div>
    </mat-menu>
  `,
  styles: [`
    ::ng-deep .notifications-menu {
      width: 320px;
      max-width: 320px;
    }
    .notif-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .5rem 1rem;
    }
    .notif-title { font-weight: 600; font-size: .95rem; color: var(--text-primary); }
    .mark-all-btn { font-size: .78rem; color: var(--primary); padding: 0 8px; min-width: auto; }
    .notif-list { max-height: 380px; overflow-y: auto; }
    .notif-empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 2rem 1rem; color: var(--text-secondary); gap: .5rem;
      mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; opacity: .4; }
      p { margin: 0; font-size: .9rem; }
    }
    .notif-item {
      display: flex; align-items: flex-start; gap: .75rem;
      padding: .75rem 1rem; cursor: pointer; transition: background .15s;
      &:hover { background: var(--surface); }
      &.unread { background: color-mix(in srgb, var(--primary) 8%, transparent); }
    }
    .notif-icon-wrap { position: relative; flex-shrink: 0; }
    .notif-icon { color: var(--primary); font-size: 1.25rem; width: 1.25rem; height: 1.25rem; }
    .unread-dot {
      position: absolute; top: -2px; right: -2px;
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--error, #f44336);
    }
    .notif-body { flex: 1; min-width: 0; }
    .notif-text { margin: 0 0 2px; font-size: .85rem; color: var(--text-primary);
      white-space: normal; word-break: break-word; }
    .notif-time { font-size: .72rem; color: var(--text-secondary); }
  `]
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  constructor(private notifService: NotificationService) {}

  ngOnInit(): void {
    this.loadNotifications();

    this.notifService.live$.pipe(takeUntil(this.destroy$))
      .subscribe((n: AppNotification) => {
        this.notifications.unshift(n);
        this.unreadCount++;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.notifService.getUnread().subscribe((list: AppNotification[]) => {
      this.notifications = list;
      this.unreadCount = list.length;
    });
  }

  markRead(n: AppNotification): void {
    if (n.isRead) return;
    this.notifService.markRead(n.id).subscribe(() => {
      n.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }

  markAllRead(): void {
    this.notifService.markAllRead().subscribe(() => {
      this.notifications.forEach(n => n.isRead = true);
      this.unreadCount = 0;
    });
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      NEW_MESSAGE:   'chat',
      ROOM_INVITE:   'group_add',
      MEMBER_JOINED: 'person_add',
    };
    return icons[type] ?? 'notifications';
  }

  getLabel(n: AppNotification): string {
    try {
      const payload = JSON.parse(n.payload) as Record<string, string>;
      switch (n.type) {
        case 'NEW_MESSAGE':   return `${payload['senderName'] ?? 'Someone'} sent you a message`;
        case 'ROOM_INVITE':   return `You were invited to "${payload['roomName'] ?? 'a room'}"`;
        case 'MEMBER_JOINED': return `${payload['username'] ?? 'Someone'} joined the room`;
        default:              return n.type.replace(/_/g, ' ');
      }
    } catch {
      return n.type;
    }
  }
}
