import { useCallback, useMemo, useRef } from 'react'

// Debounce hook for AI calls
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

// Cache with TTL for AI responses
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class TTLCache<T> {
  private cache = new Map<string, CacheItem<T>>()

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

export const aiResponseCache = new TTLCache<string>()

// Rate limiter for API calls
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    
    // Remove requests older than the time window
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    return this.requests.length < this.maxRequests
  }

  addRequest(): boolean {
    if (!this.canMakeRequest()) {
      return false
    }
    
    this.requests.push(Date.now())
    return true
  }

  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) {
      return 0
    }
    
    const oldestRequest = Math.min(...this.requests)
    return this.windowMs - (Date.now() - oldestRequest)
  }
}

// Rate limiter instance for AI calls (10 requests per minute)
export const aiRateLimiter = new RateLimiter(10, 60 * 1000)

// Performance monitoring utilities
export const performanceMonitor = {
  startTimer: (label: string) => {
    performance.mark(`${label}-start`)
  },
  
  endTimer: (label: string) => {
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)
    
    const entries = performance.getEntriesByName(label)
    const duration = entries[entries.length - 1]?.duration || 0
    
    // Log slow operations
    if (duration > 2000) {
      console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
    }
    
    return duration
  },
  
  getMetrics: () => {
    return performance.getEntriesByType('measure').map(entry => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
    }))
  }
}

// Component optimization hooks
export function useMemorizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps)
}

// Batch operations utility
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (result: R) => void; reject: (error: Error) => void }> = []
  private processing = false
  private readonly batchSize: number
  private readonly delay: number
  private readonly processor: (items: T[]) => Promise<R[]>

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 5,
    delay: number = 100
  ) {
    this.processor = processor
    this.batchSize = batchSize
    this.delay = delay
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject })
      
      if (!this.processing) {
        this.process()
      }
    })
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    setTimeout(async () => {
      const batch = this.queue.splice(0, this.batchSize)
      
      if (batch.length === 0) {
        this.processing = false
        return
      }
      
      try {
        const items = batch.map(b => b.item)
        const results = await this.processor(items)
        
        batch.forEach((b, index) => {
          b.resolve(results[index])
        })
      } catch (error) {
        batch.forEach(b => {
          b.reject(error as Error)
        })
      }
      
      this.processing = false
      
      // Process next batch if queue has items
      if (this.queue.length > 0) {
        this.process()
      }
    }, this.delay)
  }
}