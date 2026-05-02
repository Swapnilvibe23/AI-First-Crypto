import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ExternalLink, FileText, BookOpen, CheckSquare, LineChart,
  Notebook, GraduationCap, ChevronDown, ChevronUp, Search, X,
  Sparkles, Copy, Check, CalendarDays, Calculator, TrendingUp,
  TrendingDown, Scale, AlertTriangle, Rocket, Frown, ShieldAlert,
  Activity,
} from "lucide-react";

// ─── Glossary data ────────────────────────────────────────────────────────────

type GlossaryEntry = { term: string; emoji: string; short: string; long: string; category: string };

const GLOSSARY: GlossaryEntry[] = [
  // ── BASICS ─────────────────────────────────────────────────────────────────
  {
    term: "Bitcoin (BTC)",
    emoji: "₿",
    short: "The first and largest cryptocurrency, created in 2009.",
    long: "Bitcoin was created by the anonymous Satoshi Nakamoto in 2009. It was the first decentralized digital currency — no bank, no government, no middleman. There will only ever be 21 million Bitcoin in existence, making it scarce by design. It remains the most widely held and traded crypto.",
    category: "Basics",
  },
  {
    term: "Ethereum (ETH)",
    emoji: "🔷",
    short: "The second-largest crypto — a programmable blockchain.",
    long: "Ethereum expanded on Bitcoin's idea by adding programmability. Developers can build applications (dApps), tokens, and smart contracts on top of it. Most of DeFi and NFTs are built on Ethereum. ETH is the 'fuel' used to pay for transactions on the network.",
    category: "Basics",
  },
  {
    term: "Blockchain",
    emoji: "🔗",
    short: "A shared digital ledger that records all transactions permanently.",
    long: "A blockchain is a database copied across thousands of computers worldwide. Transactions are grouped into 'blocks' and chained together in order. Once written, data cannot be changed — making it tamper-resistant. There is no central server; everyone holds a copy, so no single point of failure or control.",
    category: "Basics",
  },
  {
    term: "Market Cap",
    emoji: "📊",
    short: "The total value of all coins of a cryptocurrency in circulation.",
    long: "Market Cap = Current Price × Circulating Supply. It's the standard way to rank cryptocurrencies by size. Bitcoin's market cap is in the trillions; smaller coins can be millions. A higher market cap generally means a more established project — though 'safer' is always relative in crypto.",
    category: "Basics",
  },
  {
    term: "Altcoin",
    emoji: "🪙",
    short: "Any cryptocurrency that isn't Bitcoin.",
    long: "Altcoin = 'alternative coin'. Ethereum, Solana, Cardano, XRP, and thousands of others are altcoins. Some are serious platforms with large developer communities; others are speculative meme tokens. As a rule, altcoins carry more volatility and risk than Bitcoin.",
    category: "Basics",
  },
  {
    term: "Token vs Coin",
    emoji: "🎭",
    short: "Coins run their own blockchain; tokens live on someone else's.",
    long: "A coin (BTC, ETH, SOL) operates on its own native blockchain. A token is built on top of an existing blockchain — for example, most DeFi tokens and NFTs are Ethereum tokens. The distinction matters because tokens rely on the health and fees of the chain they're built on.",
    category: "Basics",
  },
  {
    term: "Stablecoin",
    emoji: "⚖️",
    short: "A crypto pegged to a stable asset, usually the US dollar.",
    long: "Stablecoins are designed to hold a fixed value — most aim for exactly $1. USDT (Tether) and USDC are the most widely used. They let you stay in the crypto ecosystem without exposure to price swings, and are useful for moving money between exchanges without converting to traditional currency.",
    category: "Basics",
  },
  {
    term: "Wallet",
    emoji: "👛",
    short: "Software or hardware that holds your private keys (and therefore your crypto).",
    long: "A crypto wallet doesn't actually 'store' coins — it stores the private keys that prove you own them. Hot wallets (MetaMask, Coinbase Wallet) are apps connected to the internet: convenient but more vulnerable. Cold wallets (Ledger, Trezor) are offline hardware devices and significantly more secure for large holdings.",
    category: "Basics",
  },
  {
    term: "Exchange (CEX)",
    emoji: "🏛️",
    short: "A centralised platform where you buy, sell, and trade crypto.",
    long: "A centralised exchange (CEX) like Coinbase, Binance, or Kraken is a company that runs a marketplace for crypto trading. You create an account, verify your identity (KYC), deposit funds, and trade. CEXs are easy to use but they hold your crypto on your behalf — meaning you don't control the private keys.",
    category: "Basics",
  },
  {
    term: "DEX",
    emoji: "🔄",
    short: "A decentralised exchange — trade directly from your own wallet.",
    long: "A decentralised exchange (DEX) like Uniswap or Jupiter lets you trade crypto peer-to-peer using smart contracts, with no company in the middle. You connect your wallet and trade directly. DEXs are non-custodial (you keep your keys), but they have a steeper learning curve and no customer support if something goes wrong.",
    category: "Basics",
  },
  {
    term: "NFT",
    emoji: "🖼️",
    short: "A unique digital asset verified on a blockchain.",
    long: "NFT stands for Non-Fungible Token. Unlike Bitcoin (where every BTC is identical and interchangeable), each NFT is unique. They're used to prove ownership of digital art, music, game items, and collectibles. The NFT itself is just a record of ownership — the actual file usually lives elsewhere.",
    category: "Basics",
  },
  {
    term: "Mining",
    emoji: "⛏️",
    short: "Using computing power to validate transactions and earn new coins.",
    long: "In Proof of Work blockchains like Bitcoin, 'miners' compete to solve complex maths puzzles using powerful computers. The winner adds the next block of transactions to the chain and earns newly created Bitcoin as a reward. Mining consumes significant electricity, which is why some chains use Proof of Stake instead.",
    category: "Basics",
  },
  {
    term: "Staking",
    emoji: "🌱",
    short: "Locking up your crypto to help validate the network and earn rewards.",
    long: "In Proof of Stake blockchains (Ethereum, Solana, Cardano), validators are chosen to confirm transactions based on how much crypto they've 'staked' (locked up as collateral). In return, they earn staking rewards — similar to earning interest. Many exchanges offer easy staking so you don't have to run your own validator.",
    category: "Basics",
  },

  // ── MARKET ─────────────────────────────────────────────────────────────────
  {
    term: "Bull Market",
    emoji: "🐂",
    short: "A sustained period of rising prices and positive sentiment.",
    long: "A bull market is a prolonged phase where prices trend upward and investor confidence is high. In crypto, bull markets can be dramatic — Bitcoin has historically risen 10–100× during a bull cycle. The term comes from the way a bull attacks: thrusting horns upward. Bull markets eventually end, often sharply.",
    category: "Market",
  },
  {
    term: "Bear Market",
    emoji: "🐻",
    short: "A sustained period of falling prices and pessimism.",
    long: "A bear market is when prices fall 20% or more from recent highs and stay low for an extended period. Crypto bear markets ('crypto winters') can last 1–2 years. The term comes from the way a bear attacks: swiping paws downward. Bear markets test conviction — many investors sell at the bottom.",
    category: "Market",
  },
  {
    term: "Volatility",
    emoji: "📈",
    short: "How dramatically a coin's price moves up and down.",
    long: "Crypto is famous for volatility — prices can move 10–30% in a single day. High volatility creates big opportunities but equally big risks. Bitcoin is considered 'less volatile' than most altcoins — which is saying something given BTC can move 5% in an hour. Volatility is not the same as risk, but they are related.",
    category: "Market",
  },
  {
    term: "Liquidity",
    emoji: "💧",
    short: "How easily you can buy or sell without moving the price.",
    long: "High liquidity means lots of buyers and sellers at all times — you can trade large amounts without drastically changing the price. Low-liquidity coins can spike or crash on relatively small trades, and may be hard to exit quickly. Bitcoin and Ethereum have the highest liquidity of any crypto.",
    category: "Market",
  },
  {
    term: "Halving",
    emoji: "✂️",
    short: "When Bitcoin's block reward is cut in half — roughly every 4 years.",
    long: "Approximately every 210,000 blocks (~4 years), the reward Bitcoin miners receive per block is halved. This reduces the rate at which new Bitcoin enters supply. The most recent halving (April 2024) dropped the reward from 6.25 BTC to 3.125 BTC. Halvings are historically associated with bull markets in the 12–18 months that follow.",
    category: "Market",
  },
  {
    term: "ATH / ATL",
    emoji: "🏆",
    short: "All-Time High / All-Time Low — the best and worst price ever recorded.",
    long: "ATH (All-Time High) is the highest price a coin has ever reached. ATL (All-Time Low) is the lowest. When a coin 'breaks ATH' it enters price discovery with no historical resistance above it. Many traders use ATH levels as psychological targets. Note: ATH figures are often quoted in USD, so inflation matters for very old records.",
    category: "Market",
  },
  {
    term: "BTC Dominance",
    emoji: "👑",
    short: "Bitcoin's share of the total crypto market cap.",
    long: "BTC Dominance shows what percentage of the entire crypto market's value is held in Bitcoin. When dominance rises, money is flowing from altcoins into Bitcoin (often a sign of risk-off sentiment). When it falls, altcoins are outperforming Bitcoin — sometimes called 'altcoin season'. A commonly watched figure by traders.",
    category: "Market",
  },
  {
    term: "Market Correction",
    emoji: "📉",
    short: "A short-term price drop of 10–20% within a larger trend.",
    long: "A correction is a temporary pullback after a strong price run. It differs from a bear market in duration and depth — corrections are shorter and shallower. In a bull market, 20–30% corrections are common and expected. Experienced investors often view corrections as buying opportunities rather than reasons to panic.",
    category: "Market",
  },
  {
    term: "Capitulation",
    emoji: "🏳️",
    short: "When investors give up and sell in panic — often marks market bottoms.",
    long: "Capitulation is the moment of maximum fear: holders who refused to sell finally give up and dump their coins. It often produces a sharp price spike downward with heavy volume. Paradoxically, capitulation events frequently mark the bottom of a bear market — because once the last sellers have sold, there are only buyers left.",
    category: "Market",
  },
  {
    term: "Pump and Dump",
    emoji: "🎰",
    short: "A scheme where a coin is hyped up, then sold by insiders at the top.",
    long: "In a pump-and-dump, a group artificially inflates a coin's price through coordinated buying and hype (the pump), then sells their holdings at the peak (the dump), leaving late buyers with worthless tokens. This is illegal in traditional markets but largely unregulated in crypto. Low-cap, low-liquidity coins are most vulnerable.",
    category: "Market",
  },
  {
    term: "Support & Resistance",
    emoji: "🧱",
    short: "Price levels where a coin tends to stop falling or stop rising.",
    long: "Support is a price level where buying pressure historically stops a decline — the price 'bounces' off it. Resistance is where selling pressure historically stops a rise. These levels exist because traders remember them and act on them. When a resistance level is broken, it often becomes the new support.",
    category: "Market",
  },
  {
    term: "ROI",
    emoji: "💰",
    short: "Return on Investment — how much profit (or loss) you made relative to what you put in.",
    long: "ROI = (Current Value − Amount Invested) ÷ Amount Invested × 100%. A 100% ROI means you doubled your money; a −50% ROI means you lost half. In crypto, people talk about 10x, 100x ROI for big wins — but the same math applies to losses, which can also be extreme.",
    category: "Market",
  },

  // ── TECHNOLOGY ─────────────────────────────────────────────────────────────
  {
    term: "Smart Contract",
    emoji: "📜",
    short: "Self-executing code stored on a blockchain that runs automatically.",
    long: "Smart contracts are programs that execute automatically when predefined conditions are met — no bank, lawyer, or middleman required. They power DeFi protocols, NFT mints, and decentralised apps. Ethereum pioneered smart contracts in 2015. The risk: bugs in smart contract code can be exploited with no ability to reverse transactions.",
    category: "Technology",
  },
  {
    term: "DeFi",
    emoji: "🏦",
    short: "Financial services — lending, borrowing, trading — run by code on a blockchain.",
    long: "Decentralised Finance (DeFi) recreates traditional financial services without banks or companies. Smart contracts handle everything automatically. Examples: Uniswap (trading), Aave (lending), Compound (borrowing). Anyone with a wallet can access DeFi, but risks include smart contract bugs, hacks, and highly volatile interest rates.",
    category: "Technology",
  },
  {
    term: "Gas Fees",
    emoji: "⛽",
    short: "The fee paid to process a transaction on a blockchain.",
    long: "Gas fees compensate the validators who process and confirm your transaction. On Ethereum, fees spike during high network demand and can cost $10–$100+ for a simple transfer. Solana and other Layer 1 chains were designed with much lower fees. Gas is paid in the native coin of the chain (ETH on Ethereum, SOL on Solana).",
    category: "Technology",
  },
  {
    term: "Layer 1 (L1)",
    emoji: "🏗️",
    short: "The base blockchain that everything else is built on.",
    long: "A Layer 1 is a foundational blockchain — Bitcoin, Ethereum, Solana, Avalanche are all L1s. They handle transaction finality and security directly. L1s often face trade-offs between speed, cost, and decentralisation (the 'blockchain trilemma'). Everything else — DeFi protocols, NFTs, bridges — is built on top of L1s.",
    category: "Technology",
  },
  {
    term: "Layer 2 (L2)",
    emoji: "⚡",
    short: "A network built on top of an L1 to make it faster and cheaper.",
    long: "Layer 2 networks (Arbitrum, Optimism, Base, Lightning Network) process transactions off the main chain and then post the results back to the L1. This dramatically increases speed and reduces fees while inheriting the security of the base chain. L2s are increasingly where everyday crypto activity happens.",
    category: "Technology",
  },
  {
    term: "Proof of Work (PoW)",
    emoji: "⚙️",
    short: "A consensus method where miners compete using computing power.",
    long: "In PoW (used by Bitcoin), validators (called miners) race to solve a complex cryptographic puzzle using energy-intensive computing. The winner adds the next block and earns the block reward. PoW is highly secure and battle-tested but consumes significant electricity — Bitcoin's energy use is comparable to some small countries.",
    category: "Technology",
  },
  {
    term: "Proof of Stake (PoS)",
    emoji: "🗳️",
    short: "A consensus method where validators are chosen based on their stake.",
    long: "In PoS (used by Ethereum, Solana, Cardano), validators lock up (stake) crypto as collateral to earn the right to confirm transactions and earn rewards. No energy-intensive mining required. PoS is more energy-efficient than PoW. Ethereum switched from PoW to PoS in September 2022 — an event called 'The Merge'.",
    category: "Technology",
  },
  {
    term: "DAO",
    emoji: "🗺️",
    short: "A community-governed organisation run by smart contracts and token votes.",
    long: "A Decentralised Autonomous Organisation (DAO) is a group that makes decisions collectively via on-chain votes, weighted by governance token holdings. There's no CEO or board — rules are encoded in smart contracts. DAOs govern many DeFi protocols, NFT communities, and investment funds. Participation requires holding the project's governance token.",
    category: "Technology",
  },
  {
    term: "Oracle",
    emoji: "🔮",
    short: "A service that feeds real-world data into a blockchain.",
    long: "Blockchains are isolated — they can't natively access external data like stock prices, weather, or sports results. Oracles (like Chainlink) bridge this gap by feeding verified real-world data on-chain. Most DeFi protocols rely on price oracles to know the value of assets. Oracle manipulation is a common attack vector.",
    category: "Technology",
  },
  {
    term: "Bridge",
    emoji: "🌉",
    short: "A protocol that moves tokens between different blockchains.",
    long: "Bridges let you transfer assets between separate blockchains — for example, moving ETH from Ethereum to Arbitrum, or USDC from Ethereum to Solana. They work by locking tokens on one chain and minting equivalent tokens on the other. Bridges have been a frequent target of hacks — billions have been lost in bridge exploits.",
    category: "Technology",
  },
  {
    term: "Tokenomics",
    emoji: "📐",
    short: "The economic design of a cryptocurrency: supply, distribution, and incentives.",
    long: "Tokenomics covers everything about how a token is structured: total supply, how tokens are released over time (vesting), who holds them (team, investors, public), and what incentives exist to hold or spend them. Good tokenomics creates long-term demand. Bad tokenomics — like massive team allocations that unlock and get dumped — destroy value.",
    category: "Technology",
  },
  {
    term: "Fork",
    emoji: "🍴",
    short: "A change to a blockchain's rules — either backward-compatible or not.",
    long: "A soft fork is a protocol upgrade that is backward-compatible — old nodes still work. A hard fork is a breaking change that creates two incompatible chains. Bitcoin Cash was created in 2017 via a hard fork of Bitcoin. Ethereum Classic exists because of a contentious hard fork after the DAO hack in 2016.",
    category: "Technology",
  },
  {
    term: "Hash Rate",
    emoji: "🖥️",
    short: "A measure of the total computing power securing a Proof of Work network.",
    long: "Hash rate measures how much computational work miners are collectively putting into a PoW network like Bitcoin. A higher hash rate means the network is more secure and harder to attack (a '51% attack' becomes more expensive). Hash rate is measured in hashes per second (EH/s at Bitcoin's scale). It generally follows price.",
    category: "Technology",
  },
  {
    term: "Mempool",
    emoji: "🚦",
    short: "The waiting room for unconfirmed transactions on a blockchain.",
    long: "Before a transaction is confirmed, it waits in the mempool (memory pool). Miners/validators pick transactions from the mempool — usually prioritising those with higher fees. During network congestion, the mempool can grow large, causing delays and fee spikes. You can check the Bitcoin mempool in real-time on sites like mempool.space.",
    category: "Technology",
  },

  // ── TRADING ────────────────────────────────────────────────────────────────
  {
    term: "Dollar-Cost Averaging (DCA)",
    emoji: "📅",
    short: "Buying a fixed amount regularly, regardless of price.",
    long: "DCA means investing the same amount (e.g. $50) at regular intervals (weekly, monthly) regardless of price. When prices are high you buy less; when prices are low you buy more — automatically averaging your cost. Studies consistently show DCA outperforms trying to 'time the market' for most retail investors.",
    category: "Trading",
  },
  {
    term: "Market Order",
    emoji: "⚡",
    short: "Buy or sell immediately at the current market price.",
    long: "A market order executes instantly at whatever price is available. It guarantees execution but not the exact price — in volatile or low-liquidity markets, you may get filled at a worse price than expected (slippage). Market orders are simple but can be expensive in thin markets.",
    category: "Trading",
  },
  {
    term: "Limit Order",
    emoji: "🎯",
    short: "An order to buy or sell only at a specific price you set.",
    long: "A limit order lets you set the exact price you're willing to buy or sell at. It won't execute unless the market reaches that price. You might not get filled if the price never reaches your target, but you avoid slippage. Limit orders are better than market orders when precision matters more than speed.",
    category: "Trading",
  },
  {
    term: "Slippage",
    emoji: "🏂",
    short: "The difference between the price you expected and the price you actually got.",
    long: "Slippage occurs when your trade executes at a different price than quoted — common in low-liquidity markets or large orders. On DEXs, you can set a slippage tolerance (e.g. 0.5%) to limit how much worse your price can be before the trade is cancelled. High slippage = you're overpaying or underselling.",
    category: "Trading",
  },
  {
    term: "Long / Short",
    emoji: "↕️",
    short: "Long = betting prices rise. Short = betting prices fall.",
    long: "Going long means buying an asset expecting it to rise in value. Going short means opening a position that profits if the price falls (by borrowing and selling the asset, then buying it back cheaper). Shorting in crypto is done on derivatives exchanges. Getting 'short squeezed' is when shorts are forced to buy back at rising prices, accelerating the move up.",
    category: "Trading",
  },
  {
    term: "Leverage",
    emoji: "🏋️",
    short: "Borrowing money to amplify your position — and your risk.",
    long: "10x leverage means you control $10,000 with only $1,000 of your own capital. If the price moves 10% in your favour you double your money — but if it moves 10% against you, you lose everything (liquidation). Leverage amplifies both gains and losses proportionally. High leverage is one of the fastest ways to lose capital in crypto.",
    category: "Trading",
  },
  {
    term: "Liquidation",
    emoji: "💥",
    short: "When a leveraged position is automatically closed due to insufficient funds.",
    long: "If you're using leverage and the price moves against you far enough, the exchange automatically closes your position to prevent losses exceeding your collateral. This is liquidation — you lose your collateral. During sharp market moves, cascading liquidations can accelerate price crashes as positions are force-closed.",
    category: "Trading",
  },
  {
    term: "Take Profit / Stop Loss",
    emoji: "🛡️",
    short: "Automatic orders to lock in gains or cap losses.",
    long: "A take profit (TP) order closes your position automatically when the price reaches your profit target. A stop loss (SL) closes it automatically if the price falls to a level you've pre-defined to limit your downside. Using both together is a basic but essential risk management technique for any active trader.",
    category: "Trading",
  },
  {
    term: "Portfolio",
    emoji: "💼",
    short: "The collection of all crypto assets you own.",
    long: "Your portfolio is the total of everything you hold across all wallets and exchanges. Diversification across different projects reduces the risk of any single coin collapsing your entire investment. Many beginners start with a 'core portfolio' of established coins (BTC, ETH) before exploring smaller projects.",
    category: "Trading",
  },
  {
    term: "Spot Trading",
    emoji: "💱",
    short: "Buying and selling actual crypto at the current market price.",
    long: "Spot trading is the simplest form: you exchange one asset for another at today's price and immediately own what you bought. There's no leverage, no borrowing — just a straightforward purchase. Most beginners start with spot trading on a centralised exchange before exploring more complex products.",
    category: "Trading",
  },

  // ── SECURITY ───────────────────────────────────────────────────────────────
  {
    term: "Seed Phrase",
    emoji: "🔑",
    short: "12 or 24 words that are the master key to your entire wallet.",
    long: "Your seed phrase (recovery phrase) is generated when you create a wallet. These 12 or 24 words can recover your wallet on any device if you lose access. Anyone who has your seed phrase has full access to all your crypto. Write it on paper, store it offline in multiple secure locations, and never type it anywhere online. This is the single most important security principle in crypto.",
    category: "Security",
  },
  {
    term: "Private Key",
    emoji: "🗝️",
    short: "A unique secret code that proves you own your crypto.",
    long: "Every crypto address has a private key — a long string of characters that proves ownership and authorises transactions. Your wallet software manages this for you. If you use a non-custodial wallet, you are responsible for keeping your private key (or seed phrase) secure. Losing it means losing access permanently.",
    category: "Security",
  },
  {
    term: "Cold Storage",
    emoji: "🧊",
    short: "Keeping your crypto on a device that is never connected to the internet.",
    long: "Cold storage means your private keys never touch an internet-connected device — the most secure approach for significant holdings. Hardware wallets (Ledger, Trezor) are the most common method. Paper wallets (printing your keys and storing them physically) are another. Cold storage protects against hacks but requires careful physical security.",
    category: "Security",
  },
  {
    term: "Custodial vs Non-Custodial",
    emoji: "🏦",
    short: "Custodial: the exchange holds your keys. Non-custodial: you do.",
    long: "With a custodial wallet (Coinbase, Binance), the exchange holds your private keys on your behalf. Convenient, with account recovery — but you're trusting them completely ('not your keys, not your coins'). With a non-custodial wallet (MetaMask, Ledger), you hold your keys and have full control. The tradeoff is full responsibility for security.",
    category: "Security",
  },
  {
    term: "Phishing",
    emoji: "🎣",
    short: "A scam where attackers impersonate legitimate services to steal your credentials.",
    long: "Crypto phishing attacks typically involve fake websites or emails that mimic real exchanges or wallets, tricking you into entering your seed phrase or login details. Red flags: slightly misspelled domain names, urgent requests, unsolicited DMs offering help. Rule: no legitimate service will ever ask for your seed phrase.",
    category: "Security",
  },
  {
    term: "Rug Pull",
    emoji: "🏃",
    short: "When developers abandon a project and run away with investor funds.",
    long: "A rug pull happens when the team behind a crypto project suddenly withdraws all liquidity or sells their holdings, crashing the price to near zero and leaving investors with worthless tokens. Common in new DeFi projects and meme coins. Red flags: anonymous team, no audit, huge team token allocations, no locked liquidity.",
    category: "Security",
  },
  {
    term: "Smart Contract Audit",
    emoji: "🔍",
    short: "A professional security review of a project's code before launch.",
    long: "Before deploying a smart contract, reputable projects pay specialist security firms to audit the code for bugs and vulnerabilities. An audit doesn't guarantee safety — even audited contracts have been hacked — but an unaudited contract is a significant red flag. Always check if a project has been audited before interacting with it.",
    category: "Security",
  },
  {
    term: "KYC",
    emoji: "🪪",
    short: "Know Your Customer — identity verification required by regulated exchanges.",
    long: "KYC is the process where exchanges verify your identity (passport, driving licence, selfie) to comply with anti-money-laundering laws. Most centralised exchanges require KYC before you can withdraw significant amounts. DEXs do not require KYC. Some users prefer DEXs for privacy; however, regulators are increasingly targeting DeFi as well.",
    category: "Security",
  },
  {
    term: "Two-Factor Authentication (2FA)",
    emoji: "🔐",
    short: "A second verification step beyond your password to protect accounts.",
    long: "2FA adds a second layer of security — typically a time-based code from an app like Google Authenticator or Authy — that must be entered along with your password. Always enable 2FA on any crypto exchange account. Avoid SMS-based 2FA if possible, as phone numbers can be hijacked via SIM-swapping attacks.",
    category: "Security",
  },

  // ── SLANG ──────────────────────────────────────────────────────────────────
  {
    term: "HODL",
    emoji: "💎",
    short: "Hold your crypto no matter what the market does.",
    long: "HODL started as a typo for 'hold' in a 2013 Bitcoin forum post ('I AM HODLING') and became a meme that defined an entire investment philosophy. HODLers resist the urge to sell during crashes, believing in long-term value. Sometimes backronymed as 'Hold On for Dear Life'. The strategy works in bull markets, but has costs in prolonged bear markets.",
    category: "Slang",
  },
  {
    term: "FOMO",
    emoji: "😰",
    short: "Fear Of Missing Out — buying because prices are going up and you don't want to miss it.",
    long: "FOMO is one of the most dangerous forces in crypto investing. It's the anxious urgency to buy after prices have already risen sharply, driven by fear of being left behind. FOMO buyers typically buy near the top. The antidote: a clear investment plan made before prices move, not during the spike.",
    category: "Slang",
  },
  {
    term: "FUD",
    emoji: "😨",
    short: "Fear, Uncertainty, Doubt — negative news or sentiment that drives prices down.",
    long: "FUD refers to information (often exaggerated or false) that spreads fear and causes panic selling. It might come from news articles, government statements, or social media posts. Some FUD is legitimate concern; some is deliberately manufactured by those who profit from falling prices. 'Don't spread FUD' is a standard phrase in crypto communities.",
    category: "Slang",
  },
  {
    term: "DYOR",
    emoji: "📚",
    short: "Do Your Own Research — don't buy something just because someone else said to.",
    long: "DYOR is the most important piece of advice in crypto. Before putting money into any project, read the whitepaper, check the team, understand the tokenomics, look for audits, and form your own view. Never invest based solely on social media hype or a tip from a stranger. Even this glossary is educational, not investment advice.",
    category: "Slang",
  },
  {
    term: "NFA",
    emoji: "⚠️",
    short: "Not Financial Advice — a disclaimer when sharing crypto opinions.",
    long: "NFA is appended to crypto content to signal that what's being said is an opinion, not professional financial guidance. You'll see it constantly on Twitter/X and YouTube: 'BTC is going to $200K, NFA.' It's both a genuine legal disclaimer and a cultural habit. Treat all NFA crypto content as entertainment, not instruction.",
    category: "Slang",
  },
  {
    term: "Whale",
    emoji: "🐋",
    short: "An individual or entity that holds enough crypto to move the market.",
    long: "Whales are large holders — institutions, early investors, or wealthy individuals with enough crypto that their buys and sells can noticeably move prices. Watching whale wallets (e.g. via on-chain tools like Whale Alert) is a common strategy. A large transfer of BTC to an exchange often signals an impending sell-off.",
    category: "Slang",
  },
  {
    term: "Rekt",
    emoji: "💀",
    short: "Wrecked — suffering a major loss on a trade or investment.",
    long: "Getting 'rekt' (from 'wrecked') means losing a large portion of your investment, often through leverage, a rug pull, or holding through a crash. 'Getting rekt' can happen to anyone, including experienced traders. It's used both seriously and as dark humour in the crypto community.",
    category: "Slang",
  },
  {
    term: "Moon / Mooning",
    emoji: "🌙",
    short: "When a coin's price shoots up dramatically.",
    long: "'Going to the moon' or 'mooning' describes an explosive price increase. 'When moon?' is the perennial question asked about any investment. The phrase captures the speculative optimism common in crypto — the belief that any coin can multiply many times in value. Used both sincerely and sarcastically.",
    category: "Slang",
  },
  {
    term: "Ape / Aping In",
    emoji: "🦍",
    short: "Buying into a coin or project without much research, following hype.",
    long: "'Aping in' means jumping into a trade or project impulsively, driven by excitement rather than research. A compliment in some communities (risk-taking boldness), a criticism in others (reckless behaviour). NFT culture popularised the term. 'Did you ape?' = did you buy?",
    category: "Slang",
  },
  {
    term: "Diamond Hands / Paper Hands",
    emoji: "✋",
    short: "Diamond hands hold through the dip. Paper hands sell at the first sign of trouble.",
    long: "Diamond hands describes holders who refuse to sell regardless of volatility — the ultimate HODLers. Paper hands describes those who sell quickly at the first sign of a dip, often out of panic. In practice, neither is always right: knowing when to exit is a skill, not a weakness. The terms are heavily used in meme coin and NFT communities.",
    category: "Slang",
  },
  {
    term: "Degen",
    emoji: "🎲",
    short: "Short for degenerate — someone who makes high-risk crypto bets.",
    long: "A 'degen' is someone who participates in highly speculative crypto activity — trading meme coins, aping into unaudited DeFi protocols, using high leverage. Used self-deprecatingly by participants who are fully aware of the risks. 'Full degen mode' means maximum risk-taking. The term has been reclaimed by the crypto community as a badge of honour in some circles.",
    category: "Slang",
  },
  {
    term: "Shill",
    emoji: "📣",
    short: "Promoting a coin — often with undisclosed financial interest.",
    long: "Shilling means enthusiastically promoting a cryptocurrency, often because you hold it and want the price to go up. Paid shills are influencers paid (in tokens or cash) to hype projects without disclosing the relationship. 'Don't shill me' = I don't want a biased recommendation. Always ask: does this person hold this coin?",
    category: "Slang",
  },
  {
    term: "WAGMI / NGMI",
    emoji: "🤝",
    short: "We're All Gonna Make It / Not Gonna Make It — expressions of collective optimism or pessimism.",
    long: "WAGMI is used to build community spirit and collective optimism — we're all in this together and we'll all succeed. NGMI is the opposite, usually directed at someone making what the community considers a bad decision ('selling now is NGMI'). Both are rooted in NFT and DeFi culture and spread broadly through crypto Twitter.",
    category: "Slang",
  },
];

const CATEGORIES = ["All", "Basics", "Market", "Technology", "Trading", "Security", "Slang"];

const CATEGORY_STYLES: Record<string, string> = {
  Basics:     "bg-blue-500/10 text-blue-400",
  Market:     "bg-orange-500/10 text-orange-400",
  Technology: "bg-purple-500/10 text-purple-400",
  Trading:    "bg-yellow-500/10 text-yellow-400",
  Security:   "bg-red-500/10 text-red-400",
  Slang:      "bg-green-500/10 text-green-400",
};

// ─── Component ───────────────────────────────────────────────────────────────

// Stable index for today — changes at midnight, same for every visitor
function todayIndex() {
  return Math.floor(Date.now() / 86_400_000) % GLOSSARY.length;
}

const TODAY_LABEL = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric",
});

// ─── Journal / Checklist dialog content ──────────────────────────────────────

const DAILY_CHECKLIST = [
  { emoji: "📊", step: "Check the Fear & Greed index", desc: "Is the market fearful or greedy today? Adjust your mindset accordingly." },
  { emoji: "📈", step: "Glance at BTC dominance", desc: "Rising = risk-off, money moving to Bitcoin. Falling = altcoin season possible." },
  { emoji: "🔥", step: "Review top movers", desc: "Are any coins you hold in the top gainers or losers? Investigate if so." },
  { emoji: "📰", step: "Scan the news headlines", desc: "Any macro news (Fed, regulation, ETFs) that could affect the market today?" },
  { emoji: "🧠", step: "Stick to your plan", desc: "Don't let FOMO or FUD change a strategy you built with a clear head." },
];

const JOURNAL_TEMPLATE = `📓 CRYPTO TRADING JOURNAL
Date: _______________

📌 MARKET CONDITIONS TODAY
• BTC Price: $________  24h Change: _______%
• Fear & Greed: ______ (label: _____________)
• BTC Dominance: _______%
• Overall mood: Bullish / Bearish / Neutral

💸 TRADES TODAY
Coin: _______ | Action: BUY / SELL | Amount: $_______ | Price: $_______
Reason for trade: ________________________________________________
_________________________________________________________________

📊 MY PORTFOLIO
• Total value: $_______  |  vs yesterday: _______%
• Best performer: _______  |  Worst: _______

🧠 LESSONS LEARNED TODAY
1. _____________________________________________________________
2. _____________________________________________________________

🎯 TOMORROW'S PLAN
• Watch: _______________________________________________________
• If BTC drops below $_______ → ________________________________
• If BTC rises above $_______ → _______________________________

⚠️ EMOTIONAL CHECK
Today I felt: Calm / Anxious / FOMO / Confident
What drove it: ________________________________________________

Remember: The plan you make with a clear head beats any decision made on emotion.`;

export default function Resources() {
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [glossarySearch, setGlossarySearch] = useState("");
  const [glossaryCategory, setGlossaryCategory] = useState("All");
  const [copied, setCopied] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [journalCopied, setJournalCopied] = useState(false);

  const termOfTheDay = GLOSSARY[todayIndex()];

  function copyForStories() {
    const text = [
      `📚 Crypto Term of the Day`,
      ``,
      `${termOfTheDay.emoji} ${termOfTheDay.term}`,
      ``,
      termOfTheDay.short,
      ``,
      termOfTheDay.long,
      ``,
      `Learn more → AIFirstCrypto.com`,
      `#crypto #cryptobeginners #cryptoeducation #${termOfTheDay.category.toLowerCase()}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  type ResourceItem = {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    action: string;
    type: "internal" | "external" | "dialog";
    href?: string;
    dialog?: "journal" | "checklist";
  };

  const resources: ResourceItem[] = [
    {
      title: "DCA Calculator",
      description: "Simulate what consistent weekly or monthly buying would have returned on any coin over 1–3 years.",
      icon: Calculator,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      action: "Open Calculator",
      type: "internal",
      href: "/dca",
    },
    {
      title: "Beginner Watchlist Guide",
      description: "Curated list of the top foundational cryptocurrencies every beginner should know — live prices included.",
      icon: FileText,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      action: "View Watchlist",
      type: "internal",
      href: "/watchlist",
    },
    {
      title: "Understanding Fear & Greed",
      description: "Deep dive into market psychology and how to use sentiment analysis in your strategy.",
      icon: BookOpen,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      action: "Read Article",
      type: "internal",
      href: "/fear-greed",
    },
    {
      title: "Crypto Trading Journal",
      description: "A structured daily template to log your trades, decisions, and lessons learned — copy it in one click.",
      icon: Notebook,
      color: "text-green-500",
      bg: "bg-green-500/10",
      action: "Get Template",
      type: "dialog",
      dialog: "journal",
    },
    {
      title: "Daily Crypto Checklist",
      description: "A 5-step morning routine to check the market clearly without getting overwhelmed.",
      icon: CheckSquare,
      color: "text-primary",
      bg: "bg-primary/10",
      action: "View Checklist",
      type: "dialog",
      dialog: "checklist",
    },
  ];

  const filteredGlossary = useMemo(() => {
    const q = glossarySearch.toLowerCase().trim();
    return GLOSSARY.filter(entry => {
      const matchesSearch = q === "" || entry.term.toLowerCase().includes(q) || entry.short.toLowerCase().includes(q) || entry.long.toLowerCase().includes(q);
      const matchesCategory = glossaryCategory === "All" || entry.category === glossaryCategory;
      return matchesSearch && matchesCategory;
    });
  }, [glossarySearch, glossaryCategory]);

  // Count per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: GLOSSARY.length };
    for (const e of GLOSSARY) counts[e.category] = (counts[e.category] ?? 0) + 1;
    return counts;
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Free Resources</h1>
        <p className="text-xl text-muted-foreground">
          Tools, templates, and guides designed to help you navigate crypto with confidence.
        </p>
      </div>

      {/* Resource cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, i) => {
          const Icon = resource.icon;

          const cardButton =
            resource.type === "internal" ? (
              <Link href={resource.href!}>
                <Button variant="outline" className="w-full group">
                  {resource.action}
                  <ExternalLink className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </Link>
            ) : resource.type === "dialog" ? (
              <Button
                variant="outline"
                className="w-full group"
                onClick={() => resource.dialog === "journal" ? setJournalOpen(true) : setChecklistOpen(true)}
              >
                {resource.action}
                <ExternalLink className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Button>
            ) : (
              <a href={resource.href} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" className="w-full group">
                  {resource.action}
                  <ExternalLink className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Button>
              </a>
            );

          return (
            <Card key={i} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${resource.bg}`}>
                  <Icon className={`h-6 w-6 ${resource.color}`} />
                </div>
                <CardTitle className="text-xl">{resource.title}</CardTitle>
                <CardDescription className="text-sm mt-2 leading-relaxed">{resource.description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-6">
                {cardButton}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Trading Journal Dialog */}
      <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Notebook className="h-5 w-5 text-green-500" />
              Daily Crypto Trading Journal
            </DialogTitle>
            <DialogDescription>
              Copy this template into any notes app — Notion, Apple Notes, Google Docs, or just paper.
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-muted/50 rounded-xl p-4 text-xs leading-relaxed font-mono whitespace-pre-wrap text-foreground/80 border border-border/40">
            {JOURNAL_TEMPLATE}
          </pre>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JOURNAL_TEMPLATE).then(() => {
                  setJournalCopied(true);
                  setTimeout(() => setJournalCopied(false), 2500);
                });
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all ${
                journalCopied
                  ? "bg-green-500/10 border-green-500/40 text-green-400"
                  : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
              }`}
            >
              {journalCopied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Template</>}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daily Checklist Dialog */}
      <Dialog open={checklistOpen} onOpenChange={setChecklistOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Your 5-Minute Daily Crypto Routine
            </DialogTitle>
            <DialogDescription>
              Do these 5 things every morning before you make any crypto decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {DAILY_CHECKLIST.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{item.emoji}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Step {idx + 1}</span>
                  </div>
                  <p className="text-sm font-semibold mb-1">{item.step}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground text-center">
              Bookmark <span className="text-primary font-medium">AIFirstCrypto.com</span> — everything you need is right here.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── AIFirst Signal Guide ─────────────────────────────────────────── */}
      <div className="space-y-6" id="aifirst-signal">
        {/* Heading */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Understanding the AIFirst Signal</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              What the daily verdict means — and how to use it as a beginner.
            </p>
          </div>
        </div>

        {/* What is it */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-primary/3 to-transparent p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">What is the AIFirst Signal?</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            Every day, AIFirstCrypto analyses three live market signals and combines them into a single plain-English verdict. 
            No charts to interpret. No jargon. Just one sentence telling you what the market feels like today — and a beginner tip for what to do about it.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            It's designed to replace the overwhelming noise of crypto Twitter and replace it with a single, trustworthy daily read.
          </p>
        </div>

        {/* Signal Pills explained */}
        <div className="space-y-3">
          <h3 className="text-base font-bold">The 3 signals we use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">😨</span>
                <span className="text-sm font-bold">Fear &amp; Greed Index</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A 0–100 score measuring overall market sentiment. 0 = extreme fear (everyone is panicking), 100 = extreme greed (everyone is euphoric). 
                Historically, extreme fear = potential buying opportunity; extreme greed = potential time to be cautious.
              </p>
              <div className="flex gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold border border-red-500/20">0–24 · Extreme Fear</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/20">25–44 · Fear</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-semibold border border-yellow-500/20">45–54 · Neutral</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold border border-green-500/20">55–74 · Greed</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20">75–100 · Extreme Greed</span>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Market 24h Change</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The percentage change of the total crypto market cap over the last 24 hours. A strongly positive number means the whole market is rising; 
                a strongly negative number means money is flowing out across the board. This tells us the direction — not just the mood.
              </p>
              <div className="flex gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold border border-green-500/20">+3%+ · Strong rise</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-semibold border border-green-500/15">0–3% · Slight rise</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold border border-border/40">±0% · Flat</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/15">-5%+ · Sharp drop</span>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <span className="text-sm font-bold">BTC Dominance</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bitcoin's share of the total crypto market cap. When it rises above ~60%, investors are moving into Bitcoin and away from riskier altcoins — 
                a risk-off signal. When it falls below ~45%, altcoins are gaining ground — typically a more risk-on, bullish environment.
              </p>
              <div className="flex gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/20">60%+ · Risk-off, BTC dominates</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20">45–60% · Balanced</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold border border-green-500/20">&lt;45% · Altcoin season</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict cards */}
        <div className="space-y-3">
          <h3 className="text-base font-bold">The 6 possible verdicts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                icon: Rocket,
                label: "Market is Euphoric",
                color: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/30",
                iconBg: "bg-purple-500/15",
                signals: "F&G ≥ 75 · Market ≥ +3%",
                meaning: "Everyone is excited and prices are surging. Historically, this is when risk is highest — be very careful buying at the top.",
                tip: "If you already hold, consider taking some profit. Never buy just because everyone is excited.",
              },
              {
                icon: TrendingUp,
                label: "Leaning Bullish",
                color: "text-green-400",
                bg: "bg-green-500/10 border-green-500/30",
                iconBg: "bg-green-500/15",
                signals: "F&G ≥ 45 · Market ≥ 0%",
                meaning: "Sentiment is positive and the market is rising. A reasonable environment to continue a DCA plan, but not to take on excessive risk.",
                tip: "Stick to your plan. Don't over-invest just because the market feels good — it can turn quickly.",
              },
              {
                icon: Scale,
                label: "Mixed Signals",
                color: "text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/30",
                iconBg: "bg-blue-500/15",
                signals: "F&G 40–54 · Market ±1.5%",
                meaning: "No clear direction today. The market is balanced and indecisive. These days are common — they're not a signal to act.",
                tip: "Use quiet days to research, not react. Review your existing positions calmly.",
              },
              {
                icon: AlertTriangle,
                label: "Proceed with Caution",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10 border-yellow-500/30",
                iconBg: "bg-yellow-500/15",
                signals: "F&G < 45 · Market slightly negative",
                meaning: "Sentiment is nervous and the market is under mild pressure. Not a crisis — but not a time to be impulsive either.",
                tip: "Wait for clearer signals before making new purchases. Hold positions if your conviction hasn't changed.",
              },
              {
                icon: Frown,
                label: "Market is Fearful",
                color: "text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/30",
                iconBg: "bg-orange-500/15",
                signals: "F&G ≤ 35 · Market < −1%",
                meaning: "Significant fear is in the market and prices are falling. Historically, sustained fear periods end with opportunity — but we may not be at the bottom yet.",
                tip: "Don't panic-sell. If you were planning a DCA purchase, this might be a good entry — but only invest what you're comfortable losing.",
              },
              {
                icon: ShieldAlert,
                label: "Extreme Fear",
                color: "text-red-400",
                bg: "bg-red-500/10 border-red-500/30",
                iconBg: "bg-red-500/15",
                signals: "F&G ≤ 20 or Market ≤ −5%",
                meaning: "Maximum fear. Panic selling is happening. This is uncomfortable — but historically, extreme fear marks the best long-term buying opportunities.",
                tip: "Stay calm. Do not make emotional decisions. If you have spare capital you planned to invest, extreme fear has historically been the best time — in small amounts.",
              },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.label} className={`rounded-xl border p-4 space-y-3 ${v.bg}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${v.iconBg}`}>
                      <Icon className={`h-4 w-4 ${v.color}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${v.color}`}>{v.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{v.signals}</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{v.meaning}</p>
                  <div className="rounded-lg bg-background/40 border border-border/30 p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Beginner tip</p>
                    <p className="text-xs text-foreground/70 leading-relaxed">{v.tip}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Important disclaimer */}
        <div className="rounded-xl border border-border/40 bg-muted/30 p-4 flex gap-3 items-start">
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">The AIFirst Signal is not financial advice.</span>{" "}
            It is an educational tool designed to help beginners understand what market sentiment looks like today. 
            Always do your own research before investing, only invest money you can afford to lose, and consider consulting a financial adviser for personal guidance.
          </p>
        </div>

        {/* CTA to home */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="rounded-full gap-2">
              <Activity className="h-4 w-4" />
              View today's AIFirst Signal
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Glossary ─────────────────────────────────────────────────────── */}
      <div className="space-y-6" id="glossary">
        {/* Heading */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Beginner's Glossary</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {GLOSSARY.length} terms across 6 categories — plain English, no jargon.
            </p>
          </div>
        </div>

        {/* ── Term of the Day ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          <div className="relative p-5 sm:p-6 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Term of the Day</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{TODAY_LABEL}</span>
              </div>
            </div>

            {/* Term */}
            <div className="flex items-start gap-4">
              <span className="text-5xl leading-none flex-shrink-0 mt-1">{termOfTheDay.emoji}</span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-bold tracking-tight">{termOfTheDay.term}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${CATEGORY_STYLES[termOfTheDay.category] ?? ""}`}>
                    {termOfTheDay.category}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground/80 leading-snug">{termOfTheDay.short}</p>
              </div>
            </div>

            {/* Full explanation */}
            <div className="pl-0 sm:pl-[72px]">
              <p className="text-sm text-muted-foreground leading-relaxed">{termOfTheDay.long}</p>
            </div>

            {/* Share button */}
            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              <p className="text-xs text-muted-foreground">
                A new term every day — bookmark this page and check back tomorrow.
              </p>
              <button
                onClick={copyForStories}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  copied
                    ? "bg-green-500/10 border-green-500/40 text-green-400"
                    : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                }`}
              >
                {copied
                  ? <><Check className="h-3.5 w-3.5" /> Copied!</>
                  : <><Copy className="h-3.5 w-3.5" /> Copy for Stories</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search any term, e.g. 'seed phrase', 'DCA', 'rug pull'…"
            value={glossarySearch}
            onChange={e => setGlossarySearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {glossarySearch && (
            <button onClick={() => setGlossarySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => {
            const active = glossaryCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setGlossaryCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${active ? "bg-white/20 text-inherit" : "bg-muted text-muted-foreground"}`}>
                  {categoryCounts[cat] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {(glossarySearch || glossaryCategory !== "All") && (
          <p className="text-xs text-muted-foreground">
            Showing {filteredGlossary.length} of {GLOSSARY.length} terms
            {glossaryCategory !== "All" ? ` in ${glossaryCategory}` : ""}
            {glossarySearch ? ` matching "${glossarySearch}"` : ""}
          </p>
        )}

        {/* Term grid */}
        {filteredGlossary.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-border/50 text-muted-foreground">
            <p className="font-medium text-base">No terms match your search.</p>
            <p className="text-sm mt-1">Try a different word or clear the filters.</p>
            <button
              className="mt-3 text-sm text-primary hover:underline"
              onClick={() => { setGlossarySearch(""); setGlossaryCategory("All"); }}
            >
              Clear all filters
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
                  className="text-left w-full rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:bg-card/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <div className="flex items-center gap-3 p-4">
                    <span className="text-xl leading-none flex-shrink-0 w-8 text-center">{entry.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{entry.term}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${CATEGORY_STYLES[entry.category] ?? "bg-muted/50 text-muted-foreground"}`}>
                          {entry.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{entry.short}</p>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground ml-1">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <div className="pl-11 border-t border-border/40 pt-3">
                        <p className="text-sm text-muted-foreground leading-relaxed text-left">{entry.long}</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-8 bg-muted/30 rounded-2xl border border-border/50 text-center">
        <h2 className="text-2xl font-bold mb-3">Looking for something specific?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          We're constantly building new tools for retail investors. Let us know what would help you the most.
        </p>
        <Button size="lg" className="rounded-full">Request a Resource</Button>
      </div>
    </div>
  );
}
