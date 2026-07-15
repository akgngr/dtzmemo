'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Loader2, Square, CheckCircle2 } from 'lucide-react';
import { useTTS } from '@/hooks/use-tts';
import { cn } from '@/lib/utils';

interface SpeakButtonProps {
  /** The text to be spoken */
  text: string;
  /** Optional label for accessibility */
  label?: string;
  /** Visual size */
  size?: 'sm' | 'md' | 'lg';
  /** Variant — button style */
  variant?: 'icon' | 'pill' | 'subtle';
  /** Optional className */
  className?: string;
  /** Disable the button */
  disabled?: boolean;
  /** Show a small "AI" badge when ElevenLabs is used */
  showAiBadge?: boolean;
  /** Color theme */
  color?: 'emerald' | 'purple' | 'amber' | 'blue' | 'slate';
}

const colorMap: Record<string, { idle: string; hover: string; busy: string; badge: string }> = {
  emerald: { idle: 'text-emerald-600 hover:bg-emerald-50', hover: '', busy: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  purple: { idle: 'text-purple-600 hover:bg-purple-50', busy: 'text-purple-600', hover: '', badge: 'bg-purple-100 text-purple-700' },
  amber: { idle: 'text-amber-600 hover:bg-amber-50', busy: 'text-amber-600', hover: '', badge: 'bg-amber-100 text-amber-700' },
  blue: { idle: 'text-blue-600 hover:bg-blue-50', busy: 'text-blue-600', hover: '', badge: 'bg-blue-100 text-blue-700' },
  slate: { idle: 'text-slate-600 hover:bg-slate-100', busy: 'text-slate-600', hover: '', badge: 'bg-slate-100 text-slate-700' },
};

const sizeMap: Record<string, { icon: string; padding: string }> = {
  sm: { icon: 'h-4 w-4', padding: 'p-1.5' },
  md: { icon: 'h-5 w-5', padding: 'p-2' },
  lg: { icon: 'h-6 w-6', padding: 'p-3' },
};

export function SpeakButton({
  text,
  label = 'Dinle',
  size = 'md',
  variant = 'icon',
  className,
  disabled = false,
  showAiBadge = true,
  color = 'emerald',
}: SpeakButtonProps) {
  const { speak, stop, isBusy, status, provider } = useTTS();
  const [hasPlayed, setHasPlayed] = useState(false);
  const colors = colorMap[color] || colorMap.emerald;
  const sizes = sizeMap[size] || sizeMap.md;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isBusy) {
      stop();
      return;
    }
    setHasPlayed(true);
    await speak(text);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          colors.idle,
          'border-current/20 bg-white/60',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-label={label}
      >
        {status === 'loading' ? (
          <Loader2 className={cn(sizes.icon, 'animate-spin')} />
        ) : isBusy ? (
          <Square className={sizes.icon} />
        ) : (
          <Volume2 className={sizes.icon} />
        )}
        <span>{isBusy ? 'Durdur' : label}</span>
        {showAiBadge && provider && provider !== 'browser' && (
          <span className="ml-1 rounded bg-purple-100 px-1 py-0.5 text-[9px] font-bold text-purple-700">AI</span>
        )}
      </button>
    );
  }

  if (variant === 'subtle') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all',
          colors.idle,
          'hover:scale-105',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        aria-label={label}
      >
        {status === 'loading' ? (
          <Loader2 className={cn(sizes.icon, 'animate-spin')} />
        ) : isBusy ? (
          <Square className={sizes.icon} />
        ) : hasPlayed ? (
          <CheckCircle2 className={sizes.icon} />
        ) : (
          <Volume2 className={sizes.icon} />
        )}
        <span>{isBusy ? 'Durdur' : hasPlayed ? 'Tekar Dinle' : label}</span>
        {showAiBadge && provider && provider !== 'browser' && (
          <span className="rounded bg-purple-100 px-1 py-0.5 text-[9px] font-bold text-purple-700">AI</span>
        )}
      </button>
    );
  }

  // Default: icon-only button
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative rounded-full transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed',
        sizes.padding,
        colors.idle,
        className
      )}
      aria-label={label}
      title={label}
    >
      <AnimatePresence mode="wait">
        {status === 'loading' ? (
          <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className={cn(sizes.icon, 'animate-spin')} />
          </motion.span>
        ) : isBusy ? (
          <motion.span key="busy" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
            <Square className={sizes.icon} fill="currentColor" />
          </motion.span>
        ) : (
          <motion.span key="idle" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
            <Volume2 className={sizes.icon} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pulsing ring while playing */}
      {isBusy && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-current"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {showAiBadge && provider && provider !== 'browser' && (
        <span className="absolute -top-1 -right-1 rounded bg-purple-600 px-1 py-0.5 text-[8px] font-bold text-white leading-none">
          AI
        </span>
      )}
    </button>
  );
}
