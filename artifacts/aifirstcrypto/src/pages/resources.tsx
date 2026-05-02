import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, BookOpen, CheckSquare, LineChart, Notebook, GraduationCap, ChevronDown, ChevronUp, Search } from "lucide-react";

const GLOSSARY: { term: string; emoji: string; short: string; long: string; category: string }[] = [
  {
    term: "Market Cap",
    emoji: "📊",
    short: "Total value of all coins in circulation.",
    long: "Market Cap = Current Price × Total Supply. It's the most common way to rank cryptocurrencies by size. A higher market cap generally means a more established, less risky coin — though 'less risky' is relative in crypto.",
    category: "Basics",
  },
  {
    term: "HODL",
    emoji: "💎",
    short: "Hold your crypto no matter what the price does.",
    long: "HODL started as a typo for 'hold' in a 2013 forum post and became a meme. It means resisting the urge to sell during crashes. HODLers believe in long-term value over short-term price swings.",
    category: "Slang",
  },
  {
    term: "Bull Market",
    emoji: "🐂",
    short: "Prices are rising and optimism is high.",
    long: "A bull market is a prolonged period of rising prices and positive sentiment. In crypto, bull markets can be dramatic — Bitcoin has historically risen 10–100× in a bull cycle. The term comes from the way a bull attacks: thrusting horns upward.",
    category: "Market",
  },
  {
    term: "Bear Market",
    emoji: "🐻",
    short: "Prices are falling and pessimism dominates.",
    long: "A bear market is when prices fall 20% or more from recent highs and remain low for an extended period. Crypto bear markets ('crypto winters') can last 1–2 years. The term comes from the way a bear attacks: swiping paws downward.",
    category: "Market",
  },
  {
    term: "DeFi",
    emoji: "🏦",
    short: "Financial services run by code, not banks.",
    long: "Decentralized Finance (DeFi) refers to apps built on blockchains that replicate banking services — lending, borrowing, trading — without a central authority. There are no banks, no managers, just smart contracts running automatically.",
    category: "Technology",
  },
  {
    term: "Gas Fees",
    emoji: "⛽",
    short: "The cost to process a transaction on a blockchain.",
    long: "Just like paying postage to send a letter, you pay gas fees to have your transaction processed on a blockchain. On Ethereum these can spike during busy periods. Some blockchains like Solana have very low fees by design.",
    category: "Technology",
  },
  {
    term: "Wallet",
    emoji: "👛",
    short: "Software that stores your crypto keys.",
    long: "A crypto wallet doesn't actually store coins — it stores the private keys that prove ownership. Hot wallets (apps, browser extensions) are convenient but connected to the internet. Cold wallets (hardware devices) are offline and more secure.",
    category: "Basics",
  },
  {
    term: "Altcoin",
    emoji: "🪙",
    short: "Any cryptocurrency that isn't Bitcoin.",
    long: "Altcoin = 'alternative coin'. Ethereum, Solana, Cardano, and thousands of others are altcoins. Some are major established projects; others are speculative tokens. Altcoins typically carry more risk than Bitcoin.",
    category: "Basics",
  },
  {
    term: "Stablecoin",
    emoji: "⚖️",
    short: "A crypto designed to hold a steady value (usually $1).",
    long: "Stablecoins are pegged to a real-world asset, most often the US dollar. USDT and USDC are the most popular. They let you stay in the crypto ecosystem without exposure to price swings — useful for moving money between exchanges.",
    category: "Basics",
  },
  {
    term: "Blockchain",
    emoji: "🔗",
    short: "A shared digital ledger that records all transactions.",
    long: "A blockchain is a database that is copied across thousands of computers worldwide. Once data is written, it cannot be altered. This makes it tamper-resistant and removes the need for a central authority like a bank to verify transactions.",
    category: "Technology",
  },
  {
    term: "ATH",
    emoji: "🏆",
    short: "All-Time High — the highest price a coin has ever reached.",
    long: "ATH stands for All-Time High. When a coin 'breaks ATH' it means it has hit a price never seen before. Conversely, ATL = All-Time Low. Traders watch ATH levels closely as they can act as psychological resistance points.",
    category: "Slang",
  },
  {
    term: "FOMO",
    emoji: "😰",
    short: "Fear Of Missing Out — buying because everyone else is.",
    long: "FOMO drives some of the worst investment decisions. It's the anxious feeling that you'll miss a big price move, leading to buying at the top of a rally. A key rule: FOMO is not a strategy.",
    category: "Slang",
  },
  {
    term: "FUD",
    emoji: "😨",
    short: "Fear, Uncertainty, Doubt — negative news that tanks prices.",
    long: "FUD describes negative sentiment — often spread by media, governments, or competitors — that causes panic selling. Some FUD is legitimate warning; some is manufactured to manipulate prices. 'Don't FUD the market' means don't spread panic.",
    category: "Slang",
  },
  {
    term: "Liquidity",
    emoji: "💧",
    short: "How easily you can buy or sell a coin without moving its price.",
    long: "High liquidity means there are lots of buyers and sellers, so you can trade large amounts without drastically changing the price. Low-liquidity coins can be volatile and hard to exit. Bitcoin and Ethereum have the highest liquidity.",
    category: "Market",
  },
  {
    term: "Smart Contract",
    emoji: "📜",
    short: "Self-executing code that runs automatically on a blockchain.",
    long: "Smart contracts are programs stored on a blockchain that run when predetermined conditions are met — no middleman needed. They power DeFi, NFTs, and most crypto applications. Ethereum pioneered smart contracts in 2015.",
    category: "Technology",
  },
  {
    term: "Whale",
    emoji: "🐋",
    short: "An entity that holds a huge amount of crypto.",
    long: "Whales are individuals or institutions holding enough crypto to move markets when they buy or sell. Watching whale wallets is a common strategy — a large transfer to an exchange often signals an impending sell-off.",
    category: "Slang",
  },
  {
    term: "Volatility",
    emoji: "📈",
    short: "How much a coin's price swings up and down.",
    long: "Crypto is famous for volatility — prices can move 10–30% in a single day. High volatility means higher potential gains but also higher potential losses. Bitcoin is considered 'less volatile' than most altcoins, which is a relative statement.",
    category: "Market",
  },
  {
    term: "Halving",
    emoji: "✂️",
    short: "When Bitcoin's mining reward is cut in half.",
    long: "Roughly every 4 years, the reward Bitcoin miners receive for adding a new block is cut in half. This reduces the rate of new Bitcoin supply entering circulation. Halvings are historically associated with bull markets in the months that follow.",
    category: "Technology",
  },
];

const CATEGORIES = ["All", "Basics", "Market", "Technology", "Slang"];

export default function Resources() {
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] = useState("All");

  const resources = [
    {
      title: "Crypto Tracker Template",
      description: "A Google Sheets template to track your portfolio across different exchanges and wallets.",
      icon: LineChart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      action: "Get Template"
    },
    {
      title: "Beginner Watchlist Guide",
      description: "Curated list of the top 10 most foundational cryptocurrencies every beginner should know.",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      action: "Read Guide"
    },
    {
      title: "Understanding Fear & Greed",
      description: "Deep dive into market psychology and how to use sentiment analysis in your strategy.",
      icon: BookOpen,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      action: "Read Article"
    },
    {
      title: "Crypto Trading Journal",
      description: "Notion template to log your trades, decisions, and lessons learned.",
      icon: Notebook,
      color: "text-green-500",
      bg: "bg-green-500/10",
      action: "Get Template"
    },
    {
      title: "Daily Crypto Checklist",
      description: "A 5-minute routine to check the market without getting overwhelmed.",
      icon: CheckSquare,
      color: "text-primary",
      bg: "bg-primary/10",
      action: "View Checklist"
    }
  ];

  const filteredGlossary = GLOSSARY.filter(entry => {
    const matchesSearch =
      glossarySearch === "" ||
      entry.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      entry.short.toLowerCase().includes(glossarySearch.toLowerCase());
    const matchesCategory = glossaryCategory === "All" || entry.category === glossaryCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Free Resources</h1>
        <p className="text-xl text-muted-foreground">
          Tools, templates, and guides designed to help you navigate crypto with confidence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {resources.map((resource, i) => {
          const Icon = resource.icon;
          return (
            <Card key={i} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${resource.bg}`}>
                  <Icon className={`h-6 w-6 ${resource.color}`} />
                </div>
                <CardTitle className="text-xl">{resource.title}</CardTitle>
                <CardDescription className="text-sm mt-2 leading-relaxed">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-6">
                <Button variant="outline" className="w-full group">
                  {resource.action} <ExternalLink className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* ── Beginner's Glossary ──────────────────────────────────────── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Beginner's Glossary</h2>
            <p className="text-sm text-muted-foreground">Plain-English definitions for {GLOSSARY.length} common crypto terms.</p>
          </div>
        </div>

        {/* Search + category filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search terms…"
              value={glossarySearch}
              onChange={e => setGlossarySearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setGlossaryCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  glossaryCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Term list */}
        {filteredGlossary.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border/50 text-muted-foreground">
            <p className="font-medium">No terms match "{glossarySearch}"</p>
            <button
              className="mt-2 text-sm text-primary hover:underline"
              onClick={() => { setGlossarySearch(""); setGlossaryCategory("All"); }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredGlossary.map(entry => {
              const isOpen = expandedTerm === entry.term;
              return (
                <button
                  key={entry.term}
                  onClick={() => setExpandedTerm(isOpen ? null : entry.term)}
                  className="text-left w-full rounded-xl border border-border/50 bg-card hover:border-primary/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex items-center gap-3 p-4">
                    <span className="text-2xl leading-none flex-shrink-0">{entry.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{entry.term}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          entry.category === "Basics" ? "bg-blue-500/10 text-blue-500" :
                          entry.category === "Market" ? "bg-orange-500/10 text-orange-500" :
                          entry.category === "Technology" ? "bg-purple-500/10 text-purple-500" :
                          "bg-green-500/10 text-green-500"
                        }`}>
                          {entry.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{entry.short}</p>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="pl-9 border-t border-border/40 pt-3">
                        <p className="text-sm text-muted-foreground leading-relaxed">{entry.long}</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-12 p-8 bg-muted/30 rounded-2xl border border-border/50 text-center">
        <h2 className="text-2xl font-bold mb-3">Looking for something specific?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          We're constantly building new tools for retail investors. Let us know what would help you the most.
        </p>
        <Button size="lg" className="rounded-full">Request a Resource</Button>
      </div>
    </div>
  );
}
