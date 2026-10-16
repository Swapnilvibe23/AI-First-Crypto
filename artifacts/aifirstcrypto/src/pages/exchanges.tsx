import { ExternalLink, Shield, FileText, Zap, CheckCircle2, CalendarCheck } from "lucide-react";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/info-tooltip";

// ─── Exchange data ─────────────────────────────────────────────────────────────
// Replace the `href` values below with your real affiliate tracking URLs.

const LAST_VERIFIED = "October 16, 2026";

type CitedFact = {
  text: string;
  sourceHref: string;
  sourceLabel: string;
};

type CompareCell = {
  text: string;
  sourceHref?: string;
  sourceLabel?: string;
};

type Exchange = {
  name: string;
  tagline: string;
  emoji: string;
  bestFor: string;
  feeScheduleHref: string;
  availability: CitedFact;
  highlights: CitedFact[];
  badge?: string;
  badgeColor?: string;
  href: string;
};

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      {label}
    </a>
  );
}

const EXCHANGES: Exchange[] = [
  {
    name: "Coinbase",
    tagline: "U.S. crypto exchange for buying and selling digital assets",
    emoji: "🔵",
    bestFor: "Total beginners & US residents",
    feeScheduleHref: "https://help.coinbase.com/en/coinbase/trading-and-funding/pricing-and-fees/fees",
    availability: {
      text: "Available to U.S. customers (and other supported regions)",
      sourceHref: "https://help.coinbase.com/en/coinbase/getting-started/getting-started-with-coinbase/create-a-coinbase-account",
      sourceLabel: "Create an account",
    },
    highlights: [
      {
        text: "Coinbase Global, Inc. is publicly listed on Nasdaq (ticker COIN).",
        sourceHref: "https://investor.coinbase.com/home/",
        sourceLabel: "Investor relations",
      },
      {
        text: "Coinbase is not an FDIC-insured bank, and cryptocurrency is not FDIC-insured. U.S. dollar cash may be eligible for pass-through FDIC coverage if held at partner banks.",
        sourceHref: "https://help.coinbase.com/en/coinbase/other-topics/legal-policies/how-is-coinbase-insured",
        sourceLabel: "Insurance help",
      },
      {
        text: "Coinbase One is a paid membership that can include zero trading fees, with limits and exclusions.",
        sourceHref: "https://www.coinbase.com/one",
        sourceLabel: "Coinbase One",
      },
    ],
    badge: "Best for Beginners",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    href: "https://coinbase.com/join",
  },
  {
    name: "Binance",
    tagline: "Global exchange with Earn products (U.S. restricted)",
    emoji: "🟡",
    bestFor: "Active traders outside the US",
    feeScheduleHref: "https://www.binance.com/en/fee/schedule",
    availability: {
      text: "Binance.com is not available to U.S. residents. Binance.US is a separate platform.",
      sourceHref: "https://support.binance.us/hc/en-us/articles/360058996013-Binance-US-Welcomes-You",
      sourceLabel: "Binance.US notice",
    },
    highlights: [
      {
        text: "Binance Earn offers Simple Earn and Advanced Earn products, including staking offerings.",
        sourceHref: "https://www.binance.com/en/earn",
        sourceLabel: "Binance Earn",
      },
      {
        text: "Official Binance announcements list the United States among restricted locations for trading eligibility.",
        sourceHref: "https://www.binance.com/en/square/post/317792306647042",
        sourceLabel: "Binance announcement",
      },
    ],
    badge: "Global platform",
    badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    href: "https://www.binance.com/en/register",
  },
  {
    name: "Kraken",
    tagline: "Crypto exchange founded in 2011",
    emoji: "🟣",
    bestFor: "US users outside New York and Maine",
    feeScheduleHref: "https://www.kraken.com/features/fee-schedule",
    availability: {
      text: "Serves U.S. clients except residents of New York and Maine.",
      sourceHref: "https://support.kraken.com/articles/quick-start-for-clients-in-the-united-states",
      sourceLabel: "U.S. quick start",
    },
    highlights: [
      {
        text: "Kraken was founded in 2011.",
        sourceHref: "https://blog.kraken.com/news/13-years-ago-the-kraken-emerged",
        sourceLabel: "Kraken blog",
      },
      {
        text: "Kraken Pro is the platform’s advanced trading interface.",
        sourceHref: "https://www.kraken.com/pro",
        sourceLabel: "Kraken Pro",
      },
      {
        text: "Kraken publishes 24/7 customer support coverage.",
        sourceHref: "https://www.kraken.com/features/24-7-support",
        sourceLabel: "Support page",
      },
    ],
    badge: "Founded 2011",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    href: "https://www.kraken.com/sign-up",
  },
  {
    name: "Gemini",
    tagline: "NYDFS-licensed exchange and custodian",
    emoji: "🔷",
    bestFor: "US users wanting a regulated, compliant exchange",
    feeScheduleHref: "https://www.gemini.com/fees",
    availability: {
      text: "Available in all 50 U.S. states.",
      sourceHref: "https://support.gemini.com/hc/en-us/articles/204072799-Which-countries-and-U-S-states-does-Gemini-support",
      sourceLabel: "Availability help",
    },
    highlights: [
      {
        text: "Gemini Trust Company, LLC is licensed by the New York State Department of Financial Services (NYDFS) and publishes SOC 2 Type 2 exam results.",
        sourceHref: "https://www.gemini.com/trust-center",
        sourceLabel: "Trust Center",
      },
      {
        text: "Gemini is not an FDIC-insured bank. U.S. dollar balances may be eligible for FDIC pass-through insurance at partner banks, subject to limits.",
        sourceHref: "https://support.gemini.com/hc/en-us/articles/205823016-Are-my-funds-insured",
        sourceLabel: "Funds insurance",
      },
    ],
    badge: "NYDFS-licensed",
    badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    href: "https://www.gemini.com/share/",
  },
  {
    name: "Bybit",
    tagline: "Perpetual futures and copy trading (U.S. restricted)",
    emoji: "🟠",
    bestFor: "Experienced traders & derivatives",
    feeScheduleHref: "https://www.bybit.com/en/announcement-info/fee-rate/",
    availability: {
      text: "Not available to users in the United States.",
      sourceHref: "https://www.bybit.com/en/help-center/article/Service-Restricted-Countries",
      sourceLabel: "Restricted countries",
    },
    highlights: [
      {
        text: "Bybit offers copy trading for USDT perpetual futures.",
        sourceHref: "https://www.bybit.com/en/help-center/article/FAQ-Copy-Trading",
        sourceLabel: "Copy trading FAQ",
      },
      {
        text: "Bybit publishes a volume-tiered futures fee schedule; rates vary by product and VIP tier.",
        sourceHref: "https://www.bybit.com/en/announcement-info/fee-rate/",
        sourceLabel: "Fee schedule",
      },
    ],
    href: "https://www.bybit.com/en/register/",
  },
  {
    name: "OKX",
    tagline: "Trading platform with a separate Web3 wallet",
    emoji: "⚫",
    bestFor: "DeFi users & multi-chain traders",
    feeScheduleHref: "https://www.okx.com/fees",
    availability: {
      text: "Global OKX exchange services are not available in the U.S., except products offered by OKX INC. in licensed states.",
      sourceHref: "https://www.okx.com/en-us/help/us-risk-and-compliance-disclosures",
      sourceLabel: "U.S. disclosures",
    },
    highlights: [
      {
        text: "OKX INC. does not serve residents of New York, American Samoa, Guam, the Northern Mariana Islands, or the U.S. Virgin Islands.",
        sourceHref: "https://www.okx.com/en-us/help/us-licenses",
        sourceLabel: "U.S. licenses",
      },
      {
        text: "OKX Wallet is a self-custodial multichain Web3 wallet.",
        sourceHref: "https://web3.okx.com/",
        sourceLabel: "OKX Wallet",
      },
    ],
    href: "https://www.okx.com/join/",
  },
];

// ─── Comparison table rows ─────────────────────────────────────────────────────

const COMPARE_FEATURES: { feature: string; values: CompareCell[] }[] = [
  {
    feature: "U.S. residents",
    values: [
      { text: "Yes", sourceHref: "https://help.coinbase.com/en/coinbase/getting-started/getting-started-with-coinbase/create-a-coinbase-account", sourceLabel: "Source" },
      { text: "No (Binance.com)", sourceHref: "https://www.binance.com/en/square/post/317792306647042", sourceLabel: "Source" },
      { text: "Yes, except NY & ME", sourceHref: "https://support.kraken.com/articles/quick-start-for-clients-in-the-united-states", sourceLabel: "Source" },
      { text: "Yes, all 50 states", sourceHref: "https://support.gemini.com/hc/en-us/articles/204072799-Which-countries-and-U-S-states-does-Gemini-support", sourceLabel: "Source" },
      { text: "No", sourceHref: "https://www.bybit.com/en/help-center/article/Service-Restricted-Countries", sourceLabel: "Source" },
      { text: "Limited (OKX INC.)", sourceHref: "https://www.okx.com/en-us/help/us-risk-and-compliance-disclosures", sourceLabel: "Source" },
    ],
  },
  {
    feature: "Licensing / listing",
    values: [
      { text: "Nasdaq: COIN", sourceHref: "https://investor.coinbase.com/home/", sourceLabel: "Source" },
      { text: "U.S. restricted", sourceHref: "https://www.binance.com/en/square/post/317792306647042", sourceLabel: "Source" },
      { text: "Founded 2011", sourceHref: "https://blog.kraken.com/news/13-years-ago-the-kraken-emerged", sourceLabel: "Source" },
      { text: "NYDFS + SOC 2 Type 2", sourceHref: "https://www.gemini.com/trust-center", sourceLabel: "Source" },
      { text: "See restricted-country list", sourceHref: "https://www.bybit.com/en/help-center/article/Service-Restricted-Countries", sourceLabel: "Source" },
      { text: "OKX INC. / FinCEN MSB", sourceHref: "https://www.okx.com/en-us/help/us-licenses", sourceLabel: "Source" },
    ],
  },
  {
    feature: "Official fee schedule",
    values: [
      { text: "View fees", sourceHref: "https://help.coinbase.com/en/coinbase/trading-and-funding/pricing-and-fees/fees", sourceLabel: "Coinbase" },
      { text: "View fees", sourceHref: "https://www.binance.com/en/fee/schedule", sourceLabel: "Binance" },
      { text: "View fees", sourceHref: "https://www.kraken.com/features/fee-schedule", sourceLabel: "Kraken" },
      { text: "View fees", sourceHref: "https://www.gemini.com/fees", sourceLabel: "Gemini" },
      { text: "View fees", sourceHref: "https://www.bybit.com/en/announcement-info/fee-rate/", sourceLabel: "Bybit" },
      { text: "View fees", sourceHref: "https://www.okx.com/fees", sourceLabel: "OKX" },
    ],
  },
];

export default function Exchanges() {
  useSeoMeta({
    title: "Best Crypto Exchanges Compared — AIFirstCrypto",
    description: "Compare the top crypto exchanges by fees, trust, and beginner-friendliness. Coinbase, Binance, Kraken, Gemini and more — all in one place.",
  });
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
        <p className="text-sm font-medium mt-4 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary" />
          Last verified: {LAST_VERIFIED}
        </p>
        <p className="text-xs text-muted-foreground mt-2 max-w-2xl">
          Factual claims on this page are cited to official exchange pages or reputable outlets.
          Badges and “Best for” labels are editorial opinions, not verified facts. We do not publish
          specific fee percentages here because they change by product, volume tier, and region.
        </p>
      </section>

      {/* Quick stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: CalendarCheck, label: "Last verified", value: LAST_VERIFIED, desc: "facts checked against sources" },
          { icon: FileText, label: "Fee figures", value: "Official schedules", desc: "linked on each profile" },
          { icon: Shield, label: "Editorial labels", value: "Opinions only", desc: "badges & “best for”" },
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
                    <InfoTooltip content="Editorial label for the type of user or use-case this exchange may suit. Not a verified fact." />
                  </p>
                  <p className="text-sm font-medium">{ex.bestFor}</p>
                </div>

                {/* Fee + availability */}
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="rounded-md bg-muted/30 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide flex items-center gap-1">
                      Trading fees
                      <InfoTooltip content="Fees vary by product, volume tier, payment method, and region. We link the official schedule instead of quoting rates that go stale." />
                    </p>
                    <p className="font-medium text-xs">
                      <SourceLink href={ex.feeScheduleHref} label="Official fee schedule" />
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/30 px-2.5 py-2">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Availability</p>
                    <p className="font-medium text-xs leading-relaxed">
                      {ex.availability.text}{" "}
                      <SourceLink href={ex.availability.sourceHref} label={ex.availability.sourceLabel} />
                    </p>
                  </div>
                </div>

                {/* Highlights */}
                <ul className="space-y-1.5">
                  {ex.highlights.map((h) => (
                    <li key={h.text} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">
                        {h.text}{" "}
                        <SourceLink href={h.sourceHref} label={h.sourceLabel} />
                      </span>
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
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Side-by-Side Comparison
          <InfoTooltip content="Sourced availability, licensing, and official fee-schedule links only. Unsourced fee rankings, coin counts, and security slogans were removed." />
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
                      <div>{v.text}</div>
                      {v.sourceHref && (
                        <div className="mt-1 text-[10px] text-muted-foreground font-normal">
                          <SourceLink href={v.sourceHref} label={v.sourceLabel ?? "Source"} />
                        </div>
                      )}
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
          If you're a beginner in the US, <strong>Coinbase</strong> is a commonly used starting point.
          Outside the US, compare <strong>Binance</strong> using its official fee schedule before signing up.
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
