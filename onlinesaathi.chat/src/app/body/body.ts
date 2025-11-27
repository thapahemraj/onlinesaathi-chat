import { Component } from '@angular/core';
import { BodyHeader } from './body-header/body-header';
import { NoChat } from './no-chat/no-chat';
import { NgIf } from '@angular/common'; 

@Component({
  selector: 'app-body',
  standalone: true,
  imports: [BodyHeader, NoChat, NgIf],
  templateUrl: './body.html',
  styleUrls: ['./body.css'],
})
export class Body {
  showChat: boolean = true; 

  toggleChat() {
    this.showChat = !this.showChat;
  }
}
