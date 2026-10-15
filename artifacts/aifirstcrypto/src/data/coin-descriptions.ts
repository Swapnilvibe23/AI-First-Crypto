/**
 * Plain-English one-liner descriptions for the top ~80 coins.
 * Keyed by CoinGecko coin ID. Used on coin detail pages.
 */
export const COIN_DESCRIPTIONS: Record<string, string> = {
  bitcoin:
    "The original cryptocurrency — a decentralised digital currency with a fixed supply of 21 million coins, designed to be digital gold.",
  ethereum:
    "A programmable blockchain that powers most of DeFi, NFTs, and decentralised apps — think of it as the internet's global computer.",
  tether:
    "A stablecoin pegged to the US dollar, used to move money across exchanges without exposure to crypto price swings.",
  "usd-coin":
    "A regulated US dollar stablecoin issued by Circle — widely used for payments and DeFi because each coin is backed 1:1 by real dollars.",
  xrp:
    "A fast, low-cost payment network built for banks and financial institutions to send money internationally in seconds.",
  bnb:
    "The native coin of Binance and BNB Chain, used for trading fee discounts and powering a wide ecosystem of DeFi apps.",
  solana:
    "A high-speed blockchain capable of thousands of transactions per second with very low fees — a popular home for NFTs and DeFi.",
  dogecoin:
    "The original meme coin, started as a joke in 2013 but has a passionate community and remains one of the most recognised cryptocurrencies.",
  tron:
    "A blockchain focused on digital content and stablecoin transfers, processing high volumes of USDT transactions daily.",
  cardano:
    "A research-driven blockchain built by academics, designed for scalability, smart contracts, and sustainable governance.",
  "avalanche-2":
    "A fast, low-cost blockchain platform for DeFi and enterprise use, notable for its sub-second transaction finality.",
  "shiba-inu":
    "A community-driven meme token built on Ethereum, often called the 'Dogecoin killer', with its own DEX and ecosystem.",
  chainlink:
    "A decentralised oracle network that feeds real-world data (prices, events) into smart contracts on any blockchain.",
  sui:
    "A high-performance Layer 1 blockchain designed for low-latency apps and digital assets, backed by ex-Meta engineers.",
  stellar:
    "A payments-focused blockchain that enables fast, cheap cross-border money transfers, popular with remittance services.",
  polkadot:
    "A multi-chain network that lets different blockchains connect and share data, built by Ethereum co-founder Gavin Wood.",
  litecoin:
    "One of the oldest altcoins — a faster, lighter version of Bitcoin often used for everyday transactions.",
  uniswap:
    "The leading decentralised exchange (DEX) on Ethereum, letting users trade tokens directly from their wallet without a middleman.",
  near:
    "A developer-friendly blockchain focused on usability, with human-readable account names and very low transaction fees.",
  aptos:
    "A new Layer 1 blockchain built by ex-Meta engineers using the Move programming language, focused on safety and speed.",
  pepe:
    "A frog-themed meme coin with no utility beyond community and speculation — one of the most traded meme tokens in 2023–24.",
  "internet-computer":
    "A blockchain network by DFINITY aiming to run the web's back-end infrastructure — websites and apps — entirely on-chain.",
  monero:
    "A privacy-focused cryptocurrency where transactions are untraceable by design, making it the leading coin for financial privacy.",
  "ethereum-classic":
    "The original Ethereum chain that continued after the DAO hack hard fork — follows the principle that blockchain history should be immutable.",
  bittensor:
    "A decentralised network for AI model training and inference, rewarding participants who contribute machine learning compute.",
  "fetch-ai":
    "An AI and autonomous agent platform that lets software agents find, negotiate, and transact with each other on a blockchain.",
  "injective-protocol":
    "A DeFi-focused Layer 1 blockchain built for fully decentralised derivatives and financial markets.",
  arbitrum:
    "The largest Ethereum Layer 2 network, reducing fees and transaction times while inheriting Ethereum's security.",
  optimism:
    "An Ethereum Layer 2 that makes transactions faster and cheaper using optimistic rollup technology.",
  "the-graph":
    "A decentralised indexing protocol that makes blockchain data queryable — the 'Google' for on-chain information.",
  aave:
    "A leading DeFi lending protocol where you can deposit crypto to earn interest or borrow against your holdings without a bank.",
  maker:
    "The protocol behind DAI, a decentralised stablecoin backed by crypto collateral rather than a company's cash reserves.",
  filecoin:
    "A decentralised storage network where anyone can rent out spare hard drive space and earn FIL tokens in return.",
  hedera:
    "An enterprise-grade distributed ledger using hashgraph technology, backed by major corporations like Google and IBM.",
  cosmos:
    "An 'internet of blockchains' that lets independently built blockchains connect and communicate with each other.",
  vechain:
    "A blockchain for supply chain tracking and business applications, helping companies verify product authenticity.",
  decentraland:
    "A virtual reality metaverse on Ethereum where users buy, build on, and trade virtual land and digital assets.",
  "the-sandbox":
    "A blockchain-based virtual world and game platform where players own and monetise their gaming experiences as NFTs.",
  "axie-infinity":
    "A play-to-earn game where players collect, breed, and battle NFT creatures called Axies — a pioneer of blockchain gaming.",
  gala:
    "A gaming blockchain platform that lets players truly own in-game items as NFTs across a growing catalogue of games.",
  stacks:
    "A Layer 2 network for Bitcoin that adds smart contracts and DeFi capabilities directly on top of the Bitcoin chain.",
  algorand:
    "A carbon-neutral, pure proof-of-stake blockchain designed for speed and simplicity, used in central bank digital currency pilots.",
  flow:
    "A blockchain built specifically for NFTs and gaming, created by Dapper Labs — the team behind NBA Top Shot.",
  "render-token":
    "A decentralised GPU rendering network that connects creators needing 3D rendering power with GPU owners willing to provide it.",
  "immutable-x":
    "An Ethereum Layer 2 focused on NFT gaming, offering gas-free minting and trading with Ethereum-level security.",
  worldcoin:
    "A digital identity and global currency project by Sam Altman (OpenAI), attempting to verify human identity using iris scanning.",
  "ondo-finance":
    "A real-world asset (RWA) protocol that brings tokenised US Treasuries and institutional-grade yield on-chain.",
  sei:
    "A Layer 1 blockchain purpose-built for trading and exchanges, with an on-chain order book for ultra-fast execution.",
  "pyth-network":
    "A high-speed oracle network that delivers real-time financial market data to DeFi protocols across multiple blockchains.",
  jupiter:
    "The leading liquidity aggregator on Solana, finding the best swap routes across all Solana DEXs for minimal slippage.",
  jito:
    "A Solana liquid staking protocol and MEV (maximal extractable value) platform that rewards SOL stakers with extra yield.",
  bonk:
    "Solana's original community meme coin, airdropped to the Solana ecosystem in late 2022 and widely held by Solana users.",
  "dogwifhat":
    "A Solana meme coin featuring a dog with a hat — the most widely traded Solana meme token of the 2024 cycle.",
  "mantra-dao":
    "A real-world asset (RWA) Layer 1 blockchain focused on compliant tokenisation of physical assets like real estate.",
  hyperliquid:
    "A decentralised perpetuals exchange with its own Layer 1 chain, offering CEX-like speed with self-custody.",
  "sui-network":
    "A high-performance Layer 1 blockchain designed for low-latency apps and digital assets, backed by ex-Meta engineers.",
  "kaspa":
    "A proof-of-work blockchain using a novel blockDAG structure that achieves high throughput without sacrificing decentralisation.",
  "celestia":
    "A modular blockchain that specialises purely in data availability, allowing other chains to build on top of it more efficiently.",
  "base":
    "Coinbase's Ethereum Layer 2 network — a fast, low-cost chain designed to onboard the next billion users to crypto.",
  "blur":
    "An NFT marketplace aggregator for professional traders, offering real-time collection data and zero trading fees.",
  "pendle":
    "A DeFi protocol that lets users trade future yield — separating yield-bearing assets into principal and yield tokens.",
  "ethena":
    "A synthetic dollar protocol on Ethereum offering a crypto-native yield-bearing stablecoin backed by hedged ETH positions.",
  "jupiter-exchange-solana":
    "The leading liquidity aggregator on Solana, finding the best swap routes across all Solana DEXs for minimal slippage.",
};

/** Returns the plain-English description for a coin, or null if not known. */
export function getCoinDescription(coinId: string): string | null {
  return COIN_DESCRIPTIONS[coinId] ?? null;
}
