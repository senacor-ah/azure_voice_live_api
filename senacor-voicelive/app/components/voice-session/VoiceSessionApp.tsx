'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { SessionHeader } from "./SessionHeader";
import { SessionStats } from "./SessionStats";
import { SessionControls } from "./SessionControls";
import { AvatarDisplay } from "./AvatarDisplay";
import { TranscriptView, Message } from "./TranscriptView";
import { AudioVisualizer } from "./AudioVisualizer";
import { BottomNavigation, NavItem } from "./BottomNavigation";
import { AccountsView } from "./AccountsView";
import { ProfileView } from "./ProfileView";
import { TransferConfirmation } from "./TransferConfirmation";
import { AppointmentBooking } from "./AppointmentBooking";
import { AuthenticatedVoiceClient } from "@/lib/voice-client";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export function VoiceSessionApp() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isTranscriptMode, setIsTranscriptMode] = useState(false);
  const [activeNav, setActiveNav] = useState<NavItem>("home");
  const [connectionTime, setConnectionTime] = useState(0);
  const [sessionInfo, setSessionInfo] = useState<{sessionId: string; userName?: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [responseTimings, setResponseTimings] = useState<number[]>([]);
  const [currentResponseTimer, setCurrentResponseTimer] = useState<number | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [avgResponseTime, setAvgResponseTime] = useState<number | undefined>(undefined);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const [transferCallId, setTransferCallId] = useState<string | null>(null);
  const [hasVideoConnection, setHasVideoConnection] = useState(false);
  
  // Appointment Booking States
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [appointmentCallId, setAppointmentCallId] = useState<string | null>(null);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // Refs
  const voiceClientRef = useRef<AuthenticatedVoiceClient | null>(null);
  const responseStartTimeRef = useRef<number | null>(null);
  const connectionStartTimeRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentAiTextRef = useRef<string>('');
  const currentAiMessageIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Calculate average response time
  useEffect(() => {
    if (responseTimings.length > 0) {
      const avg = responseTimings.reduce((a, b) => a + b, 0) / responseTimings.length;
      setAvgResponseTime(avg / 1000); // Convert ms to seconds
    } else {
      setAvgResponseTime(undefined);
    }
  }, [responseTimings]);

  // Connection timer
  useEffect(() => {
    if (status !== "connected") return;
    const timer = setInterval(() => {
      setConnectionTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Get OneTimeToken for authentication
  // Backend accepts any token starting with 'dev-' in development mode
  const fetchOneTimeToken = async () => {
    return 'dev-token';
  };

  // Voice Client Setup
  const initializeVoiceClient = useCallback(() => {
    if (!voiceClientRef.current) {
      // Backend URL aus .env (wie im alten Frontend)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:5001';
      console.log('🔗 Connecting to backend:', backendUrl);
      
      const client = new AuthenticatedVoiceClient(backendUrl);
      
      // Event Handler: AI Text received (streaming deltas - only for text-only mode)
      // In audio mode, we use onAudioTranscriptDone instead
      client.onTextReceived((text) => {
        // In audio mode, text.delta is not typically sent
        // This is only for text-only sessions
        console.log('📝 Text delta received (text-only mode):', text);
      });
      
      // Event Handler: User Transcript received
      client.onUserTranscript((text) => {
        console.log('📝 Adding user transcript to chat:', text);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'user', 
            content: text,
            timestamp: new Date(),
          },
        ]);
      });
      
      // Event Handler: WebSocket Verbindung hergestellt
      client.onConnected(() => {
        console.log('✅ WebSocket connected, waiting for session ready...');
      });
      
      // Event Handler: Turn Detection - User stoppt sprechen
      client.onSpeechStopped(() => {
        console.log('⏱️ Turn detected: User stopped speaking, waiting for audio playback...');
        responseStartTimeRef.current = Date.now();
        setIsWaitingForResponse(true);
      });
      
      // Event Handler: ERSTE AUDIO-WIEDERGABE beginnt
      client.onAudioPlaybackStarted(() => {
        if (responseStartTimeRef.current) {
          const responseTime = Date.now() - responseStartTimeRef.current;
          console.log(`⚡ First audio playback started. Response time: ${responseTime}ms`);
          setResponseTimings(prev => [...prev, responseTime]);
          setIsWaitingForResponse(false);
          responseStartTimeRef.current = null;
        }
      });
      
      // Event Handler: Session Ready (Audio + Optional Avatar)
      client.onSessionReady((hasAvatar) => {
        console.log('🎯 Session ready. Avatar available:', hasAvatar);
        // WebRTC wird automatisch bei session.updated gestartet (wie im alten Frontend)
      });
      
      // Event Handler: Video Stream verbunden
      client.onVideoConnected(() => {
        console.log('📹 Video stream connected');
      });
      
      // Event Handler: Video Playback gestartet (Avatar sichtbar)
      client.onVideoPlaybackStarted(() => {
        console.log('📹 Video playback started - switching to live avatar');
        setHasVideoConnection(true);
      });
      
      // Event Handler: Response Done (Agent finished speaking)
      client.onResponseDone(() => {
        console.log('✅ Response done');
      });
      
      // Event Handler: Audio Transcript Done (BETTER - agent REALLY finished speaking)
      client.onAudioTranscriptDone((transcript) => {
        console.log('🎤 Audio transcript done - agent finished speaking:', transcript);
        
        // Add the AI transcript to the message list
        if (transcript && transcript.trim()) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'assistant' as const,
              content: transcript,
              timestamp: new Date(),
            },
          ]);
        }
        
        // Use functional state updates to access current values
        setIsLoadingAppointments(currentLoading => {
          if (currentLoading) {
            console.log('📅 Agent finished speaking - showing appointment modal NOW');
            setShowAppointmentModal(true);
            return false;
          }
          return currentLoading;
        });
      });
      
      // Event Handler: Function Call from Agent (Banking & Appointments)
      client.onFunctionCall((functionName, args, callId) => {
        const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
        console.log('🔧 Function call:', functionName, { ...parsedArgs, call_id: callId });
        
        if (functionName === 'ueberweisung_bestaetigen') {
          // Parse arguments if they come as string
          const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
          
          setPendingTransfer({
            id: callId,
            recipient: parsedArgs.recipient,
            iban: parsedArgs.iban,
            amount: parseFloat(parsedArgs.amount),
            currency: parsedArgs.currency || 'EUR',
            purpose: parsedArgs.purpose || undefined
          });
          setTransferCallId(callId);
        } else if (functionName === 'termine_anzeigen') {
          // WORKFLOW: Appointment data with workflow state
          const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
          console.log('📅 Appointment data received (Workflow HITL):', parsedArgs);
          
          // Check workflow state
          const workflowState = parsedArgs.workflow_state;
          if (workflowState && workflowState !== 'awaiting_selection') {
            console.warn('⚠️ Invalid workflow state for UI display:', workflowState);
          }
          
          // Cache data and show loading, but don't show modal yet
          setAppointmentData(parsedArgs);
          setAppointmentCallId(callId);
          setIsLoadingAppointments(true);
          setShowAppointmentModal(false);
          
          console.log('🔄 Waiting for agent response to finish before showing modal...');
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

  const handleMicToggle = useCallback(() => {
    const client = voiceClientRef.current;
    if (!client || status !== "connected") return;
    
    if (isMicActive) {
      client.stopRecording();
      setIsMicActive(false);
    } else {
      client.startRecording();
      setIsMicActive(true);
    }
  }, [isMicActive, status]);

  const handleDisconnect = useCallback(() => {
    if (voiceClientRef.current) {
      voiceClientRef.current.disconnect();
      voiceClientRef.current = null;
    }
    
    setStatus("disconnected");
    setSessionInfo(null);
    setMessages([]);
    setPendingTransfer(null);
    setTransferCallId(null);
    setAppointmentData(null);
    setAppointmentCallId(null);
    setShowAppointmentModal(false);
    setIsLoadingAppointments(false);
    setIsMicActive(false);
    setIsTranscriptMode(false);
    setIsConnecting(false);
    setHasVideoConnection(false);
    setConnectionTime(0);
    setResponseTimings([]);
    setAvgResponseTime(undefined);
    setCurrentResponseTimer(null);
    setIsWaitingForResponse(false);
    responseStartTimeRef.current = null;
    connectionStartTimeRef.current = null;
    currentAiTextRef.current = '';
    currentAiMessageIdRef.current = null;
  }, []);

  const handleConnect = useCallback(async () => {
    try {
      setStatus("connecting");
      setError(null);
      setIsConnecting(true);
      connectionStartTimeRef.current = Date.now();
      
      // 1. OneTimeToken von deinem System holen
      const oneTimeToken = await fetchOneTimeToken();
      
      // 2. Voice Client initialisieren
      const client = initializeVoiceClient();
      
      // 3. Verbinden und authentifizieren
      const session = await client.connect(oneTimeToken);
      
      setSessionInfo(session);
      setStatus("connected");
      setConnectionTime(0);
      
      // Mikrofon ist initial AUS (Microsoft Toggle-Style)
      setIsMicActive(false);
      
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message);
      setStatus("error");
      setIsConnecting(false);
      connectionStartTimeRef.current = null;
    }
  }, [initializeVoiceClient]);

  const handleNavigation = useCallback((item: NavItem) => {
    setActiveNav(item);
  }, []);

  const handleTranscriptToggle = useCallback(() => {
    setIsTranscriptMode(prev => !prev);
  }, []);

  // Handle Transfer Confirmation
  const handleTransferConfirm = useCallback(() => {
    if (voiceClientRef.current && transferCallId) {
      voiceClientRef.current.sendFunctionResult(transferCallId, {
        confirmed: true,
        message: 'Überweisung wurde bestätigt'
      });
      setPendingTransfer(null);
      setTransferCallId(null);
    }
  }, [transferCallId]);

  const handleTransferReject = useCallback(() => {
    if (voiceClientRef.current && transferCallId) {
      voiceClientRef.current.sendFunctionResult(transferCallId, {
        confirmed: false,
        message: 'Überweisung wurde abgebrochen'
      });
      setPendingTransfer(null);
      setTransferCallId(null);
    }
  }, [transferCallId]);

  // Handle Appointment Selection (WORKFLOW HITL)
  const handleAppointmentSelect = useCallback((appointment: any) => {
    if (voiceClientRef.current && appointmentCallId) {
      console.log('📅 Appointment selected (Workflow validation):', appointment);
      
      // Send selection to backend for workflow validation
      voiceClientRef.current.sendFunctionResult(appointmentCallId, {
        selected: true,
        termin_id: appointment.id,
        datum: appointment.datum,
        uhrzeit: appointment.uhrzeit,
        message: `Termin am ${appointment.datum} um ${appointment.uhrzeit} Uhr ausgewählt`
      });
      
      // Close modal and clear state
      setAppointmentData(null);
      setAppointmentCallId(null);
      setShowAppointmentModal(false);
      setIsLoadingAppointments(false);
      
      console.log('✅ Selection sent to backend for workflow processing');
    }
  }, [appointmentCallId]);

  const handleAppointmentCancel = useCallback(() => {
    if (voiceClientRef.current && appointmentCallId) {
      console.log('❌ Appointment selection cancelled');
      
      voiceClientRef.current.sendFunctionResult(appointmentCallId, {
        selected: false,
        message: 'Terminauswahl abgebrochen'
      });
      
      setAppointmentData(null);
      setAppointmentCallId(null);
      setShowAppointmentModal(false);
      setIsLoadingAppointments(false);
    }
  }, [appointmentCallId]);

  const isConnected = status === "connected";

  return (
    <div className="phone-container flex flex-col h-full" style={{background: '#f5f5f5', color: '#1a1a2e'}}>
      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Home View - Avatar and Session Controls */}
        {activeNav === "home" && (
          <div className="absolute inset-0 flex flex-col">
            {/* Unified Card Container for Avatar and Stats */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              
              {/* Top Part: Main Content Area */}
              <div className="relative flex-1 min-h-0 w-full">
                {/* Avatar Container - Animates between full size and PiP */}
                <div 
                  className={cn(
                    "overflow-hidden",
                    "transition-all duration-700",
                    isTranscriptMode 
                      ? "absolute bottom-4 right-4 w-28 h-36 rounded-2xl shadow-2xl ring-2 ring-primary/30 z-30 ease-out" 
                      : "absolute bottom-0 right-0 w-full h-full rounded-none shadow-none ease-in-out"
                  )}
                  style={{
                    transitionProperty: 'all',
                    transitionTimingFunction: isTranscriptMode 
                      ? 'cubic-bezier(0.16, 1, 0.3, 1)' 
                      : 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <AvatarDisplay 
                    isPip={isTranscriptMode} 
                    isConnected={isConnected} 
                    hasVideo={hasVideoConnection}
                    videoRef={videoRef}
                    className={cn(
                      isTranscriptMode ? "" : ""
                    )}
                  />
                </div>

                {/* Transcript View - Only visible in transcript mode */}
                <div 
                  className={cn(
                    "absolute inset-0 w-full h-full p-4 overflow-y-auto transition-opacity duration-300",
                    isTranscriptMode ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                  )}
                  style={{background: '#f8faff'}}
                >
                  <TranscriptView messages={messages} isSessionActive={isConnected} />
                </div>
                
                {/* Floating Controls Overlay - Bottom Right (only in Avatar mode) */}
                {!isTranscriptMode && (
                  <div className="absolute bottom-4 right-4 z-20">
                    <SessionControls
                      isMicActive={isMicActive}
                      isTranscriptMode={isTranscriptMode}
                      isConnected={isConnected}
                      onMicToggle={handleMicToggle}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onTranscriptToggle={handleTranscriptToggle}
                      variant="compact"
                      className="shadow-lg"
                    />
                  </div>
                )}
              </div>
              
              {/* Bottom Part: Session Stats - Integrated */}
              <div className="flex-shrink-0 z-10 relative" style={{borderTop: '1px solid #e2e8f0', background: '#fff'}}>
                <SessionStats
                  messageCount={messages.length}
                  connectionTime={connectionTime}
                  responseTime={avgResponseTime}
                  isConnected={isConnected}
                  compact={isTranscriptMode}
                  className="bg-transparent border-none shadow-none rounded-none h-auto p-4"
                />
                
                {/* Controls in Transcript Mode - Below Stats */}
                {isTranscriptMode && (
                  <div className="flex justify-center pb-2">
                    <SessionControls
                      isMicActive={isMicActive}
                      isTranscriptMode={isTranscriptMode}
                      isConnected={isConnected}
                      onMicToggle={handleMicToggle}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onTranscriptToggle={handleTranscriptToggle}
                      variant="compact"
                      className="shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Transfer Confirmation Modal */}
      <TransferConfirmation
        transfer={pendingTransfer}
        isOpen={!!pendingTransfer}
        onConfirm={handleTransferConfirm}
        onReject={handleTransferReject}
      />

      {/* Appointment Booking Modal */}
      {appointmentData && showAppointmentModal && (
        <AppointmentBooking
          appointments={appointmentData.appointments || []}
          advisor={appointmentData.advisor || { name: "Michael Weber", title: "Senior Bankberater", avatarUrl: "/advisor-avatar.svg" }}
          isOpen={showAppointmentModal}
          onSelect={handleAppointmentSelect}
          onCancel={handleAppointmentCancel}
        />
      )}

      {/* Loading Overlay for Appointments */}
      {isLoadingAppointments && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center" style={{background: 'rgba(0,0,0,0.35)'}}>
          <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'}}>
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: '#7da0d7', borderTopColor: 'transparent'}} />
            <p className="text-lg font-medium">Termine werden vorbereitet...</p>
          </div>
        </div>
      )}

    </div>
  );
}
