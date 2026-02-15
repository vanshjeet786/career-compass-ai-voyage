
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
   * Helper to clean AI's response (remove thinking tokens if any)
   */
  private cleanAIResponse(content: string): string {
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
   * Invokes the Supabase Edge Function 'gemini-assist'
   */
  async invokeGeminiFunction(mode: string, question?: string, context?: any, prompt?: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-assist', {
        body: {
          mode,
          question,
          context,
          prompt
        },
      });

      if (error) {
        console.error('Supabase function invocation failed:', error);
        throw new Error(`Supabase function invocation failed: ${error.message}`);
      }

      // Gemini function returns { generatedText: string, text: string }
      if (data && (data.generatedText || data.text)) {
        return this.cleanAIResponse(data.generatedText || data.text);
      }

      throw new Error('Invalid response from Gemini AI service function.');
    } catch (error) {
      console.error('Error calling Gemini function:', error);
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

    const prompt = `User Profile:
        Background: ${bgText}
        Top Quantitative Strengths: ${topStrengths}
        Qualitative Responses (Layer 6):
        ${qualitativeText}

        Generate a comprehensive career roadmap analysis. Output strictly valid JSON with this structure:
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

        Do not include markdown formatting or thinking steps in the output.`;

    try {
      const rawResponse = await this.invokeGeminiFunction('chat', undefined, {}, prompt);
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
    const prompt = `User Context:
    Top Strengths: ${JSON.stringify(context.topStrengths)}
    Background: ${JSON.stringify(context.backgroundInfo)}
    User Message: "${message}"

    You are a helpful career counselor. respond concisely based on the user's profile context.`;

    try {
      // Note: 'chat' mode in gemini-assist handles conversation context differently.
      // We pass the prompt which includes history implicitly via context if needed,
      // but here we just send the consolidated prompt.
      return await this.invokeGeminiFunction('chat', undefined, context, prompt);
    } catch (error) {
      return "I'm having trouble connecting right now. Please try again later.";
    }
  }

  /**
   * Suggests answers for open-ended questions
   */
  async suggestAnswer(questionText: string, userContext: any): Promise<{ suggestions: string[]; explanation: string }> {
     const prompt = `Question: "${questionText}"
          User Context: ${JSON.stringify(userContext)}

          You are a career coach helping a user reflect. Provide 2-3 distinct, personalized starting points (suggestions) for their answer to the open-ended question. Return JSON: { \"suggestions\": [\"...\", \"...\"], \"explanation\": \"...\" }.`;

     try {
       const raw = await this.invokeGeminiFunction('suggest', questionText, userContext, prompt);
       // Gemini 'suggest' mode might return just text, so we rely on the prompt instructing JSON output
       // But strictly speaking, gemini-assist logic parses mode and handles prompt construction internally.
       // Let's rely on 'chat' mode for strict JSON if 'suggest' is too opinionated in the backend function.
       // OR we trust our prompt override in the `prompt` field if the backend uses it.

       // Checking `gemini-assist/index.ts` (from memory):
       // if mode === 'suggest', it constructs a prompt about "3 specific suggestions".
       // It doesn't guarantee JSON.
       // So we should probably use 'chat' mode here to enforce our JSON structure via the prompt.

       const jsonPrompt = `Question: "${questionText}"
       User Context: ${JSON.stringify(userContext)}
       Generate 2-3 suggestions for answering this question based on the user context.
       Output strictly valid JSON: { "suggestions": ["..."], "explanation": "..." }`;

       const jsonRaw = await this.invokeGeminiFunction('chat', undefined, {}, jsonPrompt);
       return this.safeParseJSON(jsonRaw);

     } catch (error) {
       return {
         suggestions: FALLBACK_SUGGESTIONS,
         explanation: "Here are some general ideas to get you started."
       };
     }
  }
}

export const aiService = new AIService();
