'use client';

import { Phone, MessageSquare, Calendar, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AppointmentBadge {
  id: string;
  datum: string;
  uhrzeit: string;
  verfuegbar: boolean;
}

interface AppointmentBadgesData {
  appointments: AppointmentBadge[];
  advisor: { name: string; title: string; avatarUrl: string };
  onSelect: (appointment: AppointmentBadge) => void;
  onCancel: () => void;
}

interface TranscriptViewProps {
  messages: Message[];
  isSessionActive: boolean;
  className?: string;
  isLoading?: boolean;
  appointmentBadges?: AppointmentBadgesData | null;
}

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
};

export function TranscriptView({
  messages,
  isSessionActive,
  className,
  isLoading,
  appointmentBadges,
}: TranscriptViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  // Track whether the user has scrolled away from the bottom
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 80; // px tolerance
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  // Only auto-scroll if the user is near the bottom
  useEffect(() => {
    if (scrollRef.current && isNearBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, appointmentBadges]);

  const isEmpty = messages.length === 0 && !isLoading && !appointmentBadges;

  const handleAppointmentClick = (appointment: AppointmentBadge) => {
    if (!appointment.verfuegbar || !appointmentBadges) return;
    setSelectedAppointmentId(appointment.id);
    setTimeout(() => {
      appointmentBadges.onSelect(appointment);
      setSelectedAppointmentId(null);
    }, 250);
  };

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3" style={{borderBottom: '1px solid #e2e8f0'}}>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" style={{color: '#7da0d7'}} />
          <h2 className="text-lg font-semibold">Transcript</h2>
        </div>
        <p className="text-sm mt-0.5" style={{color: '#64748b'}}>
          Echtzeit-Mitschrift deiner Konversation
        </p>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{background: '#eef3fb'}}>
              <Phone className="w-8 h-8" style={{color: '#64748b'}} />
            </div>
            <p style={{color: '#64748b'}}>
              {isSessionActive
                ? "Warte auf Nachrichten..."
                : "Starte eine Voice Session um zu beginnen"}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "animate-slide-up",
                  message.role === "user" ? "flex justify-end" : "flex justify-start"
                )}
              >
                <div
                  className={
                    message.role === "user" ? "message-user" : "message-assistant"
                  }
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading / Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-slide-up">
                <div className="message-assistant">
                  <div className="flex items-center gap-1.5 py-1 px-1">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '0ms', animationDuration: '0.8s' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '150ms', animationDuration: '0.8s' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#94a3b8', animationDelay: '300ms', animationDuration: '0.8s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Selection Badges */}
            {appointmentBadges && appointmentBadges.appointments.length > 0 && (
              <div className="flex justify-start animate-slide-up">
                <div className="max-w-[95%]">
                  <div className="message-assistant" style={{ maxWidth: '100%', paddingBottom: '0.75rem' }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#7da0d7' }} />
                      <span className="text-sm font-semibold">Verfügbare Termine</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {appointmentBadges.appointments.map((apt) => {
                        const isSelected = selectedAppointmentId === apt.id;
                        return (
                          <button
                            key={apt.id}
                            onClick={() => handleAppointmentClick(apt)}
                            disabled={!apt.verfuegbar}
                            className={cn(
                              "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                              "hover:scale-105 active:scale-95",
                              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100",
                              isSelected && "ring-2 ring-offset-1 ring-[#7da0d7]"
                            )}
                            style={{
                              background: isSelected ? 'rgba(125,160,215,0.2)' : '#fff',
                              border: `1.5px solid ${isSelected ? '#7da0d7' : '#d1ddf0'}`,
                              color: '#1a1a2e',
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 flex-shrink-0" style={{ color: '#7da0d7' }} />
                              <span className="whitespace-nowrap">{formatShortDate(apt.datum)}</span>
                              <span style={{ color: '#94a3b8' }}>·</span>
                              <span className="whitespace-nowrap">{apt.uhrzeit}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={appointmentBadges.onCancel}
                      className="mt-2.5 flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                      style={{ color: '#94a3b8' }}
                    >
                      <X className="w-3 h-3" />
                      <span>Abbrechen</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
