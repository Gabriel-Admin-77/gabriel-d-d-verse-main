import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { adventure, discoveredLocations, mapName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build location descriptions for the map
    const locationDescriptions = discoveredLocations
      .map((loc: { name: string; type: string; description: string }) => 
        `${loc.name} (${loc.type}): ${loc.description}`)
      .join("; ");

    // Adventure-specific style hints
    let styleHint = "classic fantasy";
    if (adventure?.id === "curse_strahd") {
      styleHint = "gothic horror, dark misty valleys, ominous mountains, dead trees";
    } else if (adventure?.id === "tomb_annihilation") {
      styleHint = "tropical jungle, ancient Mayan-style ruins, dinosaurs, volcanic peaks";
    } else if (adventure?.id === "lost_mines") {
      styleHint = "frontier wilderness, rolling hills, pine forests, mining settlements";
    } else if (adventure?.setting) {
      styleHint = adventure.setting.toLowerCase();
    }

    const prompt = `Create a beautiful fantasy world map illustration in a hand-drawn cartography style.
Style: aged parchment texture, ink drawings, ${styleHint}, top-down regional map view, ornate compass rose, decorative borders.
Region name: "${mapName || 'The Realm'}"
Notable locations to feature: ${locationDescriptions || "mysterious unexplored territories"}
Art direction: Use warm sepia tones with subtle color washes. Include topographical details like mountains, forests, rivers. Mark known locations with small iconic symbols.
Do NOT include any modern text, UI elements, or watermarks. Any text should look hand-lettered in a fantasy script style.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("Map art generation failed:", status, body);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Map generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // Fallback to simpler prompt if first attempt fails
    if (!imageUrl) {
      console.warn("First map attempt failed, retrying with safe prompt");
      
      const safePrompt = "A beautiful fantasy world map on aged parchment. Hand-drawn cartography style with mountains, forests, rivers, and settlements marked with small icons. Warm sepia tones, ornate compass rose, decorative border. No text or words.";
      const retryResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: safePrompt }],
          modalities: ["image", "text"],
        }),
      });
      
      if (retryResp.ok) {
        const retryData = await retryResp.json();
        imageUrl = retryData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      }
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No map generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("map-art error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
