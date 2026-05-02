import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon } from "lucide-react";
import { formatPrice } from "@/lib/format";

// ── Canvas dimensions (Instagram Stories 9:16) ─────────────────────────────
const CW = 1080;
const CH = 1920;

export interface StoryCardData {
  coinName: string;
  coinSymbol: string;
  amountNum: number;
  frequency: string;
  periodLabel: string;
  totalInvested: number;
  currentValue: number;
  profitLoss: number;
  roi: number;
  avgBuyPrice: number;
  purchases: number;
  chartData?: { portfolioValue: number; totalInvested: number }[];
}

export interface DCAStoryCardProps extends StoryCardData {
  open: boolean;
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function roiEmoji(roi: number) {
  if (roi >= 100) return "🚀";
  if (roi >= 20)  return "📈";
  if (roi >= 0)   return "✅";
  if (roi >= -20) return "📉";
  return "🔻";
}

function freqLabel(f: string) {
  if (f === "weekly")   return "weekly";
  if (f === "biweekly") return "bi-weekly";
  return "monthly";
}

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

// ── Main draw function ─────────────────────────────────────────────────────

function drawCard(ctx: CanvasRenderingContext2D, d: StoryCardData) {
  const isProfit     = d.roi >= 0;
  const accent       = isProfit ? "#10b981" : "#ef4444";
  const accentMuted  = isProfit ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)";
  const accentBorder = isProfit ? "rgba(16,185,129,0.28)" : "rgba(239,68,68,0.28)";
  const PAD = 80;

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0,   "#08111f");
  bg.addColorStop(0.5, "#0c1827");
  bg.addColorStop(1,   "#040c18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  // Radial glow — top-right (accent)
  ctx.save();
  ctx.globalAlpha = 0.18;
  const gr1 = ctx.createRadialGradient(CW + 80, -80, 0, CW + 80, -80, 900);
  gr1.addColorStop(0, accent);
  gr1.addColorStop(1, "transparent");
  ctx.fillStyle = gr1;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Radial glow — bottom-left (blue)
  ctx.save();
  ctx.globalAlpha = 0.12;
  const gr2 = ctx.createRadialGradient(-80, CH + 80, 0, -80, CH + 80, 800);
  gr2.addColorStop(0, "#2563eb");
  gr2.addColorStop(1, "transparent");
  ctx.fillStyle = gr2;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Dot grid texture
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = "#ffffff";
  for (let gx = 0; gx < CW; gx += 64) {
    for (let gy = 0; gy < CH; gy += 64) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // ── Utility: text ─────────────────────────────────────────────────────────
  function txt(
    str: string,
    x: number,
    y: number,
    opts: {
      size: number;
      color?: string;
      weight?: string | number;
      align?: CanvasTextAlign;
      alpha?: number;
      emoji?: boolean;
    } = { size: 32 },
  ) {
    ctx.save();
    const family = opts.emoji
      ? "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
      : "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.font = `${opts.weight ?? "normal"} ${opts.size}px ${family}`;
    ctx.fillStyle = opts.color ?? "#ffffff";
    ctx.textAlign = opts.align ?? "left";
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // ── Utility: filled rounded rect ──────────────────────────────────────────
  function fillRR(
    x: number, y: number, w: number, h: number, r: number,
    fill: string, alpha = 1,
  ) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    rrPath(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  // ── Utility: stroked rounded rect ─────────────────────────────────────────
  function strokeRR(
    x: number, y: number, w: number, h: number, r: number,
    stroke: string, lw = 2, alpha = 1,
  ) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    rrPath(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }

  // ── Utility: thin horizontal rule ─────────────────────────────────────────
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

  let y = 72;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  // Logo box
  fillRR(PAD, y, 56, 56, 13, "#2563eb");
  // Simplified activity-icon lines
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.lineCap  = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(PAD + 11, y + 40);
  ctx.lineTo(PAD + 21, y + 23);
  ctx.lineTo(PAD + 32, y + 31);
  ctx.lineTo(PAD + 45, y + 13);
  ctx.stroke();
  ctx.restore();

  txt("AIFirstCrypto", PAD + 72, y + 39, { size: 40, weight: "bold" });
  txt("DCA Simulation", CW - PAD, y + 39, { size: 28, weight: "600", color: "#475569", align: "right" });

  y += 76;
  hRule(y);
  y += 88;

  // ═══════════════════════════════════════════════════════════════════════════
  // COIN IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  // Emoji
  txt(roiEmoji(d.roi), CW / 2, y + 100, { size: 120, align: "center", emoji: true });
  y += 140;

  // Coin name
  const nameSize = d.coinName.length > 14 ? 72 : d.coinName.length > 10 ? 84 : 96;
  txt(d.coinName, CW / 2, y + nameSize, { size: nameSize, weight: 900, align: "center" });
  y += nameSize + 22;

  // Ticker pill
  const tickerW = 220;
  fillRR(CW / 2 - tickerW / 2, y + 8, tickerW, 58, 29, "rgba(255,255,255,0.07)");
  txt(`$${d.coinSymbol.toUpperCase()}`, CW / 2, y + 51, {
    size: 30, weight: "700", color: "#94a3b8", align: "center",
  });
  y += 102;

  // Strategy pill
  const stratStr = `$${d.amountNum.toLocaleString()} ${freqLabel(d.frequency)} · ${d.periodLabel}`;
  const stratPillW = Math.min(Math.max(stratStr.length * 22 + 72, 420), CW - PAD * 2);
  fillRR(CW / 2 - stratPillW / 2, y + 10, stratPillW, 72, 36, "rgba(37,99,235,0.14)");
  strokeRR(CW / 2 - stratPillW / 2, y + 10, stratPillW, 72, 36, "rgba(59,130,246,0.35)", 2);
  txt(stratStr, CW / 2, y + 61, { size: 31, weight: "700", color: "#60a5fa", align: "center" });
  y += 128;

  // ═══════════════════════════════════════════════════════════════════════════
  // HUGE ROI
  // ═══════════════════════════════════════════════════════════════════════════

  y += 28;

  // Subtle ROI glow backdrop
  ctx.save();
  ctx.globalAlpha = 0.09;
  const roiGlow = ctx.createRadialGradient(CW / 2, y + 180, 0, CW / 2, y + 180, 450);
  roiGlow.addColorStop(0, accent);
  roiGlow.addColorStop(1, "transparent");
  ctx.fillStyle = roiGlow;
  ctx.fillRect(0, y - 20, CW, 420);
  ctx.restore();

  const roiStr = `${d.roi >= 0 ? "+" : ""}${d.roi.toFixed(2)}%`;
  const roiSize = roiStr.length > 9 ? 140 : roiStr.length > 7 ? 158 : 176;
  txt(roiStr, CW / 2, y + roiSize, { size: roiSize, weight: 900, color: accent, align: "center" });

  txt("RETURN ON INVESTMENT", CW / 2, y + roiSize + 56, {
    size: 28, weight: "700", color: "#334155", align: "center",
  });
  y += roiSize + 28;

  // ── Portfolio Growth sparkline ─────────────────────────────────────────────
  if (d.chartData && d.chartData.length > 2) {
    const cd   = d.chartData;
    const spX  = PAD;
    const spY  = y + 46;
    const spW  = CW - PAD * 2;
    const spH  = 148;
    const allV = cd.map(p => p.portfolioValue);
    const minV = Math.min(...allV);
    const maxV = Math.max(...allV);
    const range = maxV - minV || 1;

    const px = (i: number) => spX + (i / (cd.length - 1)) * spW;
    const py = (v: number) => spY + spH - ((v - minV) / range) * spH;

    txt("PORTFOLIO GROWTH", CW / 2, y + 32, {
      size: 24, weight: "700", color: "#334155", align: "center",
    });

    // Area fill (portfolio value)
    ctx.save();
    const spGrad = ctx.createLinearGradient(0, spY, 0, spY + spH);
    spGrad.addColorStop(0, `${accent}55`);
    spGrad.addColorStop(1, `${accent}00`);
    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.moveTo(px(0), py(cd[0].portfolioValue));
    cd.forEach((p, i) => { if (i > 0) ctx.lineTo(px(i), py(p.portfolioValue)); });
    ctx.lineTo(px(cd.length - 1), spY + spH);
    ctx.lineTo(px(0), spY + spH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Portfolio value line
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.lineCap  = "round";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(px(0), py(cd[0].portfolioValue));
    cd.forEach((p, i) => { if (i > 0) ctx.lineTo(px(i), py(p.portfolioValue)); });
    ctx.stroke();
    ctx.restore();

    // Invested line (dashed white)
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(px(0), py(cd[0].totalInvested));
    cd.forEach((p, i) => { if (i > 0) ctx.lineTo(px(i), py(p.totalInvested)); });
    ctx.stroke();
    ctx.restore();

    // Legend
    const legY = spY + spH + 28;
    // accent dot
    ctx.save(); ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(spX + 12, legY, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    txt("Portfolio Value", spX + 28, legY + 8, { size: 22, color: "#64748b" });
    // white dot
    ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.beginPath(); ctx.arc(spX + 300, legY, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    txt("Amount Invested", spX + 316, legY + 8, { size: 22, color: "#64748b" });

    y += spH + 80;
  } else {
    y += 24;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2×2 STAT GRID
  // ═══════════════════════════════════════════════════════════════════════════

  const gap = 20;
  const sW  = (CW - PAD * 2 - gap) / 2;
  const sH  = 218;

  type Stat = { label: string; value: string; sub: string; accent?: boolean };
  const stats: Stat[] = [
    {
      label: "TOTAL INVESTED",
      value: formatPrice(d.totalInvested),
      sub: `${d.purchases} purchases`,
    },
    {
      label: "CURRENT VALUE",
      value: formatPrice(d.currentValue),
      sub: "at today's price",
      accent: true,
    },
    {
      label: "PROFIT / LOSS",
      value: `${d.profitLoss >= 0 ? "+" : ""}${formatPrice(Math.abs(d.profitLoss))}`,
      sub: "vs total invested",
      accent: true,
    },
    {
      label: "AVG BUY PRICE",
      value: formatPrice(d.avgBuyPrice),
      sub: "average per coin",
    },
  ];

  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx  = PAD + col * (sW + gap);
    const sy  = y + row * (sH + gap);

    fillRR(sx, sy, sW, sH, 24, "rgba(255,255,255,0.03)");
    strokeRR(sx, sy, sW, sH, 24, s.accent ? accentBorder : "rgba(255,255,255,0.07)", 1.5);

    if (s.accent) {
      fillRR(sx, sy, sW, sH, 24, accentMuted);
    }

    txt(s.label, sx + 32, sy + 56, { size: 22, color: "#475569", weight: "700" });

    const valSize = s.value.length > 10 ? 44 : s.value.length > 7 ? 50 : 56;
    txt(s.value, sx + 32, sy + 56 + valSize + 32, {
      size: valSize, weight: 800, color: s.accent ? accent : "#ffffff",
    });
    txt(s.sub, sx + 32, sy + sH - 30, { size: 22, color: "#334155" });
  });

  y += 2 * sH + gap + 36;

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  hRule(y);
  y += 58;

  txt("Run your free DCA simulation at", CW / 2, y + 34, { size: 29, color: "#64748b", align: "center" });
  y += 70;
  txt("AIFirstCrypto.com/dca", CW / 2, y + 34, { size: 42, weight: "800", color: "#3b82f6", align: "center" });
  y += 70;
  txt(
    "Not financial advice · Data: CoinGecko · Educational purposes only",
    CW / 2, y + 28,
    { size: 21, color: "#1e293b", align: "center" },
  );
}

// ── React component ────────────────────────────────────────────────────────

export function DCAStoryCard({ open, onClose, ...data }: DCAStoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCard(ctx, data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data.roi, data.coinName, data.coinSymbol, data.amountNum, data.frequency, data.periodLabel]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `dca-${data.coinSymbol.toLowerCase()}-aifirstcrypto.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleMobileShare() {
    const canvas = canvasRef.current;
    if (!canvas || !("share" in navigator)) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `dca-${data.coinSymbol.toLowerCase()}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `My ${data.coinName} DCA Result` }).catch(() => {});
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
            Story Card — {data.coinName} ({data.coinSymbol.toUpperCase()})
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            1080×1920 · Instagram Stories format · Ready to save & share
          </p>
        </DialogHeader>

        {/* Canvas preview */}
        <div className="flex justify-center rounded-2xl bg-[#08111f] p-3 border border-border/40">
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            className="rounded-xl shadow-2xl"
            style={{ width: "100%", maxWidth: "255px", height: "auto" }}
          />
        </div>

        {/* Actions */}
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
