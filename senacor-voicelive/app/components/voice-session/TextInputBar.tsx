'use client';

import { useState, useRef, KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextInputBarProps {
  onSendText: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TextInputBar({ onSendText, disabled, className }: TextInputBarProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSendText(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-2xl",
        className
      )}
      style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Nachricht eingeben…"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 disabled:opacity-50"
        style={{ color: '#1a1a2e', minWidth: 0 }}
        autoComplete="off"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Senden"
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
          value.trim() && !disabled
            ? "opacity-100 cursor-pointer"
            : "opacity-30 cursor-not-allowed"
        )}
        style={{ background: '#4a7fc1' }}
      >
        <SendHorizontal className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
