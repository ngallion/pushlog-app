import { useEffect, useState } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";

const DISMISSED_KEY = "pushlog:pwa-install-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || !isMobileDevice()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      setIos(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 rounded-xl bg-zinc-800 border border-violet-700/50 shadow-lg shadow-black/40 p-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200"
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>

      {ios ? (
        <div className="pr-6">
          <p className="text-sm font-semibold text-zinc-100 mb-1">
            Install Pushlog
          </p>
          <p className="text-xs text-zinc-400 mb-3">
            Add to your home screen for the best experience.
          </p>
          <ol className="space-y-2">
            <li className="flex items-center gap-2 text-xs text-zinc-300">
              <Share size={14} className="text-violet-400 shrink-0" />
              Tap the <span className="font-medium text-zinc-100">Share</span>{" "}
              button in Safari
            </li>
            <li className="flex items-center gap-2 text-xs text-zinc-300">
              <PlusSquare size={14} className="text-violet-400 shrink-0" />
              Select{" "}
              <span className="font-medium text-zinc-100">
                Add to Home Screen
              </span>
            </li>
          </ol>
        </div>
      ) : (
        <div className="flex items-center gap-3 pr-6">
          <div className="flex-1">
            <p className="text-sm font-semibold text-zinc-100">
              Install Pushlog
            </p>
            <p className="text-xs text-zinc-400">
              Add to your home screen for the best experience.
            </p>
          </div>
          <button
            onClick={install}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-2 rounded-lg shrink-0"
          >
            <Download size={14} />
            Install
          </button>
        </div>
      )}
    </div>
  );
}
