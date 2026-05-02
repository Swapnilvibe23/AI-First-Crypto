import { useState } from "react";
import { Share2, Copy, Check, Twitter, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatPrice, formatPercentage } from "@/lib/format";

interface ShareCoinButtonProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  currentPrice: number;
  change24h: number | undefined | null;
}

const SITE_URL = "AIFirstCrypto.com";

function trendEmoji(change: number | undefined | null): string {
  if (change == null) return "📊";
  if (change >= 5) return "🚀";
  if (change >= 0) return "📈";
  if (change >= -5) return "📉";
  return "🔻";
}

function buildInstagramText(
  coinName: string,
  coinSymbol: string,
  coinId: string,
  currentPrice: number,
  change24h: number | undefined | null
): string {
  const emoji = trendEmoji(change24h);
  const changeStr = change24h != null ? formatPercentage(change24h) : "N/A";
  const direction = change24h != null && change24h >= 0 ? "up" : "down";

  return [
    `${emoji} ${coinName} (${coinSymbol.toUpperCase()}) Update`,
    ``,
    `💵 Price: ${formatPrice(currentPrice)}`,
    `📊 24h Change: ${changeStr} — ${direction} today`,
    ``,
    `Track ${coinName} live, see the Fear & Greed index, and set price alerts 👇`,
    `${SITE_URL}/coin/${coinId}`,
    ``,
    `#crypto #${coinName.replace(/\s+/g, "").toLowerCase()} #${coinSymbol.toLowerCase()} #bitcoin #cryptotracker #cryptonews #blockchain`,
  ].join("\n");
}

function buildTwitterText(
  coinName: string,
  coinSymbol: string,
  coinId: string,
  currentPrice: number,
  change24h: number | undefined | null
): string {
  const emoji = trendEmoji(change24h);
  const changeStr = change24h != null ? formatPercentage(change24h) : "—";
  return `${emoji} ${coinName} (${coinSymbol.toUpperCase()}) is at ${formatPrice(currentPrice)} right now — ${changeStr} in 24h\n\nLive prices, market sentiment & price alerts at ${SITE_URL}/coin/${coinId}\n\n#crypto #${coinSymbol.toLowerCase()}`;
}

export function ShareCoinButton({
  coinId,
  coinName,
  coinSymbol,
  currentPrice,
  change24h,
}: ShareCoinButtonProps) {
  const [copiedTarget, setCopiedTarget] = useState<"instagram" | null>(null);
  const [open, setOpen] = useState(false);

  function copyInstagram() {
    const text = buildInstagramText(coinName, coinSymbol, coinId, currentPrice, change24h);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTarget("instagram");
      setTimeout(() => setCopiedTarget(null), 2500);
    });
  }

  function shareTwitter() {
    const text = buildTwitterText(coinName, coinSymbol, coinId, currentPrice, change24h);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  // Native share API (mobile PWA / Safari share sheet)
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  function nativeShare() {
    const text = buildTwitterText(coinName, coinSymbol, coinId, currentPrice, change24h);
    navigator.share({
      title: `${coinName} — ${formatPrice(currentPrice)}`,
      text,
      url: `https://${SITE_URL}/coin/${coinId}`,
    }).catch(() => {});
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="lg" className="rounded-full shadow-lg">
          <Share2 className="mr-2 h-5 w-5" />
          Share
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3" align="end" sideOffset={8}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Share {coinName} ({coinSymbol.toUpperCase()})
        </p>

        {/* Current snapshot preview */}
        <div className="mb-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">{formatPrice(currentPrice)}</span>
            <span className={`text-xs font-semibold ${change24h != null && change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
              {trendEmoji(change24h)} {change24h != null ? formatPercentage(change24h) : "—"} (24h)
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          {/* Instagram copy */}
          <button
            onClick={copyInstagram}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              copiedTarget === "instagram"
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "hover:bg-muted/60 border border-transparent"
            }`}
          >
            {copiedTarget === "instagram" ? (
              <Check className="h-4 w-4 flex-shrink-0 text-green-400" />
            ) : (
              <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <Instagram className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">
                {copiedTarget === "instagram" ? "Copied!" : "Copy for Instagram"}
              </div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">
                {copiedTarget === "instagram"
                  ? "Paste into your story or caption"
                  : "Caption + hashtags ready to paste"}
              </div>
            </div>
          </button>

          {/* Twitter / X */}
          <button
            onClick={shareTwitter}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors text-left border border-transparent"
          >
            <div className="h-4 w-4 flex-shrink-0 rounded-sm bg-black flex items-center justify-center border border-border">
              <Twitter className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-tight">Share on X (Twitter)</div>
              <div className="text-xs text-muted-foreground leading-tight mt-0.5">Opens a pre-filled post</div>
            </div>
            <Share2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </button>

          {/* Native share (mobile) */}
          {canNativeShare && (
            <button
              onClick={nativeShare}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors text-left border border-transparent"
            >
              <Share2 className="h-4 w-4 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">More options…</div>
                <div className="text-xs text-muted-foreground leading-tight mt-0.5">WhatsApp, Messages, etc.</div>
              </div>
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 px-1 leading-snug">
          Sharing price data from AIFirstCrypto. Not financial advice.
        </p>
      </PopoverContent>
    </Popover>
  );
}
