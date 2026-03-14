import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card/30 backdrop-blur-sm" dir="rtl">
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-glow" />
          <span className="font-display text-sm font-semibold text-gold-glow">The Sovereign Grimoire</span>
        </div>

        {/* Legal links */}
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
          <Link to="/accessibility" className="hover:text-primary transition">הצהרת נגישות</Link>
          <Link to="/privacy" className="hover:text-primary transition">מדיניות פרטיות</Link>
          <Link to="/terms" className="hover:text-primary transition">תנאי שימוש</Link>
          <Link to="/contact" className="hover:text-primary transition">צור קשר</Link>
        </nav>

        {/* Copyright */}
        <p className="text-[11px] text-muted-foreground/60">
          © {new Date().getFullYear()} The Sovereign Grimoire. כל הזכויות שמורות.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
