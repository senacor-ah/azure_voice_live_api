"use client";

import { ArrowDownIcon } from "lucide-react";
import type { ComponentProps, RefObject } from "react";
import { cn } from "@/lib/utils";

/* ── Conversation (outer wrapper) ─────────────────────────── */

export type ConversationProps = ComponentProps<"div">;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <div
    className={cn("relative flex-1 bg-background", className)}
    role="log"
    {...props}
  />
);

/* ── ConversationContent (scrollable inner container) ─────── */

export type ConversationContentProps = ComponentProps<"div"> & {
  /** Ref that must be attached to the scrollable container (from useScrollToBottom) */
  scrollRef?: RefObject<HTMLDivElement | null>;
};

export const ConversationContent = ({
  className,
  scrollRef,
  children,
  ...props
}: ConversationContentProps) => (
  <div
    className="absolute inset-0 touch-pan-y overflow-y-auto bg-background"
    ref={scrollRef}
  >
    <div
      className={cn("flex flex-col gap-4 p-4", className)}
      {...props}
    >
      {children}
    </div>
  </div>
);

/* ── ConversationEmptyState ───────────────────────────────── */

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
};

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
      className
    )}
    {...props}
  >
    {icon && <div className="text-muted-foreground">{icon}</div>}
    <div className="space-y-1">
      <h3 className="font-medium text-sm">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
    {children}
  </div>
);

/* ── Scroll-to-bottom button ──────────────────────────────── */

export type ConversationScrollButtonProps = ComponentProps<"button"> & {
  isAtBottom: boolean;
  onScrollToBottom: () => void;
};

export const ConversationScrollButton = ({
  className,
  isAtBottom,
  onScrollToBottom,
  ...props
}: ConversationScrollButtonProps) => (
  <button
    aria-label="Scroll to bottom"
    className={cn(
      "absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted",
      isAtBottom
        ? "pointer-events-none scale-0 opacity-0"
        : "pointer-events-auto scale-100 opacity-100",
      className
    )}
    onClick={onScrollToBottom}
    type="button"
    {...props}
  >
    <ArrowDownIcon className="size-4" />
  </button>
);
