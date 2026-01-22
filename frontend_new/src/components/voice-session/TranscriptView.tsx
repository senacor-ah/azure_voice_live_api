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
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Transcript</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
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
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
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
