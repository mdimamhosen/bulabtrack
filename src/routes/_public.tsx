import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { CartProvider } from "@/lib/cart";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <PublicNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <PublicFooter />
      </div>
    </CartProvider>
  );
}
