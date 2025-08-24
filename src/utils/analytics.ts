import { supabase } from '@/integrations/supabase/client'

export interface AnalyticsEvent {
  event_name: string
  user_id?: string
  session_id?: string
  properties?: Record<string, any>
  timestamp?: string
}

class Analytics {
  private sessionId: string
  private userId?: string
  private events: AnalyticsEvent[] = []
  private flushInterval: number = 30000 // 30 seconds
  private maxBatchSize: number = 20

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startAutoFlush()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private startAutoFlush(): void {
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      event_name: eventName,
      user_id: this.userId,
      session_id: this.sessionId,
      properties,
      timestamp: new Date().toISOString(),
    }

    this.events.push(event)

    // Flush if batch is full
    if (this.events.length >= this.maxBatchSize) {
      this.flush()
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics:', eventName, properties)
    }
  }

  async flush(): Promise<void> {
    if (this.events.length === 0) return

    const eventsToFlush = [...this.events]
    this.events = []

    try {
      // Store in localStorage as fallback
      const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]')
      localStorage.setItem('analytics_events', JSON.stringify([...existingEvents, ...eventsToFlush]))

      // TODO: Send to analytics service when available
      // await supabase.functions.invoke('analytics-collector', {
      //   body: { events: eventsToFlush }
      // })
      
      console.log(`📊 Flushed ${eventsToFlush.length} analytics events`)
    } catch (error) {
      console.error('Failed to flush analytics events:', error)
      // Add events back to queue for retry
      this.events.unshift(...eventsToFlush)
    }
  }

  // Assessment-specific tracking
  trackAssessmentStart(assessmentId: string): void {
    this.track('assessment_started', { assessment_id: assessmentId })
  }

  trackAssessmentComplete(assessmentId: string, duration: number): void {
    this.track('assessment_completed', { 
      assessment_id: assessmentId, 
      duration_ms: duration 
    })
  }

  trackLayerComplete(assessmentId: string, layer: number, duration: number): void {
    this.track('layer_completed', {
      assessment_id: assessmentId,
      layer_number: layer,
      duration_ms: duration,
    })
  }

  trackAIAssist(type: 'explain' | 'suggest' | 'chat', question: string, responseTime: number): void {
    this.track('ai_assist_used', {
      assist_type: type,
      question_hash: btoa(question).slice(0, 16), // Hash for privacy
      response_time_ms: responseTime,
    })
  }

  trackPDFExport(assessmentId: string): void {
    this.track('pdf_exported', { assessment_id: assessmentId })
  }

  trackError(error: string, context?: Record<string, any>): void {
    this.track('error_occurred', {
      error_message: error,
      ...context,
    })
  }

  // Page tracking
  trackPageView(path: string): void {
    this.track('page_view', { path })
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, context?: Record<string, any>): void {
    this.track('performance_metric', {
      metric_name: metric,
      value,
      ...context,
    })
  }
}

export const analytics = new Analytics()

// Performance observer for Core Web Vitals
if (typeof window !== 'undefined') {
  // Track page load performance
  window.addEventListener('load', () => {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      if (entries.length > 0) {
        const lcp = entries[entries.length - 1]
        analytics.trackPerformance('lcp', lcp.startTime)
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    if ('PerformanceEventTiming' in window) {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach((entry: any) => {
          if (entry.processingStart) {
            analytics.trackPerformance('fid', entry.processingStart - entry.startTime)
          }
        })
      }).observe({ entryTypes: ['first-input'] })
    }

    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let clsScore = 0
      const entries = entryList.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput && entry.value) {
          clsScore += entry.value
        }
      })
      if (clsScore > 0) {
        analytics.trackPerformance('cls', clsScore)
      }
    }).observe({ entryTypes: ['layout-shift'] })
  })
}