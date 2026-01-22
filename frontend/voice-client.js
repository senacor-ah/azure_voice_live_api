/**
 * Azure Voice Live Client mit oneTimeToken Authentication
 * 
 * Flow:
 * 1. Client erhält oneTimeToken von deinem On-Prem System (z.B. nach Login)
 * 2. Client verbindet zu Backend WebSocket
 * 3. Sendet oneTimeToken im ersten Message
 * 4. Backend tauscht Token gegen Bearer Token (bleibt im Backend!)
 * 5. Backend erstellt Azure Voice Live Session
 * 6. Audio-Streaming beginnt
 */

class AuthenticatedVoiceClient {
    constructor(backendUrl) {
        this.backendUrl = backendUrl;
        this.ws = null;
        this.isAuthenticated = false;
        this.audioContext = null;
        this.audioWorklet = null;
        this.sessionId = null;
        this.userName = null;
    }

    /**
     * Verbinde mit dem Backend und authentifiziere
     * 
     * @param {string} oneTimeToken - Token vom On-Prem System
     */
    async connect(oneTimeToken) {
        return new Promise((resolve, reject) => {
            console.log('Connecting to backend...');
            
            // WebSocket Verbindung zum Backend
            this.ws = new WebSocket(`${this.backendUrl}/ws/voice`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected, authenticating...');
                
                // Erste Nachricht: Authentication mit oneTimeToken
                this.ws.send(JSON.stringify({
                    type: 'auth.init',
                    oneTimeToken: oneTimeToken
                }));
            };
            
            this.ws.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                
                // Handle authentication response
                if (message.type === 'proxy.connected') {
                    this.isAuthenticated = true;
                    this.sessionId = message.session_id;
                    this.userName = message.user?.name;
                    
                    console.log('✅ Authenticated successfully!');
                    console.log('Session ID:', this.sessionId);
                    console.log('User:', this.userName);
                    
                    // Setup audio
                    await this._setupAudio();
                    
                    resolve({
                        sessionId: this.sessionId,
                        userName: this.userName
                    });
                }
                
                // Handle errors
                else if (message.type === 'error') {
                    console.error('Error:', message.error.message);
                    
                    if (!this.isAuthenticated) {
                        reject(new Error(message.error.message));
                    }
                }
                
                // Handle audio from Azure
                else if (message.type === 'audio.delta') {
                    await this._playAudio(message.audio);
                }
                
                // Handle text responses
                else if (message.type === 'text.delta') {
                    console.log('AI:', message.text);
                    this._onTextReceived?.(message.text);
                }
                
                // Handle On-Prem API responses
                else if (message.type === 'onprem.api.response') {
                    console.log('On-Prem API response:', message.endpoint, message.data);
                    this._onApiResponse?.(message.endpoint, message.data);
                }
            };
            
            this.ws.onerror = (error) => {
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
     * Setup Audio Context und Microphone
     */
    async _setupAudio() {
        try {
            // Audio Context erstellen
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 24000
            });
            
            // Microphone Access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 24000,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            // Audio Worklet für Mikrofonverarbeitung
            await this.audioContext.audioWorklet.addModule('/audio-processor.js');
            this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-processor');
            
            // Mikrofon → Worklet → Backend
            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.audioWorklet);
            
            this.audioWorklet.port.onmessage = (event) => {
                // PCM16 Audio zum Backend senden
                this._sendAudio(event.data);
            };
            
            console.log('✅ Audio setup complete');
            
        } catch (error) {
            console.error('Failed to setup audio:', error);
            throw error;
        }
    }

    /**
     * Sende Audio zum Backend
     * 
     * @param {ArrayBuffer} audioData - PCM16 audio data
     */
    _sendAudio(audioData) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isAuthenticated) {
            // Audio als JSON oder Binary senden
            this.ws.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: Array.from(new Uint8Array(audioData))
            }));
        }
    }

    /**
     * Spiele Audio vom Backend ab
     * 
     * @param {Array|string} audioData - Audio data from backend
     */
    async _playAudio(audioData) {
        if (!this.audioContext) return;
        
        try {
            // Convert to ArrayBuffer if needed
            const buffer = typeof audioData === 'string' 
                ? this._base64ToArrayBuffer(audioData)
                : new Uint8Array(audioData).buffer;
            
            // Decode und abspielen
            const audioBuffer = await this.audioContext.decodeAudioData(buffer);
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start();
            
        } catch (error) {
            console.error('Failed to play audio:', error);
        }
    }

    /**
     * Rufe On-Prem API über Backend auf
     * (Backend nutzt Bearer Token aus Session)
     * 
     * @param {string} endpoint - API endpoint (z.B. "/api/customer/123")
     * @param {string} method - HTTP method (GET, POST, etc.)
     * @param {object} data - Optional payload
     */
    callOnPremApi(endpoint, method = 'GET', data = null) {
        if (!this.isAuthenticated) {
            console.error('Not authenticated');
            return;
        }
        
        console.log(`Calling On-Prem API: ${method} ${endpoint}`);
        
        this.ws.send(JSON.stringify({
            type: 'onprem.api.call',
            endpoint: endpoint,
            method: method,
            data: data
        }));
    }

    /**
     * Sende Text-Nachricht
     * 
     * @param {string} text - Text to send
     */
    sendText(text) {
        if (!this.isAuthenticated) {
            console.error('Not authenticated');
            return;
        }
        
        this.ws.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'text', text: text }]
            }
        }));
    }

    /**
     * Disconnect und Cleanup
     */
    disconnect() {
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
    _cleanup() {
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
    }

    /**
     * Helper: Base64 to ArrayBuffer
     */
    _base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Event Handler: Text empfangen
     */
    onTextReceived(callback) {
        this._onTextReceived = callback;
    }

    /**
     * Event Handler: On-Prem API Response
     */
    onApiResponse(callback) {
        this._onApiResponse = callback;
    }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

async function startVoiceSession() {
    // 1. OneTimeToken von deinem On-Prem System holen
    //    (z.B. nach erfolgreichem Login)
    const oneTimeToken = await getOneTimeTokenFromYourSystem();
    
    // 2. Voice Client erstellen
    const client = new AuthenticatedVoiceClient('ws://localhost:5001');
    
    // 3. Event Handlers registrieren
    client.onTextReceived((text) => {
        console.log('AI sagt:', text);
        document.getElementById('transcript').innerText += `\nAI: ${text}`;
    });
    
    client.onApiResponse((endpoint, data) => {
        console.log('On-Prem Daten:', endpoint, data);
        // Verarbeite Daten aus deinem On-Prem System
    });
    
    try {
        // 4. Verbinden und Authentifizieren
        const session = await client.connect(oneTimeToken);
        console.log('✅ Session gestartet:', session);
        
        // 5. Optional: On-Prem API aufrufen
        //    (Backend nutzt Bearer Token automatisch)
        client.callOnPremApi('/api/customer/profile', 'GET');
        
        // 6. Voice Session läuft jetzt!
        //    Audio wird automatisch gestreamt
        
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

// Beispiel: OneTimeToken Abruf (implementiere das für dein System)
async function getOneTimeTokenFromYourSystem() {
    // Dein On-Prem System gibt nach Login einen oneTimeToken aus
    // Dieser ist nur einmal verwendbar und kurzlebig
    
    const response = await fetch('https://your-onprem-system.com/api/auth/generate-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Deine bestehende Session/Auth
        },
        credentials: 'include'
    });
    
    const data = await response.json();
    return data.oneTimeToken;
}

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticatedVoiceClient;
}

