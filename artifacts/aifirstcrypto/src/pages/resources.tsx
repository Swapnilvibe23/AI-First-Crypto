import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, BookOpen, CheckSquare, LineChart, Notebook } from "lucide-react";

export default function Resources() {
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
