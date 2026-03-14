import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, Dices, Skull, Trash2, Shield, Zap, Heart, Flame, Snowflake, Eye, AlertTriangle, ChevronRight, Target, Sparkles } from "lucide-react";
import { CombatParticipant } from "@/lib/gameTypes";
import { BESTIARY } from "@/lib/gameData";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import DiceRollOverlay from "./DiceRollOverlay";

const rollD20 = () => Math.floor(Math.random() * 20) + 1;

// Conditions with icons and colors
const CONDITIONS = [
  { id: "poisoned", label: "Poisoned", icon: "☠️", color: "text-green-400" },
  { id: "stunned", label: "Stunned", icon: "💫", color: "text-yellow-400" },
  { id: "frightened", label: "Frightened", icon: "😨", color: "text-purple-400" },
  { id: "blinded", label: "Blinded", icon: "🙈", color: "text-muted-foreground" },
  { id: "prone", label: "Prone", icon: "⬇️", color: "text-orange-400" },
  { id: "restrained", label: "Restrained", icon: "⛓️", color: "text-muted-foreground" },
  { id: "burning", label: "Burning", icon: "🔥", color: "text-red-400" },
  { id: "frozen", label: "Frozen", icon: "❄️", color: "text-blue-400" },
  { id: "blessed", label: "Blessed", icon: "✨", color: "text-primary" },
  { id: "shielded", label: "Shielded", icon: "🛡️", color: "text-accent" },
] as const;

type ConditionId = typeof CONDITIONS[number]["id"];

interface ExtendedParticipant extends CombatParticipant {
  conditions: ConditionId[];
  tempHp: number;
}

// Attack result animation type
interface AttackResult {
  attackerId: string;
  targetId: string;
  roll: number;
  hit: boolean;
  critical: boolean;
  damage: number;
}

const CombatTracker = () => {
  const [participants, setParticipants] = useState<ExtendedParticipant[]>([]);
  const [inCombat, setInCombat] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  
  // Dice roll overlay
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceSuccess, setDiceSuccess] = useState<boolean | null>(null);
  const [diceCritical, setDiceCritical] = useState(false);
  
  // Attack flow
  const [attackMode, setAttackMode] = useState(false);
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [lastAttack, setLastAttack] = useState<AttackResult | null>(null);
  
  // Quick dice
  const [lastRoll, setLastRoll] = useState<{ value: number; label: string } | null>(null);
  
  // Condition picker
  const [showConditionFor, setShowConditionFor] = useState<string | null>(null);

  const rollInitiativeForAll = () => {
    const withInit = participants.map((p) => ({
      ...p,
      initiative: rollD20() + (p.isPlayer ? 2 : 0),
    }));
    withInit.sort((a, b) => b.initiative - a.initiative);
    setParticipants(withInit);
    setInCombat(true);
    setCurrentTurn(0);
    setRound(1);
    setCombatLog(["⚔️ Combat begins! Roll initiative!"]);
    
    // Show dice animation
    const highestInit = withInit[0]?.initiative || 10;
    setDiceResult(highestInit);
    setDiceSuccess(true);
    setDiceCritical(highestInit === 20);
    setDiceRolling(true);
  };

  const addPlayer = (name?: string) => {
    setParticipants((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: name || "Player",
        initiative: 0,
        hp: 45,
        maxHp: 52,
        ac: 17,
        isPlayer: true,
        conditions: [],
        tempHp: 0,
      },
    ]);
  };

  const addMonster = (monsterId: string) => {
    const m = BESTIARY.find((b) => b.id === monsterId);
    if (!m) return;
    setParticipants((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: m.name,
        initiative: 0,
        hp: m.hp,
        maxHp: m.maxHp,
        ac: m.ac,
        isPlayer: false,
        conditions: [],
        tempHp: 0,
      },
    ]);
  };

  const removeParticipant = (id: string) =>
    setParticipants((prev) => prev.filter((p) => p.id !== id));

  const adjustHp = (id: string, delta: number) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, hp: Math.max(0, Math.min(p.maxHp, p.hp + delta)) }
          : p
      )
    );
  };

  const nextTurn = () => {
    const nextIdx = (currentTurn + 1) % participants.length;
    setCurrentTurn(nextIdx);
    if (nextIdx === 0) {
      setRound((r) => r + 1);
      setCombatLog((prev) => [...prev.slice(-20), `📜 Round ${round + 1} begins`]);
      
      // Process conditions (burning deals 1d4 damage)
      setParticipants((prev) =>
        prev.map((p) => {
          let newHp = p.hp;
          if (p.conditions.includes("burning")) {
            const burnDmg = Math.floor(Math.random() * 4) + 1;
            newHp = Math.max(0, p.hp - burnDmg);
            setCombatLog((logs) => [...logs.slice(-20), `🔥 ${p.name} takes ${burnDmg} burn damage`]);
          }
          return { ...p, hp: newHp };
        })
      );
    }
  };

  const endCombat = () => {
    setInCombat(false);
    setCurrentTurn(0);
    setRound(1);
    setAttackMode(false);
    setSelectedAttacker(null);
    setCombatLog((prev) => [...prev.slice(-20), "🏁 Combat ended"]);
  };

  // Attack system
  const performAttack = useCallback(
    (targetId: string) => {
      if (!selectedAttacker) return;
      const attacker = participants.find((p) => p.id === selectedAttacker);
      const target = participants.find((p) => p.id === targetId);
      if (!attacker || !target) return;

      const roll = rollD20();
      const attackBonus = attacker.isPlayer ? 5 : 4;
      const totalRoll = roll + attackBonus;
      const critical = roll === 20;
      const critFail = roll === 1;
      const hit = critical || (!critFail && totalRoll >= target.ac);

      let damage = 0;
      if (hit) {
        const baseDmg = Math.floor(Math.random() * 8) + 1;
        damage = critical ? baseDmg * 2 : baseDmg;
        // Apply conditions
        if (target.conditions.includes("stunned")) damage = Math.floor(damage * 1.5);
      }

      // Show dice animation
      setDiceResult(roll);
      setDiceSuccess(hit);
      setDiceCritical(critical || critFail);
      setDiceRolling(true);

      setLastAttack({ attackerId: selectedAttacker, targetId, roll, hit, critical, damage });

      // Apply damage after animation
      setTimeout(() => {
        if (hit && damage > 0) {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === targetId
                ? { ...p, hp: Math.max(0, p.hp - damage) }
                : p
            )
          );
        }
        setCombatLog((prev) => [
          ...prev.slice(-20),
          hit
            ? `${critical ? "💥 CRITICAL! " : "⚔️ "}${attacker.name} hits ${target.name} for ${damage} damage (${totalRoll} vs AC ${target.ac})`
            : `❌ ${attacker.name} misses ${target.name} (${totalRoll} vs AC ${target.ac})`,
        ]);
      }, 1200);

      setAttackMode(false);
      setSelectedAttacker(null);
    },
    [selectedAttacker, participants]
  );

  const toggleCondition = (participantId: string, conditionId: ConditionId) => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id !== participantId) return p;
        const has = p.conditions.includes(conditionId);
        return {
          ...p,
          conditions: has
            ? p.conditions.filter((c) => c !== conditionId)
            : [...p.conditions, conditionId],
        };
      })
    );
    setShowConditionFor(null);
  };

  const rollDice = (sides: number, label: string) => {
    const value = Math.floor(Math.random() * sides) + 1;
    setLastRoll({ value, label: `${label}: d${sides}` });
  };

  const activeParticipant = inCombat ? participants[currentTurn] : null;

  return (
    <>
      <DiceRollOverlay
        rolling={diceRolling}
        result={diceResult}
        isSuccess={diceSuccess}
        isCritical={diceCritical}
        onComplete={() => setDiceRolling(false)}
      />
      
      <Sheet>
        <SheetTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive shadow-lg backdrop-blur-md transition hover:bg-destructive/25 hover:shadow-[0_0_20px_hsl(var(--destructive)/0.3)]"
          >
            <Swords className="h-5 w-5" />
          </motion.button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[360px] sm:w-[420px] bg-background/95 backdrop-blur-xl border-border p-0 flex flex-col"
        >
          <SheetHeader className="px-5 pt-5 pb-0">
            <SheetTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <Swords className="h-4 w-4 text-destructive" /> Combat Tracker
              {inCombat && (
                <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted/30 rounded-lg px-2 py-1 border border-border">
                  Round {round}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Initiative Timeline */}
          {inCombat && participants.length > 0 && (
            <div className="px-5 mt-3">
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-fantasy">
                {participants.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border text-[10px] transition-all shrink-0 ${
                      i === currentTurn
                        ? "border-primary/40 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                        : p.hp <= 0
                        ? "border-destructive/20 bg-destructive/5 opacity-50"
                        : "border-border/50 bg-muted/10"
                    }`}
                  >
                    {i === currentTurn && (
                      <motion.div
                        layoutId="turn-indicator"
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                    <span className={`font-medium ${p.isPlayer ? "text-accent" : "text-destructive"}`}>
                      {p.isPlayer ? "⚔️" : "💀"}
                    </span>
                    <span className="text-foreground font-medium truncate max-w-[50px]">{p.name}</span>
                    <span className="text-muted-foreground">{p.initiative}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Active Turn Banner */}
          {activeParticipant && (
            <motion.div
              key={activeParticipant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`mx-5 mt-2 rounded-xl border px-4 py-3 flex items-center gap-3 ${
                activeParticipant.isPlayer
                  ? "border-accent/30 bg-accent/8"
                  : "border-destructive/30 bg-destructive/8"
              }`}
            >
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Current Turn</p>
                <p className="text-sm font-display font-semibold text-foreground flex items-center gap-1.5">
                  {activeParticipant.isPlayer ? <Target className="h-3.5 w-3.5 text-accent" /> : <Skull className="h-3.5 w-3.5 text-destructive" />}
                  {activeParticipant.name}
                </p>
              </div>
              <div className="flex gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedAttacker(activeParticipant.id);
                    setAttackMode(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-destructive/15 border border-destructive/20 px-2.5 py-1.5 text-[10px] font-medium text-destructive hover:bg-destructive/25 transition"
                >
                  <Zap className="h-3 w-3" /> Attack
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextTurn}
                  className="flex items-center gap-1 rounded-lg bg-primary/15 border border-primary/20 px-2.5 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/25 transition"
                >
                  End Turn <ChevronRight className="h-3 w-3" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Attack Mode Banner */}
          {attackMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-5 mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center"
            >
              <p className="text-xs font-medium text-destructive flex items-center justify-center gap-2">
                <Target className="h-3.5 w-3.5 animate-pulse" />
                Select a target to attack
              </p>
              <button
                onClick={() => { setAttackMode(false); setSelectedAttacker(null); }}
                className="mt-1 text-[10px] text-muted-foreground hover:text-foreground transition"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Participants List */}
          <div
            className="flex-1 overflow-y-auto p-4 scrollbar-fantasy"
            style={{ maxHeight: "calc(100vh - 380px)" }}
          >
            <AnimatePresence>
              {participants.map((p, i) => {
                const hpPercent = p.maxHp > 0 ? (p.hp / p.maxHp) * 100 : 0;
                const isDead = p.hp <= 0;
                const isCurrentTurn = inCombat && i === currentTurn;
                const isAttackTarget = attackMode && p.id !== selectedAttacker;
                const wasJustHit = lastAttack?.targetId === p.id && lastAttack.hit;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: isDead ? 0.5 : 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`mb-2 rounded-xl border p-3.5 text-sm transition-all ${
                      isCurrentTurn
                        ? "border-primary/30 bg-primary/8 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                        : isAttackTarget
                        ? "border-destructive/30 bg-destructive/5 cursor-pointer hover:bg-destructive/10"
                        : isDead
                        ? "border-border/30 bg-muted/5"
                        : "border-border bg-muted/15"
                    }`}
                    onClick={() => isAttackTarget && performAttack(p.id)}
                  >
                    {/* Hit flash animation */}
                    {wasJustHit && (
                      <motion.div
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 rounded-xl bg-destructive/20 pointer-events-none"
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.isPlayer ? (
                          <span className="text-accent">⚔️</span>
                        ) : isDead ? (
                          <motion.span animate={{ rotate: [0, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                            💀
                          </motion.span>
                        ) : (
                          <Skull className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className={`font-medium text-xs ${isDead ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {p.name}
                        </span>
                        {inCombat && (
                          <span className="rounded-md bg-muted/50 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            Init: {p.initiative}
                          </span>
                        )}
                        {isAttackTarget && (
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-destructive"
                          >
                            <Target className="h-3.5 w-3.5" />
                          </motion.span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowConditionFor(showConditionFor === p.id ? null : p.id); }}
                          className="text-muted-foreground hover:text-primary transition p-0.5"
                          title="Add condition"
                        >
                          <Sparkles className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeParticipant(p.id); }}
                          className="text-muted-foreground hover:text-destructive transition p-0.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Conditions */}
                    {p.conditions.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.conditions.map((cId) => {
                          const cond = CONDITIONS.find((c) => c.id === cId);
                          return cond ? (
                            <motion.span
                              key={cId}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`inline-flex items-center gap-0.5 rounded-md bg-muted/30 border border-border/50 px-1.5 py-0.5 text-[9px] font-medium ${cond.color}`}
                              onClick={(e) => { e.stopPropagation(); toggleCondition(p.id, cId); }}
                              title={`Remove ${cond.label}`}
                            >
                              {cond.icon} {cond.label}
                            </motion.span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Condition picker dropdown */}
                    <AnimatePresence>
                      {showConditionFor === p.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 flex flex-wrap gap-1 overflow-hidden"
                        >
                          {CONDITIONS.map((cond) => (
                            <button
                              key={cond.id}
                              onClick={(e) => { e.stopPropagation(); toggleCondition(p.id, cond.id); }}
                              className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition ${
                                p.conditions.includes(cond.id)
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {cond.icon} {cond.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* HP bar */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground mb-1">
                          <span className="flex items-center gap-1">
                            <Heart className="h-2.5 w-2.5" /> HP
                          </span>
                          <span>
                            {p.hp}/{p.maxHp}
                            {p.tempHp > 0 && <span className="text-accent ml-1">(+{p.tempHp})</span>}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted relative">
                          <motion.div
                            animate={{ width: `${hpPercent}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`h-full rounded-full transition-colors duration-300 ${
                              hpPercent > 50
                                ? "bg-accent"
                                : hpPercent > 25
                                ? "bg-primary"
                                : "bg-destructive"
                            }`}
                          />
                          {/* Damage flash */}
                          {wasJustHit && (
                            <motion.div
                              initial={{ opacity: 0.8 }}
                              animate={{ opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 bg-destructive/50 rounded-full"
                            />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); adjustHp(p.id, -5); }}
                          className="h-6 w-6 rounded-md bg-destructive/10 border border-destructive/20 text-[10px] text-destructive hover:bg-destructive/20 transition"
                        >
                          -5
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); adjustHp(p.id, -1); }}
                          className="h-6 w-6 rounded-md bg-destructive/10 border border-destructive/20 text-[10px] text-destructive hover:bg-destructive/20 transition"
                        >
                          -1
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); adjustHp(p.id, 1); }}
                          className="h-6 w-6 rounded-md bg-accent/10 border border-accent/20 text-[10px] text-accent hover:bg-accent/20 transition"
                        >
                          +1
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); adjustHp(p.id, 5); }}
                          className="h-6 w-6 rounded-md bg-accent/10 border border-accent/20 text-[10px] text-accent hover:bg-accent/20 transition"
                        >
                          +5
                        </button>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted/30 rounded-md px-1.5 py-0.5 border border-border flex items-center gap-0.5">
                        <Shield className="h-2.5 w-2.5" />{p.ac}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {participants.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Swords className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Add participants to start combat</p>
              </div>
            )}
          </div>

          {/* Combat Log */}
          {combatLog.length > 0 && (
            <div className="border-t border-border px-4 py-2 max-h-24 overflow-y-auto scrollbar-fantasy">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Combat Log</p>
              {combatLog.slice(-5).map((log, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] text-muted-foreground py-0.5"
                >
                  {log}
                </motion.p>
              ))}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="space-y-3 border-t border-border p-4">
            {/* Dice roller */}
            <div className="flex items-center gap-1.5">
              <Dices className="h-3.5 w-3.5 text-primary" />
              {[4, 6, 8, 10, 12, 20].map((d) => (
                <button
                  key={d}
                  onClick={() => rollDice(d, `d${d}`)}
                  className="rounded-lg border border-border bg-muted/20 px-2 py-1 text-[10px] font-medium text-foreground transition hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                >
                  d{d}
                </button>
              ))}
              {lastRoll && (
                <motion.span
                  key={lastRoll.value + lastRoll.label}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="ml-1 font-display text-sm font-bold text-gold-glow"
                >
                  {lastRoll.value}
                </motion.span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {!inCombat && participants.length > 0 && (
                <motion.button
                  onClick={rollInitiativeForAll}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-xl bg-destructive/15 border border-destructive/20 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/25 flex items-center justify-center gap-1.5"
                >
                  <Swords className="h-3.5 w-3.5" /> Roll Initiative!
                </motion.button>
              )}
              {inCombat && (
                <motion.button
                  onClick={endCombat}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-xl bg-muted/30 border border-border py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground flex items-center justify-center gap-1.5"
                >
                  End Combat
                </motion.button>
              )}
            </div>

            {/* Add participants */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => addPlayer()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-accent/20 bg-accent/8 py-2 text-xs font-medium text-accent-foreground transition hover:bg-accent/15"
              >
                <Plus className="h-3.5 w-3.5" /> Player
              </motion.button>
              <select
                onChange={(e) => {
                  addMonster(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="flex-1 rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-xs text-foreground appearance-none cursor-pointer hover:bg-destructive/12 transition"
              >
                <option value="" disabled>
                  + Monster
                </option>
                {BESTIARY.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (CR {m.cr})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CombatTracker;
