'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check if dismissed before
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) return;

    // Android/Chrome: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS Safari: show manual instructions
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      // Show after 3 seconds
      setTimeout(() => setShowIOSPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSPrompt(false);
    setDeferredPrompt(null);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  if (isStandalone || dismissed) return null;

  // Android/Chrome native prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📱</span>
          <div className="flex-1">
            <p className="text-sm font-bold mb-0.5">Install RepIQ</p>
            <p className="text-xs text-neutral-400">Add to your home screen for the best experience.</p>
          </div>
          <button onClick={handleDismiss} className="text-neutral-600 text-lg leading-none">×</button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleDismiss}
            className="flex-1 py-2 rounded-xl bg-neutral-800 text-neutral-400 text-sm">
            Not now
          </button>
          <button onClick={handleInstall}
            className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-sm">
            Install
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari manual instructions
  if (showIOSPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl">📱</span>
          <div className="flex-1">
            <p className="text-sm font-bold mb-0.5">Add to Home Screen</p>
            <p className="text-xs text-neutral-400">Install RepIQ for the full app experience.</p>
          </div>
          <button onClick={handleDismiss} className="text-neutral-600 text-lg leading-none">×</button>
        </div>
        <div className="bg-neutral-800 rounded-xl p-3 text-xs text-neutral-300 space-y-1.5">
          <p>1. Tap the <span className="text-white font-bold">Share</span> button <span className="text-base">⎙</span> at the bottom of Safari</p>
          <p>2. Scroll down and tap <span className="text-white font-bold">Add to Home Screen</span></p>
          <p>3. Tap <span className="text-white font-bold">Add</span></p>
        </div>
      </div>
    );
  }

  return null;
}
