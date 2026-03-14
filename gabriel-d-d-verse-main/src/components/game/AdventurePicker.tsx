import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ADVENTURES, DIFFICULTY_COLORS, Adventure } from "@/lib/adventures";
import { ADVENTURE_IMAGES } from "@/lib/adventureImages";
import { Map, Star, Shield, ChevronRight } from "lucide-react";

interface AdventurePickerProps {
  onSelect: (adventure: Adventure) => void;
  selectedId?: string | null;
}

const AdventurePicker = ({ onSelect, selectedId }: AdventurePickerProps) => {
  const [filter, setFilter] = useState<Adventure["difficulty"] | "All">("All");

  const filtered = filter === "All" ? ADVENTURES : ADVENTURES.filter((a) => a.difficulty === filter);
  const difficulties: (Adventure["difficulty"] | "All")[] = ["All", "Easy", "Medium", "Hard", "Deadly"];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <Map className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Choose Your Adventure</h2>
          <p className="text-xs text-muted-foreground">Select a quest to embark on</p>
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 flex-wrap">
        {difficulties.map((d) => (
          <button key={d} onClick={() => setFilter(d)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
              filter === d
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
            }`}>
            {d}
          </button>
        ))}
      </div>

      {/* Adventure grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto scrollbar-fantasy pr-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((adventure, i) => (
            <motion.button key={adventure.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(adventure)}
              className={`rounded-2xl border overflow-hidden text-left transition-all ${
                selectedId === adventure.id
                  ? "border-primary/40 bg-primary/10 ring-1 ring-primary/20 shadow-gold"
                  : "border-border bg-muted/15 hover:border-primary/25 hover:bg-muted/30"
              }`}>
              {/* Adventure image */}
              <div className="relative h-28 w-full overflow-hidden">
                <img src={ADVENTURE_IMAGES[adventure.id]} alt={adventure.title}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold border backdrop-blur-sm ${DIFFICULTY_COLORS[adventure.difficulty]}`}>
                  {adventure.difficulty}
                </span>
              </div>
              <div className="p-3">
              <h3 className="font-display text-sm font-semibold text-foreground mb-1">{adventure.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{adventure.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/80">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Lvl {adventure.recommendedLevel}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {adventure.setting}</span>
                <span className="flex items-center gap-1 ml-auto text-primary/60">
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
              {/* Difficulty bar */}
              <div className="mt-2 h-1 w-full rounded-full bg-muted/30">
                <div className={`h-full rounded-full transition-all ${
                  adventure.difficulty === "Easy" ? "bg-green-500" :
                  adventure.difficulty === "Medium" ? "bg-yellow-500" :
                  adventure.difficulty === "Hard" ? "bg-orange-500" : "bg-red-500"
                }`} style={{ width: `${(adventure.difficultyLevel / 12) * 100}%` }} />
              </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdventurePicker;
