import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/api/auth/login`, { username, password })
      .pipe(map(user => {
        // Store user details and jwt token in local storage
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }));
  }

  register(user: any) {
    return this.http.post(`${environment.apiUrl}/api/auth/register`, user);
  }

  logout() {
    // Remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.currentUserValue?.token;
    return !this.jwtHelper.isTokenExpired(token);
  }

  getToken(): string {
    return this.currentUserValue?.token;
  }

  getUserId(): string {
    const token = this.getToken();
    if (!token) return '';
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.nameid;
  }

  getUserRole(): string {
    const token = this.getToken();
    if (!token) return '';
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.role;
  }
}
