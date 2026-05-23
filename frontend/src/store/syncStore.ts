import { create } from 'zustand';
import { persist } from 'zustand/middleware';
const uuidv4 = () => crypto.randomUUID();

export enum SyncStatus {
  PENDING = 'pending',
  SYNCING = 'syncing',
  FAILED = 'failed',
  DONE = 'done',
}

export interface SyncOperation {
  clientId: string;
  entityType: string;
  entityId?: string;
  operation: 'create' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  clientTimestamp: string;
  status: SyncStatus;
  retries: number;
  error?: string;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  queue: SyncOperation[];
  failedCount: number;
  setOnline: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  enqueue: (op: Omit<SyncOperation, 'clientId' | 'clientTimestamp' | 'status' | 'retries'>) => SyncOperation;
  markDone: (clientId: string, serverId?: string) => void;
  markFailed: (clientId: string, error: string) => void;
  clearDone: () => void;
  setLastSync: (ts: string) => void;
  getPendingOps: () => SyncOperation[];
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncAt: null,
      queue: [],
      failedCount: 0,

      setOnline: (v) => set({ isOnline: v }),
      setSyncing: (v) => set({ isSyncing: v }),

      enqueue: (op) => {
        const entry: SyncOperation = {
          ...op,
          clientId: uuidv4(),
          clientTimestamp: new Date().toISOString(),
          status: SyncStatus.PENDING,
          retries: 0,
        };
        set((s) => ({ queue: [...s.queue, entry] }));
        return entry;
      },

      markDone: (clientId) =>
        set((s) => ({
          queue: s.queue.map((op) =>
            op.clientId === clientId ? { ...op, status: SyncStatus.DONE } : op
          ),
        })),

      markFailed: (clientId, error) =>
        set((s) => ({
          queue: s.queue.map((op) =>
            op.clientId === clientId
              ? { ...op, status: SyncStatus.FAILED, error, retries: op.retries + 1 }
              : op
          ),
          failedCount: s.queue.filter((op) => op.clientId === clientId).length > 0
            ? s.failedCount + 1 : s.failedCount,
        })),

      clearDone: () =>
        set((s) => ({ queue: s.queue.filter((op) => op.status !== SyncStatus.DONE) })),

      setLastSync: (ts) => set({ lastSyncAt: ts }),

      getPendingOps: () =>
        get().queue.filter((op) => op.status === SyncStatus.PENDING || op.status === SyncStatus.FAILED),
    }),
    {
      name: 'fb-sync-queue',
      partialize: (s) => ({ queue: s.queue, lastSyncAt: s.lastSyncAt }),
    }
  )
);
