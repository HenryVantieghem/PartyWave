import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Centralized real-time subscription management
 * Prevents duplicate subscriptions and manages cleanup
 */

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  private constructor() {}

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  subscribe(
    key: string,
    channelName: string,
    config: {
      event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema: string;
      table: string;
      filter?: string;
    },
    callback: (payload: any) => void
  ): () => void {
    // Unsubscribe existing if present
    if (this.subscriptions.has(key)) {
      this.unsubscribe(key);
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, callback)
      .subscribe();

    this.subscriptions.set(key, channel);

    // Return cleanup function
    return () => this.unsubscribe(key);
  }

  unsubscribe(key: string): void {
    const channel = this.subscriptions.get(key);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach((channel) => channel.unsubscribe());
    this.subscriptions.clear();
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export const subscriptionManager = SubscriptionManager.getInstance();
