import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { mode, question, context, prompt } = await req.json();
    console.log(`Gemini request - Mode: ${mode}, Question: ${question?.substring(0, 50)}...`);

    // Base persona for all interactions
    const basePersona = `You are a warm, supportive career counselor with expertise in psychology, career development, and practical guidance. You help people discover their strengths and find fulfilling career paths.`;
    
    // Enhanced context analysis for better user profiling
    const analyzeUserContext = (userContext: any) => {
      if (!userContext) return "No assessment data available.";
      
      const { responses = [], userResponses = {}, layer = 1 } = userContext;
      
      // Analyze intelligence strengths from Layer 1
      const intelligenceScores: Record<string, number> = {};
      const personalityTraits: Record<string, number> = {};
      const aptitudes: Record<string, number> = {};
      
      // Process responses to calculate category averages
      if (Array.isArray(responses)) {
        const categoryMap: Record<string, { sum: number; count: number }> = {};
        
        responses.forEach((r: any) => {
          if (r.response_value && 'value' in r.response_value) {
            const categoryKey = r.question_id.split(':')[0] || r.question_id;
            if (!categoryMap[categoryKey]) {
              categoryMap[categoryKey] = { sum: 0, count: 0 };
            }
            categoryMap[categoryKey].sum += r.response_value.value;
            categoryMap[categoryKey].count += 1;
          }
        });
        
        Object.entries(categoryMap).forEach(([category, data]) => {
          const avgScore = data.sum / data.count;
          if (category.includes('Intelligence') || category === 'Linguistic' || category === 'Musical') {
            intelligenceScores[category] = avgScore;
          } else if (category.includes('Big Five') || category.includes('MBTI') || category.includes('SDT')) {
            personalityTraits[category] = avgScore;
          } else if (category.includes('Aptitude') || category.includes('Skills')) {
            aptitudes[category] = avgScore;
          }
        });
      }
      
      // Create comprehensive user profile summary
      const topIntelligences = Object.entries(intelligenceScores)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, score]) => `${category}: ${score.toFixed(1)}/5`);
        
      const topPersonality = Object.entries(personalityTraits)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, score]) => `${category}: ${score.toFixed(1)}/5`);
        
      const topAptitudes = Object.entries(aptitudes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category, score]) => `${category}: ${score.toFixed(1)}/5`);
      
      return `
COMPREHENSIVE USER PROFILE:

Intelligence Strengths: ${topIntelligences.join(', ') || 'Not assessed'}
Personality Highlights: ${topPersonality.join(', ') || 'Not assessed'}  
Top Aptitudes: ${topAptitudes.join(', ') || 'Not assessed'}

Assessment Layer: ${layer}/6
Total Responses: ${responses.length || 0}

${layer >= 6 ? 'QUALITATIVE INSIGHTS: Layer 6 responses provide personal context including career interests, fears, goals, and support needs.' : ''}
      `.trim();
    };

    let finalPrompt = basePersona + "\n\n";

    // Add comprehensive context analysis
    const userProfileSummary = analyzeUserContext(context);
    if (userProfileSummary !== "No assessment data available.") {
      finalPrompt += `USER ASSESSMENT CONTEXT:\n${userProfileSummary}\n\n`;
    }

    if (mode === "explain" && question) {
      finalPrompt += `Explain why this career assessment question is important and what factors should be considered when answering it. Question: "${question}". Keep your explanation concise (60-90 words) and actionable.`;
    } else if (mode === "suggest" && question) {
      finalPrompt += `Based on the user's assessment profile, provide 3 specific, personalized suggestions for answering this open-ended question. Each suggestion should be 80-100 words and tailored to their strengths and context. Number them 1-3. Question: "${question}". Focus on practical, actionable ideas that align with their assessment results.`;
    } else if (mode === "chat" && prompt) {
      finalPrompt += `As a career counselor, respond to this user message using their assessment context for personalized guidance. Be specific, encouraging, and actionable in 2-4 paragraphs. User message: "${prompt}"`;
    } else {
      throw new Error("Invalid parameters: mode must be 'explain', 'suggest', or 'chat'");
    }

    // Call Gemini API
    const requestBody = {
      contents: [{
        parts: [{
          text: finalPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };

    console.log('Calling Gemini API with prompt length:', finalPrompt.length);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return new Response(JSON.stringify({ 
      generatedText,
      text: generatedText // For backward compatibility
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in gemini-assist function:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      generatedText: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});