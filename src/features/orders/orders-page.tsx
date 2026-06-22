import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Eye } from "lucide-react";
import { listOrders, getOrderItems, updateOrderStatus } from "@/lib/api/orders.functions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"] as const;

export function OrdersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<any | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => listOrders({ data: {} }),
  });

  const { data: items = [] } = useQuery({
    queryKey: ["order-items", selected?.id],
    enabled: !!selected,
    queryFn: async () => getOrderItems({ data: { orderId: selected.id } }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateOrderStatus({ data: { id, status: status as never } });
    },
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = orders.filter((o: any) =>
    (status === "all" || o.status === status) &&
    (!search || `${o.order_number} ${o.customer_name} ${o.email}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage customer orders placed through the public storefront.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>
            ) : filtered.map((o: any) => (
              <tr key={o.id} className="border-b border-border/60 last:border-b-0 hover:bg-secondary/30">
                <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.email}</p>
                </td>
                <td className="px-4 py-3 font-semibold">${Number(o.total).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <Select value={o.status} onValueChange={(v) => updateStatus.mutate({ id: o.id, status: v })}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(o)}><Eye className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Order {selected.order_number}</DialogTitle></DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{selected.customer_name}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge>{selected.status}</Badge></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p>{selected.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p>{selected.phone}</p></div>
                <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Address</p><p>{selected.address}, {selected.city} {selected.postal_code}</p></div>
                {selected.notes && <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Notes</p><p>{selected.notes}</p></div>}
              </div>
              <div className="rounded-lg border border-border">
                <div className="border-b border-border bg-secondary/30 px-4 py-2 text-xs font-semibold uppercase">Items</div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((i: any) => (
                      <tr key={i.id} className="border-b border-border/60 last:border-b-0">
                        <td className="px-4 py-2">{i.device_name}</td>
                        <td className="px-4 py-2 text-muted-foreground">×{i.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium">${(Number(i.unit_price) * i.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-secondary/30">
                      <td colSpan={2} className="px-4 py-2 font-semibold">Total</td>
                      <td className="px-4 py-2 text-right font-semibold text-primary">${Number(selected.total).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
