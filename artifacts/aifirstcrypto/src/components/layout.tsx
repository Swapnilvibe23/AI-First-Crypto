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
  GitCompareArrows
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Activity },
    { href: "/rates", label: "Live Rates", icon: LineChart },
    { href: "/top-movers", label: "Top Movers", icon: TrendingUp },
    { href: "/fear-greed", label: "Fear & Greed", icon: Wallet },
    { href: "/compare", label: "Compare", icon: GitCompareArrows },
    { href: "/watchlist", label: "Watchlist", icon: Star },
    { href: "/resources", label: "Resources", icon: BookOpen },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark">
      {/* Sticky Mobile Nav */}
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
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Nav Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden border-b border-border/50 bg-background/95 backdrop-blur">
            <nav className="flex flex-col p-4 space-y-4">
              {links.map((link) => {
                const isActive = location === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 text-sm font-medium p-2 rounded-md transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      <footer className="border-t border-border/50 py-8 text-center bg-muted/20">
        <div className="container mx-auto px-4">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            Disclaimer: The information provided on AIFirstCrypto is for educational purposes only 
            and does not constitute financial, investment, or trading advice. Crypto is highly volatile. 
            Do your own research before making any investment decisions.
          </p>
          <div className="mt-4 text-sm font-medium text-foreground">
            &copy; {new Date().getFullYear()} AIFirstCrypto. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
