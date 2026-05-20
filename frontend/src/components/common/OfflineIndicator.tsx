import { Box, Chip, Tooltip, Badge, CircularProgress } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon from '@mui/icons-material/Sync';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useSyncStore } from '@/store/syncStore';

export default function OfflineIndicator() {
  const { isOnline, isSyncing } = useOfflineSync();
  const { queue, lastSyncAt } = useSyncStore();
  const pendingCount = queue.filter((op) => op.status === 'pending' || op.status === 'failed').length;

  if (!isOnline) {
    return (
      <Tooltip title="You are offline. Changes will sync when reconnected.">
        <Chip
          icon={<WifiOffIcon />}
          label="Offline"
          size="small"
          color="warning"
          variant="filled"
          sx={{ fontWeight: 600 }}
        />
      </Tooltip>
    );
  }

  if (isSyncing) {
    return (
      <Tooltip title="Syncing changes...">
        <Chip
          icon={<CircularProgress size={12} />}
          label="Syncing..."
          size="small"
          color="info"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (pendingCount > 0) {
    return (
      <Tooltip title={`${pendingCount} changes pending sync`}>
        <Badge badgeContent={pendingCount} color="warning">
          <Chip icon={<SyncIcon />} label="Pending" size="small" color="warning" variant="outlined" />
        </Badge>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`Last synced: ${lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString('en-IN') : 'Never'}`}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <CloudDoneIcon fontSize="small" color="success" />
      </Box>
    </Tooltip>
  );
}
