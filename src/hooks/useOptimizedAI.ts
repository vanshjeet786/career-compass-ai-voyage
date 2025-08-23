import { useState, useCallback } from 'react'
import { useDebounce, aiResponseCache, aiRateLimiter, performanceMonitor } from '@/utils/performance'
import { analytics } from '@/utils/analytics'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useOptimizedAI() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const callAI = useCallback(async (
    mode: 'explain' | 'suggest' | 'chat',
    question: string,
    context?: any
  ): Promise<string | null> => {
    // Check rate limiting
    if (!aiRateLimiter.addRequest()) {
      const waitTime = Math.ceil(aiRateLimiter.getTimeUntilNextRequest() / 1000)
      toast({
        title: "Rate Limited",
        description: `Please wait ${waitTime} seconds before making another AI request.`,
        variant: "destructive"
      })
      return null
    }

    // Check cache first
    const cacheKey = `${mode}_${btoa(question).slice(0, 16)}`
    const cachedResponse = aiResponseCache.get(cacheKey)
    if (cachedResponse) {
      analytics.trackAIAssist(mode, question, 0)
      return cachedResponse
    }

    setLoading(true)
    performanceMonitor.startTimer(`ai-${mode}`)

    try {
      const { data, error } = await supabase.functions.invoke('gemini-assist', {
        body: { mode, question, context }
      })

      if (error) throw error

      const response = data?.generatedText || 'No response received'
      
      // Cache the response
      aiResponseCache.set(cacheKey, response)
      
      const duration = performanceMonitor.endTimer(`ai-${mode}`)
      analytics.trackAIAssist(mode, question, duration)

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI request failed'
      analytics.trackError(errorMessage, { mode, question: question.slice(0, 50) })
      
      toast({
        title: "AI Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      })
      
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const debouncedCallAI = useDebounce(callAI, 1000)

  return {
    callAI,
    debouncedCallAI,
    loading,
    cacheSize: aiResponseCache.size(),
    canMakeRequest: aiRateLimiter.canMakeRequest()
  }
}