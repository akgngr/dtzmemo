'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Don't show if: no prompt, already installed, or user dismissed
  if (!deferredPrompt || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-100 p-2.5 shrink-0">
            <Download className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">DeutschMemo'u Yukle</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Uygulamayi ana ekrana ekle. Ucus modunda bile calisabilir!
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={handleInstall} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Yukle
              </Button>
              <button onClick={handleDismiss} className="text-xs text-muted-foreground hover:text-gray-700">
                Simdi degil
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
