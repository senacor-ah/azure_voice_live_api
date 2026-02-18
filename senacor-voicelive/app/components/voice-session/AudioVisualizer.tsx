'use client';

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function AudioVisualizer({
  isActive,
  barCount = 20,
  className,
}: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(barCount).fill(4));

  useEffect(() => {
    if (!isActive) {
      setBars(Array(barCount).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setBars(
        Array(barCount)
          .fill(0)
          .map(() => Math.random() * 24 + 4)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  return (
    <div className={cn("flex items-center justify-center gap-0.5 h-8", className)}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={cn("audio-bar", isActive && "audio-bar-active")}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}
