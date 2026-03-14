import { useState } from "react";
import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ShopPanel from "./ShopPanel";

interface ShopSidebarProps {
  characterId: string | null;
  characterLevel: number;
  characterGold: number;
  onPurchase: () => void;
}

const ShopSidebar = ({ characterId, characterLevel, characterGold, onPurchase }: ShopSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600/15 border border-teal-600/30 text-teal-500 shadow-lg backdrop-blur-md transition hover:bg-teal-600/25 hover:shadow-gold"
          title="Visit the Merchant"
        >
          <Store className="h-5 w-5 pointer-events-none" />
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[400px] bg-background/95 backdrop-blur-xl border-border p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <SheetTitle className="font-display text-lg text-foreground flex items-center gap-2">
            <Store className="h-5 w-5 text-teal-500" />
            Merchant's Wares
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 scrollbar-fantasy">
          <ShopPanel 
            characterId={characterId} 
            characterLevel={characterLevel} 
            characterGold={characterGold} 
            onPurchase={onPurchase} 
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShopSidebar;
