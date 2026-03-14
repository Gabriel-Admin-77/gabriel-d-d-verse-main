import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Accessibility = () => (
  <div className="min-h-screen bg-background text-foreground" dir="rtl">
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition mb-8">
        <ArrowRight className="h-4 w-4" /> חזרה לאתר
      </Link>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gold-glow mb-8">הצהרת נגישות</h1>
      <p className="text-muted-foreground text-sm mb-6">עודכן לאחרונה: מרץ 2026</p>

      <div className="space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">מחויבות לנגישות</h2>
          <p>
            אנו ב-<strong>The Sovereign Grimoire</strong> מחויבים להנגיש את האתר והשירותים שלנו לכלל הציבור, 
            לרבות אנשים עם מוגבלויות, בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998, 
            ותקנות הנגישות לשירותי אינטרנט (תקן SI 5568) ברמת AA של WCAG 2.1.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">התאמות הנגישות שבוצעו</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li>ניווט מלא באמצעות מקלדת בלבד</li>
            <li>תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver)</li>
            <li>מבנה סמנטי תקין עם כותרות היררכיות (H1-H6)</li>
            <li>טקסט חלופי (alt) לתמונות ואלמנטים גרפיים</li>
            <li>ניגודיות צבעים מספקת בין טקסט לרקע</li>
            <li>אפשרות להגדלת טקסט עד 200% ללא אובדן תוכן</li>
            <li>טפסים מונגשים עם תוויות (labels) ברורות</li>
            <li>התראות ומשובים מונגשים למשתמש</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">טכנולוגיות בשימוש</h2>
          <p>
            האתר בנוי באמצעות React עם HTML סמנטי, Tailwind CSS לעיצוב רספונסיבי, 
            ו-ARIA attributes להנגשת רכיבים אינטראקטיביים. האתר נבדק ותואם לדפדפנים Chrome, Firefox, Safari ו-Edge.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">מגבלות ידועות</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li>חלק מהתמונות שנוצרות באמצעות AI עשויות לחסור טקסט חלופי מפורט</li>
            <li>אנימציות מסוימות עשויות שלא להיות נגישות לחלוטין למשתמשי קוראי מסך</li>
            <li>אנו עובדים באופן שוטף לשיפור הנגישות</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-xl font-semibold text-primary mb-3">רכז/ת נגישות</h2>
          <p className="mb-2">נתקלתם בבעיית נגישות? אנא פנו אלינו ונטפל בכך בהקדם:</p>
          <ul className="space-y-1 text-foreground/80">
            <li><strong>שם:</strong> צוות The Sovereign Grimoire</li>
            <li><strong>אימייל:</strong> <a href="mailto:accessibility@sovereigngrimoire.com" className="text-primary hover:underline">accessibility@sovereigngrimoire.com</a></li>
          </ul>
        </section>
      </div>
    </div>
  </div>
);

export default Accessibility;
