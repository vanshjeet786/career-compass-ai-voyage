import { useState, useCallback } from 'react';
import { PREDETERMINED_SUGGESTIONS } from '@/data/suggestions';
import { useOptimizedAI } from '@/hooks/useOptimizedAI';
import { useToast } from '@/hooks/use-toast';

export function useSmartSuggestions() {
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const { callAI } = useOptimizedAI();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const getSuggestions = useCallback(async (question: string, layer: number, userResponses?: any) => {
    if (layer === 6) {
      return await getAISuggestions(question, layer, userResponses);
    }
    
    const predeterminedSuggestions = PREDETERMINED_SUGGESTIONS[question];
    
    if (predeterminedSuggestions && !suggestions[question]) {
      let personalizedSuggestions = [...predeterminedSuggestions];
      
      if (userResponses && Object.keys(userResponses).length > 0) {
        personalizedSuggestions = predeterminedSuggestions.map(suggestion => suggestion);
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

    setLoading(question);
    try {
      const enhancedContext = { 
        layer, 
        context,
        instruction: layer === 6 ? 
          "Based on the user's responses from layers 1-5, provide 2-3 specific, actionable suggestions..." : 
          "Provide helpful suggestions for this question."
      };
      
      const response = await callAI('suggest', question, enhancedContext);
      if (response) {
        setAiSuggestions(prev => ({ ...prev, [question]: response }));
        return response;
      }
    } catch (error) {
      if (layer === 6) {
        const predeterminedSuggestions = PREDETERMINED_SUGGESTIONS[question];
        if (predeterminedSuggestions) {
          setSuggestions(prev => ({ ...prev, [question]: predeterminedSuggestions }));
          return predeterminedSuggestions;
        }
      }
      
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
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


