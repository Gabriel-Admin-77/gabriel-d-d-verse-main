import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUMMARIZE_PROMPT = `You are a scribe recording the adventures of a D&D character. Given the chat log below, produce a structured journal summary in this exact JSON format:

{
  "title": "A dramatic title for the adventure so far (max 8 words)",
  "chapters": [
    {
      "heading": "Short chapter heading",
      "summary": "2-3 sentences summarizing this part of the adventure",
      "keyEvent": "The single most important event or decision",
      "mood": "exploration|combat|dialogue|mystery|rest"
    }
  ],
  "decisions": [
    {
      "choice": "What the player chose to do",
      "consequence": "What happened as a result",
      "moral": "good|neutral|evil"
    }
  ],
  "stats": {
    "encountersCount": 0,
    "decisionsCount": 0,
    "currentQuest": "Brief description of current objective"
  }
}

Rules:
- Group messages into logical chapters (2-5 chapters max)
- Highlight moral choices and their consequences
- Keep summaries dramatic and in-character
- Return ONLY valid JSON, no markdown or extra text`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { chatLog, characterName, adventureTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const context = `Character: ${characterName || "Unknown"}\nAdventure: ${adventureTitle || "Free Roam"}\n\nChat Log:\n${chatLog}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: SUMMARIZE_PROMPT },
          { role: "user", content: context },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Summarization failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    
    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let journal;
    try {
      journal = JSON.parse(cleaned);
    } catch {
      journal = { title: "Adventure in Progress", chapters: [], decisions: [], stats: { encountersCount: 0, decisionsCount: 0, currentQuest: "Unknown" } };
    }

    return new Response(JSON.stringify(journal), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("journal-summarize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
