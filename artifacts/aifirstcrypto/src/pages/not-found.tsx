import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
      <div className="flex flex-col items-center gap-3">
        <SearchX className="h-16 w-16 text-muted-foreground/50" />
        <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground max-w-sm text-base">
          That page doesn't exist. It may have moved, or the link might be wrong.
        </p>
      </div>
      <Link href="/">
        <Button size="lg" className="gap-2">
          <Home className="h-4 w-4" />
          Back to home
        </Button>
      </Link>
    </div>
  );
}
