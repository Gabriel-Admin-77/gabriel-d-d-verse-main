import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Backpack, Hammer, ShoppingCart, Coins, Heart } from "lucide-react";
import { InventoryItem, CraftingRecipe } from "@/lib/gameTypes";
import { CRAFTING_RECIPES } from "@/lib/gameData";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ShopPanel from "./ShopPanel";
import { toast } from "sonner";

type Tab = "inventory" | "crafting" | "market";

const POTION_HEAL_MAP: Record<string, number> = {
  "health potion": 8,
  "healing potion": 8,
  "potion of healing": 10,
  "greater healing potion": 20,
  "potion of greater healing": 20,
  "superior healing potion": 35,
  "supreme healing potion": 50,
};

function getHealAmount(itemName: string): number | null {
  const lower = itemName.toLowerCase();
  for (const [key, val] of Object.entries(POTION_HEAL_MAP)) {
    if (lower.includes(key)) return val;
  }
  // Generic: anything with "potion" and "heal" or "health"
  if (lower.includes("potion") && (lower.includes("heal") || lower.includes("health"))) return 8;
  return null;
}

interface InventorySidebarProps {
  characterId?: string | null;
  characterLevel?: number;
  characterGold?: number;
  characterHpCurrent?: number;
  characterHpMax?: number;
  onGoldChange?: (newGold: number) => void;
  onHeal?: () => void;
}

const InventorySidebar = ({ characterId, characterLevel = 1, characterGold = 0, characterHpCurrent = 0, characterHpMax = 1, onGoldChange, onHeal }: InventorySidebarProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [currency, setCurrency] = useState({ gold: characterGold, silver: 0, copper: 0 });
  const [craftResult, setCraftResult] = useState<string | null>(null);
  const [healingItemId, setHealingItemId] = useState<string | null>(null);

  const loadInventory = async () => {
    if (!characterId) return;
    const { data } = await supabase.from("character_inventory")
      .select("*").eq("character_id", characterId);
    if (data) {
      setInventory(data.map(d => ({
        id: d.id, name: d.item_name, quantity: d.quantity,
        type: d.item_type, icon: d.item_icon,
      })));
    }
  };

  useEffect(() => { loadInventory(); }, [characterId]);

  useEffect(() => {
    setCurrency(prev => ({ ...prev, gold: characterGold }));
  }, [characterGold]);

  const usePotion = async (item: InventoryItem) => {
    if (!characterId) return;
    const healAmt = getHealAmount(item.name);
    if (!healAmt) return;

    if (characterHpCurrent >= characterHpMax) {
      toast.info("You're already at full health!");
      return;
    }

    setHealingItemId(item.id);
    const actualHeal = Math.min(healAmt, characterHpMax - characterHpCurrent);
    const newHp = characterHpCurrent + actualHeal;

    // Update HP
    await supabase.from("characters").update({ hp_current: newHp }).eq("id", characterId);

    // Decrement or delete potion
    if (item.quantity > 1) {
      await supabase.from("character_inventory").update({ quantity: item.quantity - 1 }).eq("id", item.id);
    } else {
      await supabase.from("character_inventory").delete().eq("id", item.id);
    }

    toast.success(`💚 Healed ${actualHeal} HP! (${newHp}/${characterHpMax})`);
    setTimeout(() => setHealingItemId(null), 600);
    loadInventory();
    onHeal?.();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "inventory", label: "Backpack", icon: <Backpack className="h-4 w-4" /> },
    { id: "crafting", label: "Smithy", icon: <Hammer className="h-4 w-4" /> },
    { id: "market", label: "Shop", icon: <ShoppingCart className="h-4 w-4" /> },
  ];

  const hasIngredients = (recipe: CraftingRecipe) => {
    return recipe.ingredients.every((ing) => {
      const lower = ing.toLowerCase();
      return inventory.some((item) => item.name.toLowerCase().includes(lower) && item.quantity >= 1);
    });
  };

  const attemptCraft = async (recipe: CraftingRecipe) => {
    if (!characterId) return;
    if (!hasIngredients(recipe)) {
      toast.error(`Missing ingredients for ${recipe.name}`);
      setCraftResult(`❌ Missing ingredients: ${recipe.ingredients.join(", ")}`);
      setTimeout(() => setCraftResult(null), 4000);
      return;
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    const success = roll >= recipe.dc;

    // Consume ingredients regardless of success
    for (const ing of recipe.ingredients) {
      const lower = ing.toLowerCase();
      const invItem = inventory.find((item) => item.name.toLowerCase().includes(lower));
      if (invItem) {
        if (invItem.quantity > 1) {
          await supabase.from("character_inventory").update({ quantity: invItem.quantity - 1 }).eq("id", invItem.id);
        } else {
          await supabase.from("character_inventory").delete().eq("id", invItem.id);
        }
      }
    }

    if (success) {
      // Add crafted item to inventory
      await supabase.from("character_inventory").insert({
        character_id: characterId,
        item_name: recipe.name,
        item_type: "crafted",
        item_icon: recipe.resultIcon,
        quantity: 1,
      });
      setCraftResult(`✅ Success! Crafted ${recipe.name} (rolled ${roll} vs DC ${recipe.dc})`);
      toast.success(`${recipe.resultIcon} Crafted ${recipe.name}!`);
    } else {
      setCraftResult(`❌ Failed! Materials consumed. (rolled ${roll} vs DC ${recipe.dc})`);
      toast.error(`Crafting failed — materials lost! (${roll} vs DC ${recipe.dc})`);
    }

    loadInventory();
    setTimeout(() => setCraftResult(null), 4000);
  };

  const handlePurchase = (item: any) => {
    loadInventory();
    setCurrency(prev => ({ ...prev, gold: prev.gold - item.price_gold }));
    onGoldChange?.(currency.gold - item.price_gold);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-lg backdrop-blur-md transition hover:bg-primary/25 hover:shadow-gold"
        >
          <Backpack className="h-5 w-5" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[340px] sm:w-[380px] bg-background/95 backdrop-blur-xl border-border p-0">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="font-display text-lg text-foreground">Inventory</SheetTitle>
        </SheetHeader>

        <div className="flex border-b border-border mt-3">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-fantasy" style={{ maxHeight: "calc(100vh - 130px)" }}>
          <AnimatePresence mode="wait">
            {activeTab === "inventory" && (
              <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">
                    <span className="text-primary font-semibold">{currency.gold}</span> gold
                  </span>
                </div>
                {inventory.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Your backpack is empty. Visit the shop!</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {inventory.map((item) => {
                      const healAmt = getHealAmount(item.name);
                      const isPotion = healAmt !== null;
                      const isHealing = healingItemId === item.id;

                      return (
                        <motion.div key={item.id} whileHover={{ scale: 1.02 }}
                          className={`rounded-xl border p-3 text-center transition-all cursor-default ${
                            isHealing
                              ? "border-green-500/50 bg-green-500/10"
                              : isPotion
                                ? "border-green-500/20 bg-muted/15 hover:border-green-500/40 hover:bg-green-500/5"
                                : "border-border bg-muted/15 hover:border-primary/25 hover:bg-muted/30"
                          }`}>
                          <span className="text-xl block">{item.icon}</span>
                          <p className="mt-1.5 text-xs font-medium text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{item.type} · x{item.quantity}</p>
                          {isPotion && (
                            <motion.button
                              onClick={() => usePotion(item)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="mt-2 flex items-center justify-center gap-1 w-full rounded-lg bg-green-600/20 border border-green-500/30 px-2 py-1 text-[10px] font-semibold text-green-400 transition hover:bg-green-600/30"
                            >
                              <Heart className="h-3 w-3" />
                              Use (+{healAmt} HP)
                            </motion.button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "crafting" && (
              <motion.div key="crafting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnimatePresence>
                  {craftResult && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground">
                      {craftResult}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="space-y-2">
                  {CRAFTING_RECIPES.map((recipe) => {
                    const canCraft = hasIngredients(recipe);
                    return (
                      <div key={recipe.id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition ${
                          canCraft 
                            ? "border-accent/20 bg-accent/5 hover:bg-accent/10"
                            : "border-border bg-muted/15 opacity-70 hover:bg-muted/25"
                        }`}>
                        <div className="flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <span>{recipe.resultIcon}</span>
                            <span className="font-medium text-xs text-foreground">{recipe.name}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {recipe.ingredients.map((ing, idx) => {
                              const hasIt = inventory.some((item) => item.name.toLowerCase().includes(ing.toLowerCase()) && item.quantity >= 1);
                              return (
                                <span key={idx} className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${
                                  hasIt ? "border-accent/30 bg-accent/10 text-accent" : "border-destructive/20 bg-destructive/5 text-destructive"
                                }`}>
                                  {hasIt ? "✓" : "✗"} {ing}
                                </span>
                              );
                            })}
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {recipe.check} DC {recipe.dc}
                          </p>
                        </div>
                        <motion.button onClick={() => attemptCraft(recipe)}
                          whileHover={{ scale: canCraft ? 1.05 : 1 }} whileTap={{ scale: canCraft ? 0.95 : 1 }}
                          disabled={!canCraft}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition shrink-0 ${
                            canCraft
                              ? "bg-primary/15 border-primary/20 text-primary hover:bg-primary/25"
                              : "bg-muted/20 border-border text-muted-foreground cursor-not-allowed"
                          }`}>
                          {canCraft ? "Craft" : "Need Materials"}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "market" && (
              <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ShopPanel
                  characterId={characterId || null}
                  characterLevel={characterLevel}
                  characterGold={currency.gold}
                  onPurchase={handlePurchase}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InventorySidebar;
