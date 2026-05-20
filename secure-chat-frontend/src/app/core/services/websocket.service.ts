import { Injectable, OnDestroy } from '@angular/core';
import { Client, Message as StompMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { Message, TypingEvent, UserPresence } from '../models/models';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

/**
 * WebSocket service using STOMP over SockJS.
 * Manages connection lifecycle, subscriptions, and message dispatch.
 *
 * On connect, automatically subscribes to:
 *  - /topic/presence              → global presence updates
 *  - /user/queue/notifications    → personal notifications
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  // Public observables
  readonly messages$   = new Subject<Message>();
  readonly typing$     = new Subject<TypingEvent & { roomId: string }>();
  readonly presence$   = new Subject<UserPresence>();
  readonly connected$  = new BehaviorSubject<boolean>(false);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  /** Establish STOMP over SockJS connection with JWT auth header */
  connect(): void {
    if (this.client?.connected) return;

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      debug: (msg) => { if (!environment.production) console.log('[STOMP]', msg); },

      onConnect: () => {
        this.connected$.next(true);
        this.subscribeToPresence();
        this.subscribeToNotifications();
      },

      onDisconnect: () => {
        this.connected$.next(false);
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected$.next(false);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.connected$.next(false);
  }

  /** Subscribe to messages and typing events for a specific room */
  subscribeToRoom(roomId: string): void {
    if (!this.client?.connected) return;

    const msgKey = `msg-${roomId}`;
    if (!this.subscriptions.has(msgKey)) {
      const sub = this.client.subscribe(`/topic/room.${roomId}`, (frame: StompMessage) => {
        const msg: Message = JSON.parse(frame.body);
        this.messages$.next(msg);
      });
      this.subscriptions.set(msgKey, sub);
    }

    const typKey = `typ-${roomId}`;
    if (!this.subscriptions.has(typKey)) {
      const sub = this.client.subscribe(`/topic/room.${roomId}.typing`, (frame: StompMessage) => {
        const event: TypingEvent = JSON.parse(frame.body);
        this.typing$.next({ ...event, roomId });
      });
      this.subscriptions.set(typKey, sub);
    }
  }

  unsubscribeFromRoom(roomId: string): void {
    [`msg-${roomId}`, `typ-${roomId}`].forEach(key => {
      this.subscriptions.get(key)?.unsubscribe();
      this.subscriptions.delete(key);
    });
  }

  /** Send a chat message via STOMP */
  sendMessage(roomId: string, content: string, replyToId?: string): void {
    this.client?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ roomId, content, contentType: 'TEXT', replyToId })
    });
  }

  /** Send typing indicator */
  sendTyping(roomId: string, typing: boolean): void {
    this.client?.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ roomId, typing })
    });
  }

  private subscribeToPresence(): void {
    this.client?.subscribe('/topic/presence', (frame: StompMessage) => {
      const presence: UserPresence = JSON.parse(frame.body);
      this.presence$.next(presence);
    });
  }

  private subscribeToNotifications(): void {
    this.client?.subscribe('/user/queue/notifications', (frame: StompMessage) => {
      try {
        const notification = JSON.parse(frame.body);
        this.notificationService.push(notification);
      } catch (e) {
        console.warn('Failed to parse notification frame:', e);
      }
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
