import { useEffect, useCallback, useRef } from 'react';
import { useSyncStore } from '@/store/syncStore';
import api from '@/utils/axios';

export function useOfflineSync() {
  const { isOnline, isSyncing, setOnline, setSyncing, setLastSync, markDone, markFailed, clearDone, getPendingOps } = useSyncStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [setOnline]);

  const sync = useCallback(async () => {
    if (isSyncing || !isOnline) return;
    const pending = getPendingOps().filter((op) => op.retries < 3);
    if (pending.length === 0) return;

    setSyncing(true);
    try {
      const { data } = await api.post('/sync/batch', {
        deviceId: localStorage.getItem('fb-device-id') || 'web',
        operations: pending,
      });

      const results: Array<{ clientId: string; status: string; error?: string }> = data.data || [];
      results.forEach((r) => {
        if (r.status === 'completed') markDone(r.clientId);
        else markFailed(r.clientId, r.error || 'Unknown error');
      });

      clearDone();
      setLastSync(new Date().toISOString());
    } catch {
      pending.forEach((op) => markFailed(op.clientId, 'Network error'));
    } finally {
      setSyncing(false);
    }
  }, [isOnline, isSyncing, getPendingOps, setSyncing, markDone, markFailed, clearDone, setLastSync]);

  useEffect(() => {
    if (isOnline) {
      sync();
      intervalRef.current = setInterval(sync, 60000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isOnline, sync]);

  return { isOnline, isSyncing };
}
