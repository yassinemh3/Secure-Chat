import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable avatar component.
 * Displays a user's avatar image if available, otherwise shows coloured
 * initials generated deterministically from the display name.
 *
 * Usage:
 *   <app-avatar [name]="user.displayName" [avatarUrl]="user.avatarUrl" size="40"></app-avatar>
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [style.width.px]="size" [style.height.px]="size"
         [style.fontSize.px]="size * 0.38" [style.background]="bg"
         [attr.title]="name">
      <img *ngIf="avatarUrl; else initials" [src]="avatarUrl" [alt]="name"
           class="avatar-img" (error)="onImgError()">
      <ng-template #initials>
        <span class="avatar-text">{{ letters }}</span>
      </ng-template>

      <!-- Optional presence dot -->
      <span *ngIf="presence" class="presence-dot"
            [class.online]="presence === 'ONLINE'"
            [class.away]="presence === 'AWAY'"
            [style.width.px]="size * 0.28"
            [style.height.px]="size * 0.28">
      </span>
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      overflow: visible;
      font-weight: 700;
      color: #fff;
      user-select: none;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }
    .avatar-text { line-height: 1; }
    .presence-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      border-radius: 50%;
      background: var(--text-disabled);
      border: 2px solid var(--sidebar-bg, var(--surface));
      transition: background .3s;
      &.online { background: #4caf50; }
      &.away   { background: #ff9800; }
    }
  `]
})
export class AvatarComponent implements OnChanges {
  @Input() name     = '';
  @Input() avatarUrl?: string | null;
  @Input() size     = 40;
  @Input() presence?: 'ONLINE' | 'OFFLINE' | 'AWAY' | null;

  letters = '';
  bg      = '#6c63ff';
  imgFailed = false;

  /** Palette of 10 harmonious colours for initials backgrounds */
  private static readonly PALETTE = [
    '#6c63ff', '#e91e8c', '#00b4d8', '#06d6a0',
    '#f77f00', '#9b5de5', '#f72585', '#4cc9f0',
    '#43aa8b', '#e63946'
  ];

  ngOnChanges(): void {
    this.imgFailed = false;
    this.letters = this.buildInitials(this.name);
    this.bg      = this.pickColor(this.name);
  }

  onImgError(): void {
    this.imgFailed = true;
    this.avatarUrl = null;
  }

  private buildInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  private pickColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AvatarComponent.PALETTE[Math.abs(hash) % AvatarComponent.PALETTE.length];
  }
}
