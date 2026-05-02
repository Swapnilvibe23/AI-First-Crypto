import { ExternalLink, Shield, TrendingUp, Zap, Globe, Star, CheckCircle2, Info } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/info-tooltip";

// ─── Exchange data ─────────────────────────────────────────────────────────────
// Replace the `href` values below with your real affiliate tracking URLs.

type Exchange = {
  name: string;
  tagline: string;
  emoji: string;
  bestFor: string;
  makerFee: string;
  takerFee: string;
  countries: string;
  coins: string;
  highlights: string[];
  badge?: string;
  badgeColor?: string;
  href: string;
};

const EXCHANGES: Exchange[] = [
  {
    name: "Coinbase",
    tagline: "The easiest way to buy crypto in the US",
    emoji: "🔵",
    bestFor: "Total beginners & US residents",
    makerFee: "0%",
    takerFee: "0.05–0.60%",
    countries: "100+ countries",
    coins: "240+ coins",
    highlights: [
      "Most beginner-friendly interface",
      "Insured custodial wallets",
      "Regulated & publicly listed (NASDAQ)",
      "Earn rewards learning about crypto",
      "Coinbase One subscription for zero trading fees",
    ],
    badge: "Best for Beginners",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    href: "https://coinbase.com/join",
  },
  {
    name: "Binance",
    tagline: "Lowest fees, most coins, highest volume",
    emoji: "🟡",
    bestFor: "Active traders wanting low fees",
    makerFee: "0.010%",
    takerFee: "0.010%",
    countries: "180+ countries",
    coins: "350+ coins",
    highlights: [
      "Lowest fees in the industry with BNB discount",
      "Largest trading volume globally",
      "Advanced charting & futures trading",
      "Binance Earn for staking & yield",
      "Not available for US residents (use Binance.US)",
    ],
    badge: "Lowest Fees",
    badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    href: "https://www.binance.com/en/register",
  },
  {
    name: "Kraken",
    tagline: "Trusted security since 2011",
    emoji: "🟣",
    bestFor: "Security-conscious traders & US users",
    makerFee: "0.16%",
    takerFee: "0.26%",
    countries: "190+ countries",
    coins: "200+ coins",
    highlights: [
      "One of the oldest and most trusted exchanges",
      "Exceptional security track record (never hacked)",
      "Available in most US states",
      "Kraken Pro for advanced trading",
      "24/7 customer support",
    ],
    badge: "Most Trusted",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    href: "https://www.kraken.com/sign-up",
  },
  {
    name: "Gemini",
    tagline: "Regulated & audited — built for compliance",
    emoji: "🔷",
    bestFor: "US users wanting a regulated, compliant exchange",
    makerFee: "0.20%",
    takerFee: "0.40%",
    countries: "60+ countries",
    coins: "70+ coins",
    highlights: [
      "SOC 2 Type 2 certified & state-licensed",
      "FDIC-insured USD balances",
      "Gemini Earn for crypto interest",
      "Clean, simple interface",
      "Available in all 50 US states",
    ],
    badge: "Most Regulated",
    badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    href: "https://www.gemini.com/share/",
  },
  {
    name: "Bybit",
    tagline: "Professional derivatives & spot trading",
    emoji: "🟠",
    bestFor: "Experienced traders & derivatives",
    makerFee: "0.10%",
    takerFee: "0.10%",
    countries: "160+ countries",
    coins: "500+ coins",
    highlights: [
      "Popular for perpetual futures & options",
      "Deep liquidity across major pairs",
      "Copy trading to follow top traders",
      "Up to 100x leverage (use with extreme caution)",
      "Not available for US residents",
    ],
    href: "https://www.bybit.com/en/register/",
  },
  {
    name: "OKX",
    tagline: "All-in-one trading, DeFi & Web3 wallet",
    emoji: "⚫",
    bestFor: "DeFi users & multi-chain traders",
    makerFee: "0.080%",
    takerFee: "0.100%",
    countries: "160+ countries",
    coins: "350+ coins",
    highlights: [
      "Built-in Web3 wallet for DeFi",
      "One of the lowest spot trading fees",
      "NFT marketplace & DEX aggregator",
      "Earn through staking & DeFi yields",
      "Not available for US residents",
    ],
    href: "https://www.okx.com/join/",
  },
];

// ─── Comparison table rows ─────────────────────────────────────────────────────

const COMPARE_FEATURES = [
  { feature: "Best for beginners", values: ["✅ Yes", "⚠️ Moderate", "⚠️ Moderate", "✅ Yes", "❌ Advanced", "❌ Advanced"] },
  { feature: "US residents", values: ["✅ Yes", "⚠️ Binance.US", "✅ Yes", "✅ Yes", "❌ No", "❌ No"] },
  { feature: "Lowest fees", values: ["❌ No", "✅ Yes", "⚠️ Mid", "⚠️ Mid", "⚠️ Mid", "✅ Near-lowest"] },
  { feature: "Regulated", values: ["✅ High", "⚠️ Moderate", "✅ High", "✅ Highest", "⚠️ Moderate", "⚠️ Moderate"] },
  { feature: "Coin variety", values: ["⚠️ 240+", "✅ 350+", "⚠️ 200+", "❌ 70+", "✅ 500+", "✅ 350+"] },
  { feature: "DeFi / Web3", values: ["⚠️ Basic", "⚠️ Some", "❌ No", "❌ No", "⚠️ Some", "✅ Full"] },
];

export default function Exchanges() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      {/* Hero */}
      <section className="py-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Compare Crypto Exchanges
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
          Not all exchanges are the same. We compare the biggest platforms so you can find the right one for your needs — beginner-friendly, low fees, or full DeFi access.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Some links on this page are affiliate links — we may earn a commission if you sign up. This never influences our assessments.{" "}
            <Link href="/disclaimer" className="underline hover:text-foreground">See full disclosure →</Link>
          </span>
        </div>
      </section>

      {/* Quick stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Shield, label: "Regulated options", value: "4 of 6", desc: "listed exchanges" },
          { icon: TrendingUp, label: "Fee range", value: "0–0.60%", desc: "maker/taker per trade" },
          { icon: Globe, label: "Countries covered", value: "180+", desc: "global reach" },
          { icon: Star, label: "Beginner picks", value: "Coinbase & Gemini", desc: "for US users" },
        ].map(({ icon: Icon, label, value, desc }) => (
          <Card key={label} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <Icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
              <p className="text-lg font-bold leading-tight mt-0.5">{value}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exchange cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Exchange Profiles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {EXCHANGES.map((ex) => (
            <Card
              key={ex.name}
              className={`flex flex-col hover:border-primary/50 transition-all duration-200 hover:shadow-lg ${
                ex.badge ? "border-primary/20" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{ex.emoji}</span>
                    <div>
                      <CardTitle className="text-xl">{ex.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{ex.tagline}</CardDescription>
                    </div>
                  </div>
                  {ex.badge && (
                    <Badge className={`text-[10px] font-bold border flex-shrink-0 ${ex.badgeColor}`}>
                      {ex.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Best for */}
                <div className="rounded-lg bg-muted/40 px-3 py-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                    Best for
                    <InfoTooltip content="The type of user or use-case this exchange is most suited to." />
                  </p>
                  <p className="text-sm font-medium">{ex.bestFor}</p>
                </div>

                {/* Fee + stats grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/30 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
                      Maker fee
                      <InfoTooltip content="Fee charged when you add liquidity to the order book (limit orders). Lower is better." />
                    </p>
                    <p className="font-bold text-emerald-400">{ex.makerFee}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
                      Taker fee
                      <InfoTooltip content="Fee charged when you take liquidity from the order book (market orders). This applies to most instant buys." />
                    </p>
                    <p className="font-bold">{ex.takerFee}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Countries</p>
                    <p className="font-medium text-xs">{ex.countries}</p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Coins</p>
                    <p className="font-medium text-xs">{ex.coins}</p>
                  </div>
                </div>

                {/* Highlights */}
                <ul className="space-y-1.5">
                  {ex.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* CTA */}
              <div className="p-5 pt-0">
                <a href={ex.href} target="_blank" rel="noopener noreferrer sponsored">
                  <Button className="w-full rounded-full gap-2 font-bold">
                    Get started on {ex.name}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Affiliate link — we may earn a commission
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Side-by-Side Comparison
          <InfoTooltip content="Quick comparison of key criteria across all six exchanges. ✅ = strong, ⚠️ = partial/moderate, ❌ = not available or weak." />
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Feature</th>
                {EXCHANGES.map(ex => (
                  <th key={ex.name} className="text-center px-3 py-3 font-semibold">
                    {ex.emoji} {ex.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map(({ feature, values }, ri) => (
                <tr
                  key={feature}
                  className={`border-b border-border/30 ${ri % 2 === 0 ? "bg-card/30" : ""}`}
                >
                  <td className="px-4 py-3 text-muted-foreground font-medium">{feature}</td>
                  {values.map((v, ci) => (
                    <td key={ci} className="text-center px-3 py-3 text-xs font-medium">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom CTA section */}
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-8 text-center space-y-4">
        <Zap className="h-8 w-8 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Not sure where to start?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          If you're a beginner in the US, <strong>Coinbase</strong> is the safest starting point.
          Outside the US and want the lowest fees? Start with <strong>Binance</strong>.
          Already comfortable? Try our <Link href="/dca" className="text-primary underline">DCA Calculator</Link> to plan your strategy before buying.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="https://coinbase.com/join" target="_blank" rel="noopener noreferrer sponsored">
            <Button size="lg" className="rounded-full gap-2">
              🔵 Start on Coinbase <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
          <a href="https://www.binance.com/en/register" target="_blank" rel="noopener noreferrer sponsored">
            <Button size="lg" variant="secondary" className="rounded-full gap-2">
              🟡 Start on Binance <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Affiliate links · We may earn a commission ·{" "}
          <Link href="/disclaimer" className="underline">Full disclosure</Link>
        </p>
      </section>

      {/* Risk disclaimer */}
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-yellow-500">Risk warning:</strong> Cryptocurrency is highly volatile and speculative.
          Fees, features, and availability change frequently — verify current terms on each exchange's website before signing up.
          This comparison is for informational purposes only and does not constitute financial advice.
          See our full <Link href="/disclaimer" className="underline hover:text-foreground">Disclaimer</Link> and{" "}
          <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
