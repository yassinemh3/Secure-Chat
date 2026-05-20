import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  search(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search`, { params: { q: query } });
  }

  updateProfile(displayName?: string, avatarUrl?: string): Observable<User> {
    const params: Record<string, string> = {};
    if (displayName) params['displayName'] = displayName;
    if (avatarUrl)   params['avatarUrl']   = avatarUrl;
    return this.http.put<User>(`${this.apiUrl}/me`, null, { params });
  }
}
