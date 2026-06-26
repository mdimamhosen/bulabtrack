import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, Package, Home, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useEffect, useState, useRef } from "react";
import { confirmStripeOrder } from "@/lib/api/stripe.functions";
import { OrderGraphTracker } from "@/components/order-graph-tracker";
import { toast } from "sonner";
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
  const { status, session_id } = Route.useSearch();
  const { count, clear } = useCart();
  const [verifying, setVerifying] = useState(!!session_id);
  const verificationInitiated = useRef(false);

  // Query order details dynamically from MongoDB
  const { data: order, refetch, isLoading } = useQuery({
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

  // Verify Stripe payment session on success redirect
  useEffect(() => {
    if (status === "success" && session_id) {
      if (verificationInitiated.current) return;
      verificationInitiated.current = true;
      setVerifying(true);
      confirmStripeOrder({
        data: {
          orderNumber,
          sessionId: session_id,
        },
      })
        .then((res) => {
          setVerifying(false);
          if (res.success) {
            toast.success("Payment verified! Order confirmed.");
            if (count > 0) {
              clear();
            }
            refetch();
          } else {
            toast.error(res.error || "Payment verification failed.");
          }
        })
        .catch(() => {
          setVerifying(false);
          toast.error("Error connecting to stripe verification service.");
        });
    } else {
      // Just clear the cart for COD orders
      if (count > 0) {
        clear();
      }
    }
  }, [status, session_id, orderNumber, clear, refetch, count]);

  const paymentMethod = order?.notes?.includes("stripe") || session_id ? "Credit Card (Stripe)" : "Cash on Delivery";
  const displayStatus = order?.status || "Pending";

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center lg:px-8 relative min-h-[85vh]">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-15" />
        <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[300px] w-[300px] bg-primary/5 opacity-60" />
      </div>

      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
        {verifying ? (
          <Loader2 className="h-10 w-10 animate-spin" />
        ) : (
          <CheckCircle2 className="h-10 w-10" />
        )}
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        {verifying ? "Verifying Payment..." : "Order placed successfully!"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
        {verifying
          ? "Please wait while we verify your transaction details with Stripe."
          : "Thank you for your order! Your shipping requisition has been processed and logged in the inventory system."}
      </p>

      {/* Graph Status Tracker (For all roles) */}
      {!isLoading && !verifying && (
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
              ["Payment Method", verifying ? "Validating..." : paymentMethod],
              ["Order Status", displayStatus],
              ["Estimated Dispatch", "2–5 business days"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border/40 bg-zinc-950/20 p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{k}</p>
                <p className="mt-1 font-bold text-foreground capitalize">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center gap-3">
        <Button asChild variant="outline" className="rounded-xl border-border hover:bg-card/45 cursor-pointer">
          <Link to="/products">
            Keep browsing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
        <Button asChild className="rounded-xl bg-gradient-to-r from-primary to-accent font-semibold cursor-pointer">
          <Link to="/">
            <Home className="h-4 w-4" /> Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
