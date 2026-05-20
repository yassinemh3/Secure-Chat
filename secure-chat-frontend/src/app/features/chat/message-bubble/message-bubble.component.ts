import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Message } from '../../../core/models/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatButtonModule,
    MatTooltipModule, MatMenuModule,
    AvatarComponent, TimeAgoPipe
  ],
  template: `
    <div class="message-row" [class.own]="own" [attr.id]="'msg-' + message.id">

      <!-- Avatar (non-own messages only) -->
      <app-avatar *ngIf="!own"
        [name]="message.sender.displayName"
        [avatarUrl]="message.sender.avatarUrl"
        [size]="32"
        class="msg-avatar">
      </app-avatar>

      <div class="bubble-group">
        <!-- Sender name (non-own only) -->
        <span *ngIf="!own && showSenderName" class="sender-name">
          {{ message.sender.displayName }}
        </span>

        <!-- Reply-to preview -->
        <div *ngIf="message.replyToId" class="reply-preview">
          <mat-icon class="reply-icon">reply</mat-icon>
          <span class="reply-text">Replying to a message</span>
        </div>

        <!-- Bubble -->
        <div class="bubble" [class.own]="own" [class.deleted]="message.isDeleted"
             [class.no-avatar]="own">
          <p class="message-text">
            {{ message.isDeleted ? '[Message deleted]' : message.content }}
          </p>

          <div class="message-meta">
            <span class="message-time" [matTooltip]="message.createdAt | timeAgo">
              {{ formatTime(message.createdAt) }}
            </span>
            <mat-icon class="meta-icon" *ngIf="message.isEdited && !message.isDeleted"
                      matTooltip="Edited">edit</mat-icon>
            <!-- Read receipts for own messages -->
            <mat-icon class="meta-icon receipt" *ngIf="own && !message.isDeleted"
                      [matTooltip]="'Delivered'">done_all</mat-icon>
          </div>
        </div>
      </div>

      <!-- Context menu trigger (own messages only) -->
      <button *ngIf="own && !message.isDeleted" mat-icon-button class="msg-actions"
              [matMenuTriggerFor]="msgMenu" [id]="'msg-menu-' + message.id">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #msgMenu="matMenu">
        <button mat-menu-item (click)="reply.emit(message)" id="btn-reply-msg">
          <mat-icon>reply</mat-icon><span>Reply</span>
        </button>
        <button mat-menu-item (click)="edit.emit(message)" id="btn-edit-msg">
          <mat-icon>edit</mat-icon><span>Edit</span>
        </button>
        <button mat-menu-item (click)="delete.emit(message)" class="delete-item"
                id="btn-delete-msg">
          <mat-icon>delete</mat-icon><span>Delete</span>
        </button>
      </mat-menu>

    </div>
  `,
  styles: [`
    .message-row {
      display: flex; align-items: flex-end; gap: .5rem;
      &.own { flex-direction: row-reverse; }
    }
    .bubble-group { display: flex; flex-direction: column; max-width: 70%;
      &:hover .msg-actions { opacity: 1; }
    }
    .sender-name { font-size: .72rem; font-weight: 600; color: var(--primary);
      margin-bottom: 2px; padding-left: 4px; }
    .reply-preview { display: flex; align-items: center; gap: .25rem;
      padding: .25rem .5rem; border-left: 3px solid var(--primary);
      margin-bottom: 4px; border-radius: 4px; background: var(--primary-light);
      font-size: .78rem; color: var(--text-secondary);
      .reply-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
    .bubble {
      padding: .55rem .85rem; border-radius: 18px;
      background: var(--surface); box-shadow: var(--shadow-sm);
      border-radius: 18px 18px 18px 4px;
      &.own { background: var(--primary); color: white; border-radius: 18px 18px 4px 18px; }
      &.deleted { opacity: .5; font-style: italic; }
    }
    .message-text { margin: 0; line-height: 1.5; word-break: break-word; font-size: .9rem; }
    .message-meta { display: flex; align-items: center; gap: .2rem;
      margin-top: 3px; justify-content: flex-end; }
    .message-time { font-size: .68rem; opacity: .65; }
    .meta-icon { font-size: .78rem; width: .78rem; height: .78rem; opacity: .65; }
    .receipt { opacity: .8; }
    .msg-avatar { flex-shrink: 0; align-self: flex-end; }
    .msg-actions { opacity: 0; transition: opacity .15s;
      width: 28px; height: 28px; line-height: 28px;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; } }
    .delete-item { color: var(--error, #f44336); }
  `]
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input() own = false;
  @Input() showSenderName = true;

  @Output() reply  = new EventEmitter<Message>();
  @Output() edit   = new EventEmitter<Message>();
  @Output() delete = new EventEmitter<Message>();

  formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
