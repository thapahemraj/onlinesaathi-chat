import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './_services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <a class="navbar-brand" href="#">OnlineSaathi Chat</a>
          <button class="navbar-toggler" type="button" (click)="isNavCollapsed = !isNavCollapsed">
            <span class="navbar-toggler-icon"></span>
          </button>
          
          <div class="collapse navbar-collapse" [ngbCollapse]="isNavCollapsed">
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a class="nav-link" [routerLink]="['/chat']" routerLinkActive="active">Chat</a>
              </li>
            </ul>
            
            <div class="d-flex" *ngIf="authService.isAuthenticated()">
              <span class="navbar-text me-3">Welcome, {{ authService.currentUserValue?.username }}</span>
              <button class="btn btn-outline-light" (click)="logout()">Logout</button>
            </div>
          </div>
        </div>
      </nav>
      
      <div class="container mt-4">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .navbar {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .container {
      flex: 1;
    }
  `],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AppComponent implements OnInit {
  isNavCollapsed = true;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check if user is logged in on app initialization
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
