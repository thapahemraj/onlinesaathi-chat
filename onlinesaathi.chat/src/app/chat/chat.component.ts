import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService, Message } from '../_services/chat.service';
import { AuthService } from '../_services/auth.service';
import { VideoCallService } from '../_services/video-call.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';

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
  currentUserName: string = '';
  selectedUser: any = null;
  users: any[] = [];
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private videoCallService: VideoCallService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.messageForm = this.fb.group({
      content: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();
    this.currentUserName = this.authService.currentUserValue?.username || 'User';
    
    // Check authentication
    if (!this.currentUserId) {
      this.router.navigate(['/login']);
      return;
    }

    this.chatService.startConnection();
    
    this.chatService.messageReceived$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: Message) => {
        if (message && this.selectedUser) {
          if ((message.senderId === this.selectedUser?.id || message.receiverId === this.selectedUser?.id)) {
            this.messages.push(message);
            this.scrollToBottom();
          }
        }
      });

    // Listen for incoming call offers
    this.chatService.callOffer$
      .pipe(takeUntil(this.destroy$))
      .subscribe((offer: any) => {
        if (offer) {
          this.videoCallService.setIncomingCall(offer);
          this.toastr.info(`${offer.fromName} is calling...`);
        }
      });

    // Listen for call answers
    this.chatService.callAnswer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (answer: any) => {
        if (answer) {
          try {
            await this.videoCallService.handleAnswer(answer.sdp);
            this.videoCallService.setCallState('connected');
          } catch (error) {
            this.toastr.error('Failed to handle call answer');
          }
        }
      });

    // Listen for call rejections
    this.chatService.callReject$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rejection: any) => {
        if (rejection) {
          this.videoCallService.setCallState('idle');
          this.toastr.warning('Call rejected');
        }
      });

    // Listen for ICE candidates
    this.chatService.iceCandidate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (candidate: any) => {
        if (candidate) {
          try {
            await this.videoCallService.addIceCandidate(candidate.candidate);
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
      });
    
    // Join the user's chat group
    this.chatService.joinChat(this.currentUserId).catch(err => {
      console.error('Error joining chat group:', err);
    });
    
    this.loadUsers();
  }

  loadUsers() {
    // Get active users from API
    this.chatService.getActiveUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          // Filter out current user
          this.users = users.filter((u: any) => u.id !== this.currentUserId);
        },
        error: (error) => {
          // Fallback to mock data if API fails
          this.users = [
            { id: 'user1', name: 'John Doe' },
            { id: 'user2', name: 'Jane Smith' },
            { id: 'user3', name: 'Bob Johnson' }
          ];
        }
      });
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.messages = [];
    this.loadChatHistory(user.id);
  }

  loadChatHistory(userId: string) {
    this.loading = true;
    this.chatService.getConversation(this.currentUserId, userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
      senderName: this.currentUserName,
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
      this.toastr.error('Failed to send message: ' + error);
    });
  }

  async startVideoCall() {
    if (!this.selectedUser) {
      this.toastr.warning('Please select a user first');
      return;
    }

    try {
      this.toastr.info('Starting video call...');
      // Prepare local media and create an SDP offer
      const offer = await this.videoCallService.initiateCall();

      // Send offer to the selected user through SignalR
      await this.chatService.sendCallOffer({
        from: this.currentUserId,
        to: this.selectedUser.id,
        sdp: offer
      });

      // Route to video call component
      this.router.navigate(['/video-call'], {
        queryParams: { userId: this.selectedUser.id, userName: this.selectedUser.name }
      });
    } catch (error) {
      this.toastr.error('Failed to start video call: ' + error);
    }
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
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.stopConnection();
  }
}
