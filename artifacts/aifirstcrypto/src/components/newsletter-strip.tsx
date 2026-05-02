import { useState } from "react";
import { Mail, X, ArrowRight } from "lucide-react";

const BEEHIIV_EMBED_URL = "https://embeds.beehiiv.com/PLACEHOLDER_REPLACE_WITH_YOUR_EMBED_ID";

export function NewsletterStrip() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("aifirstcrypto_newsletter_dismissed") === "1"; }
    catch { return false; }
  });

  if (dismissed) return null;

  function dismiss() {
    try { localStorage.setItem("aifirstcrypto_newsletter_dismissed", "1"); }
    catch {}
    setDismissed(true);
  }

  return (
    <div className="relative w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-primary/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Get the daily crypto snapshot in your inbox</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            — market mood, top movers &amp; key news, every morning. Free.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={BEEHIIV_EMBED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
          >
            Subscribe free <ArrowRight className="h-3 w-3" />
          </a>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss newsletter banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
