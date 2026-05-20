import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Animated typing indicator.
 * Shows 3 bouncing dots with a "{n} people are typing…" label.
 *
 * Usage:
 *   <app-typing-indicator *ngIf="typingCount > 0" [count]="typingCount">
 *   </app-typing-indicator>
 */
@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="typing-indicator" *ngIf="count > 0" aria-label="Someone is typing">
      <div class="dots">
        <span></span><span></span><span></span>
      </div>
      <span class="label">
        {{ count === 1 ? 'Someone is typing' : count + ' people are typing' }}…
      </span>
    </div>
  `,
  styles: [`
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .35rem .75rem;
      border-radius: 18px;
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      width: fit-content;
      margin: .25rem 0;
    }
    .dots {
      display: flex;
      gap: 3px;
      align-items: center;
      span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--text-secondary);
        animation: typing-bounce 1.2s infinite ease-in-out;
        &:nth-child(2) { animation-delay: .2s; }
        &:nth-child(3) { animation-delay: .4s; }
      }
    }
    @keyframes typing-bounce {
      0%, 80%, 100% { transform: scale(.7); opacity: .4; }
      40%           { transform: scale(1.1); opacity: 1; }
    }
    .label {
      font-size: .8rem;
      color: var(--text-secondary);
      font-style: italic;
    }
  `]
})
export class TypingIndicatorComponent {
  /** Number of users currently typing in this room */
  @Input() count = 0;
}
