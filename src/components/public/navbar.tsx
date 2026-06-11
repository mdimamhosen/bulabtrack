import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Menu, X, ShoppingCart } from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "./cart-drawer";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">LabTrack</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                  {active && <span className="mx-auto mt-0.5 block h-0.5 w-6 rounded-full bg-primary" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-secondary"
              aria-label="Cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Login</Link>
            </Button>
            <button onClick={() => setOpen((o) => !o)} className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                  {l.label}
                </Link>
              ))}
              <Link to="/auth" className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                Login
              </Link>
            </nav>
          </div>
        )}
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
