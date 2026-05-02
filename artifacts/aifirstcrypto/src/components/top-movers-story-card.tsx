import { useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon } from "lucide-react";
import { formatPrice, formatPercentage } from "@/lib/format";

const CW = 1080;
const CH = 1920;

export interface MoverEntry {
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h?: number | null;
  image: string;
}

export interface TopMoversStoryCardProps {
  open: boolean;
  onClose: () => void;
  gainers: MoverEntry[];
  losers: MoverEntry[];
  date: string;
}

// ── Rounded rect path helper ───────────────────────────────────────────────
function rrPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Load a set of image URLs, return map url→HTMLImageElement ──────────────
function loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<[string, HTMLImageElement]>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload  = () => resolve([url, img]);
          img.onerror = () => resolve([url, img]); // resolve even on error
          img.src = url;
        }),
    ),
  ).then((pairs) => new Map(pairs));
}

// ── Main draw function ─────────────────────────────────────────────────────
function drawCard(
  ctx: CanvasRenderingContext2D,
  gainers: MoverEntry[],
  losers: MoverEntry[],
  date: string,
  imgMap: Map<string, HTMLImageElement>,
) {
  const PAD    = 72;
  const TOP_5G = gainers.slice(0, 5);
  const TOP_5L = losers.slice(0, 5);

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0,   "#07101e");
  bg.addColorStop(0.5, "#0b1624");
  bg.addColorStop(1,   "#040c18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  // Top-left glow (green)
  ctx.save();
  ctx.globalAlpha = 0.13;
  const gr1 = ctx.createRadialGradient(-60, -60, 0, -60, -60, 800);
  gr1.addColorStop(0, "#10b981");
  gr1.addColorStop(1, "transparent");
  ctx.fillStyle = gr1;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Bottom-right glow (red)
  ctx.save();
  ctx.globalAlpha = 0.13;
  const gr2 = ctx.createRadialGradient(CW + 60, CH + 60, 0, CW + 60, CH + 60, 800);
  gr2.addColorStop(0, "#ef4444");
  gr2.addColorStop(1, "transparent");
  ctx.fillStyle = gr2;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Dot grid
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.fillStyle = "#ffffff";
  for (let gx = 0; gx < CW; gx += 64) {
    for (let gy = 0; gy < CH; gy += 64) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // ── Utilities ─────────────────────────────────────────────────────────────
  function txt(
    str: string,
    x: number, y: number,
    opts: { size: number; color?: string; weight?: string | number; align?: CanvasTextAlign; alpha?: number; emoji?: boolean } = { size: 28 },
  ) {
    ctx.save();
    const fam = opts.emoji
      ? "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
      : "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.font      = `${opts.weight ?? "normal"} ${opts.size}px ${fam}`;
    ctx.fillStyle = opts.color ?? "#ffffff";
    ctx.textAlign = opts.align ?? "left";
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function fillRR(x: number, y: number, w: number, h: number, r: number, fill: string, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    rrPath(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  function strokeRR(x: number, y: number, w: number, h: number, r: number, stroke: string, lw = 1.5, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    rrPath(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }

  function hRule(yPos: number, alpha = 0.07) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, yPos);
    ctx.lineTo(CW - PAD, yPos);
    ctx.stroke();
    ctx.restore();
  }

  // ── Coin row ─────────────────────────────────────────────────────────────
  function drawCoinRow(
    coin: MoverEntry,
    rank: number,
    yRow: number,
    isGainer: boolean,
    maxPct: number,
  ) {
    const pct    = Math.abs(coin.price_change_percentage_24h ?? 0);
    const accent = isGainer ? "#10b981" : "#ef4444";
    const muted  = isGainer ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)";
    const border = isGainer ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.22)";
    const ROW_H  = 96;

    // Row background
    fillRR(PAD, yRow, CW - PAD * 2, ROW_H, 18, muted);
    strokeRR(PAD, yRow, CW - PAD * 2, ROW_H, 18, border);

    const cx = PAD + 24 + 34;  // centre of coin circle
    const cy = yRow + ROW_H / 2;

    // Coin image (circle clip)
    const imgEl = imgMap.get(coin.image);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.clip();
    if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
      ctx.drawImage(imgEl, cx - 34, cy - 34, 68, 68);
    } else {
      // Fallback: colored circle with first letter
      ctx.fillStyle = muted;
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = accent;
      ctx.font = `bold 32px -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(coin.symbol[0].toUpperCase(), cx, cy + 1);
    }
    ctx.restore();

    // Rank bubble
    fillRR(PAD + 24 + 70 + 12, yRow + ROW_H / 2 - 16, 32, 32, 8, "rgba(255,255,255,0.05)");
    txt(String(rank), PAD + 24 + 70 + 28, yRow + ROW_H / 2 + 9, {
      size: 22, weight: "700", color: "#475569", align: "center",
    });

    // Name + symbol
    const nameX = PAD + 24 + 70 + 54;
    const maxNameW = 340;
    ctx.save();
    ctx.font = `700 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    // Truncate long name
    let nameStr = coin.name;
    while (ctx.measureText(nameStr).width > maxNameW && nameStr.length > 4) {
      nameStr = nameStr.slice(0, -1);
    }
    if (nameStr !== coin.name) nameStr += "…";
    ctx.fillText(nameStr, nameX, yRow + ROW_H / 2 - 6);
    ctx.restore();

    txt(coin.symbol.toUpperCase(), nameX, yRow + ROW_H / 2 + 28, {
      size: 22, color: "#64748b", weight: "600",
    });

    // Bar + percentage
    const barX   = nameX + maxNameW + 24;
    const barW   = CW - PAD - barX - 180;
    const barH   = 14;
    const barY   = yRow + ROW_H / 2 - barH / 2;
    const fillW  = maxPct > 0 ? Math.max((pct / maxPct) * barW, 12) : 12;

    // Track
    fillRR(barX, barY, barW, barH, 7, "rgba(255,255,255,0.05)");
    // Fill
    fillRR(barX, barY, fillW, barH, 7, accent, 0.85);

    // Percentage badge
    const pctStr = formatPercentage(coin.price_change_percentage_24h);
    fillRR(CW - PAD - 166, yRow + ROW_H / 2 - 28, 166, 56, 28, isGainer ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)");
    txt(pctStr, CW - PAD - 83, yRow + ROW_H / 2 + 10, {
      size: 30, weight: 800, color: accent, align: "center",
    });
  }

  // ── Section header ────────────────────────────────────────────────────────
  function drawSectionHeader(label: string, emoji: string, yPos: number, isGainer: boolean) {
    const color = isGainer ? "#10b981" : "#ef4444";
    txt(emoji, PAD, yPos + 38, { size: 42, emoji: true });
    txt(label, PAD + 58, yPos + 40, { size: 36, weight: 900, color });
  }

  let y = 72;

  // ── HEADER ────────────────────────────────────────────────────────────────
  fillRR(PAD, y, 56, 56, 13, "#2563eb");
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(PAD + 11, y + 40);
  ctx.lineTo(PAD + 21, y + 23);
  ctx.lineTo(PAD + 32, y + 31);
  ctx.lineTo(PAD + 45, y + 13);
  ctx.stroke();
  ctx.restore();

  txt("AIFirstCrypto", PAD + 72, y + 39, { size: 40, weight: "bold" });
  txt("Daily Movers", CW - PAD, y + 39, { size: 28, weight: "600", color: "#475569", align: "right" });

  y += 76;
  hRule(y);
  y += 48;

  // Date + title
  txt("TODAY'S TOP MOVERS", CW / 2, y + 60, { size: 52, weight: 900, align: "center" });
  txt(date, CW / 2, y + 102, { size: 28, color: "#475569", weight: "600", align: "center" });
  y += 122;
  hRule(y);
  y += 40;

  // ── GAINERS ───────────────────────────────────────────────────────────────
  drawSectionHeader("TOP GAINERS", "🚀", y, true);
  y += 62;

  const maxGainerPct = Math.max(...TOP_5G.map(c => Math.abs(c.price_change_percentage_24h ?? 0)), 1);
  const ROW_H = 96;
  const ROW_GAP = 14;

  TOP_5G.forEach((coin, i) => {
    drawCoinRow(coin, i + 1, y, true, maxGainerPct);
    y += ROW_H + ROW_GAP;
  });

  y += 16;

  // Divider with gradient
  ctx.save();
  ctx.globalAlpha = 0.12;
  const divGrad = ctx.createLinearGradient(PAD, 0, CW - PAD, 0);
  divGrad.addColorStop(0,   "#10b981");
  divGrad.addColorStop(0.5, "#ffffff");
  divGrad.addColorStop(1,   "#ef4444");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(CW - PAD, y);
  ctx.stroke();
  ctx.restore();

  y += 36;

  // ── LOSERS ────────────────────────────────────────────────────────────────
  drawSectionHeader("TOP LOSERS", "📉", y, false);
  y += 62;

  const maxLoserPct = Math.max(...TOP_5L.map(c => Math.abs(c.price_change_percentage_24h ?? 0)), 1);

  TOP_5L.forEach((coin, i) => {
    drawCoinRow(coin, i + 1, y, false, maxLoserPct);
    y += ROW_H + ROW_GAP;
  });

  y += 16;
  hRule(y);
  y += 44;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  txt("Track daily movers, sentiment & alerts at", CW / 2, y + 34, { size: 28, color: "#64748b", align: "center" });
  y += 66;
  txt("AIFirstCrypto.com/top-movers", CW / 2, y + 34, { size: 40, weight: "800", color: "#3b82f6", align: "center" });
  y += 66;
  txt("Data: CoinGecko · Not financial advice", CW / 2, y + 26, {
    size: 21, color: "#1e293b", align: "center",
  });
}

// ── React component ────────────────────────────────────────────────────────
export function TopMoversStoryCard({
  open, onClose, gainers, losers, date,
}: TopMoversStoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const top5g = gainers.slice(0, 5);
    const top5l = losers.slice(0, 5);
    const allUrls = [...top5g, ...top5l].map(c => c.image);
    const imgMap = await loadImages(allUrls);
    drawCard(ctx, top5g, top5l, date, imgMap);
  }, [gainers, losers, date]);

  useEffect(() => {
    if (!open) return;
    render();
  }, [open, render]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `top-movers-${date.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-aifirstcrypto.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleMobileShare() {
    const canvas = canvasRef.current;
    if (!canvas || !("share" in navigator)) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `top-movers-${date}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Today's Top Crypto Movers — ${date}` }).catch(() => {});
      } else {
        handleDownload();
      }
    }, "image/png");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs sm:max-w-sm p-4 gap-4">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Story Card — Today's Top Movers
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            1080×1920 · Instagram Stories format · Ready to share
          </p>
        </DialogHeader>

        <div className="flex justify-center rounded-2xl bg-[#07101e] p-3 border border-border/40">
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            className="rounded-xl shadow-2xl"
            style={{ width: "100%", maxWidth: "255px", height: "auto" }}
          />
        </div>

        <div className="space-y-2">
          {"share" in navigator ? (
            <Button className="w-full gap-2 rounded-full font-bold" onClick={handleMobileShare}>
              <Download className="h-4 w-4" />
              Save &amp; Share Image
            </Button>
          ) : (
            <Button className="w-full gap-2 rounded-full font-bold" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download PNG (1080×1920)
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            Save to camera roll → post to Instagram Stories ·{" "}
            <span className="text-muted-foreground/60">No watermark · Yours to use</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
