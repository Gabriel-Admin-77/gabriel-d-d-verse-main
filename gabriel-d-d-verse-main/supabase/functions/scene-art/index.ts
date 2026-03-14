import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { narrative, adventure } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const adventureStyle = adventure
      ? `Setting: "${adventure.title}", a ${adventure.difficulty} difficulty adventure in ${adventure.setting}.`
      : "";

    // Detect mood from narrative for art direction
    const lowerNarrative = narrative.toLowerCase();
    let moodDirective = "Atmosphere: mysterious and adventurous.";
    if (/combat|attack|sword|fight|battle|strike|slash|blood|wound/i.test(lowerNarrative)) {
      moodDirective = "Atmosphere: intense combat, dramatic action poses, dynamic motion, fiery lighting.";
    } else if (/ghost|undead|dark|shadow|haunt|crypt|tomb|death|skull/i.test(lowerNarrative)) {
      moodDirective = "Atmosphere: eerie and foreboding, muted desaturated palette with ghostly light.";
    } else if (/tavern|inn|rest|camp|fire|drink|feast|celebration/i.test(lowerNarrative)) {
      moodDirective = "Atmosphere: warm and cozy, golden firelight, inviting interior.";
    } else if (/forest|jungle|nature|river|mountain|valley|path/i.test(lowerNarrative)) {
      moodDirective = "Atmosphere: majestic natural landscape, lush greens, volumetric sunlight.";
    } else if (/magic|spell|arcane|rune|enchant|portal|crystal|glow/i.test(lowerNarrative)) {
      moodDirective = "Atmosphere: arcane and mystical, glowing magical energy, ethereal blues and purples.";
    }

    const prompt = `Create a breathtaking high-quality fantasy illustration for a tabletop RPG scene. 
Style: cinematic composition, dramatic volumetric lighting, painterly brushwork, rich color palette, detailed environment art, depth of field, epic scale.
${adventureStyle}
${moodDirective}
Do NOT include any text, words, letters, numbers, UI elements, or watermarks in the image.

Scene: ${narrative.slice(0, 500)}`;

    // Use higher quality model
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
      console.error("Scene art generation failed:", status, body);
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
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // If blocked by safety filter, retry with a safe generic prompt
    if (!imageUrl) {
      const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason || "";
      console.warn("First attempt failed, finish_reason:", finishReason, "- retrying with safe prompt");
      
      const safePrompt = "A breathtaking fantasy landscape painting: ancient stone ruins overgrown with ivy, a winding path through a lush enchanted forest, dramatic golden-hour sky with towering clouds. Cinematic, painterly style, rich colors, no text or words.";
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
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scene-art error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
