import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  payload: string;   // raw JSON string — parse on demand
  isRead: boolean;
  createdAt: string;
}

/**
 * Manages in-app notifications: fetches from REST API and merges
 * with real-time pushes arriving over the WebSocket.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  /** Emits each time a new live notification arrives via WebSocket */
  readonly live$ = new Subject<AppNotification>();

  constructor(private http: HttpClient) {}

  // ─── REST ─────────────────────────────────────────────────────────────────

  getUnread(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(this.apiUrl);
  }

  markRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/read-all`, {});
  }

  // ─── WebSocket push ───────────────────────────────────────────────────────

  /**
   * Called by WebSocketService when a notification frame arrives on
   * /user/queue/notifications.  Components subscribe to live$ to react.
   */
  push(notification: AppNotification): void {
    this.live$.next(notification);
  }
}
