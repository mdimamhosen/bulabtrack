import { Link } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, setQty, remove } = useCart();

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button asChild variant="outline" onClick={onClose}>
              <Link to="/products">Browse products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                    {i.image_url && (
                      <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.brand}</p>
                    <p className="mt-1 text-sm font-semibold text-primary">${i.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setQty(i.id, i.quantity - 1)}
                        className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{i.quantity}</span>
                      <button
                        onClick={() => setQty(i.id, i.quantity + 1)}
                        className="grid h-7 w-7 place-items-center rounded-md border border-border hover:bg-secondary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(i.id)}
                        className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="mt-4 grid gap-2">
                <Button asChild className="w-full" onClick={onClose}>
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
