import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  ShieldCheck,
  Eye,
  UserCheck,
  RefreshCw,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/lib/role-context";
import { createClient } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function UsersPage() {
  const qc = useQueryClient();
  const { role, userId: currentUserId } = useRole();
  const isAdmin = role === "admin";

  const [activeTab, setActiveTab] = useState("staff");
  const [staffSearch, setStaffSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [editStaffOpen, setEditStaffOpen] = useState(false);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffId, setEditStaffId] = useState<string | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Queries
  const { data: rawProfiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["users-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
  const profiles = rawProfiles as any[];

  const { data: rawRolesList = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["users-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
  const rolesList = rawRolesList as any[];

  const { data: rawOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["users-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const orders = rawOrders as any[];

  // Map staff roles in memory
  const mappedStaff = useMemo(() => {
    return profiles
      .map((p) => {
        const roleRecord = rolesList.find((r) => r.user_id === p.id);
        return {
          ...p,
          role: roleRecord?.role ?? null,
        };
      })
      .filter((s) => s.role !== null); // Filter out users who have no assigned role (i.e. customers)
  }, [profiles, rolesList]);

  // Derive Customers from Orders & Profiles
  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        postal_code: string;
        totalOrders: number;
        totalSpend: number;
        orders: any[];
        profileId?: string;
        status?: string;
      }
    >();

    orders.forEach((o: any) => {
      const emailKey = o.email.toLowerCase().trim();
      const existing = map.get(emailKey);
      if (existing) {
        existing.totalOrders += 1;
        if (o.status !== "Cancelled") {
          existing.totalSpend += Number(o.total);
        }
        existing.orders.push(o);
      } else {
        map.set(emailKey, {
          name: o.customer_name,
          email: o.email,
          phone: o.phone,
          address: o.address,
          city: o.city,
          postal_code: o.postal_code ?? "",
          totalOrders: 1,
          totalSpend: o.status !== "Cancelled" ? Number(o.total) : 0,
          orders: [o],
        });
      }
    });

    // Merge registered profile statuses
    profiles.forEach((p) => {
      const roleRecord = rolesList.find((r) => r.user_id === p.id);
      // Only treat users without staff/admin roles as customers
      if (!roleRecord) {
        const emailKey = p.email.toLowerCase().trim();
        const existing = map.get(emailKey);
        if (existing) {
          existing.profileId = p.id;
          existing.status = p.status;
        } else {
          // Customer registered but hasn't placed any order yet
          map.set(emailKey, {
            name: p.name,
            email: p.email,
            phone: p.phone ?? "",
            address: "",
            city: "",
            postal_code: "",
            totalOrders: 0,
            totalSpend: 0,
            orders: [],
            profileId: p.id,
            status: p.status,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [orders, profiles, rolesList]);

  // Filters
  const filteredStaff = useMemo(() => {
    if (!staffSearch) return mappedStaff;
    const t = staffSearch.toLowerCase();
    return mappedStaff.filter(
      (s) =>
        s.name.toLowerCase().includes(t) ||
        s.email.toLowerCase().includes(t) ||
        (s.phone ?? "").includes(t),
    );
  }, [mappedStaff, staffSearch]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const t = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.email.toLowerCase().includes(t) ||
        c.phone.includes(t) ||
        c.city.toLowerCase().includes(t),
    );
  }, [customers, customerSearch]);

  // Staff creation logic
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) {
      return toast.error("Please fill in all fields");
    }
    if (staffPassword.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    setSubmittingStaff(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Initialize isolated client so we don't log out current admin session
      const tempClient = createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      // Sign up new user with needs_password_change = true in metadata
      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: staffEmail,
        password: staffPassword,
        options: {
          data: {
            name: staffName,
            needs_password_change: true,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData || !signUpData.user) throw new Error("Failed to create user session");

      const { error: assignError } = await supabase.rpc("assign_staff_role_by_admin", {
        target_user_id: signUpData.user.id,
        staff_name: staffName,
      });

      if (assignError) throw assignError;

      toast.success(`Staff account created for ${staffName}. Temporary password set.`);
      setAddStaffOpen(false);
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");

      qc.invalidateQueries({ queryKey: ["users-profiles"] });
      qc.invalidateQueries({ queryKey: ["users-roles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff account");
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", user.id);

      if (error) throw error;
      toast.success(`Account for ${user.name} is now ${newStatus}`);
      qc.invalidateQueries({ queryKey: ["users-profiles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update account status");
    }
  };

  const handleRemoveUser = async (user: any) => {
    if (
      !confirm(
        `Are you sure you want to completely remove staff member ${user.name}? This will permanently delete their account.`,
      )
    )
      return;
    try {
      const { error } = await supabase.rpc("delete_user_by_admin", {
        target_user_id: user.id,
      });
      if (error) throw error;
      toast.success(`Staff account for ${user.name} removed successfully.`);
      qc.invalidateQueries({ queryKey: ["users-profiles"] });
      qc.invalidateQueries({ queryKey: ["users-roles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove staff member");
    }
  };

  const handleToggleCustomerBlock = async (customer: any) => {
    if (!customer.profileId) return;
    const newStatus = customer.status === "active" ? "inactive" : "active";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", customer.profileId);

      if (error) throw error;
      toast.success(
        `Customer ${customer.name} is now ${newStatus === "inactive" ? "blocked" : "unblocked"}`,
      );
      qc.invalidateQueries({ queryKey: ["users-profiles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update customer status");
    }
  };

  const handleOpenEditStaff = (staff: any) => {
    setEditStaffId(staff.id);
    setEditStaffName(staff.name);
    setEditStaffPhone(staff.phone ?? "");
    setEditStaffOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaffId) return;
    setSavingStaff(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name: editStaffName, phone: editStaffPhone || null })
        .eq("id", editStaffId);
      if (error) throw error;
      toast.success("Staff profile updated");
      setEditStaffOpen(false);
      qc.invalidateQueries({ queryKey: ["users-profiles"] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update staff";
      toast.error(message);
    } finally {
      setSavingStaff(false);
    }
  };

  const handleForcePasswordReset = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ needs_password_change: true })
        .eq("id", staffId);
      if (error) throw error;
      toast.success("Staff will be required to change password on next login");
      qc.invalidateQueries({ queryKey: ["users-profiles"] });
      if (selectedStaff?.id === staffId) {
        setSelectedStaff((prev: any) => (prev ? { ...prev, needs_password_change: true } : null));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set password reset";
      toast.error(message);
    }
  };

  const loading = profilesLoading || rolesLoading || ordersLoading;

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Background Liquid Blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-15" />
        <div className="liquid-orb animate-blob absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-primary/5 opacity-60" />
        <div
          className="liquid-orb animate-blob absolute bottom-1/3 right-10 h-[400px] w-[400px] bg-accent/5 opacity-50"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          User & Customer Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage institutional staff accounts and track registered hardware procurement customers.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] rounded-xl border border-border bg-card/65 p-1">
          <TabsTrigger
            value="staff"
            className="rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <UserCheck className="h-3.5 w-3.5" /> Staff Accounts ({filteredStaff.length})
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5" /> Customer Database ({filteredCustomers.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Staff Accounts */}
        <TabsContent value="staff" className="space-y-4 outline-none">
          <Card className="liquid-card border-border/55">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  LabTrack Staff Profiles
                </CardTitle>
                <CardDescription className="text-xs">
                  Active laboratory technicians, supervisors, and administrative personnel.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Search staff by name, email..."
                    className="pl-9 glass-input border-border/80 rounded-xl text-xs h-9"
                  />
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    onClick={() => setAddStaffOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold h-9"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Staff
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading staff
                  accounts...
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No staff accounts found matching your query.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 bg-secondary/15">
                      <TableHead>Account Holder</TableHead>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Security Role</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((s) => (
                      <TableRow
                        key={s.id}
                        className="border-b border-border/25 last:border-0 hover:bg-secondary/15 transition-colors"
                      >
                        <TableCell className="font-semibold text-foreground">
                          <div>
                            <span>{s.name}</span>
                            {(s as { needs_password_change?: boolean }).needs_password_change && (
                              <Badge className="ml-2 text-[8px] bg-warning/20 border-warning/30 text-warning px-1.5 py-0">
                                Reset Pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-zinc-300 text-xs">{s.email}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {s.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={s.role === "admin" ? "default" : "secondary"}
                            className="capitalize text-[10px] font-bold"
                          >
                            {s.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={s.status === "active" ? "outline" : "destructive"}
                            className="capitalize text-[10px] font-bold"
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {s.id !== currentUserId && (
                              <div className="flex justify-end items-center gap-1.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setSelectedStaff(s)}
                                  className="h-7 w-7 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg"
                                  title="View details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenEditStaff(s)}
                                  className="text-[10px] px-2.5 h-7 rounded-lg font-semibold"
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleStatus(s)}
                                  className={`text-[10px] px-2.5 h-7 rounded-lg font-semibold ${
                                    s.status === "active"
                                      ? "text-warning hover:text-warning border-warning/30 hover:bg-warning/10"
                                      : "text-success hover:text-success border-success/30 hover:bg-success/10"
                                  }`}
                                >
                                  {s.status === "active" ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRemoveUser(s)}
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                  title="Remove User"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Customers Database */}
        <TabsContent value="customers" className="space-y-4 outline-none">
          <Card className="liquid-card border-border/55">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Academic Customers
                </CardTitle>
                <CardDescription className="text-xs">
                  Directory of laboratory personnel and guests placing orders through the catalog.
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, email, city..."
                  className="pl-9 glass-input border-border/80 rounded-xl text-xs h-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" /> Loading customer
                  directory...
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No customers found. Clear and seed orders on the Admin Dashboard to populate mock
                  client records.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/40 bg-secondary/15">
                      <TableHead>Customer</TableHead>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>City / Location</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Invested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((c) => (
                      <TableRow
                        key={c.email}
                        className="border-b border-border/25 last:border-0 hover:bg-secondary/15 transition-colors"
                      >
                        <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                        <TableCell className="font-mono text-zinc-300 text-xs">{c.email}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {c.phone || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {c.city || "—"}
                        </TableCell>
                        <TableCell>
                          {c.profileId ? (
                            <Badge
                              variant={c.status === "active" ? "outline" : "destructive"}
                              className="capitalize text-[10px] font-bold"
                            >
                              {c.status === "active" ? "Active" : "Blocked"}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              Guest
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">
                          {c.totalOrders}
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-success text-xs">
                          ${c.totalSpend.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            {isAdmin && c.profileId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleCustomerBlock(c)}
                                className={`text-[10px] px-2.5 h-7 rounded-lg font-semibold ${
                                  c.status === "active"
                                    ? "text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                                    : "text-success hover:text-success border-success/30 hover:bg-success/10"
                                }`}
                              >
                                {c.status === "active" ? "Block" : "Unblock"}
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedCustomer(c)}
                              className="h-7 w-7 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer details modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={(v) => !v && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-border bg-card">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Customer Profile: {selectedCustomer.name}</span>
                </DialogTitle>
              </DialogHeader>

              {/* Grid detail sections */}
              <div className="grid gap-4 sm:grid-cols-2 text-xs border-b border-border/20 pb-4 pt-1">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Contact Email
                  </p>
                  <p className="font-bold text-foreground text-sm font-mono">
                    {selectedCustomer.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone Number
                  </p>
                  <p className="text-foreground text-sm font-semibold">{selectedCustomer.phone}</p>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Shipping Address
                  </p>
                  <p className="text-foreground text-sm bg-secondary/15 rounded-md p-2.5">
                    {selectedCustomer.address}, {selectedCustomer.city}{" "}
                    {selectedCustomer.postal_code}
                  </p>
                </div>
              </div>

              {/* Summary Stats cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-border/80 bg-secondary/10 p-3">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" /> Purchase Count
                  </p>
                  <p className="text-lg font-black text-foreground mt-1">
                    {selectedCustomer.totalOrders} Order{selectedCustomer.totalOrders !== 1 && "s"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/80 bg-secondary/10 p-3">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-success" /> Total Spend
                  </p>
                  <p className="text-lg font-black text-success mt-1">
                    ${selectedCustomer.totalSpend.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order list */}
              <div className="rounded-xl border border-border overflow-hidden mt-2">
                <div className="border-b border-border bg-secondary/20 px-4 py-2.5 text-[10px] font-bold uppercase text-muted-foreground">
                  Order History
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/25 bg-secondary/10 text-[9px] text-muted-foreground uppercase font-bold text-left">
                        <th className="px-4 py-2">Order Number</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2 text-right">Total</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCustomer.orders.map((ord: any) => (
                        <tr
                          key={ord.id}
                          className="border-b border-border/20 last:border-0 hover:bg-secondary/10 transition-colors"
                        >
                          <td className="px-4 py-2 font-mono text-[10px]">{ord.order_number}</td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(ord.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold">
                            ${Number(ord.total).toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Badge
                              variant="secondary"
                              className="text-[8.5px] font-bold capitalize"
                            >
                              {ord.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Staff details modal */}
      <Dialog open={!!selectedStaff} onOpenChange={(v) => !v && setSelectedStaff(null)}>
        <DialogContent className="max-w-lg rounded-2xl border-border bg-card">
          {selectedStaff && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span>Staff Profile: {selectedStaff.name}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2 text-xs border-b border-border/20 pb-4 pt-1">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </p>
                  <p className="font-bold text-foreground text-sm font-mono">
                    {selectedStaff.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </p>
                  <p className="text-foreground text-sm font-semibold">
                    {selectedStaff.phone ?? "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Role</p>
                  <Badge
                    variant={selectedStaff.role === "admin" ? "default" : "secondary"}
                    className="capitalize text-[10px]"
                  >
                    {selectedStaff.role}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant={selectedStaff.status === "active" ? "outline" : "destructive"}
                    className="capitalize text-[10px]"
                  >
                    {selectedStaff.status}
                  </Badge>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Member Since
                  </p>
                  <p className="text-foreground text-sm">
                    {new Date(selectedStaff.created_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedStaff.needs_password_change && (
                  <div className="sm:col-span-2">
                    <Badge className="text-[9px] bg-warning/20 border-warning/30 text-warning">
                      Password reset pending
                    </Badge>
                  </div>
                )}
              </div>
              {isAdmin && selectedStaff.id !== currentUserId && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditStaff(selectedStaff)}
                    className="text-xs h-8 rounded-lg"
                  >
                    Edit Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleForcePasswordReset(selectedStaff.id)}
                    className="text-xs h-8 rounded-lg"
                  >
                    Force Password Reset
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editStaffOpen} onOpenChange={setEditStaffOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Edit Staff Profile</DialogTitle>
            <DialogDescription className="text-xs">
              Update name and phone number for this staff member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveStaff} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Full Name
              </Label>
              <Input
                value={editStaffName}
                onChange={(e) => setEditStaffName(e.target.value)}
                className="glass-input text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Phone Number
              </Label>
              <Input
                value={editStaffPhone}
                onChange={(e) => setEditStaffPhone(e.target.value)}
                className="glass-input text-xs"
                placeholder="Optional"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStaffOpen(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingStaff}
                className="rounded-xl h-9 text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
              >
                {savingStaff && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
        <DialogContent className="max-w-md rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span>Add Staff Account</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register a new staff member. The user will be required to change their password on
              first login.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Full Name
              </Label>
              <Input
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Jane Doe"
                className="glass-input text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Email Address
              </Label>
              <Input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="jane.doe@lab.edu"
                className="glass-input text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Default Password
              </Label>
              <Input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input text-xs"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddStaffOpen(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingStaff}
                className="rounded-xl h-9 text-xs bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
              >
                {submittingStaff && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Create Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
