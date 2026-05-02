import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
}

interface HoldingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (amount: number, buyPrice: number) => void;
  coin: Coin | null;
  existingAmount?: number;
  existingBuyPrice?: number;
  mode?: "add" | "edit";
}

export function HoldingDialog({
  open,
  onClose,
  onSave,
  coin,
  existingAmount,
  existingBuyPrice,
  mode = "add",
}: HoldingDialogProps) {
  const [amount, setAmount] = useState(existingAmount?.toString() ?? "");
  const [buyPrice, setBuyPrice] = useState(existingBuyPrice?.toString() ?? "");

  useEffect(() => {
    if (open) {
      setAmount(existingAmount?.toString() ?? "");
      setBuyPrice(existingBuyPrice?.toString() ?? (coin?.current_price?.toString() ?? ""));
    }
  }, [open, existingAmount, existingBuyPrice, coin]);

  if (!coin) return null;

  const parsedAmount = parseFloat(amount);
  const parsedBuyPrice = parseFloat(buyPrice);
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0 && !isNaN(parsedBuyPrice) && parsedBuyPrice > 0;

  const currentValue = isValid ? parsedAmount * coin.current_price : null;
  const costBasis = isValid ? parsedAmount * parsedBuyPrice : null;
  const pnl = currentValue !== null && costBasis !== null ? currentValue - costBasis : null;
  const pnlPct = pnl !== null && costBasis ? (pnl / costBasis) * 100 : null;

  function handleSave() {
    if (!isValid) return;
    onSave(parsedAmount, parsedBuyPrice);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" />
            {mode === "add" ? "Add Holding" : "Edit Holding"}
          </DialogTitle>
          <DialogDescription>
            {coin.name} · Current price: {formatPrice(coin.current_price)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount ({coin.symbol.toUpperCase()} held)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="any"
              placeholder={`e.g. 0.5`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buy-price">Average buy price (USD)</Label>
            <Input
              id="buy-price"
              type="number"
              min="0"
              step="any"
              placeholder={`e.g. ${coin.current_price.toFixed(2)}`}
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
            />
          </div>

          {isValid && currentValue !== null && costBasis !== null && pnl !== null && pnlPct !== null && (
            <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current value</span>
                <span className="font-semibold">{formatPrice(currentValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost basis</span>
                <span className="font-semibold">{formatPrice(costBasis)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground font-medium">P&amp;L</span>
                <span className={`font-bold ${pnl >= 0 ? "text-positive" : "text-negative"}`}>
                  {pnl >= 0 ? "+" : ""}{formatPrice(pnl)} ({pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isValid}>
            {mode === "add" ? "Add to Portfolio" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
