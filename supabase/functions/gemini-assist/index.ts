import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY secret");

    const { mode, question, context, prompt } = await req.json();

    const basePrompt =
      "You are Career Compass, a warm, concise, expert career & academic counselor. Use accessible language and avoid buzzwords.";

    let finalPrompt = basePrompt + "\n\n";

    // Create a context summary from previous responses for personalization
    let contextSummary = "";
    if (context?.responses) {
      contextSummary = "Based on the user's previous responses:\n";
      
      // Summarize key insights from previous layers
      const responseEntries = Object.entries(context.responses);
      
      // Layer 1: Intelligence strengths
      const layer1Responses = responseEntries.filter(([key]) => key.startsWith("Linguistic:") || 
        key.includes("Logical-Mathematical") || 
        key.includes("Interpersonal") || 
        key.includes("Intrapersonal") || 
        key.includes("Naturalistic") || 
        key.includes("Bodily-Kinesthetic") || 
        key.includes("Musical") || 
        key.includes("Visual-Spatial") ||
        key.includes("Cognitive Styles"));
      
      if (layer1Responses.length > 0) {
        contextSummary += "- Their intelligence strengths include: ";
        const strengths = layer1Responses
          .filter(([, value]) => value?.label === "Agree" || value?.label === "Strongly Agree")
          .map(([key]) => key.split(":")[0])
          .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
        contextSummary += strengths.join(", ") + "\n";
      }
      
      // Layer 2: Personality traits
      const layer2Responses = responseEntries.filter(([key]) => key.includes("MBTI") || 
        key.includes("Big Five") || 
        key.includes("SDT"));
      
      if (layer2Responses.length > 0) {
        contextSummary += "- Their personality traits suggest they are: ";
        // This would need more detailed analysis based on actual responses
        contextSummary += "detail-oriented and values-driven\n";
      }
      
      // Layer 3: Aptitudes
      const layer3Responses = responseEntries.filter(([key]) => key.includes("Numerical Aptitude") || 
        key.includes("Verbal Aptitude") || 
        key.includes("Abstract Reasoning") || 
        key.includes("Technical Skills") || 
        key.includes("Creative/Design Skills") || 
        key.includes("Communication Skills"));
      
      if (layer3Responses.length > 0) {
        contextSummary += "- They have strong aptitudes in: ";
        const aptitudes = layer3Responses
          .filter(([, value]) => value?.label === "Agree" || value?.label === "Strongly Agree")
          .map(([key]) => key.split(":")[0])
          .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
        contextSummary += aptitudes.join(", ") + "\n";
      }
      
      // Layer 4 & 5: Background and interests
      const layer45Responses = responseEntries.filter(([key]) => key.includes("Educational Background") || 
        key.includes("Socioeconomic Factors") || 
        key.includes("Career Exposure") || 
        key.includes("Interests and Passions") || 
        key.includes("Career Trends Awareness") || 
        key.includes("Personal Goals and Values"));
      
      if (layer45Responses.length > 0) {
        contextSummary += "- Their background and interests indicate: ";
        // This would need more detailed analysis
        contextSummary += "a strong alignment between personal values and career goals\n";
      }
    }

    if (mode === "explain" && question) {
      finalPrompt += `Explain why this question matters in career counseling and what a good answer considers. Question: "${question}". Keep it to 60-90 words.`;
    } else if (mode === "suggest" && question) {
      finalPrompt += `Your response must be a valid JSON object in the format: { "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"] }. Provide three distinct, personalized, and instructive suggestions for answering the following open-ended question. Each suggestion should be 80-100 words. Base your suggestions on the user's context provided below. Question: "${question}". Context: ${contextSummary}`;
    } else if (mode === "chat" && prompt) {
      finalPrompt += `Respond as a counselor. Be specific and actionable in 2-4 short paragraphs. User: ${prompt}. Context: ${JSON.stringify(
        context || {}
      )}.`;
    } else if (mode === 'recommendations' && context) {
      finalPrompt += `You are Career Compass, an expert career counselor. Based on the user's comprehensive assessment results provided in the context, generate a ranked list of the top 5 most suitable career paths for them. Your response MUST be a valid JSON object in the format: { "recommendations": [ { "rank": 1, "title": "Career Title", "explanation": "Why this career is a good fit...", "salary": "$80,000 - $120,000 USD", "onetLink": "https://www.onetonline.org/link/to/summary/..." }, ... ] }. Provide a concise explanation for each ranking, an estimated annual salary range in USD, and a plausible O*NET OnLine link for a relevant occupation. The user's assessment context is: ${JSON.stringify(context)}`;
    } else {
      throw new Error("Invalid parameters");
    }

    // Format for Gemini API
    const requestBody = {
      contents: [{
        parts: [{
          text: finalPrompt
        }]
      }]
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!geminiRes.ok) {
      const txt = await geminiRes.text();
      console.error("Gemini error:", txt);
      return new Response(JSON.stringify({ error: txt }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    if (mode === 'suggest' || mode === 'recommendations') {
      // The output from Gemini might be wrapped in ```json ... ```, so we need to extract it.
      const jsonMatch = rawText.match(/```json([\s\S]*)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : rawText;
      try {
        const parsed = JSON.parse(jsonString);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response:", jsonString);
        // Fallback to a structured error to be handled by the client
        return new Response(JSON.stringify({ error: "Invalid JSON response from AI." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ text: rawText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gemini-assist error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
