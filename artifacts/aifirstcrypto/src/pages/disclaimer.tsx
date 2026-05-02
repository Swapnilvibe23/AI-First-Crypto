import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Disclaimer() {
  const SITE = "AIFirstCrypto.com";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-start gap-4">
        <div className="bg-yellow-500/10 p-3 rounded-xl mt-1 flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disclaimer</h1>
          <p className="text-muted-foreground mt-1">Important information — please read carefully</p>
        </div>
      </div>

      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-sm leading-relaxed">
          <strong>Crypto is highly volatile and speculative.</strong> You can lose some or all of the money you invest.
          Never invest more than you can afford to lose. This site does not provide financial, investment, tax, or legal advice.
        </AlertDescription>
      </Alert>

      {[
        {
          title: "Not Financial Advice",
          body: [
            SITE + " is an educational and informational platform. All content — including market data, AI-generated summaries, DCA simulations, Fear & Greed analysis, and commentary — is provided for general informational purposes only.",
            "Nothing on this site constitutes or should be construed as financial advice, investment advice, trading advice, or any other advice. We are not licensed financial advisers, brokers, or investment managers.",
            "Always consult a qualified financial adviser before making investment decisions. Past performance — including historical DCA simulations — is not indicative of future results.",
          ],
        },
        {
          title: "Risk Warning",
          body: [
            "Cryptocurrency markets are highly volatile. Prices can move dramatically in short periods of time. You may lose part or all of your investment.",
            "Crypto assets are not regulated in the same way as traditional financial instruments in most jurisdictions. Investor protections (such as deposit insurance) typically do not apply.",
            "Liquidity risk: Some crypto assets may be difficult to sell quickly without significantly impacting the market price.",
            "Technology risk: Cryptocurrency wallets, exchanges, and smart contracts may be subject to hacks, bugs, or unforeseen failures.",
            "Regulatory risk: Laws governing cryptocurrencies vary by country and may change rapidly. Certain assets or activities may become restricted or illegal in your jurisdiction.",
          ],
        },
        {
          title: "Data Accuracy",
          body: [
            "Market data displayed on " + SITE + " is sourced from CoinGecko's public API and is provided without warranty of accuracy, completeness, or timeliness.",
            "Prices and market statistics may be delayed, temporarily unavailable, or subject to API rate limiting. Do not rely solely on data displayed here for trading decisions.",
            "AI-generated market summaries are automated outputs and may contain errors or omissions. They are not a substitute for independent research.",
            "DCA Calculator results are simulations based on historical data and are purely hypothetical. They do not guarantee future returns.",
          ],
        },
        {
          title: "Affiliate Disclosure",
          body: [
            SITE + " participates in affiliate marketing programs with cryptocurrency exchanges and other financial services. When you click certain links on this site and sign up or complete a qualifying action, we may earn a commission.",
            "Affiliate relationships do not affect the independence or objectivity of our content. We aim to provide balanced, factual information regardless of commercial relationships.",
            "You should independently evaluate any exchange or service before using it. Affiliate compensation is disclosed clearly wherever it applies.",
          ],
        },
        {
          title: "No Endorsement",
          body: [
            "The listing or mention of any cryptocurrency, exchange, project, or service on this site does not constitute an endorsement or recommendation to buy, sell, or hold that asset or use that service.",
            "Inclusion in any comparison, ranking, or analysis is for informational purposes only and should not be construed as investment advice.",
          ],
        },
        {
          title: "Jurisdictional Notice",
          body: [
            "Cryptocurrency products and services may not be available in all countries. It is your responsibility to ensure that your use of this site and any linked services complies with the laws of your jurisdiction.",
            "Residents of countries where cryptocurrency trading is restricted or prohibited should seek independent legal advice before using any linked exchange or service.",
          ],
        },
        {
          title: "Tax Implications",
          body: [
            "Buying, selling, or trading cryptocurrency may have tax implications in your jurisdiction. Capital gains taxes, income taxes, and reporting requirements vary widely by country.",
            SITE + " does not provide tax advice. Consult a qualified tax professional regarding your specific situation.",
          ],
        },
      ].map(({ title, body }) => (
        <Card key={title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {body.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-yellow-500 mt-1 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
