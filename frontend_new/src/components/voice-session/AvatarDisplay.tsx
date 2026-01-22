import { cn } from "@/lib/utils";
import avatarImage from "@/assets/avatar-assistant.png";
import { RefObject } from "react";

interface AvatarDisplayProps {
  isPip?: boolean;
  isConnected: boolean;
  hasVideo?: boolean;
  videoRef?: RefObject<HTMLVideoElement>;
  className?: string;
}

export function AvatarDisplay({ isPip, isConnected, hasVideo, videoRef, className }: AvatarDisplayProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-b from-secondary to-background",
        isPip ? "w-full h-full" : "w-full h-full flex items-center justify-center",
        className
      )}
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
            <div className="absolute w-48 h-48 rounded-full border-2 border-primary/20 animate-ping" />
          </div>
        )}
      </div>

      {/* Avatar Label - only on main view */}
      {!isPip && (
        <div className="absolute bottom-2 left-2 glass-card px-2 py-1 rounded-lg z-20">
          <span className="font-medium text-sm">
            {hasVideo ? "Live Avatar" : "Avatar"}
          </span>
        </div>
      )}
    </div>
  );
}
