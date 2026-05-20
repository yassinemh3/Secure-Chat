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
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Message, ChatRoom, RoomMember, User } from '../../../core/models/models';
import { ChatService } from '../../../core/services/chat.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSnackBarModule, MessageBubbleComponent, TypingIndicatorComponent
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

  // Members Drawer State
  showMembersSidebar = false;
  members: RoomMember[] = [];
  loadingMembers = false;

  // Member Invite / Add State
  memberSearchQuery = '';
  searchResults: User[] = [];
  searchingUsers = false;
  addingMember = false;
  removingMemberId: string | null = null;

  myRole: 'MEMBER' | 'ADMIN' | 'OWNER' = 'MEMBER';

  private destroy$ = new Subject<void>();
  private typingSubject$ = new Subject<void>();
  private shouldScroll = false;

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private wsService: WebSocketService,
    public authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar
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
    this.searchResults = [];
    this.memberSearchQuery = '';
    this.chatService.getRoom(roomId).subscribe(room => { this.room = room; });
    this.chatService.getMessages(roomId).subscribe(paged => {
      this.messages = [...paged.content].reverse();
      this.loading = false; this.shouldScroll = true;
      this.wsService.subscribeToRoom(roomId);

      if (this.showMembersSidebar) {
        this.loadMembers();
      } else {
        this.members = [];
      }
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

  // ─── Members Sidebar Logic ──────────────────────────────────────────────────

  toggleMembersSidebar(): void {
    this.showMembersSidebar = !this.showMembersSidebar;
    if (this.showMembersSidebar) {
      this.loadMembers();
    }
  }

  loadMembers(): void {
    if (!this.roomId) return;
    this.loadingMembers = true;
    this.chatService.getRoomMembers(this.roomId).subscribe({
      next: (members) => {
        this.members = members;
        const me = members.find(m => m.user.id === this.authService.currentUser()?.id);
        this.myRole = me ? me.role : 'MEMBER';
        this.loadingMembers = false;
      },
      error: () => {
        this.loadingMembers = false;
        this.snackBar.open('Failed to load room members', 'Close', { duration: 3000 });
      }
    });
  }

  onMemberSearchInput(): void {
    const query = this.memberSearchQuery.trim();
    if (!query) {
      this.searchResults = [];
      return;
    }

    this.searchingUsers = true;
    this.userService.search(query).subscribe({
      next: (users) => {
        // Exclude users who are already members
        const memberIds = this.members.map(m => m.user.id);
        this.searchResults = users.filter(u => !memberIds.includes(u.id));
        this.searchingUsers = false;
      },
      error: () => {
        this.searchingUsers = false;
      }
    });
  }

  addMember(user: User): void {
    if (!this.roomId || this.addingMember) return;
    this.addingMember = true;
    this.chatService.addMember(this.roomId, user.id).subscribe({
      next: () => {
        this.addingMember = false;
        this.memberSearchQuery = '';
        this.searchResults = [];
        this.snackBar.open(`${user.displayName} added to the conversation`, 'Close', { duration: 3000 });
        this.loadMembers();

        if (this.room) {
          this.room.memberCount++;
        }
      },
      error: (err) => {
        this.addingMember = false;
        this.snackBar.open(err?.error?.message || 'Failed to add member', 'Close', { duration: 3000 });
      }
    });
  }

  removeMember(memberUserId: string, displayName: string): void {
    if (!this.roomId || this.removingMemberId) return;
    const isSelf = memberUserId === this.authService.currentUser()?.id;
    const actionText = isSelf ? 'Are you sure you want to leave this conversation?' : `Remove ${displayName} from this conversation?`;

    if (!confirm(actionText)) return;

    this.removingMemberId = memberUserId;
    this.chatService.removeMember(this.roomId, memberUserId).subscribe({
      next: () => {
        this.removingMemberId = null;
        this.snackBar.open(isSelf ? 'You left the conversation' : `${displayName} removed`, 'Close', { duration: 3000 });

        if (isSelf) {
          this.showMembersSidebar = false;
          window.location.reload();
        } else {
          this.loadMembers();
          if (this.room) {
            this.room.memberCount--;
          }
        }
      },
      error: (err) => {
        this.removingMemberId = null;
        this.snackBar.open(err?.error?.message || 'Failed to remove member', 'Close', { duration: 3000 });
      }
    });
  }

  isCurrentUserAdminOrOwner(): boolean {
    return this.myRole === 'ADMIN' || this.myRole === 'OWNER';
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.authService.currentUser()?.id;
  }
}

