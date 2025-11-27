import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

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

  constructor(private http: HttpClient) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chatHub`)
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
  }

  public sendMessage(message: { receiverId: string, content: string }) {
    return this.hubConnection.invoke('SendMessage', message);
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
}
