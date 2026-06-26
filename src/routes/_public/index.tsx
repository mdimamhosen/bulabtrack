import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Zap,
  Cpu,
  Wrench,
  Users,
  Star,
  Mail,
  CheckCircle2,
  Sparkles,
  Keyboard,
  Mouse,
  Headphones,
  Monitor,
  Camera,
  Mic,
  Truck,
  PackageCheck,
  PlayCircle,
  Volume2,
  ShieldAlert,
  Check,
  RefreshCw,
  Clock,
  X,
  Heart,
  ShoppingBag,
  LayoutGrid,
  Terminal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { HomepageSkeleton } from "@/components/page-skeletons";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "LabTrack — Premium Warehouse Peripheral Inventory" },
      {
        name: "description",
        content:
          "Discover, track and procure beautifully crafted peripherals for the modern warehouse inventory with real-time tracking.",
      },
    ],
  }),
  component: HomePage,
  pendingComponent: HomepageSkeleton,
});

// Sound synthesis for interactive keyboard keys (Web Audio API)
const playKeySound = (switchType: "linear" | "tactile" | "clicky") => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (switchType === "clicky") {
      // High pitch click + quick decay
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (switchType === "tactile") {
      // Lower pitch, rounder sound
      osc.type = "triangle";
      osc.frequency.setValueAtTime(350, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.09);
      gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } else {
      // Linear - smooth lower pitch thud
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, audioCtx.currentTime + 0.12);
      gainNode.gain.setValueAtTime(0.22, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    }
  } catch (e) {
    // Audio Context blocked or not supported
  }
};

const brands = ["Logitech", "Razer", "Dell", "HP", "Corsair", "SteelSeries", "ASUS", "Microsoft"];

const features = [
  {
    icon: Cpu,
    title: "Centralized Inventory",
    desc: "Every device, brand and serial — one searchable hub.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    desc: "Live status, category and trend dashboards.",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    desc: "Log issues, schedule fixes, reduce downtime.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based Security",
    desc: "Granular admin & staff permissions out of the box.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Built on edge infrastructure for instant responses.",
  },
  {
    icon: Users,
    title: "Multi-user Teams",
    desc: "Designed for warehouse staff, operators and procurement.",
  },
];

const categories = [
  { icon: Keyboard, label: "Keyboards", count: "120+" },
  { icon: Mouse, label: "Mice", count: "85+" },
  { icon: Headphones, label: "Audio", count: "60+" },
  { icon: Monitor, label: "Displays", count: "40+" },
  { icon: Camera, label: "Webcams", count: "35+" },
  { icon: Mic, label: "Microphones", count: "28+" },
];

const stats = [
  { label: "Devices tracked", value: "850+" },
  { label: "Warehouse hubs", value: "12" },
  { label: "Uptime", value: "99.99%" },
  { label: "Active users", value: "240+" },
];

// Fallback high-quality products if DB query is empty
const fallbackProducts = [
  {
    id: "kb-01",
    name: "Apex Pro Mechanical Keyboard",
    brand: "SteelSeries",
    price: 189.99,
    category: "Keyboards",
    image_url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=600",
    description: "Mechanical keyboard with adjustable OmniPoint switches.",
  },
  {
    id: "ms-01",
    name: "G Pro X Superlight Mouse",
    brand: "Logitech",
    price: 149.99,
    category: "Mice",
    image_url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600",
    description: "Ultra-lightweight wireless gaming mouse with HERO sensor.",
  },
  {
    id: "hs-01",
    name: "BlackShark V2 Pro Headset",
    brand: "Razer",
    price: 129.99,
    category: "Audio",
    image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=600",
    description: "Esports wireless headset with noise-canceling microphone.",
  },
  {
    id: "mn-01",
    name: 'UltraSharp 27" 4K USB-C Monitor',
    brand: "Dell",
    price: 399.99,
    category: "Displays",
    image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600",
    description: "IPS black technology 4K hub monitor with USB-C power delivery.",
  },
];

const testimonials = [
  {
    name: "Aisha Khan",
    role: "Logistics Director",
    quote:
      "LabTrack replaced our spreadsheets overnight. The tracking alone saved us hours weekly, especially with warehouse peripheral replacements.",
  },
  {
    name: "Marco Reyes",
    role: "Operations Architect",
    quote:
      "Stunningly designed and extremely premium. Our warehouse staff onboarded in 10 minutes, and the inventory logs are perfect.",
  },
  {
    name: "Priya Shah",
    role: "Procurement Lead",
    quote:
      "The customized workstation bundles and streamlined requisition checkouts make ordering computer assets painless.",
  },
];

const faqItems = [
  {
    q: "Is LabTrack scalable for large warehouse hubs?",
    a: "Yes, LabTrack scales from single-room inventories up to large multi-dock warehouse networks with real-time replication.",
  },
  {
    q: "Can we configure custom requisition approvals?",
    a: "Absolutely. Warehouse Managers can configure multi-level authorization gates before requisition tickets are finalized.",
  },
  {
    q: "Does the platform track warranty details?",
    a: "Yes, you can log warranties, upload invoices, and receive proactive alerts before hardware support contracts expire.",
  },
  {
    q: "Is there a staff barcode checkout portal?",
    a: "Yes! Staff can check out loaner peripherals (like rugged scanners or tablets) by scanning bin QR codes.",
  },
];

// CS Labs configurations for Builder
const builderOptions = {
  keyboards: [
    {
      id: "b-kb-1",
      name: "Pro Mech TKL (Silent Red Switches)",
      price: 129.99,
      brand: "LabTrack Edition",
    },
    { id: "b-kb-2", name: "Standard Ergonomic Membrane", price: 49.99, brand: "Dell OEM" },
    {
      id: "b-kb-3",
      name: "CyberGlow Hot-Swap RGB (Tactile)",
      price: 159.99,
      brand: "Keychron Co.",
    },
  ],
  mice: [
    {
      id: "b-ms-1",
      name: "Ultralight Precision Mouse (Wireless)",
      price: 89.99,
      brand: "Logitech",
    },
    { id: "b-ms-2", name: "Ergonomic wired office mouse", price: 29.99, brand: "HP" },
    { id: "b-ms-3", name: "Carbon-V Precision Wireless", price: 119.99, brand: "Razer" },
  ],
  audio: [
    {
      id: "b-au-1",
      name: "Spatial Noise-Canceling Headset",
      price: 109.99,
      brand: "Audio-Technica",
    },
    { id: "b-au-2", name: "Stereo Warehouse Headsets (Pack of 5)", price: 34.99, brand: "Generic" },
    { id: "b-au-3", name: "Pro Broadcast Studio Mic", price: 149.99, brand: "Shure" },
  ],
  deskmats: [
    { id: "b-dm-1", name: "Liquidmorphic Fluid-Art Mat", price: 24.99, brand: "LabTrack Custom" },
    { id: "b-dm-2", name: "Sleek Matte Black Desk Mat", price: 14.99, brand: "LabTrack Standard" },
    { id: "b-dm-3", name: "Dual-Side Premium Leather Pad", price: 39.99, brand: "Onyx" },
  ],
};

const showroomSetups = [
  {
    title: "Fulfillment & Sorting Arena",
    location: "Logistics Hub Alpha, Section 4",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200",
    description:
      "Configured with hot-swap clicky keyboards, lightweight gaming mice, and surround-sound headsets for high performance.",
    tag: "High-Performance",
  },
  {
    title: "Engineering Station",
    location: "Fulfillment Area, Bay B",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200",
    description:
      "Fitted with quiet linear switch keyboards, high-precision vertical mice, and ergonomic dual-monitor layouts.",
    tag: "Acoustic Friendly",
  },
  {
    title: "Logistics Admin Desk",
    location: "Operations Tower, Station A",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200",
    description:
      "Outfitted with wireless productivity peripherals, custom deskmats, and active noise-cancelling overhead monitors.",
    tag: "Focus Layout",
  },
];

const storageBins = Array.from({ length: 24 }).map((_, i) => {
  const id = String(i + 1).padStart(2, "0");
  let status: "online" | "in-use" | "maintenance" | "alert" = "online";
  if (i === 7 || i === 15) status = "maintenance";
  else if (i === 11) status = "alert";
  else if (i % 3 === 0) status = "in-use";

  const keyboards = ["Apex Pro Mech", "Logitech G915", "Keychron Q1", "Dell QuietKey"];
  const mice = ["G Pro X Superlight", "Razer DeathAdder", "MX Master 3S", "HP OEM Wired"];
  const displays = ["Dell 27\" 4K", "ASUS ROG 24\"", "LG UltraWide 34\"", "HP ProDisplay 22\""];
  const audio = ["Razer BlackShark V2", "Corsair Virtuoso", "Audio-Technica M50x", "Standard USB Headset"];

  return {
    name: `BIN-${id}`,
    status,
    keyboard: keyboards[i % keyboards.length],
    keyboardHealth: 80 + (i * 7) % 21,
    mouse: mice[i % mice.length],
    mouseHealth: 75 + (i * 9) % 26,
    display: displays[i % displays.length],
    displayHealth: 90 + (i * 3) % 11,
    audio: audio[i % audio.length],
    audioHealth: 85 + (i * 5) % 16,
    uptime: (98.5 + (i * 0.1) % 1.5).toFixed(2) + "%",
    temp: (20.5 + (i * 0.3) % 4.0).toFixed(1) + "°C",
    lastAudit: `${(1 + i % 5)} hours ago`,
  };
});

function PlexusCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }[] = [];
    
    const particleCount = Math.min(50, Math.floor(width / 25));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
      });
    }

    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Move particle
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Boundary collision
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(234, 179, 8, 0.3)"; // primary color yellow/amber glow
        ctx.fill();

        // Connect to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(234, 179, 8, ${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Connect to mouse
        if (mouse.x > -500) {
          const distMouse = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
          if (distMouse < 180) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.25 * (1 - distMouse / 180)})`; // accent color purple
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none z-0" />;
}

function HomePage() {
  const { add } = useCart();
  const [videoOpen, setVideoOpen] = useState(false);
  const [activeFlowStep, setActiveFlowStep] = useState<number>(0);


  // States for SECTION: Interactive Laboratory Simulator
  const [activeStation, setActiveStation] = useState<any>(storageBins[0]);
  const [simulating, setSimulating] = useState(false);

  const handleSimulateDiagnostic = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      toast.success(`Diagnostic run complete on ${activeStation.name}. All systems verified.`);
    }, 1200);
  };

  const handleFlagIssue = () => {
    toast.error(`Maintenance ticket created for ${activeStation.name}. Staff alerted.`);
  };

  // States for SECTION 1: Interactive Keyboard Customizer
  const [customizerTheme, setCustomizerTheme] = useState<"cyberpunk" | "stealth" | "sakura">(
    "cyberpunk",
  );
  const [customizerSwitch, setCustomizerSwitch] = useState<"linear" | "tactile" | "clicky">(
    "linear",
  );
  const [lastKeyPressed, setLastKeyPressed] = useState<string>("");
  const [rgbEnabled, setRgbEnabled] = useState(true);

  // States for SECTION 2: Real-time Telemetry Dashboard
  const [telemetryWarehouse, setTelemetryWarehouse] = useState<"Warehouse Alpha" | "Warehouse Beta" | "Warehouse Gamma">("Warehouse Alpha");
  const [telemetryChartData, setTelemetryChartData] = useState<
    { time: string; keystrokes: number; clicks: number }[]
  >([]);
  const [liveLogs, setLiveLogs] = useState<string[]>([
    "Scanning Warehouse Bin arrays...",
    "Warehouse Alpha: Apex Pro Mechanical Keyboard connected.",
    "System status: 100% active and running.",
  ]);

  // States for SECTION 3: Station Builder Wizard
  const [builderStep, setBuilderStep] = useState(1);
  const [selectedKb, setSelectedKb] = useState(builderOptions.keyboards[0]);
  const [selectedMs, setSelectedMs] = useState(builderOptions.mice[0]);
  const [selectedAu, setSelectedAu] = useState(builderOptions.audio[0]);
  const [selectedDm, setSelectedDm] = useState(builderOptions.deskmats[0]);
  const [stationType, setStationType] = useState<"gaming" | "coding" | "office">("coding");

  // States for SECTION 5: Showroom Carousel
  const [showroomIndex, setShowroomIndex] = useState(0);

  // Query database for featured devices
  const { data: featured = [] } = useQuery({
    queryKey: ["featured-devices-home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("devices")
        .select("id,name,brand,price,image_url,status,category,description")
        .eq("status", "Available")
        .limit(8);
      return data ?? [];
    },
  });

  const devicesShow = featured.length > 0 ? featured : fallbackProducts;
  const heroDevice = devicesShow[0];

  // Simulating Live Telemetry Data
  useEffect(() => {
    // Generate initial data
    const initialData = [];
    for (let i = 9; i >= 0; i--) {
      initialData.push({
        time: `${i}s ago`,
        keystrokes: Math.floor(Math.random() * 40) + 30,
        clicks: Math.floor(Math.random() * 25) + 15,
      });
    }
    setTelemetryChartData(initialData);

    const interval = setInterval(() => {
      // Add new telemetry point
      setTelemetryChartData((prev) => {
        const next = [...prev.slice(1)];
        next.push({
          time: "Just now",
          keystrokes:
            Math.floor(Math.random() * 60) +
            (telemetryWarehouse === "Warehouse Alpha" ? 50 : telemetryWarehouse === "Warehouse Beta" ? 30 : 20),
          clicks:
            Math.floor(Math.random() * 35) +
            (telemetryWarehouse === "Warehouse Alpha" ? 25 : telemetryWarehouse === "Warehouse Beta" ? 15 : 10),
        });
        // Rename time fields for clean visual labels
        return next.map((item, idx) => ({
          ...item,
          time: idx === next.length - 1 ? "Now" : `${next.length - 1 - idx}s ago`,
        }));
      });

      // Add a simulated log
      const events = [
        "Link rate latency drop detected on Bin 04",
        "Battery low alert: Bin 12 Scanner",
        "Automatic latency optimization completed",
        "New peripheral checkout request received",
        "Maintenance timeline updated: Warehouse Beta",
        "Calibration checklist complete: Warehouse Gamma",
      ];
      setLiveLogs((prev) => {
        const nextLog = `${telemetryWarehouse}: ${events[Math.floor(Math.random() * events.length)]}`;
        return [nextLog, ...prev.slice(0, 4)];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [telemetryWarehouse]);

  // Adjust selections automatically based on station builder workspace preset
  const handlePresetSelect = (preset: "gaming" | "coding" | "office") => {
    setStationType(preset);
    if (preset === "gaming") {
      setSelectedKb(builderOptions.keyboards[2]); // CyberGlow RGB
      setSelectedMs(builderOptions.mice[2]); // Carbon-V Wireless
      setSelectedAu(builderOptions.audio[0]); // Spatial Noise-Cancelling
      setSelectedDm(builderOptions.deskmats[0]); // Liquidmorphic Mat
    } else if (preset === "coding") {
      setSelectedKb(builderOptions.keyboards[0]); // Pro Mech TKL Silent
      setSelectedMs(builderOptions.mice[0]); // Ultralight Precision
      setSelectedAu(builderOptions.audio[2]); // Studio Mic
      setSelectedDm(builderOptions.deskmats[2]); // Premium Leather
    } else {
      setSelectedKb(builderOptions.keyboards[1]); // Standard Membrane
      setSelectedMs(builderOptions.mice[1]); // Ergonomic Wired
      setSelectedAu(builderOptions.audio[1]); // Earbuds
      setSelectedDm(builderOptions.deskmats[1]); // Matte Black
    }
  };

  const handleAddBundleToCart = () => {
    // Add all 4 items to cart
    add({
      id: selectedKb.id,
      name: selectedKb.name,
      brand: selectedKb.brand,
      price: selectedKb.price,
      image_url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=150",
    });
    add({
      id: selectedMs.id,
      name: selectedMs.name,
      brand: selectedMs.brand,
      price: selectedMs.price,
      image_url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=150",
    });
    add({
      id: selectedAu.id,
      name: selectedAu.name,
      brand: selectedAu.brand,
      price: selectedAu.price,
      image_url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=150",
    });
    add({
      id: selectedDm.id,
      name: selectedDm.name,
      brand: selectedDm.brand,
      price: selectedDm.price,
      image_url: null,
    });
    toast.success("Complete custom workstation bundle added to your cart!");
  };

  const calculateSubtotal = () => {
    return selectedKb.price + selectedMs.price + selectedAu.price + selectedDm.price;
  };

  return (
    <div className="overflow-hidden bg-background text-foreground">
      {/* SVG gooey liquidmorphic filter */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="liquid-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* ===== HERO ===== */}
      <section className="relative min-h-[92vh] flex items-center pt-8 pb-16">
        {/* Background animation video + plexus canvas */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-zinc-950">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-[0.22] mix-blend-screen select-none pointer-events-none"
          >
            <source
              src="https://player.vimeo.com/external/435674703.sd.mp4?s=7fdf3176efdc2d8bcf51cb1c9cb42db8120ec01d&profile_id=139&oauth2_token_id=57447761"
              type="video/mp4"
            />
          </video>
          
          <div className="aurora-bg absolute inset-0 opacity-20" />
          <div className="ai-grid absolute inset-0 opacity-40" />
          
          <PlexusCanvas />

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/45 to-background" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8 w-full">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Left Hero Details */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="liquid-card inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs border border-primary/20 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                <span className="neon-text font-semibold uppercase tracking-wider text-[10px]">
                  Next-Gen Warehouse Telemetry
                </span>
              </div>

              <h1 className="mt-6 text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Warehouse Peripherals,
                <span className="block bg-gradient-to-r from-primary via-accent to-chart-3 bg-clip-text text-transparent animate-gradient-pan drop-shadow-[0_0_30px_rgba(234,179,8,0.35)]">
                  Liquidmorphic Sync.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg leading-relaxed">
                Catalog, monitor telemetry, schedule maintenance, and manage premium warehouse
                peripheral assets. Built for storage hubs, logistics centers, and fulfillment facilities.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-13 gap-2 bg-gradient-to-r from-primary via-primary/95 to-accent text-primary-foreground font-extrabold shadow-glow hover:opacity-95 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer rounded-2xl"
                >
                  <Link to="/products">
                    Explore Storefront <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  onClick={() => setVideoOpen(true)}
                  size="lg"
                  variant="outline"
                  className="liquid-card h-13 gap-2 border-border/80 text-foreground font-extrabold hover:border-primary/50 hover:bg-card/40 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer rounded-2xl"
                >
                  <PlayCircle className="h-5 w-5 text-accent animate-pulse" /> Watch Showcase
                </Button>
              </div>

              {/* Badges footer */}
              <div className="mt-12 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span>Volume discounts applied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span>COD & Procurement Invoicing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span>Live telemetry scan active</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              {/* Glass container with floating layout */}
              <div className="liquid-card animate-float-slow relative overflow-hidden rounded-[2.5rem] p-3 border-primary/20 shadow-glow">
                <img
                  src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200"
                  alt="Premium warehouse storage workspace"
                  className="aspect-[16/11] w-full rounded-[2rem] object-cover filter brightness-[0.85] contrast-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-[2.5rem]" />
              </div>

              {/* Live Status Overlay Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="liquid-card absolute -bottom-5 -left-5 rounded-2xl p-4 border border-border/80 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Active Scans
                    </p>
                    <p className="text-sm font-extrabold">All 12 Fulfillment Hubs Operational</p>
                  </div>
                </div>
              </motion.div>

              {/* Delivery stats badge */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="liquid-card absolute -top-5 -right-3 rounded-2xl p-4 border border-border/80 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Fast Transit
                    </p>
                    <p className="text-sm font-extrabold">24h Logistics Dispatch</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== BRAND BAR ===== */}
      <div className="border-y border-border/30 bg-card/10 py-8 relative">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">
            Partnered Hardware Manufacturers
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-50 hover:opacity-80 transition-opacity">
            {brands.map((b) => (
              <span
                key={b}
                className="text-sm font-bold tracking-widest uppercase hover:text-primary transition-colors cursor-default"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================= SECTION 1: INTERACTIVE KEYBOARD CUSTOMIZER ================= */}
      <section className="relative py-24 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="liquid-orb absolute right-1/4 top-1/4 h-[380px] w-[380px] bg-accent/20 opacity-60" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="bg-primary/10 text-primary border border-primary/20 py-1 px-3 mb-4">
              <Sparkles className="h-3 w-3 mr-1 animate-pulse" /> Try it Live
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Customizer Studio & Switch Sandbox
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Test different mechanical switches and keycap themes directly in your browser. Click
              the keycap deck to play synthesized mechanical click feedback.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] items-center">
            {/* Customizer Sidebar Controls */}
            <div className="liquid-card rounded-3xl p-8 border-border/60">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" /> Keyboard Options
              </h3>

              {/* Color Scheme Picker */}
              <div className="mt-8">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Keycap Color Theme
                </span>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "cyberpunk",
                      label: "Cyberpunk",
                      colors: "from-purple-500 to-yellow-400",
                    },
                    { id: "stealth", label: "Stealth Black", colors: "from-zinc-800 to-zinc-950" },
                    { id: "sakura", label: "Sakura Pink", colors: "from-pink-300 to-rose-400" },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setCustomizerTheme(theme.id as any)}
                      className={`flex flex-col items-center gap-2 rounded-xl p-3 border text-xs font-semibold transition-all ${
                        customizerTheme === theme.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card/30 text-muted-foreground hover:bg-card/50"
                      }`}
                    >
                      <span className={`h-4 w-10 rounded-full bg-gradient-to-r ${theme.colors}`} />
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Switches Selection */}
              <div className="mt-8">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Mechanical Switch Profile
                </span>
                <div className="mt-3 flex flex-col gap-2">
                  {[
                    {
                      id: "linear",
                      label: "Cherry MX Red (Linear)",
                      desc: "Quiet, smooth, click-less thud",
                      color: "bg-rose-500",
                    },
                    {
                      id: "tactile",
                      label: "Cherry MX Brown (Tactile)",
                      desc: "Moderate bump, balanced sound",
                      color: "bg-amber-600",
                    },
                    {
                      id: "clicky",
                      label: "Cherry MX Blue (Clicky)",
                      desc: "Loud tactile crisp high snap",
                      color: "bg-sky-500",
                    },
                  ].map((sw) => (
                    <button
                      key={sw.id}
                      onClick={() => {
                        setCustomizerSwitch(sw.id as any);
                        playKeySound(sw.id as any);
                        toast.info(`Switched to ${sw.label}`);
                      }}
                      className={`flex items-center justify-between rounded-xl p-4 border text-left transition-all ${
                        customizerSwitch === sw.id
                          ? "border-accent bg-accent/5 text-foreground"
                          : "border-border bg-card/30 text-muted-foreground hover:bg-card/50"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground">{sw.label}</p>
                        <p className="text-xs text-muted-foreground">{sw.desc}</p>
                      </div>
                      <span className={`h-4 w-4 rounded-full ${sw.color} shadow-lg`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6">
                <div>
                  <p className="text-sm font-bold">RGB Underglow Aura</p>
                  <p className="text-xs text-muted-foreground">Toggle lighting effects</p>
                </div>
                <button
                  onClick={() => setRgbEnabled(!rgbEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rgbEnabled ? "bg-primary" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rgbEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Keyboard Deck Simulator */}
            <div className="relative p-6 liquid-card rounded-[2rem] border-primary/20 flex flex-col items-center justify-center min-h-[350px]">
              {/* Backlight Glow Filter */}
              <div
                className={`absolute inset-6 -z-10 rounded-[1.5rem] filter blur-2xl opacity-40 transition-all duration-700 ${
                  !rgbEnabled
                    ? "bg-transparent"
                    : customizerTheme === "cyberpunk"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_80px_oklch(0.58_0.24_274/0.6)]"
                      : customizerTheme === "stealth"
                        ? "bg-gradient-to-r from-zinc-700 to-zinc-400"
                        : "bg-gradient-to-r from-pink-400 to-rose-300 shadow-[0_0_80px_oklch(0.78_0.16_210/0.5)]"
                }`}
              />

              {/* Mechanical Deck */}
              <div className="w-full max-w-lg bg-zinc-950 p-5 rounded-2xl shadow-2xl border border-zinc-800">
                {/* Simulated Keys layout */}
                <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                  {/* Row 1 */}
                  {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((key) => {
                    const isPressed = lastKeyPressed === key;

                    // Determine key color styles based on selected customizer theme
                    let keyColor = "bg-zinc-800 hover:bg-zinc-700 text-zinc-300";
                    if (customizerTheme === "cyberpunk") {
                      keyColor = ["Q", "E", "T", "U", "O"].includes(key)
                        ? "bg-purple-600 hover:bg-purple-500 text-yellow-300"
                        : "bg-yellow-400 hover:bg-yellow-300 text-purple-950";
                    } else if (customizerTheme === "sakura") {
                      keyColor = ["Q", "E", "T", "U", "O"].includes(key)
                        ? "bg-pink-300 hover:bg-pink-200 text-rose-800"
                        : "bg-white hover:bg-rose-50 text-pink-500";
                    }

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setLastKeyPressed(key);
                          playKeySound(customizerSwitch);
                          setTimeout(() => setLastKeyPressed(""), 120);
                        }}
                        className={`aspect-square w-full rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center transition-all border border-black/40 shadow-[0_4px_0_#18181b] active:translate-y-1 active:shadow-none ${keyColor} ${
                          isPressed ? "translate-y-1 shadow-none border-primary bg-accent/40" : ""
                        }`}
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>

                {/* Keyboard Spacebar & bottom keys */}
                <div className="mt-4 flex gap-2">
                  <div className="w-1/4 rounded-lg bg-zinc-900 border border-zinc-800 aspect-[4/1]" />
                  <button
                    onClick={() => {
                      setLastKeyPressed("SPACE");
                      playKeySound(customizerSwitch);
                      setTimeout(() => setLastKeyPressed(""), 120);
                    }}
                    className={`flex-1 rounded-lg font-bold text-xs flex items-center justify-center border border-black/40 shadow-[0_4px_0_#18181b] active:translate-y-1 active:shadow-none transition-all ${
                      customizerTheme === "cyberpunk"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : customizerTheme === "sakura"
                          ? "bg-rose-300 text-white"
                          : "bg-zinc-800 text-zinc-400"
                    } ${lastKeyPressed === "SPACE" ? "translate-y-1 shadow-none" : ""}`}
                  >
                    SPACEBAR
                  </button>
                  <div className="w-1/4 rounded-lg bg-zinc-900 border border-zinc-800 aspect-[4/1]" />
                </div>
              </div>

              {/* Status prompt */}
              <div className="mt-6 text-center">
                {lastKeyPressed ? (
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    Pressed{" "}
                    <span className="px-2 py-0.5 rounded bg-card text-primary font-mono">
                      {lastKeyPressed}
                    </span>{" "}
                    - Feedback: <Volume2 className="h-4 w-4 text-accent inline" /> click synthesized
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Click any keycap in the simulator to test acoustic key feedback.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: LIVE WAREHOUSE TELEMETRY & ANALYTICS ================= */}
      <section className="relative py-24 bg-card/10 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="liquid-orb absolute left-1/4 bottom-10 h-[420px] w-[420px] bg-primary/10 opacity-70" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-center">
            {/* Live Chart & Metrics Panel */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="border-accent/40 bg-accent/5 text-accent mb-3">
                  Telemetry Channel active
                </Badge>
                <h2 className="text-4xl font-extrabold tracking-tight">
                  Logistics Telemetry & Live Warehouse Pulse
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Every peripheral tracked via LabTrack streams utilization updates. View link status,
                  connection rates, and check logs in real time.
                </p>
              </div>

              {/* Tab options for switching labs */}
              <div className="flex gap-2 p-1.5 bg-card/30 border border-border/50 rounded-2xl max-w-md backdrop-blur">
                {["Warehouse Alpha", "Warehouse Beta", "Warehouse Gamma"].map((lab) => (
                  <button
                    key={lab}
                    onClick={() => {
                      setTelemetryWarehouse(lab as any);
                      toast.info(`Switched telemetry stream to ${lab}`);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      telemetryWarehouse === lab
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/45"
                    }`}
                  >
                    {lab}
                  </button>
                ))}
              </div>

              {/* Telemetry quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="liquid-card p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground">Active Hubs</p>
                  <p className="text-xl font-black text-primary mt-1">
                    {telemetryWarehouse === "Warehouse Alpha"
                      ? "42 / 45"
                      : telemetryWarehouse === "Warehouse Beta"
                        ? "28 / 30"
                        : "15 / 15"}
                  </p>
                </div>
                <div className="liquid-card p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground">Active Inputs</p>
                  <p className="text-xl font-black text-accent mt-1 animate-pulse">
                    {telemetryWarehouse === "Warehouse Alpha" ? "92%" : telemetryWarehouse === "Warehouse Beta" ? "88%" : "100%"}
                  </p>
                </div>
                <div className="liquid-card p-4 rounded-xl text-center">
                  <p className="text-xs text-muted-foreground">Sync Ping</p>
                  <p className="text-xl font-black text-success mt-1">2.4 ms</p>
                </div>
              </div>
            </div>

            {/* High Tech Dashboard Console Container */}
            <div className="liquid-card rounded-3xl p-6 border-primary/20 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-accent animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Stream // {telemetryWarehouse} Dashboard
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-success animate-ping" />
                  <span className="text-[10px] font-mono font-semibold text-success">
                    STREAMING LIVE
                  </span>
                </div>
              </div>

              {/* Recharts Chart */}
              <div className="h-56 w-full mt-4">
                {telemetryChartData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={telemetryChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorKeystrokes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 9 }}
                        stroke="var(--color-muted-foreground)"
                      />
                      <YAxis tick={{ fontSize: 9 }} stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="keystrokes"
                        name="Keystrokes/sec"
                        stroke="var(--color-primary)"
                        fillOpacity={1}
                        fill="url(#colorKeystrokes)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        name="Mouse Clicks"
                        stroke="var(--color-accent)"
                        fillOpacity={1}
                        fill="url(#colorClicks)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Log updates console */}
              <div className="mt-4 p-4 rounded-xl bg-black/60 border border-border/40 font-mono text-[10px] leading-relaxed text-zinc-400 h-28 overflow-y-auto scrollbar-none">
                <p className="text-zinc-500 mb-1">// Event Listener logs feed</p>
                {liveLogs.map((log, idx) => (
                  <motion.div
                    key={log + idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1 text-emerald-400 py-0.5"
                  >
                    <span className="text-emerald-600 font-bold">&gt;</span>
                    <span>{log}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION: INTERACTIVE WAREHOUSE SIMULATOR ================= */}
      <section className="relative py-24 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="liquid-orb absolute left-1/4 top-1/4 h-[400px] w-[400px] bg-accent/15 opacity-60" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="bg-primary/10 text-primary border border-primary/20 py-1 px-3 mb-4">
              Live Warehouse Telemetry
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Interactive Warehouse Simulator
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Click on any of the 24 storage bins in Warehouse Alpha to check peripheral status, connectivity metrics, and trigger diagnostic routines.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.3fr_0.7fr] items-start">
            {/* Left: 6x4 Grid of Stations */}
            <div className="liquid-card rounded-3xl p-8 border-border/60">
              <div className="flex items-center justify-between mb-6 border-b border-border/10 pb-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Warehouse Alpha Rack Layout (Bin Arrays)
                </span>
                <div className="flex flex-wrap gap-3 text-[10px] font-bold text-muted-foreground">
                  <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Online</div>
                  <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> In Use</div>
                  <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Maintenance</div>
                  <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" /> Alert</div>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {storageBins.map((station) => {
                  const isActive = activeStation.name === station.name;
                  const statusColors = {
                    online: "bg-success shadow-[0_0_12px_rgba(34,197,94,0.4)]",
                    "in-use": "bg-primary shadow-[0_0_12px_var(--color-primary)]",
                    maintenance: "bg-warning shadow-[0_0_12px_rgba(245,158,11,0.4)]",
                    alert: "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse",
                  };
                  return (
                    <button
                      key={station.name}
                      type="button"
                      onClick={() => {
                        setActiveStation(station);
                        setSimulating(false);
                      }}
                      className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        isActive
                          ? "border-primary bg-primary/10 shadow-glow ring-2 ring-primary/20 scale-[1.05]"
                          : "border-border/50 bg-card/20 hover:border-primary/30 hover:bg-card/45"
                      }`}
                    >
                      <span className="text-[10px] font-bold tracking-wider text-muted-foreground font-mono">
                        {station.name}
                      </span>
                      <span className={`h-2.5 w-2.5 rounded-full ${statusColors[station.status]}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Telemetry Details Panel */}
            <div className="liquid-card rounded-3xl p-6 border-primary/20 sticky top-24">
              <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-6">
                <div>
                  <h3 className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                    {activeStation.name} Telemetry
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Bin Telemetry Details
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold uppercase capitalize font-mono px-2.5 py-0.5 border ${
                    activeStation.status === "online"
                      ? "border-success/30 text-success bg-success/5"
                      : activeStation.status === "in-use"
                        ? "border-primary/30 text-primary bg-primary/5"
                        : activeStation.status === "maintenance"
                          ? "border-warning/30 text-warning bg-warning/5"
                          : "border-destructive/30 text-destructive bg-destructive/5"
                  }`}
                >
                  {activeStation.status}
                </Badge>
              </div>

              {/* Specs & Health */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Peripheral Health Status
                </h4>

                {/* Keyboard */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-muted-foreground">
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      <Keyboard className="h-3.5 w-3.5 text-primary" /> {activeStation.keyboard}
                    </span>
                    <span className="font-mono text-[10px]">{activeStation.keyboardHealth}%</span>
                  </div>
                  <div className="w-full bg-zinc-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeStation.keyboardHealth > 90
                          ? "bg-success"
                          : activeStation.keyboardHealth > 80
                            ? "bg-primary"
                            : "bg-warning"
                      }`}
                      style={{ width: `${activeStation.keyboardHealth}%` }}
                    />
                  </div>
                </div>

                {/* Mouse */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-muted-foreground">
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      <Mouse className="h-3.5 w-3.5 text-accent" /> {activeStation.mouse}
                    </span>
                    <span className="font-mono text-[10px]">{activeStation.mouseHealth}%</span>
                  </div>
                  <div className="w-full bg-zinc-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeStation.mouseHealth > 90
                          ? "bg-success"
                          : activeStation.mouseHealth > 80
                            ? "bg-primary"
                            : "bg-warning"
                      }`}
                      style={{ width: `${activeStation.mouseHealth}%` }}
                    />
                  </div>
                </div>

                {/* Display */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-muted-foreground">
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      <Monitor className="h-3.5 w-3.5 text-chart-3" /> {activeStation.display}
                    </span>
                    <span className="font-mono text-[10px]">{activeStation.displayHealth}%</span>
                  </div>
                  <div className="w-full bg-zinc-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeStation.displayHealth > 90
                          ? "bg-success"
                          : activeStation.displayHealth > 80
                            ? "bg-primary"
                            : "bg-warning"
                      }`}
                      style={{ width: `${activeStation.displayHealth}%` }}
                    />
                  </div>
                </div>

                {/* Audio */}
                <div className="text-xs">
                  <div className="flex justify-between items-center mb-1 text-muted-foreground">
                    <span className="flex items-center gap-1 text-foreground font-semibold">
                      <Headphones className="h-3.5 w-3.5 text-success" /> {activeStation.audio}
                    </span>
                    <span className="font-mono text-[10px]">{activeStation.audioHealth}%</span>
                  </div>
                  <div className="w-full bg-zinc-950/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeStation.audioHealth > 90
                          ? "bg-success"
                          : activeStation.audioHealth > 80
                            ? "bg-primary"
                            : "bg-warning"
                      }`}
                      style={{ width: `${activeStation.audioHealth}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Telemetry Stats */}
              <div className="mt-6 pt-6 border-t border-border/10 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ambient Temp:</span>
                  <span className="font-semibold text-foreground font-mono">{activeStation.temp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime Rate:</span>
                  <span className="font-semibold text-foreground font-mono">{activeStation.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Serial Audit:</span>
                  <span className="font-semibold text-foreground font-mono">{activeStation.lastAudit}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={handleSimulateDiagnostic}
                  disabled={simulating}
                  variant="outline"
                  className="rounded-xl border-border hover:bg-card/45 h-9 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer text-foreground"
                >
                  {simulating ? "Scanning..." : "Run Diagnostic"}
                </Button>
                <Button
                  type="button"
                  onClick={handleFlagIssue}
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground h-9 text-[10px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Report Alert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ================= SECTION 3: INTERACTIVE WORKSTATION BUILDER ================= */}
      <section className="relative py-24 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="liquid-orb absolute right-1/4 bottom-1/4 h-[350px] w-[350px] bg-chart-3/20 opacity-55" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="bg-accent/10 text-accent border border-accent/20 py-1 px-3 mb-4">
              Station Configurator
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Warehouse Workstation Configurator
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Assemble specialized bundles (Keyboards, Mice, Audio, and Deskmats) designed for
              warehouse staff workstation setups and check system compatibility.
            </p>
          </div>

          {/* Stepper Wizard Main Layout */}
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-start">
            {/* Left Steps Panel */}
            <div className="liquid-card rounded-3xl p-8 border-border/60">
              {/* Stepper Progress Header */}
              <div className="flex justify-between items-center mb-8 border-b border-border/30 pb-6">
                {[
                  { step: 1, label: "Workspace Focus" },
                  { step: 2, label: "Input Deck" },
                  { step: 3, label: "Acoustics & Mat" },
                  { step: 4, label: "Final Bundle" },
                ].map((s) => (
                  <div key={s.step} className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => s.step < builderStep && setBuilderStep(s.step)}
                      className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center border transition-all ${
                        builderStep === s.step
                          ? "bg-primary border-primary text-primary-foreground shadow-glow"
                          : builderStep > s.step
                            ? "bg-success border-success text-success-foreground cursor-pointer"
                            : "bg-card border-border text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {builderStep > s.step ? <Check className="h-4 w-4" /> : s.step}
                    </button>
                    <span className="text-[10px] text-center mt-2 font-semibold text-muted-foreground hidden sm:block">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wizard Content Panels */}
              <div className="min-h-[280px]">
                {/* STEP 1: PRESETS */}
                {builderStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-lg font-bold mb-2">Choose Workspace Configuration Type</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Select a preset tailored to your facility's usage profile. You can tweak
                      specific devices later.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {[
                        {
                          id: "coding",
                          label: "Engineering Station",
                          desc: "Acoustic-friendly linear keys, precision comfort wireless mice.",
                          icon: CodePresetIcon,
                        },
                        {
                          id: "gaming",
                          label: "High-Speed Fulfillment Setup",
                          desc: "Vibrant RGB keys, speed gaming mice, virtual surround audio.",
                          icon: GamePresetIcon,
                        },
                        {
                          id: "office",
                          label: "Logistics Office / Desk",
                          desc: "Classic robust keyboards, durable mice, eco-mats.",
                          icon: OfficePresetIcon,
                        },
                      ].map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset.id as any)}
                          className={`flex flex-col items-start text-left p-5 rounded-2xl border transition-all hover:scale-[1.01] ${
                            stationType === preset.id
                              ? "border-primary bg-primary/5 text-foreground ring-2 ring-primary/20"
                              : "border-border bg-card/30 text-muted-foreground hover:bg-card/50"
                          }`}
                        >
                          <preset.icon className="h-8 w-8 text-primary mb-4" />
                          <h4 className="font-extrabold text-sm text-foreground">{preset.label}</h4>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            {preset.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: INPUT DECKS */}
                {builderStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold">Configure Input Peripherals</h3>
                      <p className="text-sm text-muted-foreground">
                        Select matching mechanical keyboards and tracking mice.
                      </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Keyboards */}
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Keyboard Options
                        </label>
                        <div className="mt-3 flex flex-col gap-2">
                          {builderOptions.keyboards.map((kb) => (
                            <button
                              key={kb.id}
                              onClick={() => setSelectedKb(kb)}
                              className={`flex justify-between items-center p-3 rounded-xl border text-left text-xs ${
                                selectedKb.id === kb.id
                                  ? "border-primary bg-primary/5 text-foreground"
                                  : "border-border bg-card/20 hover:bg-card/40"
                              }`}
                            >
                              <div>
                                <p className="font-bold">{kb.name}</p>
                                <p className="text-[10px] text-muted-foreground">{kb.brand}</p>
                              </div>
                              <span className="font-mono font-bold text-primary">${kb.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mice */}
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Mice Options
                        </label>
                        <div className="mt-3 flex flex-col gap-2">
                          {builderOptions.mice.map((ms) => (
                            <button
                              key={ms.id}
                              onClick={() => setSelectedMs(ms)}
                              className={`flex justify-between items-center p-3 rounded-xl border text-left text-xs ${
                                selectedMs.id === ms.id
                                  ? "border-primary bg-primary/5 text-foreground"
                                  : "border-border bg-card/20 hover:bg-card/40"
                              }`}
                            >
                              <div>
                                <p className="font-bold">{ms.name}</p>
                                <p className="text-[10px] text-muted-foreground">{ms.brand}</p>
                              </div>
                              <span className="font-mono font-bold text-primary">${ms.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: AUDIO & EXTRAS */}
                {builderStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-bold">Configure Audio & Accessories</h3>
                      <p className="text-sm text-muted-foreground">
                        Select acoustic headsets and premium surface protection mats.
                      </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Audio */}
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Audio & Headsets
                        </label>
                        <div className="mt-3 flex flex-col gap-2">
                          {builderOptions.audio.map((au) => (
                            <button
                              key={au.id}
                              onClick={() => setSelectedAu(au)}
                              className={`flex justify-between items-center p-3 rounded-xl border text-left text-xs ${
                                selectedAu.id === au.id
                                  ? "border-primary bg-primary/5 text-foreground"
                                  : "border-border bg-card/20 hover:bg-card/40"
                              }`}
                            >
                              <div>
                                <p className="font-bold">{au.name}</p>
                                <p className="text-[10px] text-muted-foreground">{au.brand}</p>
                              </div>
                              <span className="font-mono font-bold text-primary">${au.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Deskmats */}
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Deskmat Surface
                        </label>
                        <div className="mt-3 flex flex-col gap-2">
                          {builderOptions.deskmats.map((dm) => (
                            <button
                              key={dm.id}
                              onClick={() => setSelectedDm(dm)}
                              className={`flex justify-between items-center p-3 rounded-xl border text-left text-xs ${
                                selectedDm.id === dm.id
                                  ? "border-primary bg-primary/5 text-foreground"
                                  : "border-border bg-card/20 hover:bg-card/40"
                              }`}
                            >
                              <div>
                                <p className="font-bold">{dm.name}</p>
                                <p className="text-[10px] text-muted-foreground">{dm.brand}</p>
                              </div>
                              <span className="font-mono font-bold text-primary">${dm.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: FINAL BUNDLE PREVIEW */}
                {builderStep === 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-lg font-bold mb-4">Workstation Bundle Preview</h3>

                    <div className="grid gap-3 bg-black/40 border border-border/40 p-5 rounded-2xl">
                      <div className="flex justify-between text-xs py-1 border-b border-border/10">
                        <span className="text-muted-foreground">Keyboard: {selectedKb.name}</span>
                        <span className="font-mono text-foreground font-semibold">
                          ${selectedKb.price}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-border/10">
                        <span className="text-muted-foreground">Mouse: {selectedMs.name}</span>
                        <span className="font-mono text-foreground font-semibold">
                          ${selectedMs.price}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-border/10">
                        <span className="text-muted-foreground">Audio: {selectedAu.name}</span>
                        <span className="font-mono text-foreground font-semibold">
                          ${selectedAu.price}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1 border-b border-border/10">
                        <span className="text-muted-foreground">Deskmat: {selectedDm.name}</span>
                        <span className="font-mono text-foreground font-semibold">
                          ${selectedDm.price}
                        </span>
                      </div>

                      {/* Package Discount */}
                      <div className="flex justify-between text-xs py-1 text-success-foreground bg-success/15 px-2 rounded mt-2">
                        <span className="font-semibold">Volume Bundle discount (10%)</span>
                        <span className="font-mono font-extrabold">
                          -${(calculateSubtotal() * 0.1).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm pt-4 border-t border-border/40 font-bold">
                        <span>Requisition Total:</span>
                        <span className="font-mono text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ${(calculateSubtotal() * 0.9).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Compatibility Check */}
                    <div className="mt-4 flex items-center gap-2.5 bg-success/10 border border-success/30 rounded-xl p-3.5">
                      <ShieldCheck className="h-5 w-5 text-success" />
                      <div>
                        <p className="text-xs font-bold text-success">
                          Hardware Compatibility Checked
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          All peripherals support standard USB-C telemetry daisy chains.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex justify-between items-center mt-8 border-t border-border/30 pt-6">
                <Button
                  disabled={builderStep === 1}
                  onClick={() => setBuilderStep((prev) => Math.max(1, prev - 1))}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-border hover:bg-card/45"
                >
                  Back
                </Button>

                {builderStep < 4 ? (
                  <Button
                    onClick={() => setBuilderStep((prev) => Math.min(4, prev + 1))}
                    size="sm"
                    className="rounded-xl bg-primary text-primary-foreground font-semibold"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleAddBundleToCart}
                    size="sm"
                    className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-glow"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" /> Add Bundle to Requisition
                  </Button>
                )}
              </div>
            </div>

            {/* Right Summary Live Cards */}
            <div className="liquid-card rounded-3xl p-6 border-primary/20 sticky top-24">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground mb-4">
                Workspace Bundle Showcase
              </h3>

              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/30 to-background/50 aspect-video flex items-center justify-center p-4">
                {stationType === "gaming" ? (
                  <img
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400"
                    alt="Esports Presets"
                    className="h-full w-full object-cover rounded-xl filter brightness-[0.9]"
                  />
                ) : stationType === "coding" ? (
                  <img
                    src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400"
                    alt="Developer Presets"
                    className="h-full w-full object-cover rounded-xl filter brightness-[0.9]"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=400"
                    alt="Office Presets"
                    className="h-full w-full object-cover rounded-xl filter brightness-[0.9]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <div>
                    <Badge className="bg-primary/20 text-primary border-none text-[10px]">
                      {stationType.toUpperCase()} LAYOUT
                    </Badge>
                    <p className="text-xs text-zinc-400 mt-1">
                      Configured for active warehouse environments
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic specs indicators */}
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Configured Hardware Specifications
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <Keyboard className="h-4 w-4 text-primary" />
                  <span>{selectedKb.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mouse className="h-4 w-4 text-accent" />
                  <span>{selectedMs.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Headphones className="h-4 w-4 text-success" />
                  <span>{selectedAu.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <LayoutGrid className="h-4 w-4 text-chart-3" />
                  <span>{selectedDm.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: DIAGNOSTIC & MAINTENANCE LOGS TIMELINE ================= */}
      <section className="relative py-24 bg-card/5 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="liquid-orb absolute left-1/3 top-1/3 h-[420px] w-[420px] bg-primary/10 opacity-70" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary mb-3">
              Diagnostics timeline
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Proactive Servicing & Predictive Maintenance
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Check real-time hardware status updates, resolved work tickets, and AI-predicted
              battery notifications.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl">
            {/* Centered Timeline line */}
            <div className="absolute left-4 sm:left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-accent to-zinc-800 -translate-x-1/2" />

            <div className="space-y-12">
              {/* Event 1 */}
              <div className="relative flex flex-col sm:flex-row items-start justify-between sm:odd:flex-row-reverse group">
                <div className="absolute left-4 sm:left-1/2 h-8 w-8 rounded-full bg-zinc-950 border-2 border-success flex items-center justify-center -translate-x-1/2 z-10 shadow-[0_0_15px_oklch(0.70_0.17_160/0.4)]">
                  <Check className="h-4 w-4 text-success" />
                </div>

                {/* Panel Card */}
                <div className="liquid-card ml-12 sm:ml-0 sm:w-[45%] rounded-2xl p-6 border-border/80 hover:border-success/30 transition-all">
                  <span className="text-[10px] font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    RESOLVED
                  </span>
                  <h3 className="text-lg font-bold mt-3">Sensor Cleaning Cycle</h3>
                  <p className="text-xs text-muted-foreground mt-1">Warehouse Alpha — Bin 12 to 24</p>
                  <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed">
                    Optoelectronic sensors cleared of dust. Scrollwheel encoders checked and
                    calibrated for zero drag.
                  </p>
                  <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Completed 2 hours ago
                  </div>
                </div>
                <div className="hidden sm:block w-[45%]" />
              </div>

              {/* Event 2 */}
              <div className="relative flex flex-col sm:flex-row items-start justify-between sm:odd:flex-row-reverse group">
                <div className="absolute left-4 sm:left-1/2 h-8 w-8 rounded-full bg-zinc-950 border-2 border-primary flex items-center justify-center -translate-x-1/2 z-10 shadow-[0_0_15px_oklch(0.58_0.24_274/0.4)]">
                  <RefreshCw
                    className="h-4 w-4 text-primary animate-spin"
                    style={{ animationDuration: "3s" }}
                  />
                </div>

                {/* Panel Card */}
                <div className="liquid-card ml-12 sm:ml-0 sm:w-[45%] rounded-2xl p-6 border-border/80 hover:border-primary/30 transition-all">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    IN PROGRESS
                  </span>
                  <h3 className="text-lg font-bold mt-3">Keycap Refurbishing</h3>
                  <p className="text-xs text-muted-foreground mt-1">Warehouse Delta — Multi Bins</p>
                  <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed">
                    Replacing damaged keycaps with high-density PBT doubleshot keycaps. Custom laser
                    engraving for warehouse hotkeys.
                  </p>
                  <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Started 24 mins ago
                  </div>
                </div>
                <div className="hidden sm:block w-[45%]" />
              </div>

              {/* Event 3 */}
              <div className="relative flex flex-col sm:flex-row items-start justify-between sm:odd:flex-row-reverse group">
                <div className="absolute left-4 sm:left-1/2 h-8 w-8 rounded-full bg-zinc-950 border-2 border-amber-500 flex items-center justify-center -translate-x-1/2 z-10 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                  <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse" />
                </div>

                {/* Panel Card */}
                <div className="liquid-card ml-12 sm:ml-0 sm:w-[45%] rounded-2xl p-6 border-border/80 hover:border-amber-500/30 transition-all">
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    AI PREDICTIVE WARNING
                  </span>
                  <h3 className="text-lg font-bold mt-3">Battery Exhaustion Alert</h3>
                  <p className="text-xs text-muted-foreground mt-1">Warehouse Gamma — Bin 08 Scanner</p>
                  <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed">
                    Scanner telemetry registers voltage drop below 1.15V. Replacement scheduled before
                    next warehouse audit.
                  </p>
                  <div className="mt-4 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Warning triggered 1 hour ago
                  </div>
                </div>
                <div className="hidden sm:block w-[45%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NEW SECTION: SUPPLY CHAIN FLOW GRAPH ================= */}
      <section className="relative py-24 bg-zinc-950 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="liquid-orb absolute right-10 top-10 h-[400px] w-[400px] bg-primary/5 opacity-50" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge className="bg-primary/10 text-primary border border-primary/20 py-1 px-3 mb-4">
              Logistics Infrastructure
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl animate-fade-in">
              Automated Requisition & Supply Flow
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Click on any stage in our directed logistics graph to inspect real-time SLA metrics, compliance gates, and inventory workflows.
            </p>
          </div>

          {/* Interactive DAG Flowchart */}
          <div className="grid gap-8">
            <div className="liquid-card rounded-3xl p-8 border-border/60 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[900px] gap-4 py-6 relative">
                {/* Connecting SVG Path Line Behind Nodes */}
                <svg className="absolute inset-0 h-full w-full pointer-events-none -z-10" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="flow-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="50%" stopColor="var(--color-accent)" />
                      <stop offset="100%" stopColor="var(--color-success)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 50 70 L 250 70 L 450 70 L 650 70 L 850 70"
                    fill="none"
                    stroke="url(#flow-line-grad)"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                    className="animate-dash"
                  />
                </svg>

                {[
                  { title: "1. Requisition Ingest", desc: "SLA Ticket Parsing", metric: "1.2 min SLA", status: "Active" },
                  { title: "2. Security & SLA Gate", desc: "Role Check & Sign", metric: "FIPS 140-3 Check", status: "Secured" },
                  { title: "3. Bin Allocation", desc: "Optimal Storage Rack", metric: "99.98% Precision", status: "Ready" },
                  { title: "4. Payment Gate", desc: "Stripe & Invoicing", metric: "Real-time Sync", status: "Enabled" },
                  { title: "5. Dispatch Transit", desc: "Logistics Routing", metric: "24h Turnaround", status: "Shipping" },
                ].map((step, idx) => {
                  const isActive = activeFlowStep === idx;
                  return (
                    <button
                      key={step.title}
                      onClick={() => {
                        setActiveFlowStep(idx);
                        toast.info(`Inspecting logistics flow: ${step.title}`);
                      }}
                      className={`w-44 flex flex-col items-center text-center p-4 rounded-2xl border transition-all relative z-10 cursor-pointer ${
                        isActive
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.06] shadow-glow"
                          : "border-border bg-zinc-950/80 hover:border-primary/40 hover:bg-card/30"
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs mb-3 ${
                        isActive ? "bg-primary text-primary-foreground shadow" : "bg-secondary text-muted-foreground"
                      }`}>
                        {idx + 1}
                      </div>
                      <h4 className="text-xs font-bold text-foreground">{step.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate w-full">{step.desc}</p>
                      <Badge variant="outline" className={`mt-3 text-[8px] font-bold py-0.5 ${
                        isActive ? "border-primary/40 text-primary bg-primary/5" : "border-border text-muted-foreground"
                      }`}>
                        {step.metric}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Step Detail Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFlowStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="liquid-card rounded-3xl p-8 border-primary/20 bg-gradient-to-r from-card/30 via-card/50 to-primary/5"
              >
                {[
                  {
                    title: "Requisition Submission & Ticket Ingestion",
                    details: "Incoming hardware checkouts are fed directly into our centralized telemetry database. AI automatically parses the brand, category, and target location. If stock levels are healthy, the requisition status updates to Pending, reserving the matching serial from the rack.",
                    subMetrics: [["SLA speed", "1.2 min avg"], ["Automation Rate", "98.5%"], ["System State", "Synchronized"]],
                    compliance: "NIST SP 800 compliant metadata collection."
                  },
                  {
                    title: "Role Auditing & Security Clearance Gate",
                    details: "Every check-out undergoes strict role-based capability vetting. Requisitions for staff require standard validation, while high-value assets (such as 5K monitors) trigger secondary approval alerts to the Admin panel. Security hashes are stored on our encrypted audit trails.",
                    subMetrics: [["Vetting protocol", "FIPS 140-3"], ["Authorization Gate", "Role Context check"], ["Alert threshold", "> $200"]],
                    compliance: "RBAC (Role Based Access Control) enforces granular data segregation."
                  },
                  {
                    title: "Optimal Bin Storage Allocation",
                    details: "The system allocates reserve items by matching inventory categories to the closest Fulfillment Center Bin. Serial number scanning ensures that the oldest available inventory is checked out first (FIFO policy) to manage hardware warranty cycles effectively.",
                    subMetrics: [["Shelf Accuracy", "99.98%"], ["Serial Tracking", "Mandatory"], ["LED Rack Guide", "Active on BIN-X"]],
                    compliance: "Live serial mapping prevents inventory discrepancies."
                  },
                  {
                    title: "Stripe Payments & Procurement Invoicing",
                    details: "Out-of-pocket checkouts trigger an instant Stripe payment route. Our webhook listener monitors the Stripe API for successful invoice clearance, automatically upgrading the tracking status to Confirmed and generating order dispatch tickets without human intervention.",
                    subMetrics: [["Payment processing", "Secure Stripe SDK"], ["Webhook Sync", "150ms latency"], ["Invoice generation", "PDF automated"]],
                    compliance: "PCI-DSS Level 1 secure payment environment."
                  },
                  {
                    title: "Fulfillment Packing & Logistics Transit Route",
                    details: "Orders are safely packed inside ruggedized, anti-static container units. Barcodes are printed dynamically matching our graph-based tracking database. Once the transit provider triggers the scanner, a live status signal is sent, transitioning the order to Shipped.",
                    subMetrics: [["Carrier options", "FedEx / DHL / DPD"], ["Dispatch latency", "< 24 hours"], ["Transit Status", "Active nodes"]],
                    compliance: "Real-time transit updates mapped on visual DAG graph."
                  }
                ].map((info, idx) => {
                  if (activeFlowStep !== idx) return null;
                  return (
                    <div key={idx} className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
                      <div>
                        <Badge className="bg-primary/20 text-primary border-none px-2.5 py-0.5 text-[9px] uppercase font-bold">
                          Step {idx + 1} Workflow
                        </Badge>
                        <h3 className="text-xl font-extrabold text-foreground mt-2">{info.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-4">
                          {info.details}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-6 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Compliance: {info.compliance}
                        </p>
                      </div>
                      <div className="grid gap-3 bg-black/30 border border-border/40 p-5 rounded-2xl h-fit">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          SLA Performance & Auditing
                        </h4>
                        {info.subMetrics.map(([lbl, val]) => (
                          <div key={lbl} className="flex justify-between items-center text-xs py-1 border-b border-border/10 last:border-0">
                            <span className="text-muted-foreground">{lbl}</span>
                            <span className="font-bold text-foreground font-mono">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ================= NEW SECTION: BLUEPRINT ANATOMY EXPLORER ================= */}
      <section className="relative py-24 bg-card/10 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="liquid-orb absolute left-1/3 bottom-10 h-[420px] w-[420px] bg-accent/5 opacity-40" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Badge variant="outline" className="border-accent/40 bg-accent/5 text-accent mb-3">
              Hardware Design Studio
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Peripheral Blueprint Explorer
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Hover over the technical blueprint hotspots to explore mechanical keyboard and tracking mouse logistics specifications.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Keyboard Explorer */}
            <div className="liquid-card rounded-3xl p-8 border-border/60 relative overflow-hidden bg-zinc-950/60">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" /> Industrial Mechanical Keyboard
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Interactive parts schematic and warehouse serial count.</p>
              
              <div className="relative aspect-[16/10] border border-border/40 rounded-2xl bg-black/50 p-4 flex flex-col items-center justify-center">
                {/* SVG Blueprint Draw */}
                <svg className="w-4/5 h-auto text-primary/30" viewBox="0 0 200 100" fill="none" stroke="currentColor" strokeWidth="0.7">
                  <rect x="10" y="20" width="180" height="60" rx="6" />
                  <line x1="20" y1="30" x2="180" y2="30" />
                  <line x1="20" y1="42" x2="180" y2="42" />
                  <line x1="20" y1="54" x2="180" y2="54" />
                  <line x1="20" y1="66" x2="180" y2="66" />
                  {/* Spacebar */}
                  <rect x="55" y="68" width="90" height="8" rx="2" fill="currentColor" fillOpacity="0.05" />
                  {/* Hotspots visual pointers */}
                  <circle cx="35" cy="36" r="3" className="stroke-accent animate-ping" />
                  <circle cx="100" cy="72" r="3" className="stroke-accent animate-ping" />
                  <circle cx="145" cy="48" r="3" className="stroke-accent animate-ping" />
                </svg>

                {/* Hotspot buttons */}
                {/* Hotspot 1: Switch Stem */}
                <div className="absolute top-[32%] left-[22%] group/hs">
                  <span className="relative flex h-5 w-5 cursor-pointer">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-primary/20 border border-primary flex items-center justify-center font-mono text-[8px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all">S</span>
                  </span>
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/hs:block w-48 bg-zinc-950/95 border border-primary/35 rounded-xl p-3 text-[10px] text-zinc-300 shadow-xl z-20 backdrop-blur">
                    <p className="font-extrabold text-foreground text-xs text-primary">Hot-Swap Switches</p>
                    <p className="mt-1 leading-relaxed">Cherry MX Red & Gateron Brown tactiles. Active stock: <span className="font-bold text-foreground">185 units</span> across Rack 02.</p>
                  </div>
                </div>

                {/* Hotspot 2: Keycap */}
                <div className="absolute top-[48%] left-[72%] group/hs">
                  <span className="relative flex h-5 w-5 cursor-pointer">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-primary/20 border border-primary flex items-center justify-center font-mono text-[8px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all">K</span>
                  </span>
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/hs:block w-48 bg-zinc-950/95 border border-primary/35 rounded-xl p-3 text-[10px] text-zinc-300 shadow-xl z-20 backdrop-blur">
                    <p className="font-extrabold text-foreground text-xs text-primary">PBT Doubleshot Deck</p>
                    <p className="mt-1 leading-relaxed">Non-wear doubleshot legends. Bulk replenishment index: <span className="font-bold text-foreground">30 packs</span> reserved in Bin 15.</p>
                  </div>
                </div>

                {/* Hotspot 3: Controller */}
                <div className="absolute top-[68%] left-[50%] group/hs">
                  <span className="relative flex h-5 w-5 cursor-pointer">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-accent/20 border border-accent flex items-center justify-center font-mono text-[8px] font-bold text-accent hover:bg-accent hover:text-accent-foreground transition-all">C</span>
                  </span>
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/hs:block w-48 bg-zinc-950/95 border border-accent/35 rounded-xl p-3 text-[10px] text-zinc-300 shadow-xl z-20 backdrop-blur">
                    <p className="font-extrabold text-foreground text-xs text-accent">Telemetry Controller</p>
                    <p className="mt-1 leading-relaxed">Runs dynamic link check and calibration sweeps. Average response sync: <span className="font-bold text-foreground">0.8ms</span>.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mouse Explorer */}
            <div className="liquid-card rounded-3xl p-8 border-border/60 relative overflow-hidden bg-zinc-950/60">
              <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Mouse className="h-5 w-5 text-accent" /> High-Precision Tracking Mouse
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Interactive parts schematic and sensor telemetry metrics.</p>

              <div className="relative aspect-[16/10] border border-border/40 rounded-2xl bg-black/50 p-4 flex flex-col items-center justify-center">
                {/* SVG Blueprint Draw */}
                <svg className="w-1/3 h-auto text-accent/30" viewBox="0 0 100 150" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <rect x="15" y="10" width="70" height="130" rx="35" />
                  <line x1="50" y1="10" x2="50" y2="60" />
                  <rect x="42" y="25" width="16" height="25" rx="3" fill="currentColor" fillOpacity="0.05" />
                  <circle cx="50" cy="90" r="10" strokeDasharray="3 3" />
                  {/* Hotspots visual pointers */}
                  <circle cx="50" cy="37" r="3" className="stroke-primary animate-ping" />
                  <circle cx="50" cy="90" r="3" className="stroke-primary animate-ping" />
                  <circle cx="20" cy="65" r="3" className="stroke-primary animate-ping" />
                </svg>

                {/* Hotspot buttons */}
                {/* Hotspot 1: Wheel */}
                <div className="absolute top-[22%] left-[50%] group/hs -translate-x-1/2">
                  <span className="relative flex h-5 w-5 cursor-pointer">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-accent/20 border border-accent flex items-center justify-center font-mono text-[8px] font-bold text-accent hover:bg-accent hover:text-accent-foreground transition-all">W</span>
                  </span>
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/hs:block w-48 bg-zinc-950/95 border border-accent/35 rounded-xl p-3 text-[10px] text-zinc-300 shadow-xl z-20 backdrop-blur">
                    <p className="font-extrabold text-foreground text-xs text-accent">Optical Scroll Encoder</p>
                    <p className="mt-1 leading-relaxed">Precision scrollwheel mapped for fast scrolling. Calibration interval: <span className="font-bold text-foreground">6 months</span>.</p>
                  </div>
                </div>

                {/* Hotspot 2: Sensor */}
                <div className="absolute top-[60%] left-[50%] group/hs -translate-x-1/2">
                  <span className="relative flex h-5 w-5 cursor-pointer">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-primary/20 border border-primary flex items-center justify-center font-mono text-[8px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all">S</span>
                  </span>
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/hs:block w-48 bg-zinc-950/95 border border-primary/35 rounded-xl p-3 text-[10px] text-zinc-300 shadow-xl z-20 backdrop-blur">
                    <p className="font-extrabold text-foreground text-xs text-primary">8K Hero Tracker Sensor</p>
                    <p className="mt-1 leading-relaxed">Tracks on glass surfaces. Active warehouse checkout count: <span className="font-bold text-foreground">112 units</span> checked in.</p>
                  </div>
                </div>

                {/* Hotspot 3: Lateral Grip */}
                <div className="absolute top-[43%] left-[30%] group/hs">
                  <span className="relative flex h-5 w-5 cursor-pointer">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-primary/20 border border-primary flex items-center justify-center font-mono text-[8px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all">G</span>
                  </span>
                  <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/hs:block w-48 bg-zinc-950/95 border border-primary/35 rounded-xl p-3 text-[10px] text-zinc-300 shadow-xl z-20 backdrop-blur">
                    <p className="font-extrabold text-foreground text-xs text-primary">Ergonomic Grips</p>
                    <p className="mt-1 leading-relaxed">Textured industrial shell. Replaced during preventative maintenance if wear score exceeds <span className="font-bold text-foreground">75%</span>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= NEW SECTION: LIVE DISPATCH SHIPMENT TRACKING MAP ================= */}
      <section className="relative py-24 bg-zinc-950 border-b border-border/20">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="liquid-orb absolute right-1/4 top-1/4 h-[350px] w-[350px] bg-primary/5 opacity-40" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] items-center">
            {/* Details Panel */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="border-success/40 bg-success/5 text-success mb-3">
                  Logistics Network Live
                </Badge>
                <h2 className="text-4xl font-extrabold tracking-tight">
                  Active Dispatch Operations
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Our unified logistics network delivers peripherals on-demand. Watch live dispatches stream from Fulfillment Hub Alpha to regional warehouse stations.
                </p>
              </div>

              {/* Transit Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-card/20">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Today's Dispatches</p>
                  <p className="text-2xl font-black text-primary mt-1">1,480 units</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-card/20">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">On-Time rate</p>
                  <p className="text-2xl font-black text-success mt-1">99.88%</p>
                </div>
              </div>
            </div>

            {/* SVG Dispatch Network Map */}
            <div className="liquid-card rounded-3xl p-6 border-border/60 bg-black/60 relative aspect-video flex flex-col justify-between overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">Fulfillment Hub Alpha Feed</span>
                </div>
                <Badge variant="outline" className="text-[8px] font-bold text-emerald-400 border-emerald-400/20 bg-emerald-400/5">AUTO ROUTING ACTIVE</Badge>
              </div>

              {/* Map SVG */}
              <svg className="w-full h-full text-zinc-800" viewBox="0 0 500 250" fill="none">
                <circle cx="250" cy="125" r="16" className="fill-primary/20 stroke-primary" strokeWidth="2" />
                <text x="250" y="102" textAnchor="middle" className="fill-foreground font-bold text-[9px]">Hub Alpha</text>
                
                {/* Branches to Hubs */}
                {/* 1. Boston */}
                <path d="M 250 125 Q 170 60 120 70" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="5 4" />
                <circle cx="120" cy="70" r="6" className="fill-zinc-900 stroke-zinc-700" strokeWidth="1.5" />
                <circle cx="120" cy="70" r="12" className="stroke-primary/20 animate-pulse" strokeWidth="1.5" />
                <text x="120" y="54" textAnchor="middle" className="fill-muted-foreground font-bold text-[8px]">Boston Dock A</text>

                {/* 2. Malibu */}
                <path d="M 250 125 Q 380 70 420 90" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="5 4" />
                <circle cx="420" cy="90" r="6" className="fill-zinc-900 stroke-zinc-700" strokeWidth="1.5" />
                <circle cx="420" cy="90" r="12" className="stroke-accent/20 animate-pulse" strokeWidth="1.5" />
                <text x="420" y="74" textAnchor="middle" className="fill-muted-foreground font-bold text-[8px]">Malibu Logistics</text>

                {/* 3. Austin */}
                <path d="M 250 125 Q 350 190 380 200" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="5 4" />
                <circle cx="380" cy="200" r="6" className="fill-zinc-900 stroke-zinc-700" strokeWidth="1.5" />
                <circle cx="380" cy="200" r="12" className="stroke-success/20 animate-pulse" strokeWidth="1.5" />
                <text x="380" y="216" textAnchor="middle" className="fill-muted-foreground font-bold text-[8px]">Austin Storage</text>

                {/* 4. Seattle */}
                <path d="M 250 125 Q 150 180 80 160" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="5 4" />
                <circle cx="80" cy="160" r="6" className="fill-zinc-900 stroke-zinc-700" strokeWidth="1.5" />
                <circle cx="80" cy="160" r="12" className="stroke-primary/20 animate-pulse" strokeWidth="1.5" />
                <text x="80" y="146" textAnchor="middle" className="fill-muted-foreground font-bold text-[8px]">Seattle Hub</text>

                {/* Pulsing delivery nodes traveling along paths */}
                <circle cx="210" cy="100" r="3" className="fill-primary animate-pulse" />
                <circle cx="330" cy="98" r="3" className="fill-accent animate-pulse" />
                <circle cx="310" cy="165" r="3" className="fill-success animate-pulse" />
                <circle cx="160" cy="155" r="3" className="fill-primary animate-pulse" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 5: WAREHOUSE SHOWROOM CAROUSEL ================= */}
      <section className="relative py-24 border-b border-border/20 bg-gradient-to-b from-transparent to-card/20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-16">
            <div>
              <Badge className="bg-primary/10 text-primary border-none px-3 py-1 mb-4">
                Warehouse Showroom
              </Badge>
              <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Design Showcases in Fulfillment Centers
              </h2>
              <p className="mt-3 text-muted-foreground max-w-2xl">
                Explore modern warehouse hubs and fulfillment centers globally optimized using LabTrack's
                inventory layouts.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowroomIndex((prev) => (prev === 0 ? showroomSetups.length - 1 : prev - 1));
                  toast.info("Navigated Gallery Left");
                }}
                variant="outline"
                className="liquid-card h-10 w-10 p-0 rounded-full border-border/80 flex items-center justify-center cursor-pointer"
              >
                &larr;
              </Button>
              <Button
                onClick={() => {
                  setShowroomIndex((prev) => (prev === showroomSetups.length - 1 ? 0 : prev + 1));
                  toast.info("Navigated Gallery Right");
                }}
                variant="outline"
                className="liquid-card h-10 w-10 p-0 rounded-full border-border/80 flex items-center justify-center cursor-pointer"
              >
                &rarr;
              </Button>
            </div>
          </div>

          {/* Carousel Slide container */}
          <div className="relative min-h-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={showroomIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-center"
              >
                {/* Photo slide */}
                <div className="relative overflow-hidden rounded-3xl border border-primary/20 aspect-[16/10] shadow-2xl">
                  <img
                    src={showroomSetups[showroomIndex].image}
                    alt={showroomSetups[showroomIndex].title}
                    className="h-full w-full object-cover filter brightness-[0.8]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <Badge className="bg-primary text-primary-foreground border-none px-3 py-1 font-bold text-xs uppercase">
                      {showroomSetups[showroomIndex].tag}
                    </Badge>
                  </div>
                </div>

                {/* Details slide */}
                <div className="space-y-6">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">
                    {showroomSetups[showroomIndex].location}
                  </p>
                  <h3 className="text-3xl font-extrabold tracking-tight">
                    {showroomSetups[showroomIndex].title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {showroomSetups[showroomIndex].description}
                  </p>

                  <div className="p-5 rounded-2xl border border-border/60 bg-card/30 backdrop-blur">
                    <h4 className="text-sm font-bold text-foreground mb-3">
                      Key Configuration Items
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" /> Keyboards configured
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" /> Wired/Wireless hybrid
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" /> Dynamic serial tracking
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" /> Multi-station mapping
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY GRID ===== */}
      <section className="relative py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-3">
                Shop by Category
              </Badge>
              <h2 className="text-4xl font-extrabold tracking-tight">
                Find exactly what your warehouse needs
              </h2>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-primary hover:text-accent font-semibold transition-colors"
            >
              <Link to="/products">
                All categories <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to="/products"
                  className="liquid-card group flex flex-col items-center justify-center gap-4 rounded-2xl p-6 transition-all hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_15px_40px_-15px_oklch(0.62_0.22_257/0.4)]"
                >
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/15 text-primary group-hover:from-primary group-hover:to-accent group-hover:text-primary-foreground shadow-inner transition-all duration-300">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5">{c.count} items</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED HERO PRODUCT ===== */}
      {heroDevice && (
        <section className="relative py-24 border-b border-border/20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="liquid-orb absolute right-0 top-1/3 h-[420px] w-[420px] bg-primary/15 opacity-60" />
          </div>

          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Link
                to="/products/$id"
                params={{ id: heroDevice.id }}
                className="liquid-card group block overflow-hidden rounded-[2.5rem] p-4 border-primary/15 shadow-glow"
              >
                <div className="aspect-square overflow-hidden rounded-[2rem] bg-gradient-to-br from-secondary/50 to-card">
                  {heroDevice.image_url && (
                    <img
                      src={heroDevice.image_url}
                      alt={heroDevice.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                </div>
              </Link>

              <div>
                <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 border-none text-primary mb-4">
                  ⭐ Featured Requisition Pick
                </Badge>
                <h3 className="text-4xl font-black tracking-tight">{heroDevice.name}</h3>
                <p className="mt-2 text-lg text-muted-foreground">
                  {heroDevice.brand} &bull; {heroDevice.category}
                </p>
                {heroDevice.description && (
                  <p className="mt-6 leading-relaxed text-muted-foreground/90 text-sm">
                    {heroDevice.description}
                  </p>
                )}

                <div className="mt-6 flex items-baseline gap-3">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-black text-transparent">
                    ${Number(heroDevice.price).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground/60 line-through">
                    ${(Number(heroDevice.price) * 1.2).toFixed(2)}
                  </span>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-glow"
                  >
                    <Link to="/products/$id" params={{ id: heroDevice.id }}>
                      View Specifications <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="liquid-card border-border hover:bg-card/45"
                  >
                    <Link to="/products">More Products</Link>
                  </Button>
                </div>

                {/* Substats */}
                <div className="mt-10 grid grid-cols-3 gap-3">
                  {[
                    ["Free", "Lab Calibration"],
                    ["1-Year", "Premium Warranty"],
                    ["Bulk Check", "Compliant"],
                  ].map(([val, label]) => (
                    <div
                      key={val + label}
                      className="liquid-card rounded-2xl p-4 text-center border-border/60"
                    >
                      <p className="text-lg font-black text-primary">{val}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1 tracking-wider">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURES / VALUE STATEMENTS ===== */}
      <section className="relative py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-3">
              Core features
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight">Everything lab managers need</h2>
            <p className="mt-3 text-muted-foreground text-sm">
              Consolidated hardware logs, procurement gates, and diagnostics tools.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="liquid-card group h-full rounded-2xl p-6 border-border/60 hover:border-primary/30 hover:scale-[1.01] transition-all">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS GRID ===== */}
      <section className="py-24 border-b border-border/20 bg-card/5">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <Badge variant="outline" className="border-accent/40 bg-accent/5 text-accent mb-3">
                Best Sellers
              </Badge>
              <h2 className="text-4xl font-extrabold tracking-tight">Top Peripherals This Month</h2>
              <p className="mt-2 text-muted-foreground text-sm">
                Hand-picked, warehouse-tested hardware with certified warranty.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="liquid-card border-border hover:bg-card/45"
            >
              <Link to="/products">
                View all catalog <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {devicesShow.slice(0, 8).map((p: any, i: number) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to="/products/$id"
                  params={{ id: p.id }}
                  className="liquid-card group relative block overflow-hidden rounded-2xl border-border/60 transition-all hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-25px_oklch(0.62_0.22_257/0.5)]"
                >
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary to-card">
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                    )}
                  </div>
                  <div className="absolute right-3 top-3">
                    <Badge className="bg-background/80 text-foreground backdrop-blur-md border border-border/40 text-[9px] font-bold">
                      {p.category}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider">
                      {p.brand}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-foreground">{p.name}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-lg font-extrabold text-transparent">
                        ${Number(p.price).toFixed(2)}
                      </span>
                      <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[9px] font-bold text-success">
                        In stock
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TELEMETRY STATS GRID ===== */}
      <section className="relative py-20 border-b border-border/20 bg-gradient-to-b from-transparent to-card/25">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="liquid-orb absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 bg-primary/10 opacity-70" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="liquid-card rounded-2xl p-6 text-center border-border/60"
            >
              <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-black text-transparent">
                {s.value}
              </div>
              <div className="mt-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-3">
              Loved by Logistics Managers
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              What logistics coordinators and IT admins are saying
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="liquid-card h-full border-border/60 hover:border-primary/20 transition-all">
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex gap-1 text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current text-accent" />
                        ))}
                      </div>
                      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-3.5 border-t border-border/20 pt-4">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow">
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ PREVIEW ACCORDIONS ===== */}
      <section className="py-24 border-b border-border/20 bg-card/5">
        <div className="mx-auto max-w-4xl px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="border-accent/40 bg-accent/5 text-accent mb-3">
              FAQ
            </Badge>
            <h2 className="text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="grid gap-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="liquid-card group rounded-2xl p-5 border-border/60 cursor-pointer"
              >
                <summary className="flex cursor-pointer items-center justify-between font-bold text-sm select-none">
                  {item.q}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary group-open:bg-accent group-open:text-accent-foreground transition-all">
                    &darr;
                  </span>
                </summary>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground/90 border-t border-border/10 pt-4">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              asChild
              variant="outline"
              className="liquid-card border-border hover:bg-card/45 rounded-xl"
            >
              <Link to="/faq">Read All Frequently Asked Questions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== CTA / NEWSLETTER ===== */}
      <section className="relative py-24">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="liquid-orb absolute -top-20 left-1/4 h-[420px] w-[420px] bg-primary/10 opacity-70" />
          <div className="liquid-orb absolute -bottom-20 right-1/4 h-[420px] w-[420px] bg-accent/15 opacity-60" />
        </div>

        <div className="mx-auto max-w-4xl px-4 text-center lg:px-8">
          <div className="liquid-card mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border-primary/20 shadow-glow">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight">Stay in the loop</h2>
          <p className="mt-3 text-muted-foreground text-sm max-w-md mx-auto">
            Get monthly updates regarding hardware diagnostic patterns, warranty templates, and
            volume discount updates.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              (e.target as HTMLFormElement).reset();
              toast.success("Subscribed successfully! Welcome to the LabTrack loop.");
            }}
            className="liquid-card mx-auto mt-10 flex max-w-md gap-2 rounded-full p-2.5 border-border/80"
          >
            <input
              required
              type="email"
              placeholder="logistics@warehouse.com"
              className="flex-1 rounded-full bg-transparent px-4 py-2 text-xs outline-none placeholder:text-muted-foreground/60 text-foreground"
            />
            <Button
              type="submit"
              className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold hover:opacity-90 transition-opacity"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* WATCH SHOWCASE VIDEO DIALOG MODAL */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="liquid-card w-full max-w-3xl rounded-3xl border border-primary/20 overflow-hidden bg-zinc-950 p-2 shadow-2xl relative"
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-zinc-900 border border-border/80 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-secondary transition-colors z-10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black flex flex-col items-center justify-center relative">
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200"
                alt="Video thumbnail"
                className="absolute inset-0 h-full w-full object-cover filter brightness-[0.4]"
              />
              <div className="z-10 text-center p-6 space-y-4">
                <PlayCircle className="h-16 w-16 text-primary mx-auto animate-pulse" />
                <h3 className="text-xl font-bold text-white">LabTrack Walkthrough</h3>
                <p className="text-xs text-zinc-300 max-w-md">
                  In this demonstration, see how LabTrack monitors active keystrokes, tracks
                  warranty schedules, and automates inventory audits.
                </p>
                <Button
                  onClick={() => setVideoOpen(false)}
                  size="sm"
                  className="bg-primary text-primary-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Icons helper components for Builder presets
function CodePresetIcon(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function GamePresetIcon(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="3" />
    </svg>
  );
}

function OfficePresetIcon(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
