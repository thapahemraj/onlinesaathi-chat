import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CallOffer {
  from: string;
  to: string;
  sdp: string;
}

export interface CallAnswer {
  from: string;
  to: string;
  sdp: string;
}

export interface IceCandidate {
  from: string;
  to: string;
  candidate: RTCIceCandidate;
}

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private callStateSubject = new BehaviorSubject<string>('idle'); // idle, calling, connected, ended
  callState$ = this.callStateSubject.asObservable();

  private incomingCallSubject = new BehaviorSubject<any>(null);
  incomingCall$ = this.incomingCallSubject.asObservable();

  private localStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  localStream$ = this.localStreamSubject.asObservable();

  private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  remoteStream$ = this.remoteStreamSubject.asObservable();

  private iceServers = [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] }
  ];

  constructor() {}

  // Get local media stream (audio + video)
  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      this.localStreamSubject.next(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Initialize peer connection
  async initPeerConnection(): Promise<RTCPeerConnection> {
    if (this.peerConnection) {
      return this.peerConnection;
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Add local stream tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        this.remoteStreamSubject.next(this.remoteStream);
      }
      this.remoteStream!.addTrack(event.track);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'unknown';
      console.log('Connection state:', state);
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.endCall();
      }
    };

    return this.peerConnection;
  }

  // Create and return SDP offer
  async createOffer(): Promise<string> {
    const pc = await this.initPeerConnection();
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await pc.setLocalDescription(offer);
    return JSON.stringify(offer);
  }

  // Convenience to start a call: ensure local stream, set state and create offer
  async initiateCall(): Promise<string> {
    await this.getLocalStream();
    this.setCallState('calling');
    const offer = await this.createOffer();
    return offer;
  }

  // Handle incoming offer
  async handleOffer(offerSdp: string): Promise<string> {
    try {
      const pc = await this.initPeerConnection();
      const offer = JSON.parse(offerSdp);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return JSON.stringify(answer);
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  // Handle incoming answer
  async handleAnswer(answerSdp: string): Promise<void> {
    try {
      const pc = this.peerConnection;
      if (!pc) throw new Error('Peer connection not initialized');
      
      const answer = JSON.parse(answerSdp);
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  // Add ICE candidate
  async addIceCandidate(candidateData: any): Promise<void> {
    try {
      const pc = this.peerConnection;
      if (!pc) throw new Error('Peer connection not initialized');
      
      const candidate = new RTCIceCandidate(candidateData);
      await pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  // Get ICE candidates
  getIceCandidates(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  // End call
  endCall(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.remoteStreamSubject.next(null);
    this.callStateSubject.next('ended');
  }

  // Stop local stream
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.localStreamSubject.next(null);
    }
  }

  // Set call state
  setCallState(state: string): void {
    this.callStateSubject.next(state);
  }

  // Set incoming call
  setIncomingCall(call: any): void {
    this.incomingCallSubject.next(call);
  }
}
