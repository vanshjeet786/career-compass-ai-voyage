import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    // Prefer Lovable AI Gateway, fallback to direct Gemini
    const useGateway = !!LOVABLE_API_KEY;

    const { mode, question, context, prompt } = await req.json();
    console.log(`gemini-assist - Mode: ${mode}`);

    const basePersona =
      "You are a warm, supportive career counselor with expertise in psychology, career development, and practical guidance.";

    // Handle enhanced-results mode with tool calling via Lovable AI Gateway
    if (mode === "enhanced-results" && useGateway) {
      const ctx = context || {};
      const systemPrompt = `${basePersona}

Analyze this user's comprehensive assessment data across all 6 layers and generate personalized career insights.

USER PROFILE:
- Top Strengths: ${ctx.topStrengths || "N/A"}
- Background Info: ${JSON.stringify(ctx.backgroundInfo || {})}

QUALITATIVE INSIGHTS (Layer 6):
${ctx.qualitativeText || "No qualitative responses provided."}`;

      const userPrompt =
        "Generate a comprehensive career analysis including narrative insights, career recommendations with pros/cons, visualization data comparing base vs enhanced scores, and a personalized roadmap with short/medium/long term steps.";

      const body = {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_career_analysis",
              description:
                "Generate a structured career analysis with insights, recommendations, visualization data, and roadmap.",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "string",
                    description:
                      "2-3 paragraphs synthesizing quantitative scores with qualitative Layer 6 insights and background context.",
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        pros: { type: "array", items: { type: "string" } },
                        cons: { type: "array", items: { type: "string" } },
                        nextSteps: { type: "array", items: { type: "string" } },
                        layer6Match: { type: "string" },
                      },
                      required: ["name", "pros", "cons", "nextSteps", "layer6Match"],
                      additionalProperties: false,
                    },
                  },
                  visualizationData: {
                    type: "object",
                    properties: {
                      labels: { type: "array", items: { type: "string" } },
                      baseScores: { type: "array", items: { type: "number" } },
                      enhancedScores: { type: "array", items: { type: "number" } },
                    },
                    required: ["labels", "baseScores", "enhancedScores"],
                    additionalProperties: false,
                  },
                  roadmap: {
                    type: "object",
                    properties: {
                      shortTerm: { type: "array", items: { type: "string" } },
                      mediumTerm: { type: "array", items: { type: "string" } },
                      longTerm: { type: "array", items: { type: "string" } },
                      fearsAddressed: { type: "array", items: { type: "string" } },
                    },
                    required: ["shortTerm", "mediumTerm", "longTerm", "fearsAddressed"],
                    additionalProperties: false,
                  },
                },
                required: ["insights", "recommendations", "visualizationData", "roadmap"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "generate_career_analysis" },
        },
      };

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gateway error:", response.status, errText);
        throw new Error(`Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall?.function?.arguments) {
        const toolResult = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({ toolResult }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fallback to text content
      const text = data.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ generatedText: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Standard explain/suggest/chat modes
    let finalPrompt = basePersona + "\n\n";

    if (mode === "explain" && question) {
      finalPrompt += `Explain why this career assessment question is important. Question: "${question}". Keep concise (60-90 words).`;
    } else if (mode === "suggest" && question) {
      finalPrompt += `Provide 3 specific, personalized suggestions for answering: "${question}". Number them 1-3. 80-100 words each.`;
    } else if (mode === "chat" && prompt) {
      finalPrompt += `Respond to: "${prompt}". Be specific, encouraging, actionable. 2-4 paragraphs.`;
    } else {
      throw new Error("Invalid parameters");
    }

    // Use Lovable AI Gateway if available, otherwise fallback to direct Gemini
    if (useGateway) {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: finalPrompt }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.choices?.[0]?.message?.content || "No response generated";

      return new Response(JSON.stringify({ generatedText, text: generatedText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: direct Gemini API
    if (!GEMINI_API_KEY) {
      throw new Error("No API key configured");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";

    return new Response(JSON.stringify({ generatedText, text: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in gemini-assist:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        generatedText: null,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
