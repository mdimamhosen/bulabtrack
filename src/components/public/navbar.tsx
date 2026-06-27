import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, Menu, X, ShoppingCart } from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "./cart-drawer";
import { useRole } from "@/lib/role-context";
import { dashboardPath } from "@/lib/roles";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/products", label: "Products" },
  { to: "/order-bot", label: "Quick Order" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
] as const;

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count } = useCart();
  const { userId, role, loading } = useRole();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${
          scrolled
            ? "border-border/40 bg-background/60 backdrop-blur-2xl py-2 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.5)]"
            : "border-border/0 bg-transparent py-4"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
              <Boxes className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300">
              LabTrack
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setCartOpen(true)}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card/50 text-foreground hover:bg-secondary/80 hover:border-primary/40 transition-colors backdrop-blur-md"
              aria-label="Cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-primary to-accent px-1 text-[10px] font-semibold text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.4)]">
                  {count}
                </span>
              )}
            </button>
            {!loading && userId ? (
              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                <Link to={dashboardPath(role)}>Dashboard</Link>
              </Button>
            ) : !loading ? (
              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                <Link to="/auth">Login</Link>
              </Button>
            ) : null}
            <button
              onClick={() => setOpen((o) => !o)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-card/50 backdrop-blur-md"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border/60 bg-background/95 backdrop-blur-2xl md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {LINKS.map((l) => {
                const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              {!loading && userId ? (
                <Link
                  to={dashboardPath(role)}
                  className="mt-2 rounded-md bg-gradient-to-r from-primary to-accent px-3 py-2 text-center text-sm font-medium text-primary-foreground shadow-lg"
                >
                  Dashboard
                </Link>
              ) : !loading ? (
                <Link
                  to="/auth"
                  className="mt-2 rounded-md bg-gradient-to-r from-primary to-accent px-3 py-2 text-center text-sm font-medium text-primary-foreground shadow-lg"
                >
                  Login
                </Link>
              ) : null}
            </nav>
          </div>
        )}
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
