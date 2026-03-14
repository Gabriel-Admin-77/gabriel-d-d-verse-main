import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Backpack, Hammer, ShoppingCart, Coins } from "lucide-react";
import { InventoryItem, CraftingRecipe } from "@/lib/gameTypes";
import { STARTER_INVENTORY, CRAFTING_RECIPES, CURRENCY } from "@/lib/gameData";

type Tab = "inventory" | "crafting" | "market";

const InventoryPanel = () => {
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [inventory] = useState<InventoryItem[]>(STARTER_INVENTORY);
  const [currency] = useState(CURRENCY);
  const [craftResult, setCraftResult] = useState<string | null>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "inventory", label: "Backpack", icon: <Backpack className="h-3.5 w-3.5" /> },
    { id: "crafting", label: "Smithy", icon: <Hammer className="h-3.5 w-3.5" /> },
    { id: "market", label: "Market", icon: <ShoppingCart className="h-3.5 w-3.5" /> },
  ];

  const attemptCraft = (recipe: CraftingRecipe) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    if (roll >= recipe.dc) {
      setCraftResult(`✅ Success! Crafted ${recipe.name} (rolled ${roll} vs DC ${recipe.dc})`);
    } else {
      setCraftResult(`❌ Failed to craft ${recipe.name} (rolled ${roll} vs DC ${recipe.dc})`);
    }
    setTimeout(() => setCraftResult(null), 4000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-border">
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

      <div className="flex-1 overflow-y-auto p-4 scrollbar-fantasy">
        <AnimatePresence mode="wait">
          {activeTab === "inventory" && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">
                  <span className="text-primary font-semibold">{currency.gold}</span> gold ·{" "}
                  <span className="text-muted-foreground">{currency.silver}</span> silver ·{" "}
                  <span className="text-muted-foreground">{currency.copper}</span> copper
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {inventory.map((item) => (
                  <motion.div key={item.id} whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-border bg-muted/15 p-3 text-center transition-all hover:border-primary/25 hover:bg-muted/30 cursor-default">
                    <span className="text-xl block">{item.icon}</span>
                    <p className="mt-1.5 text-xs font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.type} · x{item.quantity}</p>
                  </motion.div>
                ))}
              </div>
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
                {CRAFTING_RECIPES.map((recipe) => (
                  <div key={recipe.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/15 p-4 transition hover:bg-muted/25">
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{recipe.resultIcon}</span>
                        <span className="font-medium text-xs text-foreground">{recipe.name}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {recipe.ingredients.join(" + ")} · {recipe.check} DC {recipe.dc}
                      </p>
                    </div>
                    <motion.button onClick={() => attemptCraft(recipe)}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="rounded-lg bg-primary/15 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/25">
                      Craft
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "market" && (
            <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/20" />
                <p className="mt-3 text-sm text-muted-foreground">Market coming soon...</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Dynamic trading is on its way</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InventoryPanel;
