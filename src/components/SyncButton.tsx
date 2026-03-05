import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCw, Check, AlertCircle } from 'lucide-react-native';
import type { SyncState } from '@/types';

interface SyncButtonProps {
  syncState: SyncState;
  onSync: () => void;
}

export function SyncButton({ syncState, onSync }: SyncButtonProps) {
  const { isSyncing, lastSyncAt, error } = syncState;

  // Determine icon based on state
  let Icon = RefreshCw;
  let iconColor = '#ffffff';
  
  if (error) {
    Icon = AlertCircle;
    iconColor = '#fca5a5';
  } else if (lastSyncAt && !isSyncing) {
    Icon = Check;
    iconColor = '#86efac';
  }

  return (
    <TouchableOpacity
      onPress={onSync}
      disabled={isSyncing}
      className="p-2"
      activeOpacity={0.7}
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Icon 
          size={22} 
          color={iconColor} 
          style={error ? {} : { opacity: lastSyncAt ? 0.8 : 1 }}
        />
      )}
    </TouchableOpacity>
  );
}
