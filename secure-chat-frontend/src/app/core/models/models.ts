// Core models for the Secure-Chat application

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface UserPresence {
  userId: string;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  description?: string;
  type: 'DIRECT' | 'GROUP';
  createdBy: User;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  sender: User;
  content: string;
  contentType: 'TEXT' | 'IMAGE' | 'FILE';
  isEncrypted: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  replyToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface TypingEvent {
  userId: string;
  typing: boolean;
}

export interface SendMessageRequest {
  roomId: string;
  content: string;
  contentType?: 'TEXT' | 'IMAGE' | 'FILE';
  replyToId?: string;
}
