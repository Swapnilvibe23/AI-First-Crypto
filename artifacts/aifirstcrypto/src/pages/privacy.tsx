import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  const EFFECTIVE = "1 May 2026";
  const CONTACT = "privacy@aifirstcrypto.com";
  const SITE = "AIFirstCrypto.com";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-xl mt-1 flex-shrink-0">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground mt-1">Effective date: {EFFECTIVE}</p>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        This Privacy Policy describes how {SITE} ("we", "our", or "us") collects, uses, and protects
        information when you use our website and services. By using {SITE} you agree to the practices
        described below.
      </p>

      {[
        {
          title: "1. Information We Collect",
          body: [
            "Automatically collected data: When you visit our site, our hosting provider may log your IP address, browser type, operating system, referring URL, and pages visited. This is standard server log data retained for security and analytics.",
            "Locally stored preferences: We store your watchlist, price alerts, and holdings exclusively in your browser's localStorage. This data never leaves your device and is not transmitted to our servers.",
            "Newsletter sign-ups: If you subscribe to our email newsletter via Beehiiv, your email address is collected and processed by Beehiiv in accordance with their own Privacy Policy. We receive subscriber metrics but not individual email activity.",
            "Analytics: We may use privacy-focused analytics tools (such as Plausible or similar) that do not use cookies and do not collect personally identifiable information.",
          ],
        },
        {
          title: "2. How We Use Your Information",
          body: [
            "To operate and improve the website and its features.",
            "To send our newsletter and crypto updates (only if you explicitly subscribed).",
            "To detect and prevent abuse, fraud, or security incidents.",
            "We do not sell, rent, or share your personal data with third parties for their own marketing purposes.",
          ],
        },
        {
          title: "3. Affiliate Links & Third-Party Services",
          body: [
            "Some links on this site are affiliate links, including links to cryptocurrency exchanges such as Coinbase, Binance, Kraken, Gemini, and others. If you click an affiliate link and sign up or make a purchase, we may receive a commission at no additional cost to you.",
            "Clicking an affiliate link means you will be redirected to a third-party website. We are not responsible for the privacy practices or content of those third-party sites. We encourage you to review their privacy policies.",
            "We use CoinGecko's public API for all market data. CoinGecko's own Terms of Service and Privacy Policy apply to data sourced from their platform.",
          ],
        },
        {
          title: "4. Cookies",
          body: [
            "AIFirstCrypto does not use tracking cookies. We may use sessionStorage or localStorage to store your preferences locally in your browser. No data from localStorage is sent to our servers.",
            "Third-party services embedded in our site (such as newsletter providers) may set their own cookies. You can control cookies through your browser settings.",
          ],
        },
        {
          title: "5. Data Security",
          body: [
            "We implement commercially reasonable security measures to protect information transmitted to our servers. However, no method of internet transmission is 100% secure. Your locally stored data (watchlist, alerts) is protected only by your own device's security.",
          ],
        },
        {
          title: "6. Children's Privacy",
          body: [
            "Our site is not directed at persons under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it.",
          ],
        },
        {
          title: "7. Your Rights",
          body: [
            "Depending on your jurisdiction, you may have rights to access, correct, or delete personal data we hold about you. To exercise these rights, contact us at " + CONTACT + ". Since most data is stored locally in your browser, you can delete it at any time by clearing your browser's localStorage.",
          ],
        },
        {
          title: "8. Changes to This Policy",
          body: [
            "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of the site after changes constitutes acceptance of the new policy.",
          ],
        },
        {
          title: "9. Contact Us",
          body: [
            "For any privacy-related questions or requests, please contact us at: " + CONTACT,
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
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
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
