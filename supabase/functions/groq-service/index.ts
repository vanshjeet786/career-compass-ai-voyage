
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Groq AI Service function is ready.");

serve(async (req) => {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, max_tokens = 2400, temperature = 0.7, jsonMode = false } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("No 'messages' array found in the request body.");
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error("CRITICAL: GROQ_API_KEY secret not found in environment variables.");
      throw new Error("Groq API key is not set in Supabase secrets.");
    }

    const requestBody: any = {
      model: "qwen-2.5-32b",
      messages: messages,
      max_tokens: max_tokens,
      temperature: temperature,
      top_p: 0.9,
      stream: false,
    };

    if (jsonMode) {
      requestBody.response_format = { type: "json_object" };
    }

    console.log(`Calling Groq API (model: ${requestBody.model}, jsonMode: ${jsonMode})...`);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Groq API Error:", errorBody);
      throw new Error(`Groq API request failed with status ${response.status}: ${errorBody}`);
    }

    const responseData = await response.json();
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("An error occurred in the Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
