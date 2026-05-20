import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { ChatRoom, Message, PagedResponse, SendMessageRequest, RoomMember } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly roomsUrl = `${environment.apiUrl}/rooms`;
  private readonly msgUrl   = `${environment.apiUrl}`;
  readonly roomsChanged$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  // ─── Rooms ─────────────────────────────────────────────────────────────

  createRoom(name: string, type: 'DIRECT' | 'GROUP', memberIds: string[], description?: string): Observable<ChatRoom> {
    return this.http.post<ChatRoom>(this.roomsUrl, { name, description, type, memberIds });
  }

  getMyRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(this.roomsUrl);
  }

  getRoom(id: string): Observable<ChatRoom> {
    return this.http.get<ChatRoom>(`${this.roomsUrl}/${id}`);
  }

  getRoomMembers(roomId: string): Observable<RoomMember[]> {
    return this.http.get<RoomMember[]>(`${this.roomsUrl}/${roomId}/members`);
  }

  addMember(roomId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.roomsUrl}/${roomId}/members`, null, {
      params: { userId }
    });
  }

  removeMember(roomId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.roomsUrl}/${roomId}/members/${userId}`);
  }

  // ─── Messages ────────────────────────────────────────────────────────────

  getMessages(roomId: string, page = 0, size = 50): Observable<PagedResponse<Message>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Message>>(`${this.roomsUrl}/${roomId}/messages`, { params });
  }

  searchMessages(query: string, page = 0, size = 20): Observable<PagedResponse<Message>> {
    const params = new HttpParams().set('q', query).set('page', page).set('size', size);
    return this.http.get<PagedResponse<Message>>(`${this.msgUrl}/messages/search`, { params });
  }

  editMessage(messageId: string, content: string): Observable<Message> {
    return this.http.put<Message>(`${this.msgUrl}/messages/${messageId}`, null, {
      params: { content }
    });
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.msgUrl}/messages/${messageId}`);
  }

  deleteRoom(roomId: string): Observable<void> {
    return this.http.delete<void>(`${this.roomsUrl}/${roomId}`);
  }
}
