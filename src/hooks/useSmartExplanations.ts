import { useState, useCallback } from 'react';
import { PREDETERMINED_EXPLANATIONS } from '@/data/explanations';
import { useOptimizedAI } from '@/hooks/useOptimizedAI';
import { useToast } from '@/hooks/use-toast';

export function useSmartExplanations() {
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, string>>({});
  const { callAI, loading, setLoading } = useOptimizedAI();
  const { toast } = useToast();
  const [explanationLoading, setExplanationLoading] = useState<string | null>(null);

  const getExplanation = useCallback(async (question: string, layer: number) => {
    // First, try to get predetermined explanation
    const predeterminedExplanation = PREDETERMINED_EXPLANATIONS[question];
    
    if (predeterminedExplanation && !explanations[question]) {
      setExplanations(prev => ({ ...prev, [question]: predeterminedExplanation }));
      return predeterminedExplanation;
    }
    
    return explanations[question] || predeterminedExplanation || null;
  }, [explanations]);

  const getExpandedExplanation = useCallback(async (question: string, layer: number, context?: any) => {
    if (expandedExplanations[question]) {
      return expandedExplanations[question];
    }
    setExplanationLoading(question);
    try {
      const response = await callAI('explain', question, { layer, context });
      if (response) {
        setExpandedExplanations(prev => ({ ...prev, [question]: response }));
        return response;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get expanded explanation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExplanationLoading(null);
    }
    
    return null;
  }, [callAI, expandedExplanations, toast]);

  return {
    getExplanation,
    getExpandedExplanation,
    explanations,
    expandedExplanations,
    loading: explanationLoading,
  };
}
