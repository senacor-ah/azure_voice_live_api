'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { SessionHeader } from "./SessionHeader";
import { SessionStats } from "./SessionStats";
import { SessionControls } from "./SessionControls";
import { AvatarDisplay } from "./AvatarDisplay";
import { TranscriptView, Message } from "./TranscriptView";
import { TextInputBar } from "./TextInputBar";
import { AudioVisualizer } from "./AudioVisualizer";
import { BottomNavigation, NavItem } from "./BottomNavigation";
import { AccountsView } from "./AccountsView";
import { ProfileView } from "./ProfileView";
import { TransferConfirmation } from "./TransferConfirmation";
import { AppointmentBooking } from "./AppointmentBooking";
import { AuthenticatedVoiceClient } from "@/lib/voice-client";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

interface VoiceSessionAppProps {
  userName?: string | null
}

export function VoiceSessionApp({ userName }: VoiceSessionAppProps) {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isTranscriptMode, setIsTranscriptMode] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
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
  const [isLoadingTransfer, setIsLoadingTransfer] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  
  // Appointment Booking States
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [appointmentCallId, setAppointmentCallId] = useState<string | null>(null);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // Speech Coordinator: gate UI actions until avatar/audio finishes speaking
  const uiActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which UI action is pending: 'appointment' | 'transfer' | null
  const pendingUiActionRef = useRef<'appointment' | 'transfer' | null>(null);
  // Track whether the agent actually produced audio in the current response
  const agentProducedAudioRef = useRef<boolean>(false);
  // Track text mode for use inside callbacks with stale closures
  const isTextModeRef = useRef<boolean>(false);
  
  // Extra buffer (ms) added on top of estimated remaining playback time
  // to account for WebRTC pipeline latency and avatar rendering.
  const AVATAR_PIPELINE_BUFFER_MS = 1500;
  // Fallback drain delay if server doesn't provide audio timing
  const AVATAR_FALLBACK_DRAIN_MS = 4500;
  
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

  // Resolved display name: prefer session name, fall back to AI-returned name
  const resolvedUserName = userName ?? sessionInfo?.userName ?? undefined;

  // Voice Client Setup
  const initializeVoiceClient = useCallback(() => {
    if (!voiceClientRef.current) {
      // WebSocket URL: derive from current origin (same Next.js server) or override via env
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || `${protocol}//${window.location.host}`;
      console.log('🔗 Connecting to backend:', backendUrl);
      
      const client = new AuthenticatedVoiceClient(backendUrl);
      
      // Event Handler: AI Text received (streaming deltas - only for text-only mode)
      // In audio mode, we use onAudioTranscriptDone instead
      client.onTextReceived((text) => {
        // In audio mode, text.delta is not typically sent
        // This is only for text-only sessions
        console.log('📝 Text delta received (text-only mode):', text);
      });

      // Text Mode: stream incoming AI text into a live message bubble
      client.onTextDelta((delta) => {
        // Mark response received on first delta (text mode equivalent of onAudioPlaybackStarted)
        if (responseStartTimeRef.current) {
          const responseTime = Date.now() - responseStartTimeRef.current;
          console.log(`⚡ First text delta received. Response time: ${responseTime}ms`);
          setResponseTimings(prev => [...prev, responseTime]);
          setIsWaitingForResponse(false);
          responseStartTimeRef.current = null;
        }

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.id === 'ai-streaming') {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + delta },
            ];
          }
          return [
            ...prev,
            { id: 'ai-streaming', role: 'assistant' as const, content: delta, timestamp: new Date() },
          ];
        });
      });

      // Text Mode: finalize the streaming bubble when response is complete
      client.onTextDone((fullText) => {
        console.log('📝 Text response done:', fullText);
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== 'ai-streaming');
          if (fullText.trim()) {
            return [
              ...filtered,
              { id: `ai-${Date.now()}`, role: 'assistant' as const, content: fullText, timestamp: new Date() },
            ];
          }
          return filtered;
        });
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
      
      // Reset audio-produced flag on every new response
      client.onResponseStarted(() => {
        agentProducedAudioRef.current = false;
      });

      // Event Handler: Response Done (Agent finished generating all audio)
      // This is the PRIMARY gate signal for showing UI actions.
      // The server sends estimated remaining playback time based on actual audio duration.
      client.onResponseDone((estimatedRemainingPlaybackMs?: number, totalAudioDurationMs?: number) => {
        const pendingAction = pendingUiActionRef.current;
        if (!pendingAction) {
          console.log('✅ Response done (no pending UI actions)');
          return;
        }
        
        console.log(`✅ Response done – pending UI action: ${pendingAction}, serverEstRemaining=${estimatedRemainingPlaybackMs}ms, totalAudio=${totalAudioDurationMs}ms`);
        
        // All audio has been GENERATED. Now wait for playback to finish.
        let delayMs = 0;
        
        if (isTextModeRef.current) {
          // Text mode: no audio playback at all – show UI immediately
          delayMs = 0;
          console.log('⚡ Text mode – showing UI action immediately (no audio drain needed)');
        } else if (!agentProducedAudioRef.current) {
          // Agent produced no audio (pure function-call response) – show UI immediately
          delayMs = 0;
          console.log('⚡ No agent audio – showing UI action immediately (no drain needed)');
        } else if (client.isAvatarMode()) {
          // Avatar mode: audio is streamed via WebRTC – use server-computed remaining time
          // plus a buffer for the WebRTC/avatar rendering pipeline latency.
          if (estimatedRemainingPlaybackMs != null && estimatedRemainingPlaybackMs > 0) {
            delayMs = estimatedRemainingPlaybackMs + AVATAR_PIPELINE_BUFFER_MS;
            console.log(`⏳ Avatar mode: server says ${estimatedRemainingPlaybackMs}ms remaining + ${AVATAR_PIPELINE_BUFFER_MS}ms pipeline buffer = ${delayMs}ms`);
          } else if (totalAudioDurationMs != null && totalAudioDurationMs > 0) {
            // Fallback: use total audio duration (most audio already played, but be safe)
            delayMs = Math.max(totalAudioDurationMs * 0.5, AVATAR_PIPELINE_BUFFER_MS);
            console.log(`⏳ Avatar mode fallback: using ${delayMs.toFixed(0)}ms (50% of ${totalAudioDurationMs}ms total + buffer)`);
          } else {
            delayMs = AVATAR_FALLBACK_DRAIN_MS;
            console.log(`⏳ Avatar mode: no timing data, using fallback ${delayMs}ms`);
          }
        } else {
          // Non-avatar mode: we schedule PCM chunks to AudioContext.
          // Compute remaining playback time from the cursor.
          const remainingSec = Math.max(0, client.getPlaybackEndTime() - client.getAudioContextTime());
          delayMs = remainingSec * 1000 + 500; // +500ms safety margin
          // Also consider server-provided data as a floor
          if (estimatedRemainingPlaybackMs != null && estimatedRemainingPlaybackMs > delayMs) {
            delayMs = estimatedRemainingPlaybackMs + 300;
            console.log(`⏳ Non-avatar mode: using server estimate ${delayMs.toFixed(0)}ms (higher than AudioContext calc)`);
          } else {
            console.log(`⏳ Non-avatar mode: waiting ${delayMs.toFixed(0)}ms for local audio drain`);
          }
        }
        
        // Clear any existing timer (safety)
        if (uiActionTimerRef.current) {
          clearTimeout(uiActionTimerRef.current);
        }
        
        uiActionTimerRef.current = setTimeout(() => {
          // Double-check we weren't interrupted (barge-in)
          const action = pendingUiActionRef.current;
          if (!action) {
            uiActionTimerRef.current = null;
            return;
          }
          
          if (action === 'appointment') {
            console.log('📅 Playback drained – showing appointment modal NOW');
            setShowAppointmentModal(true);
            setIsLoadingAppointments(false);
          } else if (action === 'transfer') {
            console.log('💸 Playback drained – showing transfer modal NOW');
            setShowTransferModal(true);
            setIsLoadingTransfer(false);
          }
          
          pendingUiActionRef.current = null;
          uiActionTimerRef.current = null;
        }, delayMs);
      });
      
      // Event Handler: Audio Transcript Done (transcript text completed)
      // Used only for adding AI messages to the chat – NOT for UI gating.
      client.onAudioTranscriptDone((transcript) => {
        console.log('🎤 Audio transcript done:', transcript);
        
        // Mark that the agent actually spoke in this response
        if (transcript && transcript.trim()) {
          agentProducedAudioRef.current = true;
        }
        
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
      });
      
      // Event Handler: Function Call from Agent (Banking & Appointments)
      client.onFunctionCall((functionName, args, callId) => {
        const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
        console.log('🔧 Function call:', functionName, { ...parsedArgs, call_id: callId });
        
        if (functionName === 'ueberweisung_bestaetigen') {
          // Parse arguments if they come as string
          const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
          
          // Cache transfer data but don't show modal yet – wait for speech to finish
          setPendingTransfer({
            id: callId,
            recipient: parsedArgs.recipient,
            iban: parsedArgs.iban,
            amount: parseFloat(parsedArgs.amount),
            currency: parsedArgs.currency || 'EUR',
            purpose: parsedArgs.purpose || undefined
          });
          setTransferCallId(callId);
          setIsLoadingTransfer(true);
          setShowTransferModal(false);
          pendingUiActionRef.current = 'transfer';
          
          console.log('🔄 Waiting for agent to finish speaking before showing transfer modal...');
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
          pendingUiActionRef.current = 'appointment';
          
          console.log('🔄 Waiting for agent to finish speaking before showing modal...');
        }
      });
      
      // Event Handler: Barge-in (user starts speaking while agent is talking)
      // Cancel any pending UI actions – the user interrupted before hearing the full response.
      client.onSpeechStarted(() => {
        const pendingAction = pendingUiActionRef.current;
        if (pendingAction) {
          console.log(`🚫 Barge-in detected – cancelling pending ${pendingAction} modal`);
          
          // Cancel the scheduled timer
          if (uiActionTimerRef.current) {
            clearTimeout(uiActionTimerRef.current);
            uiActionTimerRef.current = null;
          }
          
          // Drop the pending action – the turn was not fully spoken
          if (pendingAction === 'appointment') {
            setIsLoadingAppointments(false);
          } else if (pendingAction === 'transfer') {
            setIsLoadingTransfer(false);
          }
          pendingUiActionRef.current = null;
          // Keep data/callId so the agent can re-trigger if needed
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
    // Cancel any pending speech coordinator timers
    if (uiActionTimerRef.current) {
      clearTimeout(uiActionTimerRef.current);
      uiActionTimerRef.current = null;
    }
    pendingUiActionRef.current = null;
    
    if (voiceClientRef.current) {
      voiceClientRef.current.disconnect();
      voiceClientRef.current = null;
    }
    
    setStatus("disconnected");
    setSessionInfo(null);
    setMessages([]);
    setPendingTransfer(null);
    setTransferCallId(null);
    setShowTransferModal(false);
    setIsLoadingTransfer(false);
    setAppointmentData(null);
    setAppointmentCallId(null);
    setShowAppointmentModal(false);
    setIsLoadingAppointments(false);
    setIsMicActive(false);
    setIsTranscriptMode(false);
    setIsTextMode(false);
    isTextModeRef.current = false;
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
      
      // 3. Verbinden und authentifizieren (Name aus Session mitgeben)
      const session = await client.connect(oneTimeToken, userName ?? undefined);
      
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
  }, [initializeVoiceClient, userName]);

  const handleNavigation = useCallback((item: NavItem) => {
    setActiveNav(item);
  }, []);

  const handleTranscriptToggle = useCallback(() => {
    setIsTranscriptMode(prev => !prev);
  }, []);

  const handleTextModeToggle = useCallback(() => {
    const client = voiceClientRef.current;
    if (!client || status !== 'connected') return;

    // Read current state and flip — side effects run OUTSIDE the updater
    // to avoid React StrictMode double-invocation in dev mode.
    setIsTextMode((prev) => {
      const entering = !prev;
      isTextModeRef.current = entering;

      // Schedule side effects for after state commit (microtask)
      queueMicrotask(() => {
        client.setTextMode(entering);
        if (entering) {
          setIsMicActive(false);
          setHasVideoConnection(false);
        } else {
          setHasVideoConnection(true);
          client.reconnectMic().catch((err) => console.error('Failed to reconnect mic:', err));
        }
      });

      return entering;
    });
  }, [status]);

  const handleSendText = useCallback((text: string) => {
    const client = voiceClientRef.current;
    if (!client || status !== 'connected') return;

    // Optimistic: show user message immediately
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: 'user' as const, content: text, timestamp: new Date() },
    ]);

    // Start response timer so stats update
    responseStartTimeRef.current = Date.now();
    setIsWaitingForResponse(true);

    client.sendTextAndRespond(text);
  }, [status]);

  // Handle Transfer Confirmation
  const handleTransferConfirm = useCallback(() => {
    if (voiceClientRef.current && transferCallId && pendingTransfer) {
      voiceClientRef.current.sendFunctionResult(transferCallId, {
        approved: true,
        recipient: pendingTransfer.recipient,
        iban: pendingTransfer.iban,
        amount: pendingTransfer.amount,
        currency: pendingTransfer.currency || 'EUR',
        message: 'Überweisung wurde bestätigt'
      });
      setPendingTransfer(null);
      setTransferCallId(null);
      setShowTransferModal(false);
      setIsLoadingTransfer(false);
    }
  }, [transferCallId, pendingTransfer]);

  const handleTransferReject = useCallback(() => {
    if (voiceClientRef.current && transferCallId) {
      voiceClientRef.current.sendFunctionResult(transferCallId, {
        approved: false,
        message: 'Überweisung wurde abgebrochen'
      });
      setPendingTransfer(null);
      setTransferCallId(null);
      setShowTransferModal(false);
      setIsLoadingTransfer(false);
    }
  }, [transferCallId]);

  // Handle Appointment Selection (WORKFLOW HITL)
  const handleAppointmentSelect = useCallback((appointment: any) => {
    if (voiceClientRef.current && appointmentCallId) {
      console.log('📅 Appointment selected (Workflow validation):', appointment);
      
      // Add user message to transcript showing the selection
      const dateObj = new Date(appointment.datum);
      const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      const formattedDate = `${days[dateObj.getDay()]}, ${dateObj.getDate()}. ${dateObj.toLocaleString('de-DE', { month: 'long' })} ${dateObj.getFullYear()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: `appointment-select-${Date.now()}`,
          role: 'user' as const,
          content: `📅 Termin ausgewählt: ${formattedDate} um ${appointment.uhrzeit} Uhr`,
          timestamp: new Date(),
        },
      ]);
      
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
      
      // Add user message to transcript showing the cancellation
      setMessages((prev) => [
        ...prev,
        {
          id: `appointment-cancel-${Date.now()}`,
          role: 'user' as const,
          content: '❌ Terminauswahl abgebrochen',
          timestamp: new Date(),
        },
      ]);
      
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
                {/* Avatar Container - hidden (opacity-0) in text mode to keep WebRTC alive */}
                <div 
                  className={cn(
                    "overflow-hidden",
                    "transition-all duration-700",
                    isTextMode
                      ? "absolute bottom-0 right-0 w-full h-full rounded-none opacity-0 pointer-events-none"
                      : isTranscriptMode 
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
                    isPip={isTranscriptMode && !isTextMode} 
                    isConnected={isConnected} 
                    hasVideo={hasVideoConnection}
                    videoRef={videoRef}
                  />
                </div>

                {/* Transcript View - visible in transcript mode OR text mode */}
                <div 
                  className={cn(
                    "absolute inset-0 w-full h-full p-4 overflow-y-auto transition-opacity duration-300",
                    (isTranscriptMode || isTextMode) ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
                  )}
                  style={{background: '#f8faff'}}
                >
                  <TranscriptView
                    messages={messages}
                    isSessionActive={isConnected}
                    isLoading={isTextMode && isWaitingForResponse && !messages.some(m => m.id === 'ai-streaming')}
                    appointmentBadges={
                      isTextMode && showAppointmentModal && appointmentData
                        ? {
                            appointments: appointmentData.appointments || [],
                            advisor: appointmentData.advisor || { name: 'Michael Weber', title: 'Senior Bankberater', avatarUrl: '/advisor-avatar.svg' },
                            onSelect: handleAppointmentSelect,
                            onCancel: handleAppointmentCancel,
                          }
                        : null
                    }
                  />
                </div>
                
                {/* Floating Controls Overlay - Bottom Right (only in pure Avatar mode) */}
                {!isTranscriptMode && !isTextMode && (
                  <div className="absolute bottom-4 right-4 z-20">
                    <SessionControls
                      isMicActive={isMicActive}
                      isTranscriptMode={isTranscriptMode}
                      isTextMode={isTextMode}
                      isConnected={isConnected}
                      onMicToggle={handleMicToggle}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onTranscriptToggle={handleTranscriptToggle}
                      onTextModeToggle={handleTextModeToggle}
                      variant="compact"
                      className="shadow-lg"
                    />
                  </div>
                )}
              </div>
              
              {/* Bottom Part: Controls */}
              <div className="flex-shrink-0 z-10 relative" style={{borderTop: '1px solid #e2e8f0', background: '#fff'}}>
                
                {/* Controls in Transcript or Text Mode */}
                {(isTranscriptMode || isTextMode) && (
                  <div className="flex flex-col gap-2 pb-2">
                    {/* Text input bar – only in text mode */}
                    {isTextMode && (
                      <TextInputBar
                        onSendText={handleSendText}
                        disabled={!isConnected}
                        className="mx-3"
                      />
                    )}
                    <div className="flex justify-center">
                      <SessionControls
                        isMicActive={isMicActive}
                        isTranscriptMode={isTranscriptMode}
                        isTextMode={isTextMode}
                        isConnected={isConnected}
                        onMicToggle={handleMicToggle}
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        onTranscriptToggle={handleTranscriptToggle}
                        onTextModeToggle={handleTextModeToggle}
                        variant="compact"
                        className="shadow-md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Transfer Confirmation Modal – gated by Speech Coordinator */}
      {showTransferModal && (
        <TransferConfirmation
          transfer={pendingTransfer}
          isOpen={showTransferModal}
          onConfirm={handleTransferConfirm}
          onReject={handleTransferReject}
        />
      )}

      {/* Appointment Booking Modal – only shown outside text mode */}
      {appointmentData && showAppointmentModal && !isTextMode && (
        <AppointmentBooking
          appointments={appointmentData.appointments || []}
          advisor={appointmentData.advisor || { name: "Michael Weber", title: "Senior Bankberater", avatarUrl: "/advisor-avatar.svg" }}
          isOpen={showAppointmentModal}
          onSelect={handleAppointmentSelect}
          onCancel={handleAppointmentCancel}
        />
      )}

      {/* Loading Overlay for Transfers */}
      {isLoadingTransfer && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center" style={{background: 'rgba(0,0,0,0.35)'}}>
          <div className="rounded-2xl p-8 flex flex-col items-center gap-4" style={{background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.15)'}}>
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor: '#7da0d7', borderTopColor: 'transparent'}} />
            <p className="text-lg font-medium">Überweisung wird vorbereitet...</p>
          </div>
        </div>
      )}

      {/* Loading Overlay for Appointments – only shown outside text mode */}
      {isLoadingAppointments && !isTextMode && (
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
