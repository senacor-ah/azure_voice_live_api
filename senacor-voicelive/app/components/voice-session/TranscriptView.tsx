'use client';

import { Phone, Calendar, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

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
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom();

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
      {/* Messages Area – openchat pattern: relative flex-1 + absolute scroll container */}
      <div className="relative flex-1 bg-background">
        <div
          className="absolute inset-0 touch-pan-y overflow-y-auto bg-background"
          ref={containerRef}
        >
          <div className="px-4 py-4 space-y-3">
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
                    "animate-in fade-in duration-200",
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
                <div className="flex justify-start animate-in fade-in duration-200">
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
                <div className="flex justify-start animate-in fade-in duration-200">
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

          {/* Scroll anchor */}
          <div className="min-h-[24px] shrink-0" ref={endRef} />
          </div>
        </div>

        {/* Scroll-to-bottom button */}
        <button
          aria-label="Scroll to bottom"
          className={cn(
            "absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted",
            isAtBottom
              ? "pointer-events-none scale-0 opacity-0"
              : "pointer-events-auto scale-100 opacity-100"
          )}
          onClick={() => scrollToBottom("smooth")}
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </button>
      </div>
    </div>
  );
}
