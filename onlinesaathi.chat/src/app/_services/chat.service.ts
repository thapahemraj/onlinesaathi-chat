import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: HubConnection;
  private apiUrl = `${environment.apiUrl}/api/chat`;
  private messageReceivedSource = new BehaviorSubject<Message>(null!);
  messageReceived$ = this.messageReceivedSource.asObservable();

  private callOfferSource = new BehaviorSubject<any>(null);
  callOffer$ = this.callOfferSource.asObservable();

  private callAnswerSource = new BehaviorSubject<any>(null);
  callAnswer$ = this.callAnswerSource.asObservable();

  private callRejectSource = new BehaviorSubject<any>(null);
  callReject$ = this.callRejectSource.asObservable();

  private iceCandidateSource = new BehaviorSubject<any>(null);
  iceCandidate$ = this.iceCandidateSource.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chatHub`, {
        accessTokenFactory: () => this.authService.getToken()
      })
      .withAutomaticReconnect()
      .build();

    this.registerOnServerEvents();
  }

  public startConnection = () => {
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  public stopConnection = () => {
    this.hubConnection.stop().catch(err => console.log('Error while stopping connection: ' + err));
  }

  private registerOnServerEvents(): void {
    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      this.messageReceivedSource.next(message);
    });

    this.hubConnection.on('ReceiveCallOffer', (offer: any) => {
      this.callOfferSource.next(offer);
    });

    this.hubConnection.on('ReceiveCallAnswer', (answer: any) => {
      this.callAnswerSource.next(answer);
    });

    this.hubConnection.on('ReceiveCallReject', (rejection: any) => {
      this.callRejectSource.next(rejection);
    });

    this.hubConnection.on('ReceiveIceCandidate', (candidate: any) => {
      this.iceCandidateSource.next(candidate);
    });
  }

  public sendMessage(message: { receiverId: string, content: string }) {
    return this.hubConnection.invoke('SendMessage', message);
  }

  public sendCallOffer(offer: any) {
    return this.hubConnection.invoke('SendCallOffer', offer);
  }

  public sendCallAnswer(answer: any) {
    return this.hubConnection.invoke('SendCallAnswer', answer);
  }

  public sendCallReject(rejection: any) {
    return this.hubConnection.invoke('SendCallReject', rejection);
  }

  public sendIceCandidate(candidate: any) {
    return this.hubConnection.invoke('SendIceCandidate', candidate);
  }

  public joinChat(userId: string) {
    return this.hubConnection.invoke('AddToGroup', userId);
  }

  public leaveChat(userId: string) {
    return this.hubConnection.invoke('RemoveFromGroup', userId);
  }

  // API Calls
  getChatHistory(userId: string) {
    return this.http.get<Message[]>(`${this.apiUrl}/history/${userId}`);
  }

  getConversation(userId1: string, userId2: string) {
    return this.http.get<Message[]>(`${this.apiUrl}/conversation/${userId1}/${userId2}`);
  }

  markAsRead(messageId: string) {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {});
  }

  // Get all active users
  getActiveUsers() {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }
}
