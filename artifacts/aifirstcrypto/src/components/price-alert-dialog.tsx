import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAlerts } from "@/hooks/use-alerts";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

interface PriceAlertDialogProps {
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  currentPrice: number;
}

export function PriceAlertDialog({
  coinId,
  coinName,
  coinSymbol,
  coinImage,
  currentPrice,
}: PriceAlertDialogProps) {
  const { addAlert } = useAlerts();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [direction, setDirection] = useState<"above" | "below">("above");

  const handleSave = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid target price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (direction === "above" && price <= currentPrice) {
      toast({
        title: "Price too low",
        description: `Target must be above current price of ${formatPrice(currentPrice)}.`,
        variant: "destructive",
      });
      return;
    }

    if (direction === "below" && price >= currentPrice) {
      toast({
        title: "Price too high",
        description: `Target must be below current price of ${formatPrice(currentPrice)}.`,
        variant: "destructive",
      });
      return;
    }

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    addAlert({ coinId, coinName, coinSymbol, coinImage, targetPrice: price, direction });
    setOpen(false);
    toast({
      title: "Alert set!",
      description: `You'll be notified when ${coinName} ${direction === "above" ? "rises above" : "falls below"} ${formatPrice(price)}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="rounded-full shadow-lg">
          <Bell className="mr-2 h-5 w-5" />
          Set Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img src={coinImage} alt={coinName} className="h-8 w-8 rounded-full" />
            Price Alert — {coinName}
          </DialogTitle>
          <DialogDescription>
            Current price: <span className="font-bold text-foreground">{formatPrice(currentPrice)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="direction">Notify me when price</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "above" | "below")}>
              <SelectTrigger id="direction">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Rises above</SelectItem>
                <SelectItem value="below">Falls below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">Target price (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
              <Input
                id="target"
                type="number"
                step="any"
                min="0"
                className="pl-7"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/50">
            Alerts check prices every 60 seconds while the app is open. Allow browser notifications when prompted to receive alerts.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            <Bell className="mr-2 h-4 w-4" /> Create Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
