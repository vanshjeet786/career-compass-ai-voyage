import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const HF_API_KEY = Deno.env.get("HF_API_KEY") || Deno.env.get("HUGGING_FACE_ACCESS_TOKEN");
    if (!HF_API_KEY) throw new Error("Missing HF_API_KEY secret");

    const { mode, question, context, prompt } = await req.json();

    const basePrompt =
      "You are Career Compass, a warm, concise, expert career & academic counselor. Use accessible language and avoid buzzwords.";

    let finalPrompt = basePrompt + "\n\n";

    if (mode === "explain" && question) {
      finalPrompt += `Explain why this question matters in career counseling and what a good answer considers. Question: "${question}". Keep it to 60-90 words.`;
    } else if (mode === "suggest" && question) {
      finalPrompt += `Provide three distinct, personalized suggestions (80-100 words each) for answering this open-ended question. Use the user's context if provided. Number the suggestions 1-3. Question: "${question}". User context: ${JSON.stringify(
        context || {}
      )}.`;
    } else if (mode === "chat" && prompt) {
      finalPrompt += `Respond as a counselor. Be specific and actionable in 2-4 short paragraphs. User: ${prompt}. Context: ${JSON.stringify(
        context || {}
      )}.`;
    } else {
      throw new Error("Invalid parameters");
    }

    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: finalPrompt }),
      }
    );

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      console.error("HF error:", txt);
      return new Response(JSON.stringify({ error: txt }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await hfRes.json();
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text || "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("hf-assist error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
