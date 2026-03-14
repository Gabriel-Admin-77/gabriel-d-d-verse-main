import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const TermsOfUse = () => (
  <div className="min-h-screen bg-background text-foreground" dir="rtl">
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition mb-8">
        <ArrowRight className="h-4 w-4" /> חזרה לאתר
      </Link>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gold-glow mb-8">תקנון ותנאי שימוש</h1>
      <p className="text-muted-foreground text-sm mb-6">עודכן לאחרונה: מרץ 2026</p>

      <div className="space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">כללי</h2>
          <p>
            ברוכים הבאים ל-<strong>The Sovereign Grimoire</strong>. השימוש באתר ובשירותיו כפוף לתנאים המפורטים להלן. 
            עצם השימוש באתר מהווה הסכמה לתנאים אלה. אם אינך מסכים/ה לתנאי כלשהו, אנא הימנע/י משימוש באתר.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">זכויות יוצרים וקניין רוחני</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li>כל התכנים באתר, לרבות טקסטים, עיצובים, גרפיקה, קוד ולוגו, מוגנים בזכויות יוצרים ושייכים לבעלי האתר.</li>
            <li>תכנים שנוצרו באמצעות AI במהלך המשחק נוצרים עבורך לשימוש אישי בלבד.</li>
            <li>אין להעתיק, להפיץ, לשדר או לפרסם תכנים מהאתר ללא אישור בכתב מראש.</li>
            <li>שמות מותגים, סמלים והתייחסויות ל-D&D ו-Dungeons & Dragons הם רכושן של חברת Wizards of the Coast / Hasbro.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">הגבלת אחריות</h2>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-foreground/80">
            <ul className="list-disc list-inside space-y-2">
              <li>האתר והשירותים מסופקים "כמות שהם" (AS IS) ללא אחריות מכל סוג.</li>
              <li>תכנים שנוצרים על ידי ה-AI (Dungeon Master) הם לצרכי בידור בלבד ואינם מהווים ייעוץ מקצועי.</li>
              <li>אנו לא אחראים לנזק ישיר או עקיף הנובע משימוש באתר, לרבות אובדן נתונים או הפסדים כספיים.</li>
              <li>האתר אינו מתחייב לזמינות רציפה של השירות ושומר לעצמו את הזכות להפסיק או לשנות שירותים.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">שימוש הוגן – מה מותר ואסור</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
              <h3 className="font-semibold text-accent mb-2">✅ מותר</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                <li>שימוש אישי בשירותי המשחק</li>
                <li>שיתוף קישור לאתר</li>
                <li>משחק רב-משתתפים עם חברים</li>
                <li>צילומי מסך לשימוש אישי</li>
              </ul>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <h3 className="font-semibold text-destructive mb-2">❌ אסור</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                <li>ניסיון לפרוץ או לשבש את האתר</li>
                <li>העתקת התוכן למטרות מסחריות</li>
                <li>יצירת חשבונות מרובים לניצול שירותים</li>
                <li>שימוש בבוטים או כלים אוטומטיים</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">שינויים בתנאי השימוש</h2>
          <p>
            אנו שומרים לעצמנו את הזכות לעדכן תנאי שימוש אלה מעת לעת. שינויים מהותיים יפורסמו באתר. 
            המשך שימוש באתר לאחר עדכון מהווה הסכמה לתנאים המעודכנים.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default TermsOfUse;
