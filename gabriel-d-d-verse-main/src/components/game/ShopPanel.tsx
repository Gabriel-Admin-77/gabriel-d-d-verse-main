import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Coins, Loader2, Check, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RARITY_COLORS, RARITY_BG } from "@/lib/progression";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  item_type: string;
  icon: string;
  price_gold: number;
  rarity: string;
  stat_bonus: Record<string, number>;
  min_level: number;
}

interface ShopPanelProps {
  characterId: string | null;
  characterLevel: number;
  characterGold: number;
  onPurchase: (item: ShopItem) => void;
}

const ShopPanel = ({ characterId, characterLevel, characterGold, onPurchase }: ShopPanelProps) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shop_items" as any)
        .select("*")
        .order("price_gold", { ascending: true });
      setItems((data as any[] || []) as ShopItem[]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.item_type === filter);
  const types = ["all", ...new Set(items.map(i => i.item_type))];

  const buyItem = async (item: ShopItem) => {
    if (!characterId || characterGold < item.price_gold || characterLevel < item.min_level) return;
    setBuying(item.id);

    // Deduct gold
    await supabase.from("characters").update({
      gold: characterGold - item.price_gold,
    }).eq("id", characterId);

    // Add to inventory
    await supabase.from("character_inventory").insert({
      character_id: characterId,
      item_name: item.name,
      item_type: item.item_type,
      item_icon: item.icon,
      quantity: 1,
    });

    onPurchase(item);
    toast.success(`Purchased ${item.name}!`, { description: `-${item.price_gold} gold` });
    setBuying(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Gold display */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
        <Coins className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">
          <span className="text-primary font-semibold">{characterGold}</span> gold available
        </span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-medium border capitalize transition ${
              filter === t ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-muted/10 text-muted-foreground"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {filtered.map(item => {
          const canAfford = characterGold >= item.price_gold;
          const meetsLevel = characterLevel >= item.min_level;
          const bonuses = Object.entries(item.stat_bonus || {});

          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-3 transition ${RARITY_COLORS[item.rarity]} ${RARITY_BG[item.rarity]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.name}</p>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
                        {item.rarity} · {item.item_type}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{item.description}</p>
                  {bonuses.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {bonuses.map(([stat, val]) => (
                        <span key={stat} className="text-[9px] rounded-full border border-border bg-muted/20 px-1.5 py-0.5 text-foreground">
                          +{val} {stat.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-semibold text-primary">{item.price_gold}g</span>
                  {!meetsLevel ? (
                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" /> Lvl {item.min_level}
                    </span>
                  ) : (
                    <motion.button
                      onClick={() => buyItem(item)}
                      disabled={!canAfford || buying === item.id}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-lg bg-primary/15 border border-primary/20 px-2.5 py-1 text-[10px] font-medium text-primary transition hover:bg-primary/25 disabled:opacity-40"
                    >
                      {buying === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Buy"}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopPanel;
