import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models/models';
import { environment } from '../../../environments/environment';

/**
 * Manages authentication state: login, register, token refresh, and logout.
 * Access tokens are stored in memory (not localStorage) to prevent XSS.
 * Refresh tokens arrive as HttpOnly cookies (set by server).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // In-memory token store (not localStorage)
  private _accessToken: string | null = null;
  private _tokenExpiry: number = 0;

  // Reactive current user signal
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  register(username: string, email: string, password: string, displayName?: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      username, email, password, displayName
    }).pipe(tap(res => this.handleAuthResponse(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap(res => this.handleAuthResponse(res)));
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} });
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(tap(res => this.handleAuthResponse(res)));
  }

  getAccessToken(): string | null {
    return this._accessToken;
  }

  isTokenExpired(): boolean {
    return Date.now() >= this._tokenExpiry;
  }

  private handleAuthResponse(res: AuthResponse): void {
    this._accessToken = res.accessToken;
    this._tokenExpiry = Date.now() + (res.expiresIn * 1000);
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
    this.scheduleRefresh(res.expiresIn);
  }

  /** Auto-refresh the access token 60s before expiry */
  private scheduleRefresh(expiresInSeconds: number): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const delay = Math.max((expiresInSeconds - 60) * 1000, 0);
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        error: () => this.logout()
      });
    }, delay);
  }

  private clearAuth(): void {
    this._accessToken = null;
    this._tokenExpiry = 0;
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }
}
