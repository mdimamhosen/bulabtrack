import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Send,
  User,
  ShoppingBag,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { placeChatbotOrder } from "@/lib/api/database.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/_public/order-bot")({
  head: () => ({
    meta: [
      { title: "Quick Order Chat — LabTrack" },
      { name: "description", content: "Place a quick cash-on-delivery order via our AI chatbot. No account required." },
    ],
  }),
  component: OrderBotPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  role: "bot" | "user";
  text: string;
  type?: "text" | "product-picker" | "cart-summary" | "confirm" | "success";
};

type OrderInfo = {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
};

type CartProduct = {
  device_id: string;
  device_name: string;
  unit_price: number;
  quantity: number;
  image_url?: string | null;
};

// ─── Conversation steps ───────────────────────────────────────────────────────

type Step =
  | "greeting"
  | "collect_name"
  | "collect_email"
  | "collect_phone"
  | "collect_address"
  | "collect_city"
  | "pick_products"
  | "confirm"
  | "done";

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function isValidPhone(v: string) {
  return v.trim().length >= 6 && v.trim().length <= 20;
}

// ─── Page Component ───────────────────────────────────────────────────────────

function OrderBotPage() {
  const navigate = useNavigate();
  const { items: cartItems, clear: clearCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bot state
  const [step, setStep] = useState<Step>("greeting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [orderInfo, setOrderInfo] = useState<Partial<OrderInfo>>({});
  const [pickedProducts, setPickedProducts] = useState<CartProduct[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initRan = useRef(false);

  // Fetch product catalog
  const { data: devices } = useQuery({
    queryKey: ["public-devices-chatbot"],
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("*").eq("status", "Available");
      return data || [];
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Pre-load cart items if any exist
  useEffect(() => {
    if (cartItems.length > 0 && pickedProducts.length === 0) {
      setPickedProducts(
        cartItems.map((i) => ({
          device_id: i.id,
          device_name: i.name,
          unit_price: i.price,
          quantity: i.quantity,
          image_url: i.image_url,
        }))
      );
    }
  }, [cartItems]);

  // Initialize conversation
  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;

    const greeting = cartItems.length > 0
      ? `👋 Hey there! I'm **LabBot**, your quick-order assistant.\n\nI can see you already have **${cartItems.length} item${cartItems.length > 1 ? "s" : ""}** in your cart. I'll use those for your order.\n\nLet's get started! What's your **full name**?`
      : `👋 Hey there! I'm **LabBot**, your quick-order assistant.\n\nI'll help you place a **Cash on Delivery** order in just a few steps — no account needed!\n\nFirst, what's your **full name**?`;

    botSay(greeting, "text", "collect_name");
  }, []);

  // ─── Bot helpers ──────────────────────────────────────────────────────────

  const botSay = (text: string, type: ChatMessage["type"] = "text", nextStep?: Step) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { role: "bot", text, type }]);
      if (nextStep) setStep(nextStep);
    }, 600);
  };

  const userSay = (text: string) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
  };

  // ─── Submit user input ────────────────────────────────────────────────────

  const handleSend = () => {
    const val = input.trim();
    if (!val || isTyping || loading) return;
    setInput("");
    processInput(val);
  };

  const processInput = (val: string) => {
    userSay(val);

    switch (step) {
      case "collect_name": {
        if (val.length < 2) {
          botSay("Please enter your full name (at least 2 characters).", "text");
          return;
        }
        setOrderInfo((p) => ({ ...p, customer_name: val }));
        botSay(`Nice to meet you, **${val}**! 📧 What's your **email address**?`, "text", "collect_email");
        break;
      }

      case "collect_email": {
        if (!isValidEmail(val)) {
          botSay("That doesn't look like a valid email. Please try again (e.g. `john@example.com`)", "text");
          return;
        }
        setOrderInfo((p) => ({ ...p, email: val }));
        botSay(`Got it! 📞 What's your **phone number**?`, "text", "collect_phone");
        break;
      }

      case "collect_phone": {
        if (!isValidPhone(val)) {
          botSay("Please enter a valid phone number (6-20 digits).", "text");
          return;
        }
        setOrderInfo((p) => ({ ...p, phone: val }));
        botSay(`Perfect! 🏠 What's your **full delivery address**? (street, house/flat number)`, "text", "collect_address");
        break;
      }

      case "collect_address": {
        if (val.length < 5) {
          botSay("Please enter a more complete delivery address.", "text");
          return;
        }
        setOrderInfo((p) => ({ ...p, address: val }));
        botSay(`Almost there! 🏙️ Which **city** should we deliver to?`, "text", "collect_city");
        break;
      }

      case "collect_city": {
        if (val.length < 2) {
          botSay("Please enter a valid city name.", "text");
          return;
        }
        setOrderInfo((p) => ({ ...p, city: val }));

        if (pickedProducts.length > 0) {
          botSay(
            `Great! Here's a summary of your cart. You can adjust quantities or remove items before confirming.`,
            "cart-summary",
            "confirm"
          );
        } else {
          botSay(
            `Awesome! Now let's pick the products you'd like to order. Browse the catalog below and tap **+** to add items.`,
            "product-picker",
            "pick_products"
          );
        }
        break;
      }

      case "pick_products": {
        // Input during product picking: 'done' or 'confirm'
        if (val.toLowerCase().includes("done") || val.toLowerCase().includes("confirm")) {
          if (pickedProducts.length === 0) {
            botSay("Please add at least one product before confirming! 🛒", "text");
            return;
          }
          botSay("Here's your full order summary. Ready to place it?", "cart-summary", "confirm");
        } else {
          botSay("Add products from the catalog above, then type **done** when ready!", "text");
        }
        break;
      }

      case "confirm": {
        const lower = val.toLowerCase();
        if (lower === "yes" || lower === "confirm" || lower === "place order" || lower === "ok" || lower === "y") {
          placeOrder();
        } else if (lower === "no" || lower === "cancel") {
          botSay("No problem! You can adjust your order or start over. Type **confirm** when you're ready.", "text");
        } else {
          botSay("Type **confirm** to place the order, or **no** to go back.", "text");
        }
        break;
      }

      default:
        break;
    }
  };

  // ─── Product picker helpers ───────────────────────────────────────────────

  const addProduct = (device: any) => {
    setPickedProducts((prev) => {
      const existing = prev.find((p) => p.device_id === device.id);
      if (existing) {
        return prev.map((p) => p.device_id === device.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, {
        device_id: device.id,
        device_name: device.name,
        unit_price: device.price,
        quantity: 1,
        image_url: device.image_url,
      }];
    });
    toast.success(`${device.name} added!`);
  };

  const changeQty = (device_id: string, delta: number) => {
    setPickedProducts((prev) =>
      prev
        .map((p) => p.device_id === device_id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p)
        .filter((p) => p.quantity > 0)
    );
  };

  const removeProduct = (device_id: string) => {
    setPickedProducts((prev) => prev.filter((p) => p.device_id !== device_id));
  };

  const subtotal = pickedProducts.reduce((s, p) => s + p.unit_price * p.quantity, 0);

  // ─── Place order ──────────────────────────────────────────────────────────

  const placeOrder = async () => {
    if (pickedProducts.length === 0) {
      botSay("Please add at least one product to your order first! 🛒", "text");
      return;
    }

    setLoading(true);
    botSay("⏳ Placing your order, please wait...", "text");

    try {
      const result = await placeChatbotOrder({
        data: {
          customer_name: orderInfo.customer_name!,
          email: orderInfo.email!,
          phone: orderInfo.phone!,
          address: orderInfo.address!,
          city: orderInfo.city!,
          total: subtotal,
          items: pickedProducts.map((p) => ({
            device_id: p.device_id,
            device_name: p.device_name,
            unit_price: p.unit_price,
            quantity: p.quantity,
          })),
        },
      });

      if (result.success && result.orderNumber) {
        setOrderNumber(result.orderNumber);
        setOrderPlaced(true);
        clearCart();
        setStep("done");
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: `🎉 **Order placed successfully!**\n\nYour order number is **${result.orderNumber}**.\n\nYou'll receive your items via **Cash on Delivery**. Our team will contact you at ${orderInfo.phone} to confirm.\n\nThank you, ${orderInfo.customer_name}! 💙`,
            type: "success",
          },
        ]);
      } else {
        botSay(`❌ Failed to place order: ${result.error || "Unknown error"}. Please try again.`, "text");
      }
    } catch (err: any) {
      botSay(`❌ Something went wrong: ${err.message || "Please try again."}`, "text");
    } finally {
      setLoading(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderBotText = (text: string) => {
    // Simple inline markdown: **bold** and `code`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={idx} className="px-1 py-0.5 rounded bg-muted text-xs font-mono border border-border/40">{part.slice(1, -1)}</code>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/products"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Products
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-accent to-accent/70 bg-clip-text text-transparent flex items-center gap-2">
              LabBot Quick Order <Sparkles className="h-4 w-4 text-accent" />
            </h1>
            <p className="text-xs text-muted-foreground">
              Place a Cash on Delivery order in minutes — no account needed
            </p>
          </div>
          <Badge className="ml-auto bg-primary/10 border-primary/30 text-primary text-xs font-semibold">
            COD Only
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chat Panel */}
        <div className="flex flex-col lg:col-span-3">
          <Card className="flex flex-col border-border/40 bg-card/40 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden" style={{ height: "560px" }}>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                        isUser
                          ? "bg-primary text-primary-foreground border-primary/20"
                          : "bg-secondary border-border/60 text-primary"
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div
                        className={`px-4 py-3 rounded-2xl border text-sm leading-relaxed ${
                          isUser
                            ? "bg-primary/10 border-primary/20 text-foreground rounded-tr-none"
                            : "bg-card border-border/30 rounded-tl-none text-foreground shadow-sm"
                        }`}
                      >
                        {msg.type === "success" ? (
                          <div className="space-y-2">
                            {msg.text.split("\n").map((line, i) => (
                              <p key={i}>{renderBotText(line)}</p>
                            ))}
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="rounded-xl bg-gradient-to-r from-primary to-accent text-xs font-semibold"
                                onClick={() => navigate({ to: "/order-success/$orderNumber", params: { orderNumber: orderNumber! } })}
                              >
                                <Package className="h-3 w-3 mr-1" /> View Order
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl text-xs"
                                onClick={() => navigate({ to: "/products" })}
                              >
                                Keep Shopping
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {msg.text.split("\n").map((line, i) => (
                              <p key={i} className={line === "" ? "h-1.5" : ""}>{renderBotText(line)}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bot typing indicator */}
              {isTyping && (
                <div className="flex gap-3 animate-in fade-in duration-200">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-border/60 flex items-center justify-center text-primary animate-bounce">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl border bg-card border-border/30 rounded-tl-none flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Cart summary embed in chat */}
              {messages.length > 0 &&
                messages[messages.length - 1]?.type === "cart-summary" &&
                step === "confirm" &&
                pickedProducts.length > 0 && (
                  <div className="ml-11 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CartSummaryCard
                      products={pickedProducts}
                      subtotal={subtotal}
                      onQtyChange={changeQty}
                      onRemove={removeProduct}
                    />
                    <div className="mt-3 flex gap-2">
                      <Button
                        onClick={placeOrder}
                        disabled={loading || pickedProducts.length === 0}
                        className="rounded-xl bg-gradient-to-r from-primary to-accent font-semibold text-sm px-6"
                      >
                        {loading ? "Placing…" : "✅ Confirm & Place Order"}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => {
                          setStep("pick_products");
                          botSay("Sure! Adjust your cart below, then type **done** when ready.", "product-picker");
                        }}
                      >
                        Edit Cart
                      </Button>
                    </div>
                  </div>
                )}
            </div>

            {/* Input bar */}
            {step !== "done" && (
              <div className="p-4 border-t border-border/10 flex gap-2">
                <Input
                  placeholder={getPlaceholder(step)}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isTyping || loading || step === "done" || step === "pick_products" || step === "confirm"}
                  className="flex-1 h-11 px-4 text-sm rounded-2xl glass-input"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping || loading || step === "done" || step === "pick_products" || step === "confirm"}
                  className="bg-gradient-to-r from-primary to-accent h-11 w-11 rounded-2xl p-0 shrink-0"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Quick action buttons for confirm step */}
            {step === "confirm" && !orderPlaced && (
              <div className="p-4 border-t border-border/10">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase font-bold tracking-wider">Quick Actions</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={placeOrder}
                    disabled={loading || pickedProducts.length === 0}
                    className="rounded-xl bg-gradient-to-r from-primary to-accent font-semibold text-xs"
                  >
                    {loading ? "Placing…" : "✅ Confirm Order"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => {
                      setStep("pick_products");
                      botSay("Sure! Adjust your cart in the panel, then type **done** when ready.", "product-picker");
                    }}
                  >
                    Edit Cart
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress indicator */}
          <StepProgress step={step} />

          {/* Product catalog (shown during pick_products step) */}
          {(step === "pick_products" || step === "confirm") && devices && devices.length > 0 && (
            <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" /> Product Catalog
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {devices.map((device: any) => {
                    const inCart = pickedProducts.find((p) => p.device_id === device.id);
                    return (
                      <div
                        key={device.id}
                        className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/60 p-2 hover:bg-secondary/40 transition-colors"
                      >
                        {device.image_url && (
                          <img
                            src={device.image_url}
                            alt={device.name}
                            className="h-10 w-10 rounded-lg object-cover shrink-0 bg-secondary"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{device.name}</p>
                          <p className="text-[10px] text-muted-foreground">${device.price.toFixed(2)}</p>
                        </div>
                        {inCart ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => changeQty(device.id, -1)}
                              className="h-6 w-6 rounded-md border border-border/60 flex items-center justify-center hover:bg-secondary text-xs"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{inCart.quantity}</span>
                            <button
                              onClick={() => changeQty(device.id, 1)}
                              className="h-6 w-6 rounded-md border border-border/60 flex items-center justify-center hover:bg-secondary text-xs"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addProduct(device)}
                            className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {step === "pick_products" && pickedProducts.length > 0 && (
                  <Button
                    className="mt-3 w-full rounded-xl text-xs bg-gradient-to-r from-primary to-accent font-semibold"
                    onClick={() => {
                      botSay("Great choices! Here's your cart summary.", "cart-summary", "confirm");
                    }}
                  >
                    Done — Review Order ({pickedProducts.length} item{pickedProducts.length > 1 ? "s" : ""})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live cart preview (always visible once products selected) */}
          {pickedProducts.length > 0 && step !== "pick_products" && (
            <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-lg">
              <CardContent className="p-4">
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" /> Your Cart
                </h3>
                <CartSummaryCard
                  products={pickedProducts}
                  subtotal={subtotal}
                  onQtyChange={changeQty}
                  onRemove={removeProduct}
                  compact
                />
              </CardContent>
            </Card>
          )}

          {/* Info box */}
          <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No Account Required
            </p>
            <p>Orders are placed as <strong>Cash on Delivery</strong>. You pay when your items arrive.</p>
            <p>Need to track your order? Use your email on the <Link to="/contact" className="text-primary hover:underline">contact page</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Summary Card ────────────────────────────────────────────────────────

function CartSummaryCard({
  products,
  subtotal,
  onQtyChange,
  onRemove,
  compact = false,
}: {
  products: CartProduct[];
  subtotal: number;
  onQtyChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-2">
      {products.map((p) => (
        <div key={p.device_id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/60 p-2">
          {p.image_url && !compact && (
            <img src={p.image_url} alt={p.device_name} className="h-10 w-10 rounded-lg object-cover shrink-0 bg-secondary" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{p.device_name}</p>
            <p className="text-[10px] text-muted-foreground">${p.unit_price.toFixed(2)} × {p.quantity}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onQtyChange(p.device_id, -1)} className="h-6 w-6 rounded-md border border-border/60 flex items-center justify-center hover:bg-secondary">
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center text-xs font-bold">{p.quantity}</span>
            <button onClick={() => onQtyChange(p.device_id, 1)} className="h-6 w-6 rounded-md border border-border/60 flex items-center justify-center hover:bg-secondary">
              <Plus className="h-3 w-3" />
            </button>
            <button onClick={() => onRemove(p.device_id)} className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center ml-1">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
      <div className="flex justify-between border-t border-border/30 pt-2 text-sm font-semibold px-1">
        <span>Total</span>
        <span className="text-primary">${subtotal.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Step Progress ────────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: "collect_name", label: "Your Name" },
  { key: "collect_email", label: "Email" },
  { key: "collect_phone", label: "Phone" },
  { key: "collect_address", label: "Address" },
  { key: "collect_city", label: "City" },
  { key: "pick_products", label: "Products" },
  { key: "confirm", label: "Confirm" },
  { key: "done", label: "Done!" },
];

function StepProgress({ step }: { step: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === step);
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-2xl shadow-lg">
      <CardContent className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Order Progress</p>
        <div className="space-y-2">
          {STEPS.map((s, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={s.key} className="flex items-center gap-2.5">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border transition-colors ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                      ? "bg-accent/20 border-accent text-accent animate-pulse"
                      : "bg-muted/30 border-border/40 text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : idx + 1}
                </div>
                <span
                  className={`text-xs transition-colors ${
                    done ? "text-foreground font-medium" : active ? "text-accent font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Input placeholder by step ────────────────────────────────────────────────

function getPlaceholder(step: Step): string {
  switch (step) {
    case "collect_name": return "Your full name…";
    case "collect_email": return "your@email.com";
    case "collect_phone": return "Phone number…";
    case "collect_address": return "Street address…";
    case "collect_city": return "City name…";
    case "pick_products": return "Type 'done' when cart is ready…";
    case "confirm": return "Type 'confirm' to place order…";
    default: return "Type your message…";
  }
}
