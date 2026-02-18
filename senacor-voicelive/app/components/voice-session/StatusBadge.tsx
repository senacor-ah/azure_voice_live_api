'use client';

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatus = "connected" | "connecting" | "disconnected";

interface StatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    connected: {
      label: "Verbunden",
      icon: CheckCircle2,
      className: "status-connected",
    },
    connecting: {
      label: "Verbindet...",
      icon: Loader2,
      className: "status-connecting",
    },
    disconnected: {
      label: "Getrennt",
      icon: XCircle,
      className: "status-disconnected",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      <Icon
        className={cn("w-3 h-3", status === "connecting" && "animate-spin")}
      />
      <span>{config.label}</span>
    </div>
  );
}
