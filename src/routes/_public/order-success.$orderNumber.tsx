import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, Package, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useEffect } from "react";
import { OrderGraphTracker } from "@/components/order-graph-tracker";
import { z } from "zod";

const searchSchema = z.object({
  status: z.string().optional(),
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/_public/order-success/$orderNumber")({
  head: () => ({ meta: [{ title: "Order Placed — LabTrack" }] }),
  validateSearch: (search) => searchSchema.parse(search),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { orderNumber } = useParams({ from: "/_public/order-success/$orderNumber" });
  const { count, clear } = useCart();

  // Query order details dynamically from MongoDB
  const {
    data: order,
    isLoading,
  } = useQuery({
    queryKey: ["order-details", orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (count > 0) {
      clear();
    }
  }, [count, clear]);

  const paymentMethod = "Cash on Delivery";
  const displayStatus = order?.status || "Pending";

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center lg:px-8 relative min-h-[85vh]">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-15" />
        <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-primary/5 opacity-60" />
      </div>

      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="h-10 w-10" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        Order placed successfully!
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
        Thank you for your order! Your shipping requisition has been processed and logged in the
        inventory system.
      </p>

      {/* Graph Status Tracker (For all roles) */}
      {!isLoading && (
        <div className="mt-8">
          <OrderGraphTracker currentStatus={displayStatus} />
        </div>
      )}

      <Card className="mt-6 text-left border-border/55 liquid-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Your order number
              </p>
              <p className="font-mono text-base font-bold text-foreground mt-0.5">{orderNumber}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-xs sm:grid-cols-3">
            {[
              ["Payment Method", paymentMethod],
              ["Order Status", displayStatus],
              ["Estimated Dispatch", "2–5 business days"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border/40 bg-zinc-950/20 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {k}
                </p>
                <p className="mt-1 font-bold text-foreground capitalize">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center gap-3">
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-border hover:bg-card/45 cursor-pointer"
        >
          <Link to="/products">
            Keep browsing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button
          asChild
          className="rounded-xl bg-gradient-to-r from-primary to-accent font-semibold cursor-pointer"
        >
          <Link to="/">
            <Home className="h-4 w-4" /> Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
