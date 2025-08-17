'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, WifiOff, Wifi } from 'lucide-react';

// Lazy import to avoid SSR issues
const registerServiceWorker = () => {
  if (typeof window !== 'undefined') {
    import('@/lib/service-worker-registration').then(({ registerServiceWorker }) => {
      registerServiceWorker();
    });
  }
};

const checkIsOnline = () => {
  if (typeof window !== 'undefined') {
    return navigator.onLine;
  }
  return true;
};

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Register service worker
    registerServiceWorker();

    // Check online status
    const updateOnlineStatus = () => {
      setIsOffline(!checkIsOnline());
    };

    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setShowUpdateBanner(true);
        }
      });
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">
              You are offline. Some features may be limited.
            </span>
          </div>
        </div>
      )}

      {/* Update banner */}
      {showUpdateBanner && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="glass-card p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Update Available</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                A new version of InsightLoop is available.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Update Now
                </button>
                <button
                  onClick={() => setShowUpdateBanner(false)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection restored notification */}
      {!isOffline && (
        <ConnectionRestoredNotification />
      )}

      {children}
    </>
  );
}

function ConnectionRestoredNotification() {
  const [show, setShow] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      if (wasOffline && checkIsOnline()) {
        setShow(true);
        setTimeout(() => setShow(false), 3000);
      }
      setWasOffline(!checkIsOnline());
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [wasOffline]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="glass-card p-3 flex items-center gap-2 bg-green-500/10 border-green-500/20">
        <Wifi className="w-4 h-4 text-green-500" />
        <span className="text-sm text-green-700 dark:text-green-400">
          Connection restored
        </span>
      </div>
    </div>
  );
}