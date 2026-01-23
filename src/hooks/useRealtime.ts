import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealtime(options: UseRealtimeOptions) {
  const { table, filter, onInsert, onUpdate, onDelete } = options;
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 创建实时订阅
    const channelName = `${table}${filter ? `:${filter}` : ''}`;
    const realtimeChannel = supabase.channel(channelName);

    // 订阅表变化
    realtimeChannel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter && { filter }),
        },
        (payload) => {
          console.log('实时更新:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new);
              break;
            case 'UPDATE':
              onUpdate?.(payload.new);
              break;
            case 'DELETE':
              onDelete?.(payload.old);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('订阅状态:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(realtimeChannel);

    // 清理订阅
    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [table, filter, onInsert, onUpdate, onDelete]);

  return { channel, isConnected };
}

