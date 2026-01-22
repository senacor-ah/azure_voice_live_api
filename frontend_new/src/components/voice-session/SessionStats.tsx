import { Clock, MessageCircle, Zap, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionStatsProps {
  messageCount: number;
  connectionTime: number;
  responseTime?: number;
  isConnected: boolean;
  compact?: boolean;
  className?: string;
}

export function SessionStats({
  messageCount,
  connectionTime,
  responseTime,
  isConnected,
  compact = false,
  className,
}: SessionStatsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("glass-card rounded-b-2xl p-4 h-full transition-all duration-300", className)}>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        Session Stats
      </h3>

      <div className={cn("space-y-2", compact && "space-y-1.5")}>
        <div className={cn("flex items-center justify-between", compact ? "text-xs" : "text-sm")}>
          <span className="text-muted-foreground flex items-center gap-2">
            <MessageCircle className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            Nachrichten
          </span>
          <span className="font-medium">{messageCount}</span>
        </div>

        <div className={cn("flex items-center justify-between", compact ? "text-xs" : "text-sm")}>
          <span className="text-muted-foreground flex items-center gap-2">
            <Clock className={cn(compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            Verbindungszeit
          </span>
          <span className="font-medium flex items-center gap-1.5">
            {isConnected && (
              <CheckCircle className={cn("text-success", compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
            )}
            {formatTime(connectionTime)}
          </span>
        </div>

        {responseTime !== undefined && !compact && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Antwortzeit
            </span>
            <span className="font-medium">{responseTime.toFixed(2)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
