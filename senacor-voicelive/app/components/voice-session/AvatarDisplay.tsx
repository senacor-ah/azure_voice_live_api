'use client';

import { cn } from "@/lib/utils";
import React, { RefObject } from "react";

const avatarImage = "/avatar-assistant.png";

interface AvatarDisplayProps {
  isPip?: boolean;
  isConnected: boolean;
  hasVideo?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  className?: string;
}

export function AvatarDisplay({ isPip, isConnected, hasVideo, videoRef, className }: AvatarDisplayProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isPip ? "w-full h-full" : "w-full h-full flex items-center justify-center",
        className
      )}
      style={{background: 'linear-gradient(135deg, #eef3fb 0%, #dce8f5 100%)'}}
    >
      {/* Video Element for Live Avatar */}
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 bg-secondary",
          hasVideo ? "opacity-100 z-10" : "opacity-0 z-0"
        )}
        autoPlay
        playsInline
        muted={false}
      />

      {/* Static Avatar Image (Fallback when no video) */}
      <div className={cn(
        "absolute inset-0 w-full h-full transition-opacity duration-500",
        hasVideo ? "opacity-0" : "opacity-100"
      )}>
        <img
          src={avatarImage}
          alt="AI Assistant Avatar"
          className="w-full h-full object-cover"
        />
        
        {/* Connection Pulse Ring */}
        {isConnected && !isPip && !hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute w-48 h-48 rounded-full border-2 animate-ping" style={{borderColor: 'rgba(125,160,215,0.4)'}} />
          </div>
        )}
      </div>

      {/* Avatar Label - only on main view, only when video is live */}
      {!isPip && hasVideo && (
        <div className="absolute top-4 left-4 z-20 px-2 py-1 rounded-lg" style={{background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(125,160,215,0.25)'}}>
          <span className="font-medium text-sm" style={{color: '#1a1a2e'}}>
            Live Avatar
          </span>
        </div>
      )}
    </div>
  );
}
