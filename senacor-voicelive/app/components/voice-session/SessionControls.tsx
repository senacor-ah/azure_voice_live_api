'use client';

import { Mic, MicOff, PhoneOff, Phone, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionControlsProps {
  isMicActive: boolean;
  isTranscriptMode: boolean;
  isTextMode: boolean;
  isConnected: boolean;
  onMicToggle: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onTranscriptToggle: () => void;
  onTextModeToggle: () => void;
  variant?: "default" | "compact";
  className?: string;
}

export function SessionControls({
  isMicActive,
  isTranscriptMode,
  isTextMode,
  isConnected,
  onMicToggle,
  onConnect,
  onDisconnect,
  onTranscriptToggle,
  onTextModeToggle,
  variant = "default",
  className,
}: SessionControlsProps) {
  const isCompact = variant === "compact";
  const btnSize = isCompact ? "w-10 h-10" : "w-14 h-14";
  const iconSize = isCompact ? "w-4 h-4" : "w-6 h-6";

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center",
        isCompact ? "px-3 py-2 gap-2" : "px-6 py-3 gap-4",
        className
      )}
      style={{background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid #e2e8f0'}}
    >


      {/* Text Mode Toggle Button */}
      <button
        onClick={onTextModeToggle}
        disabled={!isConnected}
        className={cn(
          isTextMode ? "control-btn-primary rounded-full" : "control-btn-secondary rounded-full",
          "flex items-center justify-center",
          !isConnected && "opacity-50 cursor-not-allowed",
          btnSize
        )}
        title={isTextMode ? "Zurück zur Sprachsteuerung" : "Textmodus aktivieren"}
        aria-label={isTextMode ? "Sprachmodus" : "Textmodus"}
      >
        <Keyboard className={iconSize} />
      </button>

      {/* Microphone Button – hidden in text mode */}
      {!isTextMode && (
        <button
          onClick={onMicToggle}
          disabled={!isConnected}
          className={cn(
            isMicActive ? "control-btn-primary rounded-full" : "control-btn-secondary rounded-full",
            "flex items-center justify-center",
            !isConnected && "opacity-50 cursor-not-allowed",
            btnSize
          )}
          aria-label={isMicActive ? "Mikrofon stoppen" : "Mikrofon starten"}
        >
          {isMicActive ? (
            <Mic className={iconSize} />
          ) : (
            <MicOff className={iconSize} />
          )}
        </button>
      )}

      {/* Connect/Disconnect Button */}
      {isConnected ? (
        <button
          onClick={onDisconnect}
          className={cn("control-btn-destructive rounded-full flex items-center justify-center", btnSize)}
          aria-label="Auflegen"
        >
          <PhoneOff className={iconSize} />
        </button>
      ) : (
        <button
          onClick={onConnect}
          className={cn("control-btn-success rounded-full flex items-center justify-center", btnSize)}
          aria-label="Anrufen"
        >
          <Phone className={iconSize} />
        </button>
      )}
    </div>
  );
}
