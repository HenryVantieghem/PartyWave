import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

/**
 * Image caching and optimization utilities
 * Implements aggressive caching for better performance
 */

const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;

export class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, string> = new Map();

  private constructor() {
    this.initCache();
  }

  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  private async initCache() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.warn('Failed to initialize image cache:', error);
    }
  }

  private getCacheKey(uri: string): string {
    return uri.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  async getCachedImage(uri: string): Promise<string> {
    if (this.cache.has(uri)) {
      return this.cache.get(uri)!;
    }

    const cacheKey = this.getCacheKey(uri);
    const cachePath = `${CACHE_DIR}${cacheKey}`;

    try {
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      if (fileInfo.exists) {
        this.cache.set(uri, cachePath);
        return cachePath;
      }

      // Download and cache
      await FileSystem.downloadAsync(uri, cachePath);
      this.cache.set(uri, cachePath);
      return cachePath;
    } catch (error) {
      console.warn('Image cache error:', error);
      return uri; // Fallback to original URI
    }
  }

  async prefetchImages(uris: string[]): Promise<void> {
    const prefetchPromises = uris.map((uri) =>
      Image.prefetch(uri).catch((error) => console.warn('Prefetch error:', error))
    );
    await Promise.all(prefetchPromises);
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      this.cache.clear();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
      let totalSize = 0;

      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.warn('Failed to get cache size:', error);
      return 0;
    }
  }
}

export const imageCache = ImageCache.getInstance();
