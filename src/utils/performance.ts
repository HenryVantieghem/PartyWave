/**
 * Performance monitoring and profiling utilities
 * Tracks app performance metrics and identifies bottlenecks
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  endTimer(name: string): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) return null;

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return duration;
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return this.metrics;
  }

  getAverageDuration(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
    this.timers.clear();
  }

  logMetrics(): void {
    console.log('Performance Metrics:', {
      total: this.metrics.length,
      byName: this.metrics.reduce((acc, m) => {
        if (!acc[m.name]) {
          acc[m.name] = { count: 0, total: 0, avg: 0 };
        }
        acc[m.name].count++;
        acc[m.name].total += m.duration;
        acc[m.name].avg = acc[m.name].total / acc[m.name].count;
        return acc;
      }, {} as Record<string, { count: number; total: number; avg: number }>),
    });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility function for measuring async operations
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  performanceMonitor.startTimer(name);
  try {
    return await fn();
  } finally {
    const duration = performanceMonitor.endTimer(name);
    if (duration && duration > 1000) {
      console.warn(`Slow operation: ${name} took ${duration}ms`);
    }
  }
}
