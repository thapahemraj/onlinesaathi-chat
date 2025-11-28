import { Component, ElementRef, Renderer2, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- add this
import { Navbar } from './navbar/navbar';
import { Chats } from './chats/chats';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Body } from './body/body';
import { AuthService } from './_services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Navbar, Chats, RouterOutlet, Header, Body], // <-- add CommonModule here
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements AfterViewInit {
  currentPage: 'messages' | 'settings' = 'messages'; // default page
  isSidebarExpanded = false;
  private isResizing = false;
  private startX = 0;
  private startWidth = 480;
  isAuthenticated$: Observable<boolean>;

  constructor(private el: ElementRef, private renderer: Renderer2, private authService: AuthService) {
    this.isAuthenticated$ = this.authService.currentUser.pipe(
      map(user => user && this.authService.isAuthenticated())
    );
    window.addEventListener('sidebarToggle', (e: any) => {
      this.isSidebarExpanded = e.detail;
      document.documentElement.style.setProperty(
        '--sidebar-width',
        this.isSidebarExpanded ? '250px' : '60px'
      );
    });
  }

  ngAfterViewInit() {
    // Only initialize resize handle if app-chats element exists (i.e., user is authenticated)
    try {
      const chatPanel: HTMLElement | null = this.el.nativeElement.querySelector('app-chats');
      if (!chatPanel) return;

      const handle = this.renderer.createElement('div');
      this.renderer.addClass(handle, 'resize-handle');
      this.renderer.appendChild(chatPanel, handle);

      this.renderer.listen(handle, 'mousedown', (e: MouseEvent) => {
        this.isResizing = true;
        this.startX = e.clientX;
        this.startWidth = chatPanel.offsetWidth;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
      });

      this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
        if (!this.isResizing) return;
        const newWidth = Math.max(300, Math.min(700, this.startWidth + (e.clientX - this.startX)));
        this.renderer.setStyle(chatPanel, 'width', `${newWidth}px`);
      });

      this.renderer.listen('document', 'mouseup', () => {
        if (this.isResizing) {
          this.isResizing = false;
          document.body.style.cursor = 'default';
          document.body.style.userSelect = 'auto';
        }
      });
    } catch (error) {
      console.error('Error initializing resize handle:', error);
    }
  }

  onPageChange(page: 'messages' | 'settings') {
    this.currentPage = page;
  }
}
