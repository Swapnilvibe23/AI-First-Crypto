import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSeoMeta } from "@/hooks/use-seo-meta";

export default function Terms() {
  useSeoMeta({
    title: "Terms of Service — AIFirstCrypto",
    description: "Terms governing your use of AIFirstCrypto.com. Free to use, for educational and informational purposes only.",
  });
  const EFFECTIVE = "1 May 2026";
  const SITE = "AIFirstCrypto.com";
  const CONTACT = "legal@aifirstcrypto.com";

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-xl mt-1 flex-shrink-0">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground mt-1">Effective date: {EFFECTIVE}</p>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        These Terms of Service ("Terms") govern your access to and use of {SITE} and its related services.
        By accessing or using {SITE} you agree to be bound by these Terms. If you do not agree, do not use this site.
      </p>

      {[
        {
          title: "1. Nature of the Service",
          body: [
            SITE + " is an informational and educational platform providing cryptocurrency market data, analytics, tools, and commentary for general informational purposes only.",
            "We are not a licensed financial adviser, broker, dealer, investment adviser, or exchange. Nothing on this site constitutes financial, investment, tax, or legal advice.",
            "All market data is sourced from third parties (including CoinGecko) and may be delayed, inaccurate, or incomplete. We make no warranties regarding accuracy or timeliness.",
          ],
        },
        {
          title: "2. Eligibility",
          body: [
            "You must be at least 18 years old to use this site.",
            "By using the site you represent that you have the legal capacity to enter into these Terms in your jurisdiction.",
            "Cryptocurrency trading may be restricted or prohibited in certain jurisdictions. You are solely responsible for ensuring your use complies with applicable local laws.",
          ],
        },
        {
          title: "3. Acceptable Use",
          body: [
            "You agree not to use the site to engage in any illegal activity or to violate any applicable laws or regulations.",
            "You agree not to scrape, crawl, or use automated methods to extract data from the site in ways that exceed reasonable personal use.",
            "You agree not to attempt to gain unauthorized access to any part of the site or its underlying infrastructure.",
            "You agree not to transmit any viruses, malware, or other harmful code.",
          ],
        },
        {
          title: "4. Affiliate Relationships",
          body: [
            "This site contains affiliate links to third-party services including cryptocurrency exchanges. We may earn a commission if you click an affiliate link and complete a qualifying action (such as signing up or trading).",
            "Affiliate compensation does not influence our editorial content, rankings, or assessments. We endeavor to present balanced, factual information.",
            "We are not responsible for the products, services, or practices of any third-party exchange or platform linked from this site.",
          ],
        },
        {
          title: "5. Intellectual Property",
          body: [
            "All original content on " + SITE + ", including text, graphics, design, and code, is the property of AIFirstCrypto and is protected by applicable intellectual property laws.",
            "Market data sourced from CoinGecko remains subject to CoinGecko's own terms and licensing.",
            "You may share individual pieces of content for non-commercial, educational purposes with attribution. You may not reproduce the site in bulk or for commercial purposes without written permission.",
          ],
        },
        {
          title: "6. No Warranties",
          body: [
            'The site is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.',
            "We do not warrant that the site will be uninterrupted, error-free, or free of viruses or other harmful components.",
            "We do not warrant the accuracy, completeness, or usefulness of any market data, AI-generated summaries, or other information displayed.",
          ],
        },
        {
          title: "7. Limitation of Liability",
          body: [
            "To the maximum extent permitted by law, AIFirstCrypto and its owners, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, arising from your use of, or inability to use, this site.",
            "In no event shall our total liability to you exceed the amount you paid us (if any) in the 12 months preceding the claim.",
          ],
        },
        {
          title: "8. Third-Party Links",
          body: [
            "Our site contains links to third-party websites and services. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites.",
            "We strongly advise you to read the terms and privacy policies of any third-party site you visit.",
          ],
        },
        {
          title: "9. Modifications",
          body: [
            "We reserve the right to modify these Terms at any time. Material changes will be communicated by updating the effective date at the top of this page.",
            "Your continued use of the site after changes constitutes acceptance of the updated Terms.",
          ],
        },
        {
          title: "10. Governing Law",
          body: [
            "These Terms shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved in the jurisdiction where AIFirstCrypto is headquartered.",
          ],
        },
        {
          title: "11. Contact",
          body: [
            "For any questions about these Terms, please contact us at: " + CONTACT,
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
