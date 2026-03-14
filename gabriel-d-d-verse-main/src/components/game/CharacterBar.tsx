import { motion } from "framer-motion";
import { Shield, Heart, Swords, Star, Sparkles } from "lucide-react";
import { Character } from "@/lib/gameTypes";
import { CLASS_IMAGES } from "@/lib/classImages";
import MoralCompass from "./MoralCompass";
import CharacterSheet from "./CharacterSheet";
import StatusEffectsBar from "./StatusEffectsBar";

interface CharacterBarProps {
  character: Character;
  xp?: number;
  xpToNext?: number;
  rawCharacter?: any;
  characterId?: string | null;
}

const StatBadge = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center gap-0.5 px-2 sm:px-3">
    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="font-display text-sm font-semibold text-foreground">{value}</span>
  </div>
);

const CharacterBar = ({ character, xp = 0, xpToNext = 300, rawCharacter, characterId }: CharacterBarProps) => {
  const hpPercent = (character.hp.current / character.hp.max) * 100;
  const xpPercent = xpToNext > 0 ? Math.min((xp / xpToNext) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b border-border bg-card/30 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-primary/20">
            <img
              src={character.portraitUrl || CLASS_IMAGES[character.class]}
              alt={character.name}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-semibold text-gold-glow">{character.name}</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{character.class} · Level {character.level}</p>
          </div>
        </div>

        {/* HP bar */}
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-destructive" />
          <div className="w-24 sm:w-36">
            <div className="mb-0.5 flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>HP</span>
              <span>{character.hp.current}/{character.hp.max}</span>
            </div>
            <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-destructive to-destructive/70"
                initial={{ width: 0 }}
                animate={{ width: `${hpPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* XP bar */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <div className="w-24 sm:w-32">
            <div className="mb-0.5 flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>XP</span>
              <span>{xp}/{xpToNext}</span>
            </div>
            <div className="h-1.5 sm:h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* AC */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">AC</p>
            <p className="font-display text-sm font-semibold">{character.ac}</p>
          </div>
        </div>

        {/* Status Effects */}
        <StatusEffectsBar characterId={characterId} />

        {/* Stats - hidden on small screens */}
        <div className="hidden items-center gap-0 rounded-xl border border-border bg-muted/20 px-1 py-1.5 lg:flex">
          <StatBadge label="STR" value={character.stats.str} />
          <StatBadge label="DEX" value={character.stats.dex} />
          <StatBadge label="CON" value={character.stats.con} />
          <StatBadge label="INT" value={character.stats.int} />
          <StatBadge label="WIS" value={character.stats.wis} />
          <StatBadge label="CHA" value={character.stats.cha} />
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <MoralCompass score={character.moralScore} size={64} />
          {rawCharacter && <CharacterSheet character={rawCharacter} xp={xp} xpToNext={xpToNext} />}
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterBar;
