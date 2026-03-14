import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Map, Plus, Users, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface MobileNavProps {
  onAdventurePick: () => void;
  onNewCharacter: () => void;
  onMultiplayer: () => void;
  onSignOut: () => void;
  adventureTitle?: string;
}

const MobileNav = ({ onAdventurePick, onNewCharacter, onMultiplayer, onSignOut, adventureTitle }: MobileNavProps) => {
  const [open, setOpen] = useState(false);

  // Close on escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const item = (icon: React.ReactNode, label: string, action: () => void) => (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { action(); setOpen(false); }}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-ui text-foreground active:bg-muted/40 transition"
    >
      {icon}
      {label}
    </motion.button>
  );

  return (
    <div className="lg:hidden relative">
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.95 }}
        className="btn-ink rounded-lg p-2.5"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop to close menu on outside click */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed left-3 right-3 top-[60px] z-50 rounded-2xl border border-border bg-card/98 backdrop-blur-xl shadow-lg p-3 space-y-0.5"
            >
              {item(<Map className="h-4 w-4 text-primary" />, adventureTitle || "Choose Adventure", onAdventurePick)}
              {item(<Users className="h-4 w-4 text-primary" />, "Multiplayer", onMultiplayer)}
              {item(<Plus className="h-4 w-4 text-primary" />, "New Character", onNewCharacter)}

              <div className="my-1.5 h-px bg-border" />

              <div className="flex items-center justify-between px-2 py-1">
                <ThemeToggle />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { onSignOut(); setOpen(false); }}
                  className="btn-ink flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileNav;
