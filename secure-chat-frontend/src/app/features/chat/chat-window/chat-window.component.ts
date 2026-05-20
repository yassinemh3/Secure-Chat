import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Message, ChatRoom } from '../../../core/models/models';
import { ChatService } from '../../../core/services/chat.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
    MessageBubbleComponent, TypingIndicatorComponent
  ],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: Message[] = [];
  room: ChatRoom | null = null;
  roomId: string | null = null;
  messageContent = '';
  loading = false;
  sending = false;
  replyTo: Message | null = null;
  editingMessage: Message | null = null;
  typingUsers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  private destroy$ = new Subject<void>();
  private typingSubject$ = new Subject<void>();
  private shouldScroll = false;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private wsService: WebSocketService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('roomId');
      if (id && id !== this.roomId) {
        if (this.roomId) this.wsService.unsubscribeFromRoom(this.roomId);
        this.roomId = id;
        this.loadRoom(id);
      }
    });

    this.typingSubject$.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { if (this.roomId) this.wsService.sendTyping(this.roomId, false); });

    this.wsService.messages$.pipe(takeUntil(this.destroy$)).subscribe(msg => {
      if (msg.roomId === this.roomId) { this.messages.push(msg); this.shouldScroll = true; }
    });

    this.wsService.typing$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event.roomId !== this.roomId) return;
      if (event.userId === this.authService.currentUser()?.id) return;
      if (event.typing) {
        const timer = setTimeout(() => this.typingUsers.delete(event.userId), 3000);
        this.typingUsers.set(event.userId, timer);
      } else {
        const existing = this.typingUsers.get(event.userId);
        if (existing) clearTimeout(existing);
        this.typingUsers.delete(event.userId);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  ngOnDestroy(): void {
    if (this.roomId) this.wsService.unsubscribeFromRoom(this.roomId);
    this.destroy$.next(); this.destroy$.complete();
  }

  loadRoom(roomId: string): void {
    this.loading = true; this.messages = [];
    this.chatService.getRoom(roomId).subscribe(room => { this.room = room; });
    this.chatService.getMessages(roomId).subscribe(paged => {
      this.messages = [...paged.content].reverse();
      this.loading = false; this.shouldScroll = true;
      this.wsService.subscribeToRoom(roomId);
    });
  }

  sendMessage(): void {
    if (!this.messageContent.trim() || !this.roomId || this.sending) return;
    const content = this.messageContent.trim();

    if (this.editingMessage) {
      // Edit existing message
      this.chatService.editMessage(this.editingMessage.id, content)
        .subscribe(updated => {
          const idx = this.messages.findIndex(m => m.id === updated.id);
          if (idx !== -1) this.messages[idx] = updated;
        });
      this.editingMessage = null;
    } else {
      // Send new message via WebSocket
      this.wsService.sendMessage(this.roomId!, content, this.replyTo?.id);
      this.replyTo = null;
    }
    this.messageContent = '';
    this.wsService.sendTyping(this.roomId!, false);
  }

  onTyping(): void {
    if (this.roomId && this.messageContent) {
      this.wsService.sendTyping(this.roomId, true);
      this.typingSubject$.next();
    }
  }

  onReply(msg: Message): void  { this.replyTo = msg; this.editingMessage = null; }
  onEdit(msg: Message): void   { this.editingMessage = msg; this.messageContent = msg.content; this.replyTo = null; }
  cancelEdit(): void           { this.editingMessage = null; this.messageContent = ''; }
  cancelReply(): void          { this.replyTo = null; }

  onDelete(msg: Message): void {
    if (!confirm('Delete this message?')) return;
    this.chatService.deleteMessage(msg.id).subscribe(() => {
      const idx = this.messages.findIndex(m => m.id === msg.id);
      if (idx !== -1) this.messages[idx] = { ...msg, isDeleted: true };
    });
  }

  isOwnMessage(msg: Message): boolean {
    return msg.sender.id === this.authService.currentUser()?.id;
  }

  get typingCount(): number { return this.typingUsers.size; }

  private scrollToBottom(): void {
    try { this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight; } catch {}
  }

  trackMsg(_: number, msg: Message): string { return msg.id; }
}
