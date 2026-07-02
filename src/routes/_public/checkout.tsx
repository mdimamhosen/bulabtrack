import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Truck, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createStripeCheckoutSession } from "@/lib/api/stripe.functions";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import { CheckoutSkeleton } from "@/components/page-skeletons";

export const Route = createFileRoute("/_public/checkout")({
  head: () => ({ meta: [{ title: "Checkout — LabTrack" }] }),
  // Auth redirect removed — checkout now works without login (COD)
  component: CheckoutPage,
  pendingComponent: CheckoutSkeleton,
});

const schema = z.object({
  customer_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  address: z.string().trim().min(5).max(255),
  city: z.string().trim().min(2).max(80),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

function generateOrderNumber() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LAB-${t}-${r}`;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const paymentMethod = "cod";
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // Try to pre-fill from authenticated user if logged in
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const formData: Partial<FormData> = {
          email: user.email || "",
        };

        // Try to fetch profile details
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          formData.customer_name = profile.name || "";
          if (profile.phone) {
            formData.phone = profile.phone;
          }
        }

        // Try to fetch last order details to pre-populate address
        const { data: lastOrders } = await supabase
          .from("orders")
          .select("*")
          .eq("email", user.email)
          .order("created_at", { ascending: false });

        if (lastOrders && lastOrders.length > 0) {
          const lastOrder = lastOrders[0];
          formData.customer_name = lastOrder.customer_name || formData.customer_name || "";
          formData.phone = lastOrder.phone || formData.phone || "";
          formData.address = lastOrder.address || "";
          formData.city = lastOrder.city || "";
          formData.postal_code = lastOrder.postal_code || "";
        }

        // Use reset to reliably populate all fields at once
        reset(formData);
      }
    });
  }, [reset]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add some products before checking out.</p>
        <Button asChild className="mt-6">
          <Link to="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const orderId = crypto.randomUUID();
    const orderNumber = generateOrderNumber();

    // Save order in Pending state first
    const { error } = await supabase.from("orders").insert({
      id: orderId,
      ...data,
      order_number: orderNumber,
      total: subtotal,
      status: "Pending", // explicitly set to Pending for safety
    });

    if (error) {
      setLoading(false);
      return toast.error(error?.message ?? "Failed to place order");
    }

    const lineItems = items.map((i) => ({
      order_id: orderId,
      device_id: i.id,
      device_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
    }));

    const { error: liErr } = await supabase.from("order_items").insert(lineItems);
    if (liErr) {
      setLoading(false);
      return toast.error(liErr.message);
    }

    setLoading(false);
    clear();
    toast.success("Order placed successfully (Cash on Delivery)!");
    navigate({ to: "/order-success/$orderNumber", params: { orderNumber } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8 lg:py-16">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Delivery details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" error={errors.customer_name?.message}>
                  <Input {...register("customer_name")} />
                </Field>
                <Field label="Phone Number" error={errors.phone?.message}>
                  <Input {...register("phone")} />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <Input type="email" {...register("email")} />
                </Field>
                <Field label="City" error={errors.city?.message}>
                  <Input {...register("city")} />
                </Field>
                <Field label="Postal Code" error={errors.postal_code?.message}>
                  <Input {...register("postal_code")} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Delivery Address" error={errors.address?.message}>
                    <Input {...register("address")} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Order Notes (optional)" error={errors.notes?.message}>
                    <Textarea rows={3} {...register("notes")} />
                  </Field>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Payment method</h2>
              <div className="mt-4">
                <div className="flex items-start gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-4">
                  <Truck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm">Cash on Delivery</div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
                      Pay with cash when your package is delivered to your door. Online card payment coming soon.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={loading}>
            <Lock className="h-4 w-4" />{" "}
            {loading ? "Placing order…" : `Place Order • $${subtotal.toFixed(2)}`}
          </Button>
        </form>

        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
                {items.map((i) => (
                  <div key={i.id} className="flex gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {i.image_url && (
                        <img
                          src={i.image_url}
                          alt={i.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {i.quantity} × ${i.price.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">${(i.quantity * i.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
