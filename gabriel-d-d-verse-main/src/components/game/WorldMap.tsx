import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Lock, MapPin, Compass, Footprints, Sparkles, RefreshCw, Image } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Adventure } from "@/lib/adventures";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Location data per adventure
interface MapLocation {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  description: string;
  type: "town" | "dungeon" | "wilderness" | "landmark" | "boss";
  connections: string[];
}

const ADVENTURE_MAPS: Record<string, { name: string; locations: MapLocation[] }> = {
  lost_mines: {
    name: "Sword Coast",
    locations: [
      { id: "phandalin", name: "Phandalin", icon: "🏘️", x: 50, y: 75, description: "A frontier mining town, your base of operations.", type: "town", connections: ["tresendar", "cragmaw_hideout", "old_owl_well"] },
      { id: "cragmaw_hideout", name: "Cragmaw Hideout", icon: "🕳️", x: 25, y: 55, description: "A cave where goblins ambush travelers.", type: "dungeon", connections: ["phandalin", "cragmaw_castle"] },
      { id: "tresendar", name: "Tresendar Manor", icon: "🏚️", x: 65, y: 65, description: "Ruined manor hiding the Redbrand hideout.", type: "dungeon", connections: ["phandalin"] },
      { id: "old_owl_well", name: "Old Owl Well", icon: "🦉", x: 75, y: 40, description: "Ancient ruins haunted by undead.", type: "wilderness", connections: ["phandalin", "wave_echo"] },
      { id: "cragmaw_castle", name: "Cragmaw Castle", icon: "🏰", x: 20, y: 25, description: "Crumbling castle of the Cragmaw goblin tribe.", type: "dungeon", connections: ["cragmaw_hideout", "wave_echo"] },
      { id: "wave_echo", name: "Wave Echo Cave", icon: "⛏️", x: 50, y: 15, description: "The lost mines of the Phandelver Pact.", type: "boss", connections: ["old_owl_well", "cragmaw_castle"] },
    ],
  },
  curse_strahd: {
    name: "Barovia",
    locations: [
      { id: "village_barovia", name: "Village of Barovia", icon: "🏘️", x: 20, y: 80, description: "A miserable village shrouded in mist.", type: "town", connections: ["tser_pool", "old_bonegrinder"] },
      { id: "tser_pool", name: "Tser Pool", icon: "🔮", x: 35, y: 60, description: "Vistani encampment by a dark pool.", type: "landmark", connections: ["village_barovia", "vallaki"] },
      { id: "old_bonegrinder", name: "Old Bonegrinder", icon: "🏚️", x: 15, y: 50, description: "A windmill inhabited by night hags.", type: "dungeon", connections: ["village_barovia", "vallaki"] },
      { id: "vallaki", name: "Vallaki", icon: "🏰", x: 50, y: 45, description: "A walled town ruled by a paranoid burgomaster.", type: "town", connections: ["tser_pool", "old_bonegrinder", "argynvostholt"] },
      { id: "argynvostholt", name: "Argynvostholt", icon: "🐉", x: 75, y: 35, description: "Ruined mansion of the Order of the Silver Dragon.", type: "dungeon", connections: ["vallaki", "ravenloft"] },
      { id: "ravenloft", name: "Castle Ravenloft", icon: "🧛", x: 55, y: 12, description: "The lair of Count Strahd von Zarovich.", type: "boss", connections: ["argynvostholt"] },
    ],
  },
  tomb_annihilation: {
    name: "Chult",
    locations: [
      { id: "port_nyanzaru", name: "Port Nyanzaru", icon: "⛵", x: 20, y: 80, description: "A vibrant merchant city on the coast of Chult.", type: "town", connections: ["camp_vengeance", "firefinger"] },
      { id: "camp_vengeance", name: "Camp Vengeance", icon: "⚔️", x: 40, y: 65, description: "A beleaguered Order of the Gauntlet outpost.", type: "landmark", connections: ["port_nyanzaru", "heart_of_ubtao"] },
      { id: "firefinger", name: "Firefinger", icon: "🔥", x: 15, y: 50, description: "A volcanic spire infested with pterafolk.", type: "dungeon", connections: ["port_nyanzaru", "orolunga"] },
      { id: "orolunga", name: "Orolunga", icon: "🐍", x: 35, y: 35, description: "Ancient ziggurat where a naga oracle dwells.", type: "landmark", connections: ["firefinger", "heart_of_ubtao"] },
      { id: "heart_of_ubtao", name: "Heart of Ubtao", icon: "💚", x: 60, y: 40, description: "A massive stone heart in the deep jungle.", type: "wilderness", connections: ["camp_vengeance", "orolunga", "tomb_nine_gods"] },
      { id: "tomb_nine_gods", name: "Tomb of the Nine Gods", icon: "💀", x: 55, y: 15, description: "The Soulmonger awaits in this accursed tomb.", type: "boss", connections: ["heart_of_ubtao"] },
    ],
  },
};

function getGenericMap(adventure: Adventure): { name: string; locations: MapLocation[] } {
  return {
    name: adventure.setting,
    locations: [
      { id: "start", name: "Starting Point", icon: "🏘️", x: 50, y: 80, description: "Where your adventure begins.", type: "town", connections: ["crossroads"] },
      { id: "crossroads", name: "Crossroads", icon: "🔀", x: 50, y: 60, description: "A fork in the road. Which way?", type: "wilderness", connections: ["start", "dark_woods", "ruins"] },
      { id: "dark_woods", name: "Dark Woods", icon: "🌲", x: 25, y: 40, description: "Dense forest with hidden dangers.", type: "wilderness", connections: ["crossroads", "lair"] },
      { id: "ruins", name: "Ancient Ruins", icon: "🏛️", x: 75, y: 40, description: "Crumbling structures of a forgotten age.", type: "dungeon", connections: ["crossroads", "lair"] },
      { id: "lair", name: `${adventure.icon} ${adventure.title.split(' ')[0]} Lair`, icon: adventure.icon, x: 50, y: 15, description: "The final destination of your quest.", type: "boss", connections: ["dark_woods", "ruins"] },
    ],
  };
}

const TYPE_COLORS: Record<string, string> = {
  town: "border-accent/40 bg-accent/15 text-accent",
  dungeon: "border-destructive/40 bg-destructive/15 text-destructive",
  wilderness: "border-green-500/40 bg-green-500/15 text-green-400",
  landmark: "border-primary/40 bg-primary/15 text-primary",
  boss: "border-gold-glow/40 bg-gold-glow/15 text-gold-glow",
};

interface WorldMapProps {
  adventure: Adventure | null;
  chatMessages: { role: string; content: string }[];
}

const WorldMap = ({ adventure, chatMessages }: WorldMapProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIMap, setShowAIMap] = useState(true);
  const lastGeneratedCount = useRef(0);

  // Determine which locations are "discovered" based on chat message mentions
  const discoveredLocations = useMemo(() => {
    if (!adventure) return new Set<string>(["start"]);
    const mapData = ADVENTURE_MAPS[adventure.id] || getGenericMap(adventure);
    const discovered = new Set<string>();
    
    if (mapData.locations.length > 0) {
      discovered.add(mapData.locations[0].id);
    }

    const allText = chatMessages.map((m) => m.content.toLowerCase()).join(" ");
    mapData.locations.forEach((loc) => {
      const nameParts = loc.name.toLowerCase().split(" ");
      if (nameParts.some((part) => part.length > 3 && allText.includes(part))) {
        discovered.add(loc.id);
        loc.connections.forEach((cId) => discovered.add(cId));
      }
    });

    return discovered;
  }, [adventure, chatMessages]);

  const mapData = useMemo(() => {
    if (!adventure) return null;
    return ADVENTURE_MAPS[adventure.id] || getGenericMap(adventure);
  }, [adventure]);

  // Get discovered location details for AI generation
  const discoveredLocationDetails = useMemo(() => {
    if (!mapData) return [];
    return mapData.locations
      .filter((loc) => discoveredLocations.has(loc.id))
      .map((loc) => ({
        name: loc.name,
        type: loc.type,
        description: loc.description,
      }));
  }, [mapData, discoveredLocations]);

  // Generate AI map artwork
  const generateMapArt = useCallback(async () => {
    if (!adventure || !mapData || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("map-art", {
        body: {
          adventure: {
            id: adventure.id,
            title: adventure.title,
            setting: adventure.setting,
          },
          discoveredLocations: discoveredLocationDetails,
          mapName: mapData.name,
        },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setMapImageUrl(data.imageUrl);
        lastGeneratedCount.current = discoveredLocations.size;
      }
    } catch (err) {
      console.error("Map generation error:", err);
      toast.error("Failed to generate map artwork");
    } finally {
      setIsGenerating(false);
    }
  }, [adventure, mapData, discoveredLocationDetails, discoveredLocations.size, isGenerating]);

  // Auto-generate map when significant new discoveries are made
  useEffect(() => {
    if (!adventure || !mapData) return;
    
    // Generate on first open if no map exists
    if (!mapImageUrl && discoveredLocations.size > 0 && !isGenerating) {
      generateMapArt();
      return;
    }

    // Regenerate when 2+ new locations discovered
    const newDiscoveries = discoveredLocations.size - lastGeneratedCount.current;
    if (newDiscoveries >= 2 && !isGenerating) {
      generateMapArt();
    }
  }, [discoveredLocations.size, adventure, mapData, mapImageUrl, isGenerating, generateMapArt]);

  if (!adventure) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/15 border border-border/30 text-muted-foreground shadow-lg backdrop-blur-md transition hover:bg-muted/25"
          >
            <Map className="h-5 w-5" />
          </motion.button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[360px] sm:w-[420px] bg-background/95 backdrop-blur-xl border-border p-0">
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" /> World Map
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <Compass className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Select an adventure to reveal the map</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const selected = mapData?.locations.find((l) => l.id === selectedLocation);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-lg backdrop-blur-md transition hover:bg-primary/25 hover:shadow-gold"
        >
          <Map className="h-5 w-5" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[360px] sm:w-[480px] bg-background/95 backdrop-blur-xl border-border p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <Map className="h-4 w-4 text-primary" /> {mapData?.name}
            </SheetTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAIMap(!showAIMap)}
                className={`p-1.5 rounded-lg transition ${showAIMap ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted-foreground"}`}
                title={showAIMap ? "Show tactical view" : "Show illustrated map"}
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                onClick={generateMapArt}
                disabled={isGenerating}
                className="p-1.5 rounded-lg bg-muted/20 text-muted-foreground hover:bg-primary/20 hover:text-primary transition disabled:opacity-50"
                title="Regenerate map artwork"
              >
                <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {discoveredLocations.size} / {mapData?.locations.length || 0} locations discovered
          </p>
        </SheetHeader>

        {/* Map Canvas */}
        <div className="relative mx-4 mt-3 rounded-xl border border-border bg-muted/10 overflow-hidden" style={{ height: 360 }}>
          {/* AI Generated Map Background */}
          <AnimatePresence>
            {showAIMap && mapImageUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-0"
              >
                <img
                  src={mapImageUrl}
                  alt={`${mapData?.name} Map`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generating indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                <p className="text-xs text-muted-foreground">Cartographer at work...</p>
              </div>
            </motion.div>
          )}

          {/* Grid pattern background (fallback) */}
          {(!showAIMap || !mapImageUrl) && (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          )}

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {mapData?.locations.flatMap((loc) =>
              loc.connections
                .filter((cId) => {
                  const target = mapData.locations.find((l) => l.id === cId);
                  return target && discoveredLocations.has(loc.id) && discoveredLocations.has(cId);
                })
                .map((cId) => {
                  const target = mapData.locations.find((l) => l.id === cId)!;
                  return (
                    <motion.line
                      key={`${loc.id}-${cId}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: showAIMap && mapImageUrl ? 0.5 : 0.3 }}
                      transition={{ duration: 1, delay: 0.3 }}
                      x1={`${loc.x}%`}
                      y1={`${loc.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke={showAIMap && mapImageUrl ? "hsl(var(--foreground))" : "hsl(var(--primary))"}
                      strokeWidth={showAIMap && mapImageUrl ? 2 : 1.5}
                      strokeDasharray="4 4"
                    />
                  );
                })
            )}
          </svg>

          {/* Location markers */}
          {mapData?.locations.map((loc, i) => {
            const discovered = discoveredLocations.has(loc.id);
            return (
              <motion.button
                key={loc.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: discovered ? 1 : 0.6, opacity: discovered ? 1 : 0.3 }}
                transition={{ delay: i * 0.1, type: "spring" }}
                whileHover={discovered ? { scale: 1.2 } : {}}
                onClick={() => discovered && setSelectedLocation(selectedLocation === loc.id ? null : loc.id)}
                className={`absolute z-10 flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 ${
                  discovered ? "cursor-pointer" : "cursor-not-allowed"
                }`}
                style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-base transition shadow-lg ${
                    selectedLocation === loc.id
                      ? "border-primary bg-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.5)] scale-110"
                      : discovered
                      ? `${TYPE_COLORS[loc.type] || "border-border bg-muted/20"} ${showAIMap && mapImageUrl ? "bg-background/80 backdrop-blur-sm" : ""}`
                      : "border-border/30 bg-muted/10"
                  }`}
                >
                  {discovered ? (
                    <span>{loc.icon}</span>
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                </div>
                {discovered && (
                  <span className={`text-[9px] font-medium whitespace-nowrap max-w-[70px] truncate px-1.5 py-0.5 rounded ${
                    showAIMap && mapImageUrl ? "bg-background/80 text-foreground backdrop-blur-sm" : "text-foreground/80"
                  }`}>
                    {loc.name}
                  </span>
                )}
                {/* Pulse for boss */}
                {loc.type === "boss" && discovered && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute h-10 w-10 rounded-full border border-gold-glow/40"
                  />
                )}
              </motion.button>
            );
          })}

          {/* Fog overlay for undiscovered areas */}
          <div
            className="absolute inset-0 pointer-events-none z-5"
            style={{
              background: showAIMap && mapImageUrl
                ? `radial-gradient(circle at 50% 75%, transparent 30%, hsl(var(--background) / 0.5) 70%)`
                : `radial-gradient(circle at 50% 75%, transparent 20%, hsl(var(--background) / 0.3) 60%)`,
            }}
          />
        </div>

        {/* Location Detail */}
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mx-4 mt-3 rounded-xl border p-4 ${TYPE_COLORS[selected.type] || "border-border bg-muted/10"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{selected.icon}</span>
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground">{selected.name}</h4>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{selected.type}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{selected.description}</p>
              {selected.connections.length > 0 && (
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  <Footprints className="h-3 w-3 text-muted-foreground" />
                  {selected.connections.map((cId) => {
                    const conn = mapData?.locations.find((l) => l.id === cId);
                    return conn ? (
                      <span
                        key={cId}
                        className={`text-[9px] rounded-md border px-1.5 py-0.5 ${
                          discoveredLocations.has(cId)
                            ? "border-primary/20 bg-primary/5 text-primary cursor-pointer"
                            : "border-border/30 bg-muted/10 text-muted-foreground/50"
                        }`}
                        onClick={() => discoveredLocations.has(cId) && setSelectedLocation(cId)}
                      >
                        {discoveredLocations.has(cId) ? conn.name : "???"}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="mt-auto px-4 py-3 border-t border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Legend</p>
          <div className="flex flex-wrap gap-2">
            {[
              { type: "town", label: "Town", icon: "🏘️" },
              { type: "dungeon", label: "Dungeon", icon: "🕳️" },
              { type: "wilderness", label: "Wild", icon: "🌲" },
              { type: "landmark", label: "Landmark", icon: "📍" },
              { type: "boss", label: "Boss", icon: "💀" },
            ].map((t) => (
              <span key={t.type} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${TYPE_COLORS[t.type]}`}>
                {t.icon} {t.label}
              </span>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WorldMap;
