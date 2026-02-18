'use client';

import { Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TranscriptViewProps {
  messages: Message[];
  isSessionActive: boolean;
  className?: string;
}

export function TranscriptView({
  messages,
  isSessionActive,
  className,
}: TranscriptViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isEmpty = messages.length === 0;

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
          messages.map((message) => (
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
          ))
        )}
      </div>
    </div>
  );
}
