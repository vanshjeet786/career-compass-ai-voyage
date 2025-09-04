import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateUserProfile, generateCareerRecommendations, UserProfile, CareerRecommendation, ResponseData } from '@/utils/userProfile';
import { userProfileCache } from '@/utils/performance';

export interface AIEnhancedResults {
  insights: string;
  recommendations: CareerRecommendation[];
  visualizationData: {
    labels: string[];
    baseScores: number[];
    enhancedScores: number[];
  };
  userProfile: UserProfile;
}

export function useEnhancedAI() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateEnhancedResults = useCallback(async (
    assessmentId: string,
    responses: ResponseData[]
  ): Promise<AIEnhancedResults | null> => {
    // Check cache first
    const cacheKey = `enhanced_results_${assessmentId}`;
    const cachedResults = userProfileCache.get(cacheKey);
    if (cachedResults) {
      return cachedResults;
    }

    setLoading(true);
    try {
      // Generate comprehensive user profile
      const userProfile = generateUserProfile(responses, assessmentId);
      
      // Generate career recommendations
      const recommendations = generateCareerRecommendations(userProfile);
      
      // Create AI prompt for enhanced insights
      const aiPrompt = `As a warm, professional career counselor, analyze this user's comprehensive assessment results and provide personalized insights.

USER PROFILE SUMMARY:
- Intelligence Strengths: ${userProfile.overallScores.topStrengths.map(s => `${s.category} (${s.score.toFixed(1)}/5)`).join(', ')}
- Development Areas: ${userProfile.overallScores.developmentAreas.map(s => `${s.category} (${s.score.toFixed(1)}/5)`).join(', ')}
- Overall Score: ${userProfile.overallScores.totalScore.toFixed(1)}/5

Layer 6 Qualitative Insights: ${JSON.stringify(userProfile.layer6Insights, null, 2)}

Please provide a comprehensive analysis in this exact JSON format:
{
  "insights": "2-3 paragraph summary combining quantitative strengths with Layer 6 qualitative insights. Address fears, goals, and personal context.",
  "visualizationData": {
    "labels": ["Linguistic", "Logical-Mathematical", "Interpersonal", "Intrapersonal", "Technical Skills", "Creative Skills"],
    "baseScores": [score1, score2, score3, score4, score5, score6],
    "enhancedScores": [adjustedScore1, adjustedScore2, adjustedScore3, adjustedScore4, adjustedScore5, adjustedScore6]
  }
}

For enhancedScores, adjust the base intelligence/aptitude scores based on Layer 6 insights (e.g., if they mention artistic goals, boost Creative Skills by 0.3-0.8 points). Keep scores between 0-5.`;

      // Call AI for enhanced insights
      const { data, error } = await supabase.functions.invoke('gemini-assist', {
        body: { 
          mode: 'chat', 
          prompt: aiPrompt,
          context: { 
            responses,
            assessmentId,
            userProfile 
          }
        }
      });

      if (error) throw error;

      let aiResponse;
      try {
        // Try to parse JSON response from AI
        const jsonMatch = data.generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.warn('Failed to parse AI JSON, using fallback:', parseError);
        // Fallback if AI doesn't return proper JSON
        aiResponse = {
          insights: data.generatedText || "Based on your assessment results, you demonstrate strong capabilities across multiple areas. Your responses indicate a well-rounded profile with particular strengths in analytical thinking and interpersonal skills. Consider exploring career paths that leverage these natural abilities while aligning with your personal interests and values.",
          visualizationData: {
            labels: ["Linguistic", "Logical-Mathematical", "Interpersonal", "Intrapersonal", "Technical Skills", "Creative Skills"],
            baseScores: [3.5, 4.0, 4.2, 3.8, 3.6, 3.4],
            enhancedScores: [3.7, 4.2, 4.4, 4.0, 3.9, 3.8]
          }
        };
      }

      const enhancedResults: AIEnhancedResults = {
        insights: aiResponse.insights,
        recommendations,
        visualizationData: aiResponse.visualizationData,
        userProfile
      };

      // Cache results for 30 minutes
      userProfileCache.set(cacheKey, enhancedResults, 30 * 60 * 1000);

      return enhancedResults;

    } catch (error) {
      console.error('Error generating enhanced results:', error);
      toast({
        title: "AI Enhancement Error",
        description: "Failed to generate enhanced insights. Showing basic results.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    generateEnhancedResults,
    loading
  };
}