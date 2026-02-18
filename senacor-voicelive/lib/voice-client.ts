/**
 * Azure Voice Live Client with oneTimeToken Authentication
 * 
 * Flow:
 * 1. Client receives oneTimeToken from On-Prem System (e.g., after login)
 * 2. Client connects to Backend WebSocket
 * 3. Sends oneTimeToken in first message
 * 4. Backend exchanges token for Bearer Token (stays in backend!)
 * 5. Backend creates Azure Voice Live Session
 * 6. Audio streaming begins
 */

interface SessionInfo {
    sessionId: string;
    userName?: string;
}

export class AuthenticatedVoiceClient {
    private backendUrl: string;
    private ws: WebSocket | null = null;
    private isAuthenticated: boolean = false;
    private audioContext: AudioContext | null = null;
    private audioWorklet: AudioWorkletNode | null = null;
    private sessionId: string | null = null;
    private userName: string | null = null;
    
    // Event callbacks
    private _onTextReceived?: (text: string) => void;
    private _onUserTranscript?: (text: string) => void;
    private _onApiResponse?: (endpoint: string, data: any) => void;
    private _onConnected?: () => void;
    private _onSpeechStopped?: () => void;
    private _onAudioPlaybackStarted?: () => void;
    private _onSessionReady?: (hasAvatar: boolean) => void;
    private _onVideoConnected?: () => void;
    private _onVideoPlaybackStarted?: () => void;
    private _onResponseDone?: () => void;
    private _onAudioTranscriptDone?: (transcript: string) => void;
    private _onFunctionCall?: (functionName: string, args: any, callId: string) => void;
    private _onError?: (error: string) => void;
    
    // Video/Avatar element
    private videoElement: HTMLVideoElement | null = null;
    
    // Recording state
    private isRecording: boolean = true;
    
    // WebRTC for Avatar
    private peerConnection: RTCPeerConnection | null = null;
    private avatarEnabled: boolean = false;
    
    // Audio playback queue (for non-avatar mode)
    private audioQueue: Float32Array[] = [];
    private isPlayingAudio: boolean = false;
    private nextPlayTime: number = 0;

    constructor(backendUrl: string) {
        this.backendUrl = backendUrl;
    }

    /**
     * Connect to backend and authenticate
     * 
     * @param oneTimeToken - Token from On-Prem System
     */
    async connect(oneTimeToken: string): Promise<SessionInfo> {
        return new Promise((resolve, reject) => {
            console.log('Connecting to backend...');
            
            // WebSocket connection to backend
            this.ws = new WebSocket(`${this.backendUrl}/ws/voice`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected, authenticating...');
                this._onConnected?.();
                
                // First message: Authentication with oneTimeToken
                this.ws!.send(JSON.stringify({
                    type: 'auth.init',
                    oneTimeToken: oneTimeToken
                }));
            };
            
            this.ws.onmessage = async (event: MessageEvent) => {
                const message = JSON.parse(event.data);
                
                // Handle authentication response
                if (message.type === 'proxy.connected') {
                    this.isAuthenticated = true;
                    this.sessionId = message.session_id;
                    this.userName = message.user?.name || null;
                    
                    console.log('✅ Authenticated successfully!');
                    console.log('Session ID:', this.sessionId);
                    console.log('User:', this.userName);
                    
                    // Setup audio
                    await this._setupAudio();
                    
                    resolve({
                    sessionId: this.sessionId!,
                        userName: this.userName || undefined
                    });
                }
                
                // Handle errors
                else if (message.type === 'error') {
                    console.error('Error:', message.error?.message || message.message);
                    this._onError?.(message.error?.message || message.message);
                    
                    if (!this.isAuthenticated) {
                        reject(new Error(message.error?.message || message.message));
                    }
                }
                
                // Handle audio from Azure (only when NO avatar - avatar uses WebRTC for audio)
                else if (message.type === 'audio.delta') {
                    if (!this.avatarEnabled) {
                        this._onAudioPlaybackStarted?.();
                        await this._playAudio(message.audio);
                    }
                }
                
                // Handle text responses (AI speaking)
                else if (message.type === 'text.delta') {
                    console.log('AI:', message.text);
                    this._onTextReceived?.(message.text);
                }
                
                // Handle user transcript (user speaking)
                else if (message.type === 'user_transcript') {
                    console.log('User:', message.text);
                    this._onUserTranscript?.(message.text);
                }
                
                // Handle session updated (session ready)
                else if (message.type === 'session.updated') {
                    console.log('Session updated:', message);
                    
                    // Extract session from message (backend sends full session object)
                    const session = message.session || message;
                    this.avatarEnabled = session.avatar_enabled || false;
                    
                    console.log('Avatar enabled:', this.avatarEnabled);
                    
                    // If avatar is enabled, start WebRTC connection
                    if (this.avatarEnabled && session.avatar) {
                        console.log('Starting WebRTC for avatar...');
                        this._startWebRTC(session.avatar);
                    }
                    
                    this._onSessionReady?.(this.avatarEnabled);
                }
                
                // Handle speech stopped (turn detection)
                else if (message.type === 'speech.stopped') {
                    console.log('Speech stopped (turn detection)');
                    this._onSpeechStopped?.();
                }
                
                // Handle speech started (user starts speaking - barge-in)
                else if (message.type === 'speech.started') {
                    console.log('Speech started (barge-in - clearing audio queue)');
                    this.clearAudioQueue();
                }
                
                // Handle response done
                else if (message.type === 'response.done') {
                    console.log('Response done');
                    this._onResponseDone?.();
                }
                
                // Handle response started
                else if (message.type === 'response.started') {
                    console.log('Response started');
                }
                
                // Handle audio transcript done
                else if (message.type === 'response.audio_transcript.done') {
                    console.log('Audio transcript done:', message.transcript);
                    this._onAudioTranscriptDone?.(message.transcript || '');
                }
                
                // Handle function call
                else if (message.type === 'function_call') {
                    this._onFunctionCall?.(message.name, message.arguments, message.call_id);
                }
                
                // Handle avatar WebRTC answer
                else if (message.type === 'session.avatar.answer') {
                    console.log('Avatar WebRTC answer received:', message);
                    const serverSdp = message.server_sdp || message.sdp;
                    if (serverSdp) {
                        this._handleWebRTCAnswer(serverSdp);
                    } else {
                        console.error('No SDP in avatar answer!');
                    }
                }
                
                // Handle On-Prem API responses
                else if (message.type === 'onprem.api.response') {
                    console.log('On-Prem API response:', message.endpoint, message.data);
                    this._onApiResponse?.(message.endpoint, message.data);
                }
                
                // Handle On-Prem API errors
                else if (message.type === 'onprem.api.error') {
                    console.error('On-Prem API error:', message.error);
                }
                
                // Log unknown message types
                else {
                    console.log('Unknown message type:', message.type, message);
                }
            };
            
            this.ws.onerror = (error: Event) => {
                console.error('WebSocket error:', error);
                reject(error);
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket closed');
                this.isAuthenticated = false;
                this._cleanup();
            };
        });
    }

    /**
     * Setup Audio Context and Microphone
     */
    private async _setupAudio(): Promise<void> {
        try {
            // Create Audio Context
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000
            });
            
            // Microphone Access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 24000,
                    echoCancellation: true,
                    noiseSuppression: true
                } as any
            });
            
            // Audio Worklet for microphone processing
            await this.audioContext.audioWorklet.addModule('/audio-processor.js');
            this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-processor');
            
            // Microphone → Worklet → Backend
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.audioWorklet);
            
            this.audioWorklet.port.onmessage = (event: MessageEvent) => {
                // Send PCM16 Audio to backend
                this._sendAudio(event.data);
            };
            
            console.log('✅ Audio setup complete');
            
        } catch (error) {
            console.error('Failed to setup audio:', error);
            throw error;
        }
    }

    /**
     * Send Audio to backend
     */
    private _sendAudio(audioData: ArrayBuffer): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated && this.isRecording) {
            // Convert ArrayBuffer to Base64 string
            const base64Audio = this._arrayBufferToBase64(audioData);
            this.ws.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: base64Audio
            }));
        }
    }
    
    /**
     * Helper: ArrayBuffer to Base64
     */
    private _arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Play PCM16 audio from backend (24kHz, mono, 16-bit signed little-endian)
     * Uses a queue to ensure chunks play sequentially without overlap
     */
    private async _playAudio(audioData: string | number[]): Promise<void> {
        if (!this.audioContext) return;
        
        try {
            // Convert base64 to ArrayBuffer
            const buffer = typeof audioData === 'string' 
                ? this._base64ToArrayBuffer(audioData)
                : new Uint8Array(audioData).buffer;
            
            // PCM16 is raw audio - convert to Float32 for Web Audio API
            const pcm16 = new Int16Array(buffer);
            const float32 = new Float32Array(pcm16.length);
            
            // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
            for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768.0;
            }
            
            // Schedule audio to play at the right time (sequential playback)
            const sampleRate = 24000;
            const duration = float32.length / sampleRate;
            const currentTime = this.audioContext.currentTime;
            
            // If this is the first chunk or we've fallen behind, reset the play time
            if (this.nextPlayTime < currentTime) {
                this.nextPlayTime = currentTime;
            }
            
            // Create audio buffer (24kHz mono)
            const audioBuffer = this.audioContext.createBuffer(1, float32.length, sampleRate);
            audioBuffer.getChannelData(0).set(float32);
            
            // Play the audio at the scheduled time
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start(this.nextPlayTime);
            
            // Schedule the next chunk to play after this one ends
            this.nextPlayTime += duration;
            
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
    }
    
    /**
     * Clear audio queue (e.g., when user interrupts)
     */
    clearAudioQueue(): void {
        this.audioQueue = [];
        this.nextPlayTime = 0;
        console.log('Audio queue cleared');
    }

    /**
     * Set the video element for avatar display
     */
    setVideoElement(element: HTMLVideoElement): void {
        this.videoElement = element;
        console.log('Video element set');
    }

    /**
     * Start recording (unmute microphone)
     */
    startRecording(): void {
        this.isRecording = true;
        console.log('Recording started');
    }

    /**
     * Stop recording (mute microphone)
     */
    stopRecording(): void {
        this.isRecording = false;
        console.log('Recording stopped');
    }

    /**
     * Call On-Prem API via backend
     */
    callOnPremApi(endpoint: string, method: string = 'GET', data: any = null): void {
        if (!this.isAuthenticated) {
            console.error('Not authenticated');
            return;
        }
        
        console.log(`Calling On-Prem API: ${method} ${endpoint}`);
        
        this.ws!.send(JSON.stringify({
            type: 'onprem.api.call',
            endpoint: endpoint,
            method: method,
            data: data
        }));
    }

    /**
     * Send function call result back to the agent
     */
    sendFunctionResult(callId: string, result: any): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return;
        }
        
        console.log('Sending function result:', callId, result);
        
        this.ws.send(JSON.stringify({
            type: 'function_call_result',
            call_id: callId,
            result: result
        }));
    }

    /**
     * Send text message
     */
    sendText(text: string): void {
        if (!this.isAuthenticated) {
            console.error('Not authenticated');
            return;
        }
        
        this.ws!.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'text', text: text }]
            }
        }));
    }

    /**
     * Disconnect and cleanup
     */
    disconnect(): void {
        console.log('Disconnecting...');
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        this._cleanup();
    }

    /**
     * Cleanup Audio Resources
     */
    private _cleanup(): void {
        // Close WebRTC connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.audioWorklet) {
            this.audioWorklet.disconnect();
            this.audioWorklet = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.isAuthenticated = false;
        this.sessionId = null;
        this.avatarEnabled = false;
    }

    /**
     * Start WebRTC connection for avatar video/audio
     */
    private async _startWebRTC(avatarConfig: any): Promise<void> {
        try {
            console.log('Avatar config received:', JSON.stringify(avatarConfig, null, 2));
            
            // Build ICE servers from avatar config
            // Azure returns ice_servers as array of {urls: string[], username?: string, credential?: string}
            const iceServers: RTCIceServer[] = [];
            
            if (avatarConfig.ice_servers && Array.isArray(avatarConfig.ice_servers)) {
                for (const server of avatarConfig.ice_servers) {
                    const iceServer: RTCIceServer = {
                        urls: server.urls || []
                    };
                    // Add credentials if provided (for TURN servers)
                    if (server.username) {
                        iceServer.username = server.username;
                    }
                    if (server.credential) {
                        iceServer.credential = server.credential;
                    }
                    iceServers.push(iceServer);
                }
            }
            
            // Also check for top-level username/credential (Azure sometimes provides these separately)
            if (avatarConfig.username && avatarConfig.credential && iceServers.length > 0) {
                // Apply to all servers if not already set
                for (const server of iceServers) {
                    if (!server.username) server.username = avatarConfig.username;
                    if (!server.credential) server.credential = avatarConfig.credential;
                }
            }
            
            console.log('ICE servers configured:', JSON.stringify(iceServers, null, 2));
            
            // Create RTCPeerConnection
            this.peerConnection = new RTCPeerConnection({
                iceServers: iceServers.length > 0 ? iceServers : undefined
            });
            
            // Create a single MediaStream for all tracks
            const avatarStream = new MediaStream();
            let hasVideo = false;
            let hasAudio = false;
            let playStarted = false;
            
            // Handle incoming tracks (video + audio from avatar)
            this.peerConnection.ontrack = (event: RTCTrackEvent) => {
                console.log('WebRTC track received:', event.track.kind, 'readyState:', event.track.readyState);
                
                // Add track to our unified stream
                avatarStream.addTrack(event.track);
                
                if (event.track.kind === 'video') {
                    hasVideo = true;
                    console.log('Video track added to stream');
                }
                
                if (event.track.kind === 'audio') {
                    hasAudio = true;
                    console.log('Audio track added to stream');
                    this._onAudioPlaybackStarted?.();
                }
                
                // Set srcObject once we have at least the video track
                if (this.videoElement && hasVideo && !playStarted) {
                    playStarted = true;
                    console.log('Setting unified stream to video element');
                    this.videoElement.srcObject = avatarStream;
                    
                    // Small delay to ensure tracks are ready
                    setTimeout(() => {
                        if (this.videoElement) {
                            this.videoElement.play().then(() => {
                                console.log('Video playback started successfully');
                                this._onVideoPlaybackStarted?.();
                            }).catch(err => {
                                console.error('Video play error:', err);
                                // Retry once after a short delay
                                setTimeout(() => {
                                    this.videoElement?.play().catch(e => 
                                        console.error('Retry video play failed:', e)
                                    );
                                }, 100);
                            });
                        }
                    }, 50);
                }
            };
            
            // Log ICE connection state changes
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
                if (this.peerConnection?.iceConnectionState === 'connected') {
                    this._onVideoConnected?.();
                }
            };
            
            // Log ICE gathering state
            this.peerConnection.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', this.peerConnection?.iceGatheringState);
            };
            
            // Log signaling state
            this.peerConnection.onsignalingstatechange = () => {
                console.log('Signaling state:', this.peerConnection?.signalingState);
            };
            
            // Log ICE candidates as they're gathered
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('ICE candidate gathered:', event.candidate.candidate.substring(0, 50) + '...');
                } else {
                    console.log('ICE gathering complete (null candidate)');
                }
            };
            
            // Add transceivers for video and audio
            // Use 'recvonly' since we only receive from Azure Avatar, not send
            this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
            this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });
            
            // Create offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            console.log('WebRTC offer created, waiting for ICE gathering...');
            console.log('Local SDP (first 500 chars):', offer.sdp?.substring(0, 500));
            
            // Wait for ICE gathering to complete (or timeout after 5 seconds)
            await this._waitForIceGathering(5000);
            
            // Log final SDP
            const finalSdp = this.peerConnection.localDescription?.sdp || '';
            console.log('Final SDP length:', finalSdp.length);
            console.log('Final SDP has candidates:', finalSdp.includes('a=candidate'));
            
            // IMPORTANT: Azure expects SDP as Base64-encoded JSON with {type, sdp}
            // This matches the Microsoft demo format
            const sdpObject = {
                type: 'offer',
                sdp: finalSdp
            };
            const sdpBase64 = btoa(JSON.stringify(sdpObject));
            console.log('Encoded SDP (Base64 JSON) length:', sdpBase64.length);
            
            // Send offer to backend
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'session.avatar.connect',
                    client_sdp: sdpBase64
                }));
                console.log('WebRTC offer sent to backend (Base64-encoded JSON format)');
            }
            
        } catch (error) {
            console.error('Failed to start WebRTC:', error);
            this._onError?.(`WebRTC error: ${error}`);
        }
    }
    
    /**
     * Wait for ICE gathering to complete or timeout
     */
    private _waitForIceGathering(timeout: number): Promise<void> {
        return new Promise((resolve) => {
            if (!this.peerConnection) {
                resolve();
                return;
            }
            
            if (this.peerConnection.iceGatheringState === 'complete') {
                resolve();
                return;
            }
            
            const timeoutId = setTimeout(() => {
                console.log('ICE gathering timeout, proceeding with current candidates');
                resolve();
            }, timeout);
            
            this.peerConnection.onicegatheringstatechange = () => {
                if (this.peerConnection?.iceGatheringState === 'complete') {
                    clearTimeout(timeoutId);
                    resolve();
                }
            };
        });
    }
    
    /**
     * Handle WebRTC answer from server
     */
    private async _handleWebRTCAnswer(sdpInput: string): Promise<void> {
        try {
            if (!this.peerConnection) {
                console.error('No peer connection for answer');
                return;
            }
            
            console.log('Processing WebRTC answer, input length:', sdpInput.length);
            
            // Try to decode Base64 JSON (Azure's format)
            let sdp = sdpInput;
            try {
                // Check if it looks like Base64 (no whitespace, valid Base64 chars)
                if (/^[A-Za-z0-9+/=]+$/.test(sdpInput) && !sdpInput.includes('v=0')) {
                    const decoded = atob(sdpInput);
                    const parsed = JSON.parse(decoded);
                    console.log('Decoded Base64 SDP JSON:', parsed.type);
                    sdp = parsed.sdp || parsed;
                }
            } catch (e) {
                // Not Base64 encoded, use as-is
                console.log('SDP is not Base64-encoded, using directly');
            }
            
            console.log('Setting remote description, SDP length:', sdp.length);
            
            await this.peerConnection.setRemoteDescription({
                type: 'answer',
                sdp: sdp
            });
            
            console.log('Remote description set successfully');
            
        } catch (error) {
            console.error('Failed to set remote description:', error);
            this._onError?.(`WebRTC answer error: ${error}`);
        }
    }

    /**
     * Helper: Base64 to ArrayBuffer
     */
    private _base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // =========================================================================
    // Event Handlers
    // =========================================================================

    /** Called when WebSocket connection is established */
    onConnected(callback: () => void): void {
        this._onConnected = callback;
    }

    /** Called when AI text is received */
    onTextReceived(callback: (text: string) => void): void {
        this._onTextReceived = callback;
    }

    /** Called when user transcript is received */
    onUserTranscript(callback: (text: string) => void): void {
        this._onUserTranscript = callback;
    }

    /** Called when user stops speaking (turn detection) */
    onSpeechStopped(callback: () => void): void {
        this._onSpeechStopped = callback;
    }

    /** Called when audio playback starts */
    onAudioPlaybackStarted(callback: () => void): void {
        this._onAudioPlaybackStarted = callback;
    }

    /** Called when session is ready (audio + optional avatar) */
    onSessionReady(callback: (hasAvatar: boolean) => void): void {
        this._onSessionReady = callback;
    }

    /** Called when video stream is connected */
    onVideoConnected(callback: () => void): void {
        this._onVideoConnected = callback;
    }

    /** Called when video playback starts */
    onVideoPlaybackStarted(callback: () => void): void {
        this._onVideoPlaybackStarted = callback;
    }

    /** Called when response is done */
    onResponseDone(callback: () => void): void {
        this._onResponseDone = callback;
    }

    /** Called when audio transcript is done */
    onAudioTranscriptDone(callback: (transcript: string) => void): void {
        this._onAudioTranscriptDone = callback;
    }

    /** Called when a function call is received from the agent */
    onFunctionCall(callback: (functionName: string, args: any, callId: string) => void): void {
        this._onFunctionCall = callback;
    }

    /** Called when On-Prem API response is received */
    onApiResponse(callback: (endpoint: string, data: any) => void): void {
        this._onApiResponse = callback;
    }

    /** Called when an error occurs */
    onError(callback: (error: string) => void): void {
        this._onError = callback;
    }
}
