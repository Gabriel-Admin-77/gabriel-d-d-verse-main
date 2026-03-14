import { Link } from "react-router-dom";
import { ArrowRight, Mail, Globe, MessageCircle } from "lucide-react";

const Contact = () => (
  <div className="min-h-screen bg-background text-foreground" dir="rtl">
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition mb-8">
        <ArrowRight className="h-4 w-4" /> חזרה לאתר
      </Link>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-gold-glow mb-8">צור קשר</h1>

      <div className="space-y-8 text-foreground/90 leading-relaxed">
        <section>
          <p className="text-lg">
            יש לכם שאלה, הצעה, דיווח על באג או פשוט רוצים לומר שלום? נשמח לשמוע מכם!
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/50 p-6 flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">פניות כלליות</h2>
            <a href="mailto:contact@sovereigngrimoire.com" className="text-primary hover:underline text-sm">
              contact@sovereigngrimoire.com
            </a>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-6 flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <MessageCircle className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-lg font-semibold">תמיכה טכנית</h2>
            <a href="mailto:support@sovereigngrimoire.com" className="text-primary hover:underline text-sm">
              support@sovereigngrimoire.com
            </a>
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card/50 p-6">
          <h2 className="text-xl font-semibold text-primary mb-3">פרטי בעל האתר</h2>
          <ul className="space-y-2 text-foreground/80">
            <li><strong>שם:</strong> The Sovereign Grimoire</li>
            <li><strong>אימייל:</strong> <a href="mailto:contact@sovereigngrimoire.com" className="text-primary hover:underline">contact@sovereigngrimoire.com</a></li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span>אתר זה פועל תחת חוקי מדינת ישראל</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">זמני מענה</h2>
          <p>אנו משתדלים להשיב לכל פנייה תוך 48 שעות עסקיות. פניות דחופות בנושא נגישות יטופלו בעדיפות.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Contact;
