import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, type Role } from "@/lib/roles";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Download, Pencil, Trash2, PackageX } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_app/devices/")({
  head: () => ({ meta: [{ title: "Devices — LabTrack" }] }),
  component: DevicesPage,
});

const STATUSES = ["Available", "In Use", "Under Maintenance", "Damaged", "Disposed"] as const;
const CATEGORIES = ["Input Device", "Output Device"] as const;

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "Available") return "default";
  if (s === "Damaged" || s === "Disposed") return "destructive";
  if (s === "Under Maintenance") return "outline";
  return "secondary";
}

function DevicesPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [toDelete, setToDelete] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) fetchUserRole(data.user.id).then(setRole);
    });
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    return list.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (category !== "all" && d.category !== category) return false;
      if (q) {
        const t = q.toLowerCase();
        if (
          !d.name.toLowerCase().includes(t) &&
          !d.brand.toLowerCase().includes(t) &&
          !d.model.toLowerCase().includes(t) &&
          !(d.serial_number ?? "").toLowerCase().includes(t) &&
          !(d.supplier ?? "").toLowerCase().includes(t) &&
          !(d.interface ?? "").toLowerCase().includes(t)
        ) return false;
      }
      return true;
    });
  }, [data, q, status, category]);

  const updateStatus = useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      const { error } = await supabase.from("devices").update({ status: args.status as never }).eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["devices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Device deleted");
      qc.invalidateQueries({ queryKey: ["devices"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCsv = () => {
    const rows = filtered;
    if (rows.length === 0) return toast.error("Nothing to export");
    const headers = ["Name", "Brand", "Model", "Category", "Status", "Interface", "Qty", "Price", "Total", "Serial", "Supplier", "Location"];
    const lines = [headers.join(",")];
    for (const d of rows) {
      lines.push([
        d.name, d.brand, d.model, d.category, d.status, d.interface,
        d.quantity, d.price, Number(d.price) * (d.quantity ?? 1),
        d.serial_number, d.supplier ?? "", d.location ?? "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `devices-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const isAdmin = role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Devices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {data?.length ?? 0} devices
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          {isAdmin && (
            <Link to="/devices/new">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add device
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, brand, model, serial, supplier…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Interface</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <div className="h-8 animate-pulse rounded bg-muted" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                        <PackageX className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No devices match your filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.brand} {d.model} • {d.serial_number}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{d.category}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{d.interface}</TableCell>
                    <TableCell>
                      <Select value={d.status} onValueChange={(v) => updateStatus.mutate({ id: d.id, status: v })}>
                        <SelectTrigger className="h-8 w-40 border-0 bg-transparent p-0 hover:bg-secondary">
                          <Badge variant={statusVariant(d.status)} className="capitalize">{d.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-right text-sm">{d.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${(Number(d.price) * (d.quantity ?? 1)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/devices/$id/edit" params={{ id: d.id }}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setToDelete(d.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete device?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && del.mutate(toDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
