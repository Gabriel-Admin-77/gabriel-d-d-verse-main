import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, X } from "lucide-react";
import { SKILLS, performSkillCheck, type SkillDef } from "@/lib/skillChecks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface SkillCheckOverlayProps {
  characterStats: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  characterLevel: number;
  onResult?: (skill: string, success: boolean, roll: number, total: number, dc: number) => void;
}

const SkillCheckOverlay = ({ characterStats, characterLevel, onResult }: SkillCheckOverlayProps) => {
  const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);
  const [dc, setDc] = useState(12);
  const [result, setResult] = useState<{ roll: number; modifier: number; total: number; success: boolean; critical: boolean } | null>(null);
  const [rolling, setRolling] = useState(false);

  const profBonus = Math.floor((characterLevel - 1) / 4) + 2;

  const doRoll = useCallback(() => {
    if (!selectedSkill || rolling) return;
    setRolling(true);
    setResult(null);

    const statVal = characterStats[selectedSkill.stat] || 10;
    
    setTimeout(() => {
      const res = performSkillCheck(selectedSkill, statVal, dc, 0);
      setResult(res);
      setRolling(false);
      onResult?.(selectedSkill.name, res.success, res.roll, res.total, dc);
    }, 1200);
  }, [selectedSkill, dc, characterStats, rolling, onResult]);

  const groupedSkills: Record<string, SkillDef[]> = {};
  SKILLS.forEach(s => {
    const stat = s.stat.toUpperCase();
    if (!groupedSkills[stat]) groupedSkills[stat] = [];
    groupedSkills[stat].push(s);
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-lg backdrop-blur-md transition hover:bg-primary/25 hover:shadow-gold"
        >
          <Dices className="h-5 w-5" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[340px] sm:w-[380px] bg-background/95 backdrop-blur-xl border-border p-0">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="font-display text-lg text-foreground">Skill Checks</SheetTitle>
        </SheetHeader>

        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
          {/* DC Selector */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">Difficulty (DC):</span>
            <div className="flex gap-1.5">
              {[8, 10, 12, 15, 18, 20].map(d => (
                <button key={d} onClick={() => setDc(d)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                    dc === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Grid */}
          {Object.entries(groupedSkills).map(([stat, skills]) => (
            <div key={stat}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">{stat} ({characterStats[stat.toLowerCase() as keyof typeof characterStats]})</p>
              <div className="grid grid-cols-2 gap-1.5">
                {skills.map(skill => (
                  <motion.button
                    key={skill.id}
                    onClick={() => { setSelectedSkill(skill); setResult(null); }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                      selectedSkill?.id === skill.id
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/15 text-foreground hover:border-primary/20 hover:bg-muted/25"
                    }`}
                  >
                    <span className="text-sm">{skill.icon}</span>
                    <span className="text-[11px] font-medium">{skill.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}

          {/* Roll Button */}
          {selectedSkill && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <motion.button
                onClick={doRoll}
                disabled={rolling}
                whileHover={{ scale: rolling ? 1 : 1.02 }}
                whileTap={{ scale: rolling ? 1 : 0.98 }}
                className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold transition hover:brightness-110 disabled:opacity-50"
              >
                {rolling ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity }}>🎲</motion.span>
                ) : (
                  `Roll ${selectedSkill.name} (DC ${dc})`
                )}
              </motion.button>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`rounded-xl border p-4 text-center ${
                      result.success
                        ? "border-green-500/30 bg-green-500/10"
                        : "border-destructive/30 bg-destructive/10"
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {result.critical
                        ? result.roll === 20 ? "🌟" : "💀"
                        : result.success ? "✅" : "❌"}
                    </div>
                    <p className={`text-lg font-display font-bold ${
                      result.success ? "text-green-400" : "text-destructive"
                    }`}>
                      {result.critical && result.roll === 20 ? "CRITICAL SUCCESS!" : 
                       result.critical && result.roll === 1 ? "CRITICAL FAILURE!" :
                       result.success ? "SUCCESS!" : "FAILURE!"}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono">🎲 {result.roll}</span>
                      <span>+</span>
                      <span className="font-mono">{result.modifier >= 0 ? `+${result.modifier}` : result.modifier}</span>
                      <span>=</span>
                      <span className="font-semibold text-foreground">{result.total}</span>
                      <span className="text-muted-foreground/60">vs DC {dc}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SkillCheckOverlay;
