import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Offline queue for pending operations
 * Queues mutations when offline and syncs when back online
 */

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const QUEUE_KEY = '@partywave_offline_queue';

export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: QueuedOperation[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;

  private constructor() {
    this.init();
  }

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  private async init() {
    // Load queue from storage
    await this.loadQueue();

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? true;

      // Sync when coming back online
      if (wasOffline && this.isOnline) {
        this.syncQueue();
      }
    });
  }

  private async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  async addOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };

    this.queue.push(queuedOp);
    await this.saveQueue();

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncQueue();
    }
  }

  async syncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      const { supabase } = await import('@/lib/supabase');

      for (const operation of [...this.queue]) {
        try {
          switch (operation.type) {
            case 'create':
              await supabase.from(operation.table).insert(operation.data);
              break;
            case 'update':
              await supabase.from(operation.table).update(operation.data).eq('id', operation.data.id);
              break;
            case 'delete':
              await supabase.from(operation.table).delete().eq('id', operation.data.id);
              break;
          }

          // Remove from queue on success
          this.queue = this.queue.filter((op) => op.id !== operation.id);
        } catch (error) {
          console.warn('Failed to sync operation:', error);
          // Keep in queue for retry
        }
      }

      await this.saveQueue();
    } finally {
      this.isSyncing = false;
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
}

export const offlineQueue = OfflineQueue.getInstance();
