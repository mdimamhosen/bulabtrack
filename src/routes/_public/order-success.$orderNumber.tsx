import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, Package, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_public/order-success/$orderNumber")({
  head: () => ({ meta: [{ title: "Order Placed — LabTrack" }] }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { orderNumber } = useParams({ from: "/_public/order-success/$orderNumber" });
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center lg:px-8">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        Order placed successfully!
      </h1>
      <p className="mt-3 text-muted-foreground">
        Thank you for your order. Our team will contact you shortly to confirm delivery details.
      </p>

      <Card className="mt-8 text-left">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Your order number</p>
              <p className="font-mono text-lg font-semibold">{orderNumber}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            {[
              ["Payment", "Cash on Delivery"],
              ["Status", "Pending"],
              ["Delivery", "2–5 business days"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-secondary p-3">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-0.5 font-medium">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link to="/products">Keep shopping</Link>
        </Button>
        <Button asChild>
          <Link to="/">
            <Home className="h-4 w-4" /> Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
