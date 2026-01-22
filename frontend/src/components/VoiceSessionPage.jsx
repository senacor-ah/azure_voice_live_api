/**
 * Voice Session Page - React Component mit shadcn/ui
 * 
 * Nutzt AuthenticatedVoiceClient für Azure Voice Live mit oneTimeToken Auth
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthenticatedVoiceClient } from '../lib/voice-client';
import TransferConfirmation from './TransferConfirmation';
import VideoPanel from './VideoPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  User, 
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

// Transcript Message Component
const TranscriptMessage = ({ role, text, timestamp }) => {
  const isAi = role === 'assistant';
  
  return (
    <div className={`flex gap-3 mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex flex-col max-w-[80%] ${isAi ? 'items-start' : 'items-end'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString()}
          </span>
          <Badge variant={isAi ? 'default' : 'secondary'} className="text-xs">
            {isAi ? 'AI' : 'Du'}
          </Badge>
        </div>
        <div
          className={`rounded-lg px-4 py-2 ${
            isAi
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <p className="text-sm">{text}</p>
        </div>
      </div>
    </div>
  );
};

// Audio Visualizer Component
const AudioVisualizer = ({ isActive, level = 0 }) => {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(20)].map((_, i) => {
        const height = isActive
          ? Math.random() * (level + 20) + 20
          : 10;
        
        return (
          <div
            key={i}
            className="bg-primary rounded-full transition-all duration-100"
            style={{
              width: '4px',
              height: `${height}%`,
              opacity: isActive ? 0.7 : 0.3,
            }}
          />
        );
      })}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    disconnected: {
      icon: PhoneOff,
      label: 'Nicht verbunden',
      variant: 'secondary',
    },
    connecting: {
      icon: Loader2,
      label: 'Verbinde...',
      variant: 'default',
      animate: true,
    },
    connected: {
      icon: CheckCircle,
      label: 'Verbunden',
      variant: 'default',
    },
    error: {
      icon: AlertCircle,
      label: 'Fehler',
      variant: 'destructive',
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-2">
      <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
};

// Main Voice Session Page Component
export default function VoiceSessionPage() {
  // State
  const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [sessionInfo, setSessionInfo] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  const [micActive, setMicActive] = useState(false); // Microsoft-Style: Toggle statt Push-to-Talk
  const [audioLevel, setAudioLevel] = useState(0);
  const [videoConnected, setVideoConnected] = useState(false);
  const [hasAvatar, setHasAvatar] = useState(true); // Neu: Steuert Video-Anzeige
  
  // Response Time Tracking
  const [responseTimings, setResponseTimings] = useState([]);
  const [currentResponseTimer, setCurrentResponseTimer] = useState(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const responseStartTimeRef = useRef(null);
  
  // Connection Time Tracking
  const [connectionTime, setConnectionTime] = useState(null);
  const [currentConnectionTimer, setCurrentConnectionTimer] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const connectionStartTimeRef = useRef(null);
  
  // Function Call State (für Überweisungsbestätigung)
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [transferCallId, setTransferCallId] = useState(null);
  
  // Refs
  const voiceClientRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const videoRef = useRef(null);
  
  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Timer für Response-Messung
  useEffect(() => {
    let interval;
    if (isWaitingForResponse && responseStartTimeRef.current) {
      interval = setInterval(() => {
        const elapsed = Date.now() - responseStartTimeRef.current;
        setCurrentResponseTimer(elapsed);
      }, 10); // Update alle 10ms
    } else {
      setCurrentResponseTimer(null);
    }
    return () => clearInterval(interval);
  }, [isWaitingForResponse]);
  
  // Timer für Connection-Messung (läuft bis Video abspielt)
  useEffect(() => {
    let interval;
    if (isConnecting && connectionStartTimeRef.current) {
      interval = setInterval(() => {
        const elapsed = Date.now() - connectionStartTimeRef.current;
        setCurrentConnectionTimer(elapsed);
      }, 10);
    } else {
      setCurrentConnectionTimer(null);
    }
    return () => clearInterval(interval);
  }, [isConnecting]);

  // Voice Client Setup
  const initializeVoiceClient = useCallback(() => {
    if (!voiceClientRef.current) {
      // In development: use Vite proxy (port 3000)
      // In production: use direct backend connection (port 5001)
      const isDevelopment = import.meta.env.DEV;
      const backendUrl = isDevelopment 
        ? (import.meta.env.VITE_BACKEND_URL || 'ws://localhost:3000')  // Vite proxy
        : (import.meta.env.VITE_BACKEND_URL || 'ws://localhost:5001'); // Direct connection
      const client = new AuthenticatedVoiceClient(backendUrl);
      
      // Event Handler: AI Text received
      client.onTextReceived((text) => {
        setTranscript((prev) => [
          ...prev,
          {
            role: 'assistant',
            text,
            timestamp: new Date(),
          },
        ]);
      });
      
      // Event Handler: User Transcript received
      client.onUserTranscript((text) => {
        console.log('📝 Adding user transcript to chat:', text);
        setTranscript((prev) => [
          ...prev,
          {
            role: 'user',
            text,
            timestamp: new Date(),
          },
        ]);
      });
      
      // Event Handler: On-Prem API responses
      client.onApiResponse((endpoint, data) => {
        console.log('On-Prem API Response:', endpoint, data);
      });
      
      // Event Handler: WebSocket Verbindung hergestellt (aber Video noch nicht)
      client.onConnected(() => {
        console.log('✅ WebSocket connected, waiting for video...');
      });
      
      // Event Handler: Turn Detection - User stoppt sprechen → Response Timer starten
      client.onSpeechStopped(() => {
        console.log('⏱️ Turn detected: User stopped speaking, waiting for audio playback...');
        responseStartTimeRef.current = Date.now();
        setIsWaitingForResponse(true);
      });
      
      // Event Handler: ERSTE AUDIO-WIEDERGABE beginnt → Response Timer stoppen
      client.onAudioPlaybackStarted(() => {
        if (responseStartTimeRef.current) {
          const responseTime = Date.now() - responseStartTimeRef.current;
          console.log(`🔊 AUDIO PLAYBACK started after ${responseTime}ms (Turn → Playback)`);
          
          // Speichere die letzten 3 Zeiten
          setResponseTimings((prev) => [responseTime, ...prev].slice(0, 3));
          
          setIsWaitingForResponse(false);
          responseStartTimeRef.current = null;
        }
      });
      
      // Event Handler: Function Call vom Agent (UI-Aktionen)
      client.onFunctionCall((functionName, argumentsStr, callId) => {
        console.log('🔧 Function Call received:', functionName);
        
        try {
          const args = JSON.parse(argumentsStr);
          
          // Handle verschiedene Function Calls
          if (functionName === 'show_transfer_confirmation' || functionName === 'ueberweisung_bestaetigen') {
            // Zeige Überweisungsbestätigung
            setPendingTransfer(args);
            setTransferCallId(callId);
          } else {
            console.warn('Unknown function:', functionName);
            // Unbekannte Funktion → sende Fehler zurück
            client.sendFunctionResult(callId, {
              success: false,
              error: `Unknown function: ${functionName}`
            });
          }
        } catch (error) {
          console.error('Failed to parse function arguments:', error);
          client.sendFunctionResult(callId, {
            success: false,
            error: 'Invalid arguments'
          });
        }
      });
      
      // Event Handler: Video-Stream verbunden (aber noch nicht abspielend)
      client.onVideoConnected(() => {
        console.log('✅ Video stream connected, waiting for playback...');
        setVideoConnected(true);
      });
      
      // Event Handler: Video-Wiedergabe gestartet → Connection Timer stoppen
      client.onVideoPlaybackStarted(() => {
        console.log('✅ Video playback started');
        
        // Connection Timer stoppen (komplette Zeit: Start → Video läuft)
        if (connectionStartTimeRef.current) {
          const connTime = Date.now() - connectionStartTimeRef.current;
          console.log(`⏱️ Total connection time (Start → Video Playing): ${connTime}ms`);
          setConnectionTime(connTime);
          setIsConnecting(false);
          connectionStartTimeRef.current = null;
        }
      });
      
      // Event Handler: Session Ready (Avatar Status)
      client.onSessionReady((avatarEnabled) => {
        console.log('✅ Session ready, avatar enabled:', avatarEnabled);
        setHasAvatar(avatarEnabled);
        
        if (!avatarEnabled) {
            // Wenn kein Avatar, stoppen wir den Connection Timer hier (da kein Video kommen wird)
            // Audio-only Verbindungen sind hier fertig aufgebaut
            if (connectionStartTimeRef.current) {
                const connTime = Date.now() - connectionStartTimeRef.current;
                console.log(`⏱️ Total connection time (Start → Audio Only Ready): ${connTime}ms`);
                setConnectionTime(connTime);
                setIsConnecting(false);
                connectionStartTimeRef.current = null;
            }
        }
      });
      
      // Set video element reference
      if (videoRef.current) {
        client.setVideoElement(videoRef.current);
      }
      
      voiceClientRef.current = client;
    }
    
    return voiceClientRef.current;
  }, []);

  // Connect to Voice Session
  const handleConnect = async () => {
    try {
      setStatus('connecting');
      setError(null);
      
      // Start connection timer
      connectionStartTimeRef.current = Date.now();
      setIsConnecting(true);
      
      // 1. OneTimeToken von deinem System holen
      const oneTimeToken = await fetchOneTimeToken();
      
      // 2. Voice Client initialisieren
      const client = initializeVoiceClient();
      
      // 3. Verbinden und authentifizieren
      const session = await client.connect(oneTimeToken);
      
      setSessionInfo(session);
      setStatus('connected');
      
      // Mikrofon ist initial AUS (Microsoft Toggle-Style)
      setMicActive(false);
      
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
      setStatus('error');
      setIsConnecting(false);
      connectionStartTimeRef.current = null;
    }
  };

  // Disconnect from Voice Session
  const handleDisconnect = () => {
    if (voiceClientRef.current) {
      voiceClientRef.current.disconnect();
      voiceClientRef.current = null;
    }
    
    setStatus('disconnected');
    setSessionInfo(null);
    setTranscript([]);
    setPendingTransfer(null);
    setTransferCallId(null);
    setVideoConnected(false);
    setIsConnecting(false);
  };
  
  // Handle Transfer Confirmation
  const handleTransferConfirm = () => {
    if (voiceClientRef.current && transferCallId) {
      voiceClientRef.current.sendFunctionResult(transferCallId, {
        success: true,
        approved: true,
        message: 'Überweisung vom Benutzer bestätigt'
      });
      
      // UI schließen
      setPendingTransfer(null);
      setTransferCallId(null);
      
      console.log('✅ Transfer confirmed');
    }
  };
  
  // Handle Transfer Rejection
  const handleTransferReject = () => {
    if (voiceClientRef.current && transferCallId) {
      voiceClientRef.current.sendFunctionResult(transferCallId, {
        success: true,
        approved: false,
        message: 'Überweisung vom Benutzer abgelehnt'
      });
      
      // UI schließen
      setPendingTransfer(null);
      setTransferCallId(null);
      
      console.log('❌ Transfer rejected');
    }
  };

  // Microsoft-Style: Toggle Microphone (Click to start/stop)
  const handleToggleMicrophone = () => {
    if (voiceClientRef.current && status === 'connected') {
      const newState = voiceClientRef.current.toggleRecording();
      setMicActive(newState);
      console.log(newState ? '🎤 Microphone started' : '🔇 Microphone stopped');
    }
  };

  // Send text message
  const handleSendText = (text) => {
    if (voiceClientRef.current && text.trim()) {
      voiceClientRef.current.sendText(text);
      
      setTranscript((prev) => [
        ...prev,
        {
          role: 'user',
          text,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Fetch OneTimeToken from your On-Prem system
  const fetchOneTimeToken = async () => {
    // In Development: Nutze Token aus .env
    const devToken = import.meta.env.VITE_DEV_ONE_TIME_TOKEN;
    const isDevelopment = import.meta.env.VITE_ENV === 'development';
    
    if (isDevelopment && devToken) {
      console.log('🔧 Development Mode: Using token from .env');
      return devToken;
    }
    
    // Production: Hole Token von deinem On-Prem System
    try {
      const response = await fetch('https://your-onprem-system.com/api/auth/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch oneTimeToken');
      }
      
      const data = await response.json();
      return data.oneTimeToken;
      
    } catch (err) {
      console.error('Failed to fetch token from On-Prem system:', err);
      throw new Error('Konnte oneTimeToken nicht abrufen');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Überweisungsbestätigung Dialog (triggered by Agent Function Call) */}
      <TransferConfirmation
        isOpen={pendingTransfer !== null}
        transferData={pendingTransfer}
        onConfirm={handleTransferConfirm}
        onReject={handleTransferReject}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column - Session Info & Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Session Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Voice Session</CardTitle>
                <StatusBadge status={status} />
              </div>
              <CardDescription>
                Azure Voice Live mit Bearer Token Auth
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* User Info */}
              {sessionInfo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{sessionInfo.userName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Session: {sessionInfo.sessionId?.slice(0, 12)}...
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* Connect/Disconnect Buttons */}
              <div className="space-y-2">
                {status === 'disconnected' || status === 'error' ? (
                  <Button 
                    onClick={handleConnect} 
                    className="w-full"
                    size="lg"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Verbindung starten
                  </Button>
                ) : (
                  <Button 
                    onClick={handleDisconnect}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                    disabled={status === 'connecting'}
                  >
                    <PhoneOff className="mr-2 h-4 w-4" />
                    Verbindung trennen
                  </Button>
                )}
                
                {/* Microsoft-Style Toggle Button - Sichtbar wenn Video verbunden ODER Audio-Only */}
                {status === 'connected' && (videoConnected || !hasAvatar) && (
                  <Button
                    onClick={handleToggleMicrophone}
                    variant={micActive ? "default" : "secondary"}
                    size="lg"
                    className="w-full"
                  >
                    {micActive ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop Microphone
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Start Microphone
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* Audio Visualizer Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Audio Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AudioVisualizer 
                isActive={status === 'connected' && micActive}
                level={audioLevel}
              />
            </CardContent>
          </Card>
          
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Messages:</span>
                <span className="font-medium">{transcript.length}</span>
              </div>
              {sessionInfo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium">{sessionInfo.userName}</span>
                </div>
              )}
              
              <Separator />
              
              {/* Connection Timer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Verbindungszeit:</span>
                  {currentConnectionTimer !== null ? (
                    <Badge variant="outline" className="font-mono animate-pulse">
                      ⏱️ {(currentConnectionTimer / 1000).toFixed(2)}s
                    </Badge>
                  ) : connectionTime !== null ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      ✅ {(connectionTime / 1000).toFixed(3)}s
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Response Timer */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Antwortzeit (Turn→Audio):</span>
                  {isWaitingForResponse && currentResponseTimer !== null ? (
                    <Badge variant="outline" className="font-mono animate-pulse">
                      ⏱️ {(currentResponseTimer / 1000).toFixed(2)}s
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
                
                {responseTimings.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">Letzte 3 Antwortzeiten:</span>
                    {responseTimings.map((time, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">#{idx + 1}:</span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {(time / 1000).toFixed(3)}s
                        </Badge>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-medium pt-1 border-t">
                      <span>Ø:</span>
                      <span className="font-mono">
                        {(responseTimings.reduce((a, b) => a + b, 0) / responseTimings.length / 1000).toFixed(3)}s
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Middle Column - Video */}
        {hasAvatar && (
          <div className="lg:col-span-1">
            <VideoPanel 
              videoRef={videoRef}
              isConnected={videoConnected}
              avatarName={status === 'connected' ? 'Avatar' : null}
            />
          </div>
        )}
        
        {/* Right Column - Transcript */}
        <div className={hasAvatar ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card className="h-[calc(100vh-8rem)]">
            <CardHeader>
              <CardTitle>Conversation Transcript</CardTitle>
              <CardDescription>
                Echtzeit-Mitschrift deiner Konversation
              </CardDescription>
            </CardHeader>
            
            <CardContent className="h-[calc(100%-8rem)]">
              <ScrollArea className="h-full pr-4">
                {transcript.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Phone className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-sm">
                      Starte eine Voice Session um zu beginnen
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transcript.map((message, index) => (
                      <TranscriptMessage
                        key={index}
                        role={message.role}
                        text={message.text}
                        timestamp={message.timestamp}
                      />
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

