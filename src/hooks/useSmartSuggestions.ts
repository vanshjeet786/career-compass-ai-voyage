import { useState, useCallback } from 'react';
import { PREDETERMINED_SUGGESTIONS } from '@/data/suggestions';
import { useOptimizedAI } from '@/hooks/useOptimizedAI';
import { useToast } from '@/hooks/use-toast';

export function useSmartSuggestions() {
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const { callAI, loading } = useOptimizedAI();
  const { toast } = useToast();

  const getSuggestions = useCallback(async (question: string, layer: number, userResponses?: any) => {
    // First, try to get predetermined suggestions
    const predeterminedSuggestions = PREDETERMINED_SUGGESTIONS[question];
    
    if (predeterminedSuggestions && !suggestions[question]) {
      // Personalize suggestions based on user responses if available
      let personalizedSuggestions = [...predeterminedSuggestions];
      
      if (userResponses && Object.keys(userResponses).length > 0) {
        // Add context-aware personalization to suggestions
        personalizedSuggestions = predeterminedSuggestions.map(suggestion => {
          // This is a simple example - in a real app, you'd want more sophisticated personalization
          return suggestion + " (based on your previous responses)";
        });
      }
      
      setSuggestions(prev => ({ ...prev, [question]: personalizedSuggestions }));
      return personalizedSuggestions;
    }
    
    return suggestions[question] || predeterminedSuggestions || [];
  }, [suggestions]);

  const getAISuggestions = useCallback(async (question: string, layer: number, context?: any) => {
    if (aiSuggestions[question]) {
      return aiSuggestions[question];
    }

    try {
      const response = await callAI('suggest', question, { layer, context });
      if (response) {
        setAiSuggestions(prev => ({ ...prev, [question]: response }));
        return response;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive"
      });
    }
    
    return null;
  }, [callAI, aiSuggestions, toast]);

  return {
    getSuggestions,
    getAISuggestions,
    suggestions,
    aiSuggestions,
    loading
  };
}