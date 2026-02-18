'use client';

import { User, Activity } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

interface SessionHeaderProps {
  status: ConnectionStatus;
  userName: string;
  sessionId?: string;
  className?: string;
}

export function SessionHeader({
  status,
  userName,
  sessionId,
  className,
}: SessionHeaderProps) {
  return (
    <div className={cn("px-4 py-3 rounded-2xl", className)} style={{background: '#fff', border: '1px solid #e2e8f0'}}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{userName}</p>
            {sessionId && (
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                Session: {sessionId.slice(0, 8)}...
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
