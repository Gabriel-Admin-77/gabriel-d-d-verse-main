import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, characterClass } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Class-specific visual descriptors
    const classDescriptions: Record<string, string> = {
      Barbarian: "muscular warrior with tribal markings, fierce expression, wild hair, fur-lined armor",
      Bard: "charismatic performer with elegant clothing, musical instrument nearby, mischievous smile",
      Cleric: "holy priest with divine symbols, glowing aura, peaceful yet determined expression, religious vestments",
      Druid: "nature guardian with leaves and vines in hair, animal companion nearby, earthy tones, staff",
      Fighter: "battle-hardened soldier in plate armor, shield and sword, confident stance, battle scars",
      Monk: "disciplined martial artist in simple robes, meditation pose, serene focus, athletic build",
      Paladin: "noble knight in shining armor, holy symbol on tabard, righteous expression, radiant light",
      Ranger: "wilderness tracker with hooded cloak, bow and quiver, keen eyes, forest background",
      Rogue: "cunning shadow agent with daggers, hooded face partially visible, mysterious smirk",
      Sorcerer: "innate spellcaster with arcane energy swirling around hands, dramatic robes, glowing eyes",
      Warlock: "pact-bound mystic with otherworldly features, dark robes, eldritch symbols, haunted gaze",
      Wizard: "scholarly mage with spell tome, arcane runes floating nearby, pointed hat, wise expression",
    };

    const classDesc = classDescriptions[characterClass] || "fantasy adventurer in medieval attire";

    const prompt = `Create a stunning fantasy character portrait for a tabletop RPG hero.
Style: painterly digital art, dramatic lighting, rich colors, high detail, shoulder-up portrait composition.
Character: ${name}, a heroic ${characterClass}.
Visual details: ${classDesc}
Background: blurred atmospheric fantasy setting appropriate to the class.
Do NOT include any text, words, letters, numbers, UI elements, or watermarks.
Make the character look heroic and memorable.`;

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
      console.error("Portrait generation failed:", status, body);
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
      return new Response(JSON.stringify({ error: "Portrait generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // Retry with simpler prompt if blocked
    if (!imageUrl) {
      console.warn("First attempt failed, retrying with safe prompt");
      const safePrompt = `Fantasy character portrait: A heroic ${characterClass} adventurer named ${name}. Painterly style, dramatic lighting, shoulder-up composition, no text or words.`;
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
      return new Response(JSON.stringify({ error: "No portrait generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("character-portrait error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
