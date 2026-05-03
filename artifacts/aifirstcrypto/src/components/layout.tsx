import { Link, useLocation } from "wouter";
import { 
  LineChart, 
  Wallet, 
  TrendingUp, 
  Activity, 
  Star, 
  BookOpen,
  Menu,
  X,
  GitCompareArrows,
  Bell,
  Calculator,
  ArrowRightLeft,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/hooks/use-alerts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NewsletterStrip } from "@/components/newsletter-strip";
import { ScrollToTop } from "@/components/scroll-to-top";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { alerts } = useAlerts();
  const alertCount = alerts.length;

  const links = [
    { href: "/", label: "Home", icon: Activity },
    { href: "/rates", label: "Live Rates", icon: LineChart },
    { href: "/top-movers", label: "Top Movers", icon: TrendingUp },
    { href: "/fear-greed", label: "Fear & Greed", icon: Wallet },
    { href: "/compare", label: "Compare", icon: GitCompareArrows },
    { href: "/dca", label: "DCA Calc", icon: Calculator },
    { href: "/exchanges", label: "Exchanges", icon: ArrowRightLeft },
    { href: "/watchlist", label: "Watchlist", icon: Star },
    { href: "/resources", label: "Resources", icon: BookOpen },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark">
      {/* Sticky Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
            <div className="bg-primary p-1.5 rounded-md">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-lg text-foreground">AIFirstCrypto</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const isActive = location === link.href;
              const isWatchlist = link.href === "/watchlist";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors hover:text-primary inline-flex items-center gap-1.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                  {isWatchlist && alertCount > 0 && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                      {alertCount > 9 ? "9+" : alertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Bell icon + mobile hamburger */}
          <div className="flex items-center gap-1">
            {/* Alert bell — always visible, disappears when 0 alerts */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/watchlist">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9"
                    onClick={closeMenu}
                    aria-label={alertCount > 0 ? `${alertCount} active price alert${alertCount !== 1 ? "s" : ""}` : "Price alerts"}
                  >
                    <Bell
                      className={`h-4.5 w-4.5 transition-colors ${
                        alertCount > 0
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      }`}
                    />
                    {alertCount > 0 && (
                      <>
                        {/* Pulse ring */}
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
                        {/* Solid dot / count */}
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold leading-none">
                          {alertCount > 9 ? "" : alertCount}
                        </span>
                      </>
                    )}
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {alertCount > 0
                  ? `${alertCount} active price alert${alertCount !== 1 ? "s" : ""} — tap to view`
                  : "No active price alerts"}
              </TooltipContent>
            </Tooltip>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-b border-border/50 bg-background/95 backdrop-blur">
            <nav className="flex flex-col p-4 space-y-1">
              {links.map((link) => {
                const isActive = location === link.href;
                const isWatchlist = link.href === "/watchlist";
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`flex items-center justify-between text-sm font-medium p-2.5 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {link.label}
                    </span>
                    {isWatchlist && alertCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                        {alertCount > 9 ? "9+" : alertCount}
                        <Bell className="h-3 w-3 ml-0.5" />
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <NewsletterStrip />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      <footer className="border-t border-border/50 pt-10 pb-8 bg-muted/20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Top row: brand + nav columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="bg-primary p-1.5 rounded-md">
                  <Activity className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold tracking-tight text-foreground">AIFirstCrypto</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your daily crypto pulse. Live prices, market sentiment, and clear signals — no noise.
              </p>
            </div>

            {/* Tools */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Tools</p>
              <ul className="space-y-2">
                {[
                  { href: "/rates", label: "Live Rates" },
                  { href: "/top-movers", label: "Top Movers" },
                  { href: "/fear-greed", label: "Fear & Greed" },
                  { href: "/compare", label: "Compare" },
                  { href: "/dca", label: "DCA Calculator" },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* More */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">More</p>
              <ul className="space-y-2">
                {[
                  { href: "/exchanges", label: "Exchanges" },
                  { href: "/watchlist", label: "My Watchlist" },
                  { href: "/resources", label: "Resources" },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Legal</p>
              <ul className="space-y-2">
                {[
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/terms", label: "Terms of Service" },
                  { href: "/disclaimer", label: "Disclaimer" },
                ].map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider + bottom row */}
          <div className="border-t border-border/40 pt-6 space-y-3">
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-muted-foreground/80">Disclaimer:</strong>{" "}
              For educational purposes only · Not financial advice · Crypto is volatile, DYOR · Some links are affiliate.{" "}
              <Link href="/disclaimer" className="underline hover:text-foreground">Full disclaimer →</Link>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Market data sourced from{" "}
              <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">CoinGecko</a>.
              {" "}&copy; {new Date().getFullYear()} AIFirstCrypto. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
