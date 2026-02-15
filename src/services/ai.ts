
import { supabase } from "@/integrations/supabase/client";

interface AIServiceResponse {
  suggestions?: string[];
  explanation?: string;
  insights?: string;
  recommendations?: any[];
  visualizationData?: any;
  careerFitData?: any;
  [key: string]: any;
}

// Fallback logic for when AI is unavailable
const FALLBACK_EXPLANATIONS: Record<string, string> = {
  default: "This question assesses a key aspect of your career profile. Your honest response helps ensure you receive personalized and accurate career recommendations."
};

const FALLBACK_SUGGESTIONS = [
  "Reflect on your past experiences where you felt most energized.",
  "Consider feedback you've received from mentors or peers about your strengths.",
  "Think about the types of problems you enjoy solving."
];

class AIService {
  private responseCache = new Map<string, any>();

  /**
   * Helper to clean Groq's response (remove thinking tokens if any)
   */
  private cleanGroqResponse(content: string): string {
    let cleaned = content.trim();
    // Remove <think> blocks if present (common in reasoning models)
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    // Remove markdown code blocks if the whole response is wrapped in one
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return cleaned;
  }

  /**
   * Safe JSON parser
   */
  private safeParseJSON(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Initial JSON parse failed, attempting to extract JSON object...", e);
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
         try {
            return JSON.parse(raw.substring(firstBrace, lastBrace + 1));
         } catch (e2) {
            console.error("Extraction JSON parse failed:", e2);
            throw new Error("Failed to parse JSON from AI response");
         }
      }
      throw new Error("No JSON object found in response");
    }
  }

  /**
   * Invokes the Supabase Edge Function 'groq-service'
   */
  async invokeGroqFunction(messages: any[], maxTokens: number = 2400, temperature: number = 0.7, jsonMode: boolean = false): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('groq-service', {
        body: {
          messages,
          max_tokens: maxTokens,
          temperature,
          jsonMode
        },
      });

      if (error) {
        console.error('Supabase function invocation failed:', error);
        throw new Error(`Supabase function invocation failed: ${error.message}`);
      }

      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        return this.cleanGroqResponse(data.choices[0].message.content);
      }

      throw new Error('Invalid response from Groq AI service function.');
    } catch (error) {
      console.error('Error calling Groq function:', error);
      throw error;
    }
  }

  /**
   * Generates comprehensive results (Roadmap, Insights) based on all assessment data.
   */
  async generateEnhancedResults(
    quantitativeScores: Record<string, number>,
    layer6Responses: { question: string; response: string }[],
    backgroundInfo?: any
  ): Promise<AIServiceResponse> {
    const cacheKey = `enhanced-results-${JSON.stringify(quantitativeScores)}-${JSON.stringify(layer6Responses)}-${JSON.stringify(backgroundInfo)}`;
    if (this.responseCache.has(cacheKey)) return this.responseCache.get(cacheKey);

    const topStrengths = Object.entries(quantitativeScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([k, v]) => `${k}: ${v.toFixed(1)}/5`)
      .join(', ');

    const qualitativeText = layer6Responses.map(r => `${r.question}: ${r.response}`).join('\n');
    const bgText = backgroundInfo ? JSON.stringify(backgroundInfo) : "Not provided";

    const messages = [
      {
        role: "system",
        content: `You are an expert career counselor. Analyze the user's 6-layer assessment.

        Output strictly valid JSON with this structure:
        {
          "insights": "2-3 paragraphs of synthesis...",
          "recommendations": [
            {
              "name": "Career Name",
              "pros": ["pro1", "pro2"],
              "cons": ["con1"],
              "nextSteps": ["step1", "step2"],
              "layer6Match": "Why this matches their open-ended answers"
            }
          ],
          "visualizationData": {
            "labels": ["Strength1", "Strength2"...],
            "baseScores": [4.5, 4.2...],
            "enhancedScores": [4.8, 4.4...]
          },
          "careerFitData": [
            { "career": "Career Name", "fitScore": 4.8 }
          ]
        }

        Do not include markdown formatting or thinking steps in the output.`
      },
      {
        role: "user",
        content: `User Profile:
        Background: ${bgText}
        Top Quantitative Strengths: ${topStrengths}
        Qualitative Responses (Layer 6):
        ${qualitativeText}

        Generate the career roadmap JSON.`
      }
    ];

    try {
      const rawResponse = await this.invokeGroqFunction(messages, 3000, 0.7, true);
      const parsed = this.safeParseJSON(rawResponse);
      this.responseCache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      console.error("AI Generation failed, returning fallback.", error);
      return {
        insights: "We analyzed your profile based on your scores. You show strong potential in analytical and creative fields.",
        recommendations: [],
        visualizationData: { labels: [], baseScores: [], enhancedScores: [] },
        careerFitData: []
      };
    }
  }

  /**
   * Chat with AI Counselor
   */
  async chatResponse(message: string, history: { role: string; content: string }[], context: any): Promise<string> {
    const systemPrompt = `You are a helpful career counselor.
    User Context:
    Top Strengths: ${JSON.stringify(context.topStrengths)}
    Background: ${JSON.stringify(context.backgroundInfo)}

    Keep answers concise, encouraging, and actionable.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ];

    try {
      return await this.invokeGroqFunction(messages, 500);
    } catch (error) {
      return "I'm having trouble connecting right now. Please try again later.";
    }
  }

  /**
   * Suggests answers for open-ended questions
   */
  async suggestAnswer(questionText: string, userContext: any): Promise<{ suggestions: string[]; explanation: string }> {
     const messages = [
        {
          role: "system",
          content: "You are a career coach helping a user reflect. Provide 2-3 distinct, personalized starting points (suggestions) for their answer to the open-ended question. Return JSON: { \"suggestions\": [\"...\", \"...\"], \"explanation\": \"...\" }."
        },
        {
          role: "user",
          content: `Question: "${questionText}"
          User Context: ${JSON.stringify(userContext)}

          Generate suggestions.`
        }
     ];

     try {
       const raw = await this.invokeGroqFunction(messages, 800, 0.8, true);
       return this.safeParseJSON(raw);
     } catch (error) {
       return {
         suggestions: FALLBACK_SUGGESTIONS,
         explanation: "Here are some general ideas to get you started."
       };
     }
  }
}

export const aiService = new AIService();
