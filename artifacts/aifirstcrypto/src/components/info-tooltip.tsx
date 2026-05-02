import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle
          className={`h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help flex-shrink-0 transition-colors ${className ?? ""}`}
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs leading-relaxed" side="top">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
