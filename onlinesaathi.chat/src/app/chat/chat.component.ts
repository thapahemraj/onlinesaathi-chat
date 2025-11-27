import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, Message } from '../_services/chat.service';
import { AuthService } from '../_services/auth.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  messageForm: FormGroup;
  currentUserId: string = '';
  selectedUser: any = null;
  users: any[] = [];
  loading = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.messageForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();
    this.loadUsers();
    this.chatService.startConnection();
    
    this.chatService.messageReceived$.subscribe((message: Message) => {
      if ((message.senderId === this.selectedUser?.id || message.receiverId === this.selectedUser?.id) 
          && message.senderId !== this.currentUserId) {
        this.messages.push(message);
        this.scrollToBottom();
      }
    });
  }

  loadUsers() {
    // TODO: Replace with actual user list from your API
    this.users = [
      { id: 'user1', name: 'User 1' },
      { id: 'user2', name: 'User 2' },
      { id: 'user3', name: 'User 3' }
    ];
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.loadChatHistory(user.id);
  }

  loadChatHistory(userId: string) {
    this.loading = true;
    this.chatService.getConversation(this.currentUserId, userId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.scrollToBottom();
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load chat history');
        this.loading = false;
      }
    });
  }

  sendMessage() {
    if (this.messageForm.invalid || !this.selectedUser) {
      return;
    }

    const messageContent = this.messageForm.get('content')?.value;
    const message: Message = {
      id: '',
      senderId: this.currentUserId,
      senderName: this.authService.currentUserValue?.username || 'You',
      receiverId: this.selectedUser.id,
      content: messageContent,
      timestamp: new Date(),
      isRead: false
    };

    this.chatService.sendMessage({
      receiverId: this.selectedUser.id,
      content: messageContent
    }).then(() => {
      this.messages.push(message);
      this.messageForm.reset();
      this.scrollToBottom();
    }).catch(error => {
      this.toastr.error('Failed to send message');
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy() {
    this.chatService.stopConnection();
  }
}
