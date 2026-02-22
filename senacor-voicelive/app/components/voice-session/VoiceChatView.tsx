'use client';

import { Calendar, Clock, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Suggestion } from "@/components/ai-elements/suggestion";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { Greeting } from "./Greeting";

export interface ChatMessage {
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

interface VoiceChatViewProps {
  messages: ChatMessage[];
  isSessionActive: boolean;
  isTextMode?: boolean;
  isLoading?: boolean;
  onSendText?: (text: string) => void;
  appointmentBadges?: AppointmentBadgesData | null;
  className?: string;
}

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${days[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
};

const SUGGESTED_ACTIONS = [
  "Ich möchte eine Überweisung machen",
  "Ich möchte einen Termin mit meinem Berater",
  "Welche Produkte bietet ihr an?",
];

export function VoiceChatView({
  messages,
  isSessionActive,
  isTextMode,
  isLoading,
  onSendText,
  appointmentBadges,
  className,
}: VoiceChatViewProps) {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom();

  const handleAppointmentClick = (appointment: AppointmentBadge) => {
    if (!appointment.verfuegbar || !appointmentBadges) return;
    setSelectedAppointmentId(appointment.id);
    setTimeout(() => {
      appointmentBadges.onSelect(appointment);
      setSelectedAppointmentId(null);
    }, 250);
  };

  // Show suggestions as long as the user hasn't sent their first message
  const userHasSpoken = messages.some((m) => m.role === "user");
  const showSuggestions = !isLoading && !appointmentBadges && !userHasSpoken;

  return (
    <div className={cn("flex flex-col h-full overflow-hidden bg-background", className)}>
      {/* ── Message Area (openchat pattern: relative flex-1 + absolute scroll container) ── */}
      <Conversation className="flex-1">
        <ConversationContent scrollRef={containerRef}>
          {/* Greeting (empty state) – inside scroll area like openchat */}
          {messages.length === 0 && !isLoading && !appointmentBadges && (
            <Greeting isSessionActive={isSessionActive} />
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <Message
              key={msg.id}
              from={msg.role}
              className="animate-in fade-in duration-200"
            >
              <MessageContent>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] opacity-50 mt-1 select-none">
                  {msg.timestamp.toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </MessageContent>
            </Message>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <Message from="assistant" className="animate-in fade-in duration-200">
              <MessageContent>
                <div className="flex items-center gap-1.5 py-1 px-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms] [animation-duration:0.8s]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms] [animation-duration:0.8s]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms] [animation-duration:0.8s]" />
                </div>
              </MessageContent>
            </Message>
          )}

          {/* Appointment Selection Badges */}
          {appointmentBadges && appointmentBadges.appointments.length > 0 && (
            <Message from="assistant" className="animate-in fade-in duration-200">
              <MessageContent>
                <div className="flex items-center gap-2 mb-2.5">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-primary" />
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
                          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 border",
                          isSelected
                            ? "ring-2 ring-offset-1 ring-primary border-primary bg-primary/10"
                            : "bg-background border-border"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 flex-shrink-0 text-primary" />
                          <span className="whitespace-nowrap">{formatShortDate(apt.datum)}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="whitespace-nowrap">{apt.uhrzeit}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={appointmentBadges.onCancel}
                  className="mt-2.5 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:opacity-80"
                >
                  <X className="w-3 h-3" />
                  <span>Abbrechen</span>
                </button>
              </MessageContent>
            </Message>
          )}

          {/* Scroll anchor (like openchat's endRef spacer) */}
          <div className="min-h-[24px] shrink-0" ref={endRef} />
        </ConversationContent>

        {/* Scroll-to-bottom FAB with smooth show/hide transition */}
        <ConversationScrollButton
          isAtBottom={isAtBottom}
          onScrollToBottom={() => scrollToBottom("smooth")}
        />
      </Conversation>

      {/* ── Bottom area: Suggestions + Input (like openchat's sticky bottom) ── */}
      {isTextMode && onSendText && (
        <div className="flex-shrink-0 bg-background px-3">
          {/* Suggestions – directly above input, only when no messages sent yet */}
          {showSuggestions && isSessionActive && (
            <div className="flex flex-col gap-2 pt-3 pb-2">
              {SUGGESTED_ACTIONS.map((action, index) => (
                <Suggestion
                  key={action}
                  suggestion={action}
                  onClick={onSendText}
                  className={cn(
                    "w-full whitespace-normal text-left h-auto py-2.5 px-4 rounded-xl",
                    "animate-in fade-in slide-in-from-bottom-2 duration-300",
                  )}
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                />
              ))}
            </div>
          )}

          {/* Text Input */}
          <div className="border-t border-border pt-3 pb-3">
            <PromptInput
              onSubmit={(msg) => {
                const text = msg.text.trim();
                if (text) onSendText(text);
              }}
            >
              <PromptInputBody>
                <PromptInputTextarea placeholder="Nachricht eingeben…" />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputSubmit />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </div>
  );
}
