/**
 * @file src/lib/offlineStore.ts
 * @description Zustand store (with localStorage persistence) for offline-first functionality.
 *
 * Stores two collections:
 *  - `savedItems`: Farmer-bookmarked content (schedules, prices, diagnoses) accessible offline.
 *  - `syncQueue`:  Actions queued while offline that will be replayed when connectivity returns.
 *
 * Persistence is handled by the `zustand/middleware` `persist` plugin, keyed as
 * `kisanseva-offline-storage` in localStorage.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** The serialisable content payload stored inside a `SavedItem`. */
export type SavedItemData = Record<string, unknown>;

/** The serialisable payload for a queued sync action. */
export type SyncPayload = Record<string, unknown>;

/** A single offline-saved item (diagnosis result, price snapshot, etc.). */
export interface SavedItem {
  /** Unique ID generated at save time via `crypto.randomUUID()`. */
  id: string;
  /** Human-readable title displayed in the saved-items list. */
  title: string;
  /** Category of saved content. */
  type: 'schedule' | 'price' | 'pdf' | 'diagnosis';
  /** Serialised content payload \u2014 shape varies by `type`. */
  data: SavedItemData;
  /** Unix timestamp (ms) of when the item was saved. */
  savedAt: number;
}

/** A single action queued for replay when the device regains connectivity. */
export interface SyncAction {
  /** Unique ID generated at queue time via `crypto.randomUUID()`. */
  id: string;
  /** Discriminated type of action to replay. */
  type: 'chat_message' | 'fetch_price';
  /** Action-specific data needed to replay the request. */
  payload: SyncPayload;
  /** Unix timestamp (ms) of when the action was queued. */
  timestamp: number;
}

interface OfflineState {
  savedItems: SavedItem[];
  syncQueue: SyncAction[];

  /** Saves an item to the offline store (generates id and savedAt automatically). */
  saveItem: (item: Omit<SavedItem, 'id' | 'savedAt'>) => void;
  /** Removes a saved item by its id. */
  removeItem: (id: string) => void;

  /** Queues an action for replay on reconnect (generates id and timestamp automatically). */
  queueAction: (action: Omit<SyncAction, 'id' | 'timestamp'>) => void;
  /** Removes a single queued action by its id (call after successful replay). */
  removeAction: (id: string) => void;
  /** Empties the entire sync queue (e.g. after a full sync sweep). */
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      savedItems: [],
      syncQueue: [],

      saveItem: (item) => set((state) => ({
        savedItems: [
          { ...item, id: crypto.randomUUID(), savedAt: Date.now() },
          ...state.savedItems,
        ],
      })),

      removeItem: (id) => set((state) => ({
        savedItems: state.savedItems.filter((i) => i.id !== id),
      })),

      queueAction: (action) => set((state) => ({
        syncQueue: [
          ...state.syncQueue,
          { ...action, id: crypto.randomUUID(), timestamp: Date.now() },
        ],
      })),

      removeAction: (id) => set((state) => ({
        syncQueue: state.syncQueue.filter((a) => a.id !== id),
      })),

      clearQueue: () => set({ syncQueue: [] }),
    }),
    {
      name: 'kisanseva-offline-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
