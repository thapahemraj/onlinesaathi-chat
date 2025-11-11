import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { CommonModule } from '@angular/common'; // <-- import this
import { UserDetail } from '../user-detail/user-detail';

@Component({
  selector: 'app-body-header',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, UserDetail], // <-- add CommonModule here
  templateUrl: './body-header.html',
  styleUrls: ['./body-header.css'],
})
export class BodyHeader {
  @Output() closeChat = new EventEmitter<void>();

  showFileMenu = false;
  selectedFileName = ''; // <-- added

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('mediaInput') mediaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;

  onClose() {
    this.closeChat.emit();
  }

  toggleFileMenu() {
    this.showFileMenu = !this.showFileMenu;
  }

  selectDocument() {
    this.showFileMenu = false;
    this.fileInput.nativeElement.click();
  }

  selectMedia() {
    this.showFileMenu = false;
    this.mediaInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFileName = target.files[0].name; // show in input
    }
  }

  onMediaSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFileName = target.files[0].name; // show in input
    }
  }
}
