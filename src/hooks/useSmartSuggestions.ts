import { useState, useCallback } from 'react';
import { PREDETERMINED_SUGGESTIONS } from '@/data/suggestions';
import { useOptimizedAI } from '@/hooks/useOptimizedAI';
import { useToast } from '@/hooks/use-toast';

export function useSmartSuggestions() {
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const { callAI, loading } = useOptimizedAI();
  const { toast } = useToast();
  const [suggestionLoading, setSuggestionLoading] = useState<string | null>(null);


  const getSuggestions = useCallback(async (question: string, layer: number, userResponses?: any) => {
    // For Layer 6, try AI first, then fall back to predetermined suggestions
    if (layer === 6) {
      return await getAISuggestions(question, layer, userResponses);
    }

    // For layers 1-5, use predetermined suggestions first
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

    setSuggestionLoading(question); // Set loading state for the specific question
    try {
      // Build context from layers 1-5 responses for Layer 6 suggestions
      const enhancedContext = { 
        layer, 
        context,
        instruction: layer === 6 ? 
          "Based on the user's responses from layers 1-5, provide 2-3 specific, actionable suggestions that explain, instruct, and provide answers for this question. Make each suggestion detailed and personalized based on their assessment responses." : 
          "Provide helpful suggestions for this question."
      };

      const response = await callAI('suggest', question, enhancedContext);
      if (response) {
        setAiSuggestions(prev => ({ ...prev, [question]: response }));
        return response;
      }
    } catch (error) {
      // For Layer 6, fall back to predetermined suggestions if AI fails
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
      setSuggestionLoading(null); // Clear loading state
    }

    return null;
  }, [callAI, aiSuggestions, toast]);

  return {
    getSuggestions,
    getAISuggestions,
    suggestions,
    aiSuggestions,
    loading: suggestionLoading
  };
}
