import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon } from "lucide-react";

const CW = 1080;
const CH = 1920;

export interface FGHistoryPoint {
  date: string;
  value: number;
}

export interface FearGreedStoryCardProps {
  open: boolean;
  onClose: () => void;
  value: number;
  classification: string;
  updatedDate: string;
  history: FGHistoryPoint[];
  avgScore: number | null;
}

// ── Colour helpers ─────────────────────────────────────────────────────────
function sentimentColor(v: number) {
  if (v <= 25) return "#ef4444";
  if (v <= 45) return "#f97316";
  if (v <= 55) return "#eab308";
  if (v <= 75) return "#22c55e";
  return "#10b981";
}

function sentimentLabel(v: number) {
  if (v <= 25) return "Extreme Fear";
  if (v <= 45) return "Fear";
  if (v <= 55) return "Neutral";
  if (v <= 75) return "Greed";
  return "Extreme Greed";
}

function sentimentEmoji(v: number) {
  if (v <= 25) return "😱";
  if (v <= 45) return "😰";
  if (v <= 55) return "😐";
  if (v <= 75) return "😏";
  return "🤑";
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

// ── Main draw function ─────────────────────────────────────────────────────
function drawCard(
  ctx: CanvasRenderingContext2D,
  value: number,
  classification: string,
  updatedDate: string,
  history: FGHistoryPoint[],
  avgScore: number | null,
) {
  const color      = sentimentColor(value);
  const colorMuted = `${color}22`;
  const PAD        = 80;

  // ── Background ────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0,   "#060c18");
  bg.addColorStop(0.5, "#0a1220");
  bg.addColorStop(1,   "#040810");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  // Radial glow (accent)
  ctx.save();
  ctx.globalAlpha = 0.16;
  const gr1 = ctx.createRadialGradient(CW / 2, 600, 0, CW / 2, 600, 700);
  gr1.addColorStop(0, color);
  gr1.addColorStop(1, "transparent");
  ctx.fillStyle = gr1;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Bottom glow
  ctx.save();
  ctx.globalAlpha = 0.08;
  const gr2 = ctx.createRadialGradient(CW / 2, CH, 0, CW / 2, CH, 600);
  gr2.addColorStop(0, "#2563eb");
  gr2.addColorStop(1, "transparent");
  ctx.fillStyle = gr2;
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // Dot grid texture
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
    ctx.font   = `${opts.weight ?? "normal"} ${opts.size}px ${family}`;
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

  function strokeRR(x: number, y: number, w: number, h: number, r: number, stroke: string, lw = 2, alpha = 1) {
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

  let y = 72;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  fillRR(PAD, y, 56, 56, 13, "#2563eb");
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
  txt("Fear & Greed Index", CW - PAD, y + 39, { size: 28, weight: "600", color: "#475569", align: "right" });

  y += 76;
  hRule(y);
  y += 68;

  // Date
  txt(`Updated ${updatedDate}`, CW / 2, y + 30, { size: 28, color: "#475569", align: "center", weight: "500" });
  y += 66;

  // ═══════════════════════════════════════════════════════════════════════════
  // HUGE SCORE + EMOJI
  // ═══════════════════════════════════════════════════════════════════════════

  y += 20;

  // Score glow backdrop
  ctx.save();
  ctx.globalAlpha = 0.1;
  const scoreGlow = ctx.createRadialGradient(CW / 2, y + 200, 0, CW / 2, y + 200, 500);
  scoreGlow.addColorStop(0, color);
  scoreGlow.addColorStop(1, "transparent");
  ctx.fillStyle = scoreGlow;
  ctx.fillRect(0, y - 20, CW, 500);
  ctx.restore();

  // Emoji
  txt(sentimentEmoji(value), CW / 2, y + 100, { size: 110, align: "center", emoji: true });
  y += 140;

  // Big score
  txt(String(value), CW / 2, y + 220, { size: 280, weight: 900, color: color, align: "center" });
  y += 240;

  txt("out of 100", CW / 2, y + 36, { size: 34, color: "#475569", align: "center", weight: "500" });
  y += 80;

  // Classification pill
  const pillW = Math.max(classification.length * 38 + 80, 360);
  fillRR(CW / 2 - pillW / 2, y + 10, pillW, 88, 44, colorMuted);
  strokeRR(CW / 2 - pillW / 2, y + 10, pillW, 88, 44, `${color}55`, 2.5);
  txt(classification.toUpperCase(), CW / 2, y + 67, {
    size: 44, weight: 900, color: color, align: "center",
  });
  y += 130;

  // ═══════════════════════════════════════════════════════════════════════════
  // GAUGE ARC
  // ═══════════════════════════════════════════════════════════════════════════

  const gaugeCX   = CW / 2;
  const gaugeCY   = y + 260;
  const gaugeROut = 380;
  const gaugeRIn  = 260;
  const startAng  = Math.PI;       // 180° = leftmost (score 0)
  const endAng    = 2 * Math.PI;   // 360° = rightmost (score 100)

  // 5 coloured arc segments
  const zones = [
    { from: 0,  to: 25,  col: "#ef4444" },
    { from: 25, to: 45,  col: "#f97316" },
    { from: 45, to: 55,  col: "#eab308" },
    { from: 55, to: 75,  col: "#22c55e" },
    { from: 75, to: 100, col: "#10b981" },
  ];

  zones.forEach(({ from, to, col }) => {
    const a1 = startAng + (from / 100) * Math.PI;
    const a2 = startAng + (to   / 100) * Math.PI;
    ctx.save();
    ctx.beginPath();
    ctx.arc(gaugeCX, gaugeCY, gaugeROut, a1, a2);
    ctx.arc(gaugeCX, gaugeCY, gaugeRIn,  a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.restore();

    // Brighter edge stroke for each zone
    ctx.save();
    ctx.beginPath();
    ctx.arc(gaugeCX, gaugeCY, gaugeROut, a1, a2);
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.restore();
  });

  // Active zone highlight (filled arc up to value)
  {
    const a1 = startAng;
    const a2 = startAng + (value / 100) * Math.PI;
    ctx.save();
    ctx.beginPath();
    ctx.arc(gaugeCX, gaugeCY, gaugeROut, a1, a2);
    ctx.arc(gaugeCX, gaugeCY, gaugeRIn,  a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.12;
    ctx.fill();
    ctx.restore();
  }

  // Needle
  const needleAng = startAng + (value / 100) * Math.PI;
  const nLen = gaugeROut - 30;
  const nTip = {
    x: gaugeCX + Math.cos(needleAng) * nLen,
    y: gaugeCY + Math.sin(needleAng) * nLen,
  };
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.moveTo(gaugeCX, gaugeCY);
  ctx.lineTo(nTip.x, nTip.y);
  ctx.stroke();
  ctx.restore();

  // Centre dot
  ctx.save();
  ctx.beginPath();
  ctx.arc(gaugeCX, gaugeCY, 22, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // Zone labels
  [
    { label: "Fear",    ang: startAng + (15  / 100) * Math.PI, col: "#ef4444" },
    { label: "Neutral", ang: startAng + (50  / 100) * Math.PI, col: "#eab308" },
    { label: "Greed",   ang: startAng + (87  / 100) * Math.PI, col: "#10b981" },
  ].forEach(({ label, ang, col: lc }) => {
    const labelR = gaugeROut + 52;
    const lx = gaugeCX + Math.cos(ang) * labelR;
    const ly = gaugeCY + Math.sin(ang) * labelR;
    txt(label, lx, ly + 12, { size: 26, color: lc, weight: "700", align: "center" });
  });

  y = gaugeCY + 80;

  // ═══════════════════════════════════════════════════════════════════════════
  // 30-DAY SPARKLINE
  // ═══════════════════════════════════════════════════════════════════════════

  y += 60;
  hRule(y);
  y += 52;

  txt("30-Day Sentiment History", CW / 2, y + 32, {
    size: 30, weight: "700", color: "#64748b", align: "center",
  });
  y += 68;

  if (history.length > 1) {
    const spX   = PAD;
    const spY   = y;
    const spW   = CW - PAD * 2;
    const spH   = 200;
    const vals  = history.map(h => h.value);
    const minV  = Math.min(...vals, 0);
    const maxV  = Math.max(...vals, 100);
    const range = maxV - minV || 1;

    function px(i: number) { return spX + (i / (history.length - 1)) * spW; }
    function py(v: number) { return spY + spH - ((v - minV) / range) * spH; }

    // Fill gradient
    ctx.save();
    const spGrad = ctx.createLinearGradient(0, spY, 0, spY + spH);
    spGrad.addColorStop(0, `${color}55`);
    spGrad.addColorStop(1, `${color}00`);
    ctx.fillStyle = spGrad;
    ctx.beginPath();
    ctx.moveTo(px(0), py(history[0].value));
    history.forEach((h, i) => { if (i > 0) ctx.lineTo(px(i), py(h.value)); });
    ctx.lineTo(px(history.length - 1), spY + spH);
    ctx.lineTo(px(0), spY + spH);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Line
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap  = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(px(0), py(history[0].value));
    history.forEach((h, i) => { if (i > 0) ctx.lineTo(px(i), py(h.value)); });
    ctx.stroke();
    ctx.restore();

    // Avg line
    if (avgScore !== null) {
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 2;
      const avgY = py(avgScore);
      ctx.beginPath();
      ctx.moveTo(spX, avgY);
      ctx.lineTo(spX + spW, avgY);
      ctx.stroke();
      ctx.restore();
      txt(`Avg: ${avgScore}`, spX + spW + 10, avgY + 10, { size: 22, color: "#475569" });
    }

    // First & last date labels
    if (history.length > 1) {
      txt(history[0].date, spX, spY + spH + 36, { size: 22, color: "#334155" });
      txt(history[history.length - 1].date, spX + spW, spY + spH + 36, {
        size: 22, color: "#334155", align: "right",
      });
    }

    y += spH + 68;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUOTE BOX
  // ═══════════════════════════════════════════════════════════════════════════

  hRule(y);
  y += 56;

  fillRR(PAD, y, CW - PAD * 2, 210, 24, "rgba(255,255,255,0.03)");
  strokeRR(PAD, y, CW - PAD * 2, 210, 24, "rgba(255,255,255,0.06)", 1.5);

  txt("❝", PAD + 36, y + 72, { size: 60, color: color, alpha: 0.6, emoji: true });

  // Wrap long quote manually
  const quoteLines = [
    "Be fearful when others are greedy,",
    "and greedy when others are fearful.",
  ];
  quoteLines.forEach((line, li) => {
    txt(line, CW / 2, y + 80 + li * 52, {
      size: 32, color: "#94a3b8", align: "center", weight: "500",
    });
  });
  txt("— Warren Buffett", CW / 2, y + 184, {
    size: 24, color: "#475569", align: "center", weight: "600",
  });

  y += 244;

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════

  hRule(y);
  y += 58;

  txt("Track market sentiment daily, free at", CW / 2, y + 34, { size: 29, color: "#64748b", align: "center" });
  y += 70;
  txt("AIFirstCrypto.com", CW / 2, y + 34, { size: 44, weight: "800", color: "#3b82f6", align: "center" });
  y += 72;
  txt(
    "Data: Alternative.me Fear & Greed API · Not financial advice",
    CW / 2, y + 28,
    { size: 21, color: "#1e293b", align: "center" },
  );
}

// ── React component ────────────────────────────────────────────────────────
export function FearGreedStoryCard({
  open, onClose, value, classification, updatedDate, history, avgScore,
}: FearGreedStoryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawCard(ctx, value, classification, updatedDate, history, avgScore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value, classification]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `fear-greed-${value}-aifirstcrypto.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleMobileShare() {
    const canvas = canvasRef.current;
    if (!canvas || !("share" in navigator)) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `fear-greed-${value}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Fear & Greed Index: ${value} – ${classification}` }).catch(() => {});
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
            Story Card — Fear &amp; Greed {value}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            1080×1920 · Instagram Stories format · Ready to share
          </p>
        </DialogHeader>

        <div className="flex justify-center rounded-2xl bg-[#060c18] p-3 border border-border/40">
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
