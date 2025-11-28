import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoCallService } from '../_services/video-call.service';
import { ChatService } from '../_services/chat.service';
import { AuthService } from '../_services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @Input() selectedUser: any;
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  callState = 'idle';
  audioEnabled = true;
  videoEnabled = true;

  get localStream$() { return this.videoCallService.localStream$; }
  get remoteStream$() { return this.videoCallService.remoteStream$; }
  get incomingCall$() { return this.videoCallService.incomingCall$; }

  private destroy$ = new Subject<void>();
  private currentUserId: string = '';

  constructor(
    private videoCallService: VideoCallService,
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUserId = this.authService.getUserId();

    this.videoCallService.callState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.callState = state;
      });

    this.localStream$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stream => {
        if (stream && this.localVideo) {
          this.localVideo.nativeElement.srcObject = stream;
        }
      });

    this.remoteStream$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stream => {
        if (stream && this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = stream;
        }
      });
  }

  async initiateCall() {
    try {
      // Get local stream
      await this.videoCallService.getLocalStream();
      this.videoCallService.setCallState('calling');

      // Create offer
      const offer = await this.videoCallService.createOffer();

      // Send offer via SignalR
      await this.chatService.sendCallOffer({
        from: this.currentUserId,
        to: this.selectedUser.id,
        sdp: offer
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to start call: ' + error);
    }
  }

  async acceptCall(call: any) {
    try {
      // Get local stream
      await this.videoCallService.getLocalStream();
      this.videoCallService.setCallState('connected');

      // Create answer
      const answer = await this.videoCallService.handleOffer(call.sdp);

      // Send answer via SignalR
      await this.chatService.sendCallAnswer({
        from: this.currentUserId,
        to: call.from,
        sdp: answer
      });

      // Clear incoming call
      this.videoCallService.setIncomingCall(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to accept call: ' + error);
    }
  }

  async rejectCall(call: any) {
    await this.chatService.sendCallReject({
      from: this.currentUserId,
      to: call.from
    });
    this.videoCallService.setIncomingCall(null);
  }

  async toggleAudio() {
    const stream = this.localVideo?.nativeElement.srcObject as MediaStream;
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      this.audioEnabled = !this.audioEnabled;
    }
  }

  async toggleVideo() {
    const stream = this.localVideo?.nativeElement.srcObject as MediaStream;
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      this.videoEnabled = !this.videoEnabled;
    }
  }

  endCall() {
    this.videoCallService.endCall();
    this.videoCallService.stopLocalStream();
    this.videoCallService.setCallState('idle');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.videoCallService.stopLocalStream();
    this.videoCallService.endCall();
  }
}
