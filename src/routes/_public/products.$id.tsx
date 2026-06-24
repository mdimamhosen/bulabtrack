import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RefreshCw,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Star,
  Share2,
  Heart,
  CheckCircle2,
  Zap,
  Award,
  ShieldAlert,
  Sliders,
  Volume2,
  HardDrive,
  Cpu,
  Layers,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { enhanceProductWithNanoBanana } from "./products";
import { useRole } from "@/lib/role-context";
import {
  fetchProductReviewsAndLikes,
  addProductReview,
  toggleLikeDislike,
} from "@/lib/api/database.functions";

export const Route = createFileRoute("/_public/products/$id")({
  component: ProductDetailPage,
});

const SUPPORT_PHONE = "+1 (800) 555-0142";
const SUPPORT_PHONE_HREF = "tel:+18005550142";

// Enhance DB product with Nano Banana specifications and real image gallery
function enhanceProductDetails(p: any) {
  const enhanced = enhanceProductWithNanoBanana(p);
  if (!enhanced) return null;
  return {
    ...enhanced,
    specsList: enhanced.specsRaw,
  };
}

// Sound synthesis helper for Keyboard switch test
const playSwitchSound = (switchColor: "red" | "brown" | "blue") => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (switchColor === "blue") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.06);
      gainNode.gain.setValueAtTime(0.14, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.06);
    } else if (switchColor === "brown") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else {
      // red
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.14);
      gainNode.gain.setValueAtTime(0.24, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.14);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.14);
    }
  } catch (e) {}
};

function ProductDetailPage() {
  const { id } = useParams({ from: "/_public/products/$id" });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const { add } = useCart();

  const { userId } = useRole();
  const queryClient = useQueryClient();

  // Switch tester states (Keyboard)
  const [switchType, setSwitchType] = useState<"red" | "brown" | "blue">("red");
  const [keypressCount, setKeypressCount] = useState(0);

  // Mouse polling tester states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pollingRate, setPollingRate] = useState(1000);
  const [avgLatency, setAvgLatency] = useState(0.85);

  // Refresh rate simulator states
  const [displayHz, setDisplayHz] = useState<60 | 144>(60);
  const [animProgress, setAnimProgress] = useState(0);

  // Audio Equalizer simulator state
  const [eqActive, setEqActive] = useState(false);

  // Form states for reviews
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch product details
  const { data: dbProduct, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("devices").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  // Fetch dynamic reviews and likes/dislikes
  const { data: feedbackData } = useQuery({
    queryKey: ["product-feedback", id, userId],
    queryFn: async () => {
      const res = await fetchProductReviewsAndLikes({
        data: {
          device_id: id,
          user_id: userId,
        },
      });
      return res;
    },
  });

  const product = useMemo(() => {
    if (!dbProduct) return null;
    const base = enhanceProductDetails(dbProduct);
    if (!base) return null;

    // Override with dynamic feedback if it exists and has database entries
    if (feedbackData && feedbackData.totalReviews > 0) {
      return {
        ...base,
        rating: feedbackData.averageRating.toFixed(1),
        reviews: feedbackData.totalReviews,
      };
    }
    return base;
  }, [dbProduct, feedbackData]);

  // Mutations
  const toggleLikeMutation = useMutation({
    mutationFn: async (type: "like" | "dislike") => {
      if (!userId) {
        toast.error("Please log in to like or dislike products");
        return;
      }
      return toggleLikeDislike({
        data: {
          device_id: id,
          type,
        },
      });
    },
    onSuccess: (res) => {
      if (res?.success) {
        toast.success(
          res.userStatus === "like"
            ? "Product liked!"
            : res.userStatus === "dislike"
            ? "Product disliked!"
            : "Feedback removed"
        );
        queryClient.invalidateQueries({ queryKey: ["product-feedback", id] });
      } else {
        toast.error(res?.error || "Failed to submit feedback");
      }
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        toast.error("Please log in to review products");
        return;
      }
      if (!newComment.trim()) {
        toast.error("Please write a comment");
        return;
      }
      setIsSubmittingReview(true);
      return addProductReview({
        data: {
          device_id: id,
          rating: newRating,
          comment: newComment.trim(),
        },
      });
    },
    onSuccess: (res) => {
      setIsSubmittingReview(false);
      if (res?.success) {
        toast.success("Review submitted successfully!");
        setNewComment("");
        setNewRating(5);
        queryClient.invalidateQueries({ queryKey: ["product-feedback", id] });
      } else {
        toast.error(res?.error || "Failed to submit review");
      }
    },
    onError: (err: any) => {
      setIsSubmittingReview(false);
      toast.error(err.message || "Failed to submit review");
    },
  });

  // Fetch related products
  const { data: dbRelated = [] } = useQuery({
    queryKey: ["related", product?.category, id],
    enabled: !!product,
    queryFn: async () => {
      const { data } = await supabase
        .from("devices")
        .select("id,name,brand,price,image_url,category")
        .eq("category", product!.category)
        .neq("id", id)
        .limit(4);
      return data ?? [];
    },
  });

  const related = useMemo(() => {
    return dbRelated.map(enhanceProductDetails);
  }, [dbRelated]);

  // Monitor refresh rate animation loop
  useEffect(() => {
    let animId: number;
    const updateAnim = () => {
      setAnimProgress((p) => (p + (displayHz === 144 ? 3 : 1.25)) % 100);
      animId = requestAnimationFrame(updateAnim);
    };
    animId = requestAnimationFrame(updateAnim);
    return () => cancelAnimationFrame(animId);
  }, [displayHz]);

  // Mouse Canvas Trail Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let points: { x: number; y: number; time: number }[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      points.push({ x, y, time: Date.now() });

      // Generate randomized polling speed readouts
      const rates = [1000, 2000, 4000, 8000];
      const selectedRate = rates[Math.floor(Math.random() * rates.length)];
      setPollingRate(selectedRate);
      setAvgLatency(Number((1000 / selectedRate).toFixed(3)));
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    let drawInterval = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      // Draw connection lines between mouse points
      const now = Date.now();
      points = points.filter((p) => now - p.time < 800); // 800ms trail fade

      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = "oklch(0.58 0.24 274)"; // Primary color
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Draw glowing head dot
        const head = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "oklch(0.78 0.16 210)"; // Accent color
        ctx.shadowColor = "rgba(var(--primary), 0.8)";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }
    }, 16);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      clearInterval(drawInterval);
    };
  }, [product]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="liquid-card h-96 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button asChild className="mt-4">
          <Link to="/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  const isKeyboard =
    product.name?.toLowerCase().includes("keyboard") ||
    product.category?.toLowerCase().includes("keyboard");
  const isMouse =
    product.name?.toLowerCase().includes("mouse") ||
    product.category?.toLowerCase().includes("mouse");
  const isAudio =
    product.name?.toLowerCase().includes("headset") ||
    product.name?.toLowerCase().includes("speaker") ||
    product.category?.toLowerCase().includes("audio");
  const isDisplay =
    product.name?.toLowerCase().includes("monitor") ||
    product.category?.toLowerCase().includes("display");

  return (
    <div className="relative min-h-screen">
      {/* Background blurs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="aurora-bg absolute inset-0 opacity-20" />
        <div className="liquid-orb animate-blob absolute -top-40 left-1/4 h-[500px] w-[500px] bg-primary/10 opacity-70" />
        <div
          className="liquid-orb animate-blob absolute right-10 top-40 h-[480px] w-[480px] bg-accent/10 opacity-60"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-foreground transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <Link
          to="/products"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Product Catalog
        </Link>

        {/* Main Details Panel */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-start">
          {/* === PHOTO GALLERY === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Big Main Display Card */}
            <div className="liquid-card relative aspect-square overflow-hidden rounded-[2rem] p-3 border-primary/20 shadow-2xl">
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-card to-background">
                {product.images?.[activeImg] && (
                  <motion.img
                    key={activeImg}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    src={product.images[activeImg]}
                    alt={product.name}
                    className="h-full w-full object-cover filter brightness-[0.85] contrast-[1.05]"
                  />
                )}

                {/* Floating tags */}
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <Badge className="liquid-card border-none bg-zinc-950/80 text-zinc-200 backdrop-blur-md font-bold text-[9px] py-1 px-3">
                    <Award className="mr-1.5 h-3.5 w-3.5 text-primary animate-pulse" /> NANO BANANA
                    EDITION
                  </Badge>
                  {product.status === "Available" ? (
                    <Badge className="bg-success/20 text-success border-success/30 font-bold text-[9px] py-1 px-3 backdrop-blur-md">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> READY FOR DISPATCH
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 font-bold text-[9px] py-1 px-3 backdrop-blur-md">
                      <ShieldAlert className="mr-1 h-3.5 w-3.5" /> REPAIR IN PROGRESS
                    </Badge>
                  )}
                </div>

                <div className="absolute right-4 top-4 flex gap-2">
                  <button className="liquid-card h-10 w-10 rounded-full flex items-center justify-center bg-zinc-950/60 text-zinc-300 hover:bg-rose-500/20 hover:text-rose-500 border-border/40 backdrop-blur transition-all cursor-pointer">
                    <Heart className="h-4 w-4" />
                  </button>
                  <button className="liquid-card h-10 w-10 rounded-full flex items-center justify-center bg-zinc-950/60 text-zinc-300 hover:bg-primary/20 border-border/40 backdrop-blur transition-all cursor-pointer">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Selection */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((src: string, i: number) => (
                  <button
                    key={src + i}
                    onClick={() => setActiveImg(i)}
                    className={`liquid-card aspect-square overflow-hidden rounded-2xl p-1 transition-all cursor-pointer ${
                      activeImg === i
                        ? "border-primary ring-2 ring-primary/20 scale-[0.98]"
                        : "border-border/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full rounded-xl object-cover filter brightness-90"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* === PRODUCT META & REQUISITION === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Headers */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
                  {product.category}
                </Badge>
                <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 border-none text-primary uppercase font-bold text-[10px]">
                  {product.brand} PERIPHERALS
                </Badge>
                {product.interface && (
                  <Badge variant="outline" className="border-border/60">
                    {product.interface}
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/75 bg-clip-text text-transparent">
                {product.name}
              </h1>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-b border-border/20 pb-4">
                <p>
                  Standard Model: {product.model} &bull; S/N: {product.serial_number}
                </p>

                {/* Rating & Likes */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-bold text-foreground">
                    <Star className="h-4 w-4 fill-current text-accent" />
                    <span>{product.rating}</span>
                    <span className="text-muted-foreground/60">
                      ({product.reviews} {product.reviews === 1 ? 'academic log' : 'academic logs'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-l border-border/20 pl-4">
                    <button
                      onClick={() => toggleLikeMutation.mutate("like")}
                      disabled={toggleLikeMutation.isPending}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all duration-300 ${
                        feedbackData?.userStatus === "like"
                          ? "bg-primary/20 border-primary text-primary shadow-glow-sm scale-105"
                          : "border-border/60 hover:bg-secondary/40 hover:text-foreground"
                      }`}
                      title="Like this product"
                    >
                      <ThumbsUp className={`h-3.5 w-3.5 ${feedbackData?.userStatus === "like" ? "fill-current animate-pulse" : ""}`} />
                      <span className="font-semibold font-mono">{feedbackData?.likesCount ?? 0}</span>
                    </button>

                    <button
                      onClick={() => toggleLikeMutation.mutate("dislike")}
                      disabled={toggleLikeMutation.isPending}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all duration-300 ${
                        feedbackData?.userStatus === "dislike"
                          ? "bg-destructive/20 border-destructive text-destructive scale-105"
                          : "border-border/60 hover:bg-secondary/40 hover:text-foreground"
                      }`}
                      title="Dislike this product"
                    >
                      <ThumbsDown className={`h-3.5 w-3.5 ${feedbackData?.userStatus === "dislike" ? "fill-current animate-pulse" : ""}`} />
                      <span className="font-semibold font-mono">{feedbackData?.dislikesCount ?? 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Box */}
            <div className="liquid-card rounded-2xl p-6 border-primary/10 bg-gradient-to-br from-card/30 to-background/50">
              <div className="flex items-baseline gap-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  REQUISITION VALUE
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-black text-transparent">
                  ${Number(product.price).toFixed(2)}
                </span>
                <span className="text-lg text-muted-foreground/50 line-through">
                  ${(Number(product.price) * 1.2).toFixed(2)}
                </span>
                <Badge className="bg-success/15 border-none text-success text-[10px] font-bold">
                  17% INST. SAVINGS
                </Badge>
              </div>
              <p className="mt-3.5 flex items-center gap-2 text-xs text-muted-foreground/80">
                <Zap className="h-4 w-4 text-primary" /> Multi-station orders qualify for additional
                bulk tax waivers.
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Device Overview
                </h4>
                <p className="leading-relaxed text-sm text-muted-foreground/90">
                  {product.description}
                </p>
              </div>
            )}

            {/* Key highlights (custom specs list) */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Telemetry Diagnostic Highlights
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {product.specsList?.slice(0, 4).map(([key, val]: any) => (
                  <div key={key} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>
                      <strong className="text-foreground">{key}</strong>: {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantity Selector & Action buttons */}
            <div className="flex items-center gap-4 border-t border-border/20 pt-6">
              <div className="flex items-center border border-border/80 bg-secondary/50 rounded-full h-12">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-12 h-full flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-muted-foreground cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm font-mono">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-12 h-full flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-muted-foreground cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                onClick={() => {
                  add(
                    {
                      id: product.id,
                      name: product.name,
                      brand: product.brand,
                      price: Number(product.price),
                      image_url: product.image_url,
                    },
                    qty,
                  );
                  toast.success(`${qty} × ${product.name} added to requisition cart`);
                }}
                disabled={product.status !== "Available"}
                size="lg"
                className="h-12 flex-1 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-glow"
              >
                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Requisition Cart
              </Button>
            </div>

            {/* Support drawer clicker */}
            <button
              onClick={() => setInquiryOpen(true)}
              className="liquid-card group flex w-full items-center justify-between rounded-2xl p-4 text-left border-border/80 transition-all hover:-translate-y-0.5 hover:border-primary/30 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Speak with a Procurement Specialist
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requisitions, VAT exemptions, and freight quotes
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* ================= CATEGORY INTERACTIVE DIAGNOSTIC SANDBOX ================= */}
        <section className="mt-16 border-t border-border/20 pt-16">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <Badge className="bg-accent/10 border-accent/20 text-accent px-3 py-0.5 mb-2">
                Live Hardware Simulator
              </Badge>
              <h3 className="text-2xl font-extrabold">Nano Banana Sandbox Calibration</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Test raw response telemetry outputs generated by this peripheral device.
              </p>
            </div>

            {/* 1. KEYBOARD SWITCH TESTING SANDBOX */}
            {isKeyboard && (
              <div className="liquid-card rounded-3xl p-6 border-primary/20 max-w-2xl mx-auto">
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" /> Tactile Switch Sandbox
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Select mechanical key cores to hear keypress sounds.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex gap-2">
                    {[
                      { id: "red", label: "Linear Red", color: "bg-rose-500" },
                      { id: "brown", label: "Tactile Brown", color: "bg-amber-600" },
                      { id: "blue", label: "Clicky Blue", color: "bg-sky-500" },
                    ].map((sw) => (
                      <button
                        key={sw.id}
                        onClick={() => {
                          setSwitchType(sw.id as any);
                          playSwitchSound(sw.id as any);
                          toast.info(`Configured switch: ${sw.label}`);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          switchType === sw.id
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card/25 text-muted-foreground hover:bg-card/45"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${sw.color}`} />
                        {sw.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setKeypressCount((c) => c + 1);
                      playSwitchSound(switchType);
                    }}
                    className="h-14 w-28 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white font-extrabold text-xs shadow-[0_5px_0_#18181b] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4 text-accent animate-pulse" /> PRESS KEY
                  </button>
                </div>

                <div className="mt-6 border-t border-border/20 pt-4 flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    Clicks registered: <strong>{keypressCount}</strong>
                  </span>
                  <span>
                    Audio synthesis: <strong>{switchType.toUpperCase()} OSC</strong>
                  </span>
                </div>
              </div>
            )}

            {/* 2. MOUSE POLLING RATE SANDBOX */}
            {isMouse && (
              <div className="liquid-card rounded-3xl p-6 border-primary/20 max-w-2xl mx-auto">
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" /> Optical Sensor Calibration
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Move your cursor within the box to track polling rates and sensor accuracy.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-secondary/30 border border-border/20 rounded-xl">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Sensor Polling Rate
                    </p>
                    <p className="text-xl font-mono font-black text-primary mt-1">
                      {pollingRate} Hz
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/30 border border-border/20 rounded-xl">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Average Latency
                    </p>
                    <p className="text-xl font-mono font-black text-accent mt-1">{avgLatency} ms</p>
                  </div>
                </div>

                <div className="mt-5 border border-border/80 bg-zinc-950 rounded-2xl overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full h-[200px] cursor-crosshair block"
                  />
                </div>
              </div>
            )}

            {/* 3. MONITOR REFRESH RATE COMPARATOR */}
            {isDisplay && (
              <div className="liquid-card rounded-3xl p-6 border-primary/20 max-w-2xl mx-auto">
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" /> Visual Refresh Rate Comparison
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Compare physical smoothness differences between 60Hz and 144Hz.
                </p>

                <div className="mt-5 flex gap-2 justify-center mb-6">
                  {([60, 144] as const).map((hz) => (
                    <button
                      key={hz}
                      onClick={() => setDisplayHz(hz)}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        displayHz === hz
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card/25 text-muted-foreground hover:bg-card/45"
                      }`}
                    >
                      {hz} Hz Output
                    </button>
                  ))}
                </div>

                <div className="relative h-20 w-full bg-zinc-950 border border-border/80 rounded-2xl overflow-hidden flex items-center p-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-grid opacity-10" />

                  {/* Moving Block */}
                  <div
                    className="absolute h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow transition-all"
                    style={{ left: `${animProgress}%` }}
                  />

                  {/* Frame Rate Indicator Overlay */}
                  <div className="absolute right-4 bottom-2 text-[10px] font-mono text-zinc-500">
                    Simulation running at {displayHz === 144 ? "144 FPS" : "60 FPS"}
                  </div>
                </div>
              </div>
            )}

            {/* 4. AUDIO FREQUENCY EQUALIZER */}
            {isAudio && (
              <div className="liquid-card rounded-3xl p-6 border-primary/20 max-w-2xl mx-auto">
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" /> Frequency Equalizer Response
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Toggle frequency response simulator to check acoustic profiles.
                </p>

                <div className="mt-6 flex justify-center mb-6">
                  <Button
                    onClick={() => {
                      setEqActive(!eqActive);
                      toast.info(
                        eqActive ? "Audio visualizer stopped" : "Frequency generator started",
                      );
                    }}
                    className={`rounded-xl px-5 h-10 font-bold transition-all ${
                      eqActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "bg-card border border-border text-muted-foreground hover:bg-card/45"
                    }`}
                  >
                    {eqActive ? "STOP TELEMETRY FEED" : "START TELEMETRY FEED"}
                  </Button>
                </div>

                <div className="h-24 bg-zinc-950 border border-border/85 rounded-2xl p-4 flex items-center justify-between gap-1.5 overflow-hidden">
                  {Array.from({ length: 28 }).map((_, idx) => {
                    const barHeight = eqActive
                      ? 20 + Math.sin(idx * 0.5 + Date.now() * 0.05) * 20 + Math.cos(idx * 0.2) * 15
                      : 8 + Math.sin(idx * 0.1) * 4;
                    return (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-150"
                        style={{ height: `${Math.max(4, barHeight)}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* === TECHNICAL SPECIFICATIONS TABLE === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="liquid-card mt-16 overflow-hidden rounded-[2rem] border border-border/60"
        >
          <div className="border-b border-border/40 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent px-6 py-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" /> Detailed Technical Specifications
            </h2>
            <p className="text-xs text-muted-foreground">
              Certified testing values for institutional audits.
            </p>
          </div>
          <div className="grid sm:grid-cols-2">
            {product.specsList?.map(([k, v]: any, i: number) => (
              <div
                key={k}
                className={`flex items-center justify-between gap-4 border-b border-border/40 px-6 py-4 ${
                  i % 2 === 0 ? "sm:border-r" : ""
                } hover:bg-card/20 transition-colors`}
              >
                <span className="text-xs text-muted-foreground/80 font-bold uppercase tracking-wider">
                  {k}
                </span>
                <span className="text-sm font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* === PROS AND CONS COMPARATOR === */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          {/* Pros */}
          <div className="liquid-card rounded-2xl p-6 border-success/20 bg-success/5">
            <h4 className="text-xs font-bold text-success uppercase tracking-wider mb-4">
              Institutional Advantages
            </h4>
            <div className="space-y-2">
              {product.pros?.map((pro: string) => (
                <div key={pro} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cons */}
          <div className="liquid-card rounded-2xl p-6 border-amber-500/20 bg-amber-500/5">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4">
              Deployment Considerations
            </h4>
            <div className="space-y-2">
              {product.cons?.map((con: string) => (
                <div key={con} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{con}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === BOX CONTENTS === */}
        <div className="liquid-card mt-8 rounded-2xl p-6 border-border/60">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
            In The Box
          </h4>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            {product.boxContents?.map((item: string) => (
              <div key={item} className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* === CALIBRATION LOGS & USER REVIEWS === */}
        <section className="mt-16 border-t border-border/20 pt-16">
          <div className="mb-8">
            <Badge className="bg-primary/10 border-primary/20 text-primary px-3 py-0.5 mb-2">
              Telemetry Records
            </Badge>
            <h3 className="text-3xl font-extrabold tracking-tight">Calibration Logs & Operator Reviews</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time usability feedback and hardware audit logs from deployed stations.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] items-start">
            {/* LEFT COLUMN: STATISTICS AGGREGATION */}
            <div className="liquid-card rounded-3xl p-6 border-primary/10 bg-gradient-to-br from-card/30 to-background/50 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  Acoustic & Tactile Rating Summary
                </h4>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {product.rating}
                  </span>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const starVal = idx + 1;
                        const score = Number(product.rating);
                        return (
                          <Star
                            key={idx}
                            className={`h-5 w-5 ${
                              starVal <= score
                                ? "fill-accent text-accent"
                                : starVal - 0.5 <= score
                                ? "fill-accent text-accent opacity-70"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold">
                      Based on {product.reviews} {product.reviews === 1 ? "audit entry" : "audit entries"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bars */}
              <div className="space-y-2.5 pt-2 border-t border-border/20">
                {[5, 4, 3, 2, 1].map((stars) => {
                  let percentage = 0;
                  const total = feedbackData?.totalReviews || 0;
                  if (total > 0) {
                    const count = feedbackData.reviews.filter((r: any) => r.rating === stars).length;
                    percentage = Math.round((count / total) * 100);
                  } else {
                    // Seed mock percentages for display if empty
                    const mockPercentages: Record<number, number> = { 5: 75, 4: 18, 3: 5, 2: 2, 1: 0 };
                    percentage = mockPercentages[stars];
                  }

                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-bold text-muted-foreground font-mono flex items-center gap-0.5">
                        {stars} <Star className="h-3 w-3 fill-current text-accent" />
                      </span>
                      <div className="flex-1 h-2 bg-secondary/80 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        />
                      </div>
                      <span className="w-8 text-right font-mono font-semibold text-muted-foreground/80">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: SUBMISSION FORM / LOGIN CTA */}
            <div className="liquid-card rounded-3xl p-6 border-primary/10 bg-gradient-to-br from-card/30 to-background/50">
              {userId ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Submit New Calibration Log
                  </h4>

                  {/* Rating Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Usability Calibration (Star Rating)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const starVal = idx + 1;
                        const isActive = hoverRating !== null ? starVal <= hoverRating : starVal <= newRating;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNewRating(starVal)}
                            onMouseEnter={() => setHoverRating(starVal)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="text-muted-foreground hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`h-7 w-7 transition-colors duration-200 ${
                                isActive ? "fill-accent text-accent drop-shadow-glow" : "text-muted-foreground/40"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comments input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Usability Calibration Comments
                    </label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Input telemetry observations, sound tests, and hardware build impressions..."
                      rows={4}
                      className="w-full rounded-2xl border border-border/80 bg-zinc-950/40 p-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 px-1">
                      <span>Be descriptive & mention firmware versions if applicable.</span>
                      <span>{newComment.length}/1000</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={() => addReviewMutation.mutate()}
                    disabled={isSubmittingReview || !newComment.trim()}
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-2xl h-11"
                  >
                    {isSubmittingReview ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" /> WRITING TELEMETRY LOG...
                      </span>
                    ) : (
                      "SUBMIT CALIBRATION LOG"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 h-full min-h-[220px]">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                    <ShieldCheck className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">TELEMETRY ACCESS RESTRICTED</h4>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                      Please sign in to write reviews, calibrate device diagnostics, and submit telemetry feedback.
                    </p>
                  </div>
                  <Button asChild size="sm" className="rounded-xl font-bold bg-primary hover:bg-primary/95 text-primary-foreground px-5 h-9">
                    <Link to="/auth" search={{ redirect: `/products/${id}` }}>
                      Sign In to Review
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* TELEMETRY FEEDBACK ARCHIVE LIST */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between border-b border-border/20 pb-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Telemetry Log Archive
              </h4>
              <Badge variant="outline" className="text-[10px] border-border/60">
                {feedbackData?.reviews?.length || 0} Dynamic entries
              </Badge>
            </div>

            {feedbackData?.reviews && feedbackData.reviews.length > 0 ? (
              <div className="grid gap-4">
                {feedbackData.reviews.map((rev: any) => {
                  const initials = (rev.user_name || "Customer")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  const formattedDate = new Date(rev.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });

                  return (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="liquid-card rounded-2xl p-5 border-border/40 hover:border-primary/20 transition-all flex gap-4"
                    >
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-black text-foreground shrink-0 border border-primary/20">
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div>
                            <span className="text-sm font-bold text-foreground block sm:inline">
                              {rev.user_name}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 sm:ml-2.5 font-bold uppercase tracking-wider">
                              Verified Operator
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/70 font-mono">
                            {formattedDate}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`h-3.5 w-3.5 ${
                                idx < rev.rating ? "fill-accent text-accent" : "text-muted-foreground/20"
                              }`}
                            />
                          ))}
                        </div>

                        {/* Review text */}
                        <p className="text-xs leading-relaxed text-muted-foreground/90 whitespace-pre-wrap pt-0.5">
                          {rev.comment}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="liquid-card rounded-2xl p-8 text-center border-dashed border-border/80 flex flex-col items-center justify-center space-y-3">
                <div className="h-10 w-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">NO USABILITY RECORDS AVAILABLE</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                    This unit has not received user validation calibration logs yet.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* === RELATED RECOMMENDATIONS === */}
        {related.length > 0 && (
          <div className="mt-24 border-t border-border/20 pt-16">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <Badge variant="outline" className="border-accent/40 bg-accent/5 text-accent">
                  Requisition matches
                </Badge>
                <h2 className="mt-2 text-3xl font-extrabold tracking-tight">
                  Related Nano Banana peripherals
                </h2>
              </div>
              <Button asChild variant="ghost" className="text-primary hover:text-accent font-bold">
                <Link to="/products">View All Catalog &rarr;</Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.slice(0, 4).map((p: any, i: number) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to="/products/$id"
                    params={{ id: p.id }}
                    className="liquid-card group block overflow-hidden rounded-2xl border-border/60 hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary to-card">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108 filter brightness-[0.85] contrast-[1.05]"
                        />
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider">
                        {p.brand}
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-foreground">{p.name}</p>
                      <p className="mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text font-black text-transparent">
                        ${Number(p.price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === RIGHT-SIDE SPECIALIST SHEETS === */}
      <Sheet open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <SheetContent
          side="right"
          className="w-full border-l border-border/60 bg-background/80 backdrop-blur-2xl sm:max-w-md"
        >
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="liquid-orb absolute -top-20 -right-20 h-[300px] w-[300px] bg-primary/10 opacity-60" />
            <div className="liquid-orb absolute bottom-0 left-0 h-[280px] w-[280px] bg-accent/10 opacity-40" />
          </div>
          <SheetHeader>
            <SheetTitle className="text-2xl">Talk to a specialist</SheetTitle>
            <SheetDescription>
              Have questions regarding{" "}
              <span className="font-medium text-foreground">{product.name}</span> compatibility?
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Phone Requisition link */}
            <a
              href={SUPPORT_PHONE_HREF}
              className="liquid-card group block rounded-2xl bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-5 border-primary/20 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                  <Phone className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Call Procurement Desk
                  </p>
                  <p className="mt-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-bold text-transparent font-mono">
                    {SUPPORT_PHONE}
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Mon–Sat, 9am – 7pm EST
              </p>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/18005550142"
              target="_blank"
              rel="noreferrer"
              className="liquid-card group flex items-center gap-4 rounded-2xl p-4 border-border/80 transition hover:-translate-y-0.5"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-success/15 text-success">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">WhatsApp Instant Chat</p>
                <p className="text-xs text-muted-foreground">
                  Get live telemetry integration setup guides
                </p>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </a>

            {/* Mail */}
            <a
              href="mailto:sales@labtrack.dev"
              className="liquid-card group flex items-center gap-4 rounded-2xl p-4 border-border/80 transition hover:-translate-y-0.5"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">procurement@labtrack.dev</p>
                <p className="text-xs text-muted-foreground">
                  Institutional quotation and invoicing reply in 24h
                </p>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </a>

            {/* Location */}
            <div className="liquid-card flex items-center gap-4 rounded-2xl p-4 border-border/80">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-amber-500">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Logistics Showroom</p>
                <p className="text-xs text-muted-foreground">221B Tech Street, Innovation Park</p>
              </div>
            </div>

            {/* Requisition link button */}
            <Button
              asChild
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold h-11"
              size="lg"
            >
              <Link to="/contact" onClick={() => setInquiryOpen(false)}>
                Submit RFQ Ticket
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
