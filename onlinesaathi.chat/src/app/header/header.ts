import { Component, HostListener } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header {
  dropdownOpen = false;
  isActive = true;

  isDarkMode = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  setStatus(active: boolean) {
    this.isActive = active;
    this.dropdownOpen = false;
  }

  toggleThemeIcon() {
    this.isDarkMode = !this.isDarkMode;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-dropdown')) {
      this.dropdownOpen = false;
    }
  }
}
