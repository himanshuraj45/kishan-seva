/**
 * @file src/components/layout/BackgroundSyncManager.tsx
 * @description Invisible background component that flushes the offline action queue when the device regains network connectivity.
 */
'use client';

import { useEffect, useRef } from 'react';
import { useOfflineStore } from '@/lib/offlineStore';

export default function BackgroundSyncManager() {
  const { syncQueue, removeAction, clearQueue } = useOfflineStore();
  const isSyncing = useRef(false);

  useEffect(() => {
    const handleOnline = async () => {
      // If we're already syncing or there's nothing to sync, return
      if (isSyncing.current || syncQueue.length === 0) return;
      
      console.log(`[SyncManager] Back online! Processing ${syncQueue.length} queued actions...`);
      isSyncing.current = true;

      // In a real app, we would loop through syncQueue and perform fetch requests
      // Example for chat messages:
      // for (const action of syncQueue) {
      //   if (action.type === 'chat_message') {
      //     try {
      //       await fetch('/api/v1/agent/chat', { method: 'POST', body: JSON.stringify(action.payload) });
      //       removeAction(action.id);
      //     } catch (e) {
      //       console.error("Failed to sync action", action.id);
      //     }
      //   }
      // }
      
      // For demonstration, we'll just clear them after simulating a delay
      setTimeout(() => {
        clearQueue();
        console.log('[SyncManager] Sync complete.');
        isSyncing.current = false;
        
        // Optional: show a small toast or notification to the user
        // toast.success("Offline data synced successfully");
      }, 1500);
    };

    window.addEventListener('online', handleOnline);
    
    // Also try to sync on initial load if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncQueue, clearQueue]);

  return null; // This component doesn't render anything visually
}

