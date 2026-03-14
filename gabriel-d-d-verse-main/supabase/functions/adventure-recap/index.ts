import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RECAP_PROMPT = `You are a dramatic narrator recapping a D&D adventure for a returning player. 
Given the chat history below, write a cinematic "Previously on..." recap in exactly this JSON format:

{
  "title": "Previously on...",
  "subtitle": "A dramatic subtitle (max 6 words)",
  "paragraphs": [
    "First paragraph: set the scene and remind the player where they are (2-3 sentences, vivid prose)",
    "Second paragraph: summarize the key events and decisions (2-3 sentences)",
    "Third paragraph: end with the current cliffhanger or situation (1-2 sentences, dramatic)"
  ],
  "currentState": {
    "location": "Where the player currently is (short)",
    "threat": "What danger looms (short, or null)",
    "objective": "What the player was trying to do (short)"
  }
}

Rules:
- Write in second person ("You...")
- Be dramatic and cinematic, like a TV show recap narrator
- Keep it concise — 3 paragraphs max, 2-3 sentences each
- Return ONLY valid JSON, no markdown`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { chatLog, characterName, adventureTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const context = `Character: ${characterName || "Unknown"}\nAdventure: ${adventureTitle || "Free Roam"}\n\nRecent Chat Log (last messages):\n${chatLog}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: RECAP_PROMPT },
          { role: "user", content: context },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI recap error:", response.status, t);
      return new Response(JSON.stringify({ error: "Recap generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let recap;
    try {
      recap = JSON.parse(cleaned);
    } catch {
      recap = {
        title: "Previously on...",
        subtitle: "Your Adventure Continues",
        paragraphs: ["You return to where you left off. The adventure awaits."],
        currentState: { location: "Unknown", threat: null, objective: "Continue exploring" },
      };
    }

    return new Response(JSON.stringify(recap), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("adventure-recap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
