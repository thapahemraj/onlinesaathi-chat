import { Component, EventEmitter, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  isExpanded = false;
  selectedPage: 'messages' | 'settings' = 'messages'; // default page

  @Output() pageChange = new EventEmitter<'messages' | 'settings'>();

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: this.isExpanded }));
  }

  openMessages() {
    this.selectedPage = 'messages';
    this.pageChange.emit('messages');
  }

  openSettings() {
    this.selectedPage = 'settings';
    this.pageChange.emit('settings');
  }
}
