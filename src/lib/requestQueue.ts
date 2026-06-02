/**
 * API Request Queue - Prevents concurrent requests to same endpoint
 * Useful for preventing rate limit errors when multiple requests are queued
 */

interface QueuedRequest<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests: Map<string, boolean> = new Map();

  /**
   * Add a request to the queue and execute when slot is available
   */
  async enqueue<T>(
    endpoint: string,
    fn: () => Promise<T>,
    maxConcurrent = 1
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: `${endpoint}-${Date.now()}-${Math.random()}`,
        fn,
        resolve,
        reject,
      };

      this.queue.push(request);
      this.processQueue(endpoint, maxConcurrent);
    });
  }

  private async processQueue(endpoint: string, maxConcurrent: number) {
    const activeCount = Array.from(this.activeRequests.values()).filter(v => v).length;
    if (activeCount >= maxConcurrent) {
      console.log(`⏳ Request queue: ${this.queue.length} waiting, ${activeCount} active (max ${maxConcurrent})`);
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.activeRequests.set(request.id, true);

    try {
      console.log(`🚀 Executing queued request: ${endpoint}`);
      const result = await request.fn();
      request.resolve(result);
    } catch (error) {
      console.error(`❌ Queued request failed: ${endpoint}`, error);
      request.reject(error);
    } finally {
      this.activeRequests.set(request.id, false);
      this.activeRequests.delete(request.id);
      
      // Process next request
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(endpoint, maxConcurrent), 100);
      }
    }
  }

  /**
   * Clear all queued requests
   */
  clear() {
    console.log(`🗑️ Clearing request queue: ${this.queue.length} requests`);
    this.queue = [];
    this.activeRequests.clear();
  }

  /**
   * Get queue stats
   */
  getStats() {
    const activeCount = Array.from(this.activeRequests.values()).filter(v => v).length;
    return {
      queued: this.queue.length,
      active: activeCount,
      total: this.queue.length + activeCount,
    };
  }
}

export const mockupRequestQueue = new RequestQueue();
