import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background text-foreground" dir="rtl">
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition mb-8">
        <ArrowRight className="h-4 w-4" /> חזרה לאתר
      </Link>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gold-glow mb-8">מדיניות פרטיות</h1>
      <p className="text-muted-foreground text-sm mb-6">עודכן לאחרונה: מרץ 2026</p>

      <div className="space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">כללי</h2>
          <p>
            <strong>The Sovereign Grimoire</strong> ("האתר", "אנחנו") מכבד את פרטיותך ומחויב להגן על המידע האישי שלך 
            בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 והתקנות שהותקנו מכוחו. 
            מדיניות זו מפרטת את סוגי המידע שאנו אוספים, כיצד אנו משתמשים בו ומהן זכויותיך.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">מידע שאנו אוספים</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li><strong>פרטי הרשמה:</strong> כתובת אימייל וסיסמה מוצפנת בעת יצירת חשבון</li>
            <li><strong>נתוני משחק:</strong> דמויות, בחירות, התקדמות במשחק והיסטוריית שיחות עם ה-DM</li>
            <li><strong>מידע טכני:</strong> סוג דפדפן, מערכת הפעלה, וכתובת IP (לצרכי אבטחה בלבד)</li>
            <li><strong>עוגיות (Cookies):</strong> לניהול הפעלה (session) ושמירת העדפות משתמש</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">כיצד אנו משתמשים במידע</h2>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li>ניהול חשבונך והפעלת חוויית המשחק</li>
            <li>שיפור חוויית המשתמש והתאמה אישית של התוכן</li>
            <li>שליחת עדכונים והתראות הקשורים לשירות (באישורך)</li>
            <li>אבטחת האתר ומניעת שימוש לרעה</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">שיתוף עם צדדים שלישיים</h2>
          <p>אנו עשויים לשתף מידע עם הגורמים הבאים:</p>
          <ul className="list-disc list-inside space-y-2 text-foreground/80 mt-2">
            <li><strong>שירותי AI:</strong> הודעות שנשלחות ל-AI Dungeon Master מעובדות דרך ספקי AI חיצוניים (כגון Google Gemini) לצורך יצירת תגובות. המידע אינו נשמר על ידם מעבר לעיבוד.</li>
            <li><strong>שירותי אחסון:</strong> המידע שלך מאוחסן בצורה מאובטחת על שרתים מוגנים.</li>
            <li>אנו <strong>לא מוכרים</strong> את המידע האישי שלך לצדדים שלישיים.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">זכויותיך</h2>
          <p>בהתאם לחוק, עומדות לך הזכויות הבאות:</p>
          <ul className="list-disc list-inside space-y-2 text-foreground/80 mt-2">
            <li>עיון במידע האישי שלך המוחזק אצלנו</li>
            <li>תיקון או מחיקת מידע שגוי</li>
            <li>הסרה מרשימות תפוצה בכל עת</li>
            <li>בקשה למחיקת חשבונך ומידע נלווה</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-xl font-semibold text-primary mb-3">יצירת קשר בנושא פרטיות</h2>
          <p>לשאלות או בקשות בנושא מדיניות הפרטיות:</p>
          <p className="mt-2"><strong>אימייל:</strong> <a href="mailto:privacy@sovereigngrimoire.com" className="text-primary hover:underline">privacy@sovereigngrimoire.com</a></p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
