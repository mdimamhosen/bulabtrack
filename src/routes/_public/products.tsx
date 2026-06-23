import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/products")({
  component: ProductsLayout,
});

function ProductsLayout() {
  return <Outlet />;
}

// Master mapping engine to inject rich "Nano Banana" specs, ratings, and gallery images
export function enhanceProductWithNanoBanana(p: any) {
  if (!p) return null;
  const hasUploadedImage = Boolean(p.image_url?.trim());
  const nameLower = (p.name || "").toLowerCase();
  const catLower = (p.category || "").toLowerCase();

  // Fine-grained category detection
  const isKeyboard =
    nameLower.includes("keyboard") || nameLower.includes("keypad") || catLower.includes("keyboard");
  const isMouse =
    nameLower.includes("mouse") ||
    nameLower.includes("mice") ||
    nameLower.includes("trackball") ||
    catLower.includes("mouse");
  const isAudio =
    nameLower.includes("headset") ||
    nameLower.includes("speaker") ||
    nameLower.includes("audio") ||
    nameLower.includes("pebble") ||
    nameLower.includes("jbl") ||
    nameLower.includes("sound") ||
    nameLower.includes("headphones");
  const isMic =
    nameLower.includes("mic") ||
    nameLower.includes("microphone") ||
    nameLower.includes("quadcast") ||
    nameLower.includes("yeti") ||
    nameLower.includes("shure") ||
    nameLower.includes("rode");
  const isWebcam =
    nameLower.includes("webcam") ||
    nameLower.includes("camera") ||
    nameLower.includes("brio") ||
    nameLower.includes("kiyo") ||
    nameLower.includes("insta360");
  const isDisplay =
    nameLower.includes("monitor") ||
    nameLower.includes("display") ||
    nameLower.includes("ultrawide") ||
    nameLower.includes("screen") ||
    nameLower.includes("crt");
  const isPrinter =
    nameLower.includes("printer") ||
    nameLower.includes("ecotank") ||
    nameLower.includes("laserjet") ||
    nameLower.includes("pixma") ||
    nameLower.includes("inkjet") ||
    nameLower.includes("writer") ||
    nameLower.includes("brother");
  const isScanner =
    nameLower.includes("scanner") || nameLower.includes("scan") || nameLower.includes("scansnap");
  const isTablet =
    nameLower.includes("pencil") ||
    nameLower.includes("stylus") ||
    nameLower.includes("tablet") ||
    nameLower.includes("digitizer") ||
    nameLower.includes("wacom") ||
    nameLower.includes("pen");
  const isPower =
    nameLower.includes("ups") ||
    nameLower.includes("battery") ||
    nameLower.includes("power") ||
    nameLower.includes("apc") ||
    nameLower.includes("charge");
  const isStorage =
    nameLower.includes("ssd") ||
    nameLower.includes("hdd") ||
    nameLower.includes("drive") ||
    nameLower.includes("flash") ||
    nameLower.includes("memory") ||
    nameLower.includes("storage");
  const isProjector =
    nameLower.includes("projector") || nameLower.includes("optoma") || nameLower.includes("tk700");
  const isVr =
    nameLower.includes("vr") ||
    nameLower.includes("virtual reality") ||
    nameLower.includes("oculus") ||
    nameLower.includes("quest");
  const isPresenter =
    nameLower.includes("presenter") ||
    nameLower.includes("remote") ||
    nameLower.includes("pointer");
  const isDongle =
    nameLower.includes("adapter") ||
    nameLower.includes("dongle") ||
    nameLower.includes("wifi") ||
    nameLower.includes("bluetooth") ||
    nameLower.includes("hub") ||
    nameLower.includes("dock") ||
    nameLower.includes("link");

  let peripheralType = "Accessory";
  let images = [p.image_url];
  let tags: string[] = ["Lab-Certified", "High Bandwidth", "Gold-Plated Pins"];
  let specsList: [string, string][] = [
    ["Brand", p.brand || "Nano Banana"],
    ["Model", p.model || "NB-Gen1"],
    ["Category", p.category],
    ["Interface", p.interface || "USB-C"],
    ["Serial #", p.serial_number || "NB-SERIAL-100"],
  ];
  let pros = ["Lab-tested durability", "Highly ergonomic", "Plug & play setup"];
  let cons = ["Requires USB-C port", "High initial cost"];
  let boxContents = [
    "Nano Banana Hardware Unit",
    "1.8m Braided USB-C Cable",
    "Calibration Guide",
    "Academic Warranty Card",
  ];

  if (isKeyboard) {
    peripheralType = "Keyboard";
    tags = ["Tactile Switches", "Hot-Swappable", "TKL 80% Layout"];
    images = [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?q=80&w=800", // Minimalist keyboard
      "https://images.unsplash.com/photo-1626958390898-162d3577f593?q=80&w=800", // Cyberpunk keyboard
      "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800", // Switch closeup
    ];
    specsList = [
      ["Layout", "Tenkeyless (TKL) - 80%"],
      ["Switches", "Gateron Banana Pre-lubed Tactile"],
      ["Keycaps", "DoubleShot PBT Cyberpunk Edition"],
      ["Travel Distance", "3.6mm total, 2.0mm actuation"],
      ["Actuation Force", "50gf Tactile Peak Force"],
      ["Hot-Swap", "Yes, 3-pin & 5-pin MX compatible"],
      ["Weight", "850g Aluminum CNC Case"],
      ["Latency", "0.5ms (Wired mode)"],
    ];
    pros = [
      "Crisp tactile sound feedback",
      "Lubricated stabilizers out of the box",
      "Heavy frame reduces sliding",
    ];
    cons = ["No dedicated numpad", "Custom keycap stems are tight"];
    boxContents = [
      "TKL Mechanical Keyboard",
      "USB-C to USB-A Gold plated cable",
      "Keycap & Switch puller tool",
      "3 Extra Banana Switch replacements",
    ];
  } else if (isMouse) {
    peripheralType = "Mouse";
    tags = ["26K DPI Optical", "72g Ultra-Light", "8000Hz Polling"];
    images = [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800", // Yellow mouse
      "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=800", // Side profile
      "https://images.unsplash.com/photo-1625948515291-69613efd103f?q=80&w=800", // Sensor closeup
    ];
    specsList = [
      ["Sensor", "Banana Eye 26K Optical"],
      ["Resolution", "100 - 26,000 DPI adjustable"],
      ["Polling Rate", "Up to 8000Hz (0.125ms delay)"],
      ["Max Speed", "650 IPS (Inches Per Second)"],
      ["Max Acceleration", "50G"],
      ["Switch Type", "Optical Nano Mouse Switches (100M clicks)"],
      ["Battery Life", "Up to 120 hours continuous wireless"],
      ["Weight", "72g Ultra-lightweight"],
    ];
    pros = [
      "Sub-millisecond tracking delay",
      "Extremely lightweight structure",
      "Wired/Wireless dual connectivity",
    ];
    cons = [
      "Requires dongle extension for 8000Hz stability",
      "Large footprint not suitable for tiny hands",
    ];
    boxContents = [
      "Wireless Precision Mouse",
      "2.4GHz USB Dongle Receiver",
      "USB-C paracord charging cable",
      "PTFE mouse feet replacements",
    ];
  } else if (isMic) {
    peripheralType = "Microphone";
    tags = ["Broadcast Quality", "4 Polar Patterns", "96kHz / 24-bit"];
    images = [
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800", // Studio Mic
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=800", // Microphone closeup
      "https://images.unsplash.com/photo-1591105575633-922c8897af9e?q=80&w=800",
    ];
    specsList = [
      ["Microphone Type", "Pro Broadcast Condenser"],
      ["Capsules", "Three 14mm custom condenser capsules"],
      ["Polar Patterns", "Cardioid, Omnidirectional, Stereo, Bidirectional"],
      ["Frequency Range", "20Hz - 20,000Hz"],
      ["Sample Rate", "96kHz / 24-bit studio quality"],
      ["Sensitivity", "4.5mV/Pa (1kHz)"],
      ["Max SPL", "120dB (THD: 0.5% 1kHz)"],
      ["Interface", "USB-C and 3.5mm Headphone latency-free jack"],
    ];
    pros = [
      "Vocal broadcast richness",
      "Four adjustable recording patterns",
      "Sturdy metal desk stand",
    ];
    cons = ["Highly sensitive to ambient typing noise", "Large heavy mic assembly"];
    boxContents = [
      "Studio Broadcaster Microphone",
      "Solid metal desktop stand",
      "2m USB-C braided cable",
      "Anti-dust microphone pop filter",
    ];
  } else if (isWebcam) {
    peripheralType = "Webcam";
    tags = ["4K UHD 30fps", "Sony STARVIS Sensor", "AI Auto-Focus"];
    images = [
      "https://images.unsplash.com/photo-1632516643720-e7f5d7d6ecc9?q=80&w=800", // Real webcam
      "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?q=80&w=800", // Ring light desk
      "https://images.unsplash.com/photo-1603184017968-953f59cd2e37?q=80&w=800", // Camera lens closeup
    ];
    specsList = [
      ["Resolution", "4K Ultra HD (3840 x 2160) at 30fps / 1080p 60fps"],
      ["Optical Sensor", "8.3MP Sony STARVIS CMOS Sensor"],
      ["Field of View", "65, 78, or 90 degrees adjustable"],
      ["Zoom Capability", "5x Digital zoom"],
      ["Focus System", "Dual-Pixel Auto Focus with AI face tracking"],
      ["Microphone", "Dual omni-directional mics with noise cancellation"],
      ["Lens Type", "Premium glass elements, f/2.0 aperture"],
      ["Mounting", "Integrated universal clip and tripod threads"],
    ];
    ((pros = [
      "Extremely sharp 4K resolution",
      "Excellent performance in dim laboratory lighting",
      "Dynamic AI auto-framing",
    ]),
      (cons = ["No manual focus ring override", "Gets warm during extended 4K broadcasts"]));
    boxContents = [
      "4K Live Stream Webcam",
      "Removable privacy shutter cap",
      "USB-C to USB-C cable (1.5m)",
      "Carrying protective sleeve",
    ];
  } else if (isAudio) {
    peripheralType = "Audio";
    tags = ["50mm Drivers", "Active ANC 35dB", "Spatial Sound"];
    images = [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?q=80&w=800", // Yellow headset
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800", // Audio speakers
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=800",
    ];
    specsList = [
      ["Driver Size", "50mm Neodymium magnet dynamic drivers"],
      ["Frequency Response", "15Hz - 28,000Hz"],
      ["Impedance", "32 Ohms"],
      ["Acoustic Chamber", "Closed-back isolation"],
      ["Microphone", "Detachable Cardioid Pro Mic"],
      ["Connection", "Bluetooth 5.3 / 2.4G / 3.5mm Jack"],
      ["Spatial Sound", "DTS Headphone:X 2.0 / Dolby Atmos Ready"],
      ["Active NC", "Yes, up to 35dB noise attenuation"],
    ];
    pros = [
      "Superb spatial audio positioning",
      "Thick memory foam ear cushions",
      "Clear mic broadcast quality",
    ];
    cons = ["Headphones sit tight initially", "Requires software client for virtual 7.1 mapping"];
    boxContents = [
      "Studio Wireless Headset",
      "Detachable Broadcast Microphone",
      "3.5mm Audio Cable",
      "Soft Travel Pouch",
    ];
  } else if (isDisplay) {
    peripheralType = "Display";
    tags = ['34" Curved 21:9', "WQHD 144Hz", "90W USB-C Power"];
    images = [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800", // Curved display
      "https://images.unsplash.com/photo-1547119957-637f8679db1e?q=80&w=800", // Dual monitor
    ];
    specsList = [
      ["Display Size", "34-inch Curved UltraWide (21:9)"],
      ["Panel Type", "Nano IPS Display"],
      ["Resolution", "WQHD (3440 x 1440)"],
      ["Refresh Rate", "144Hz Overclockable to 160Hz"],
      ["Response Time", "1ms Gray-to-Gray (GtG)"],
      ["Brightness", "400 nits (Vesa HDR400 certified)"],
      ["Color Gamut", "DCI-P3 98% / sRGB 135%"],
      ["Ports", "2x HDMI, 1x DP, 1x USB-C (90W Power Delivery)"],
    ];
    ((pros = [
      "Immense workspace desktop real-estate",
      "Vibrant colors for creative editing",
      "USB-C charge laptop directly",
    ]),
      (cons = [
        "Heavy stand requires sturdy desk support",
        "Large box dimensions require freight dispatch",
      ]));
    boxContents = [
      '34" IPS curved monitor',
      "Heavy-duty height-adjustable stand",
      "DisplayPort 1.4 Cable",
      "USB-C Cable (E-Marker 100W)",
    ];
  } else if (isPrinter) {
    peripheralType = "Printer";
    tags = ["Refillable Tanks", "40 Pages / Min", "Auto Duplex"];
    images = [
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=800", // Printer printing
      "https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=800",
    ];
    specsList = [
      ["Print Tech", "Piezoelectric Inkjet Printing"],
      ["Print Speed", "Up to 40 pages per minute (Mono/Color)"],
      ["Ink Capacity", "High-capacity refillable tanks"],
      ["Resolution", "4800 x 1200 optimized DPI"],
      ["Paper Tray", "250-sheet input tray"],
      ["Duplex", "Automatic Double-sided printing"],
      ["Connectivity", "Wi-Fi, Ethernet, USB 3.0"],
      ["Page Yield", "Up to 7,500 pages per ink bottle"],
    ];
    pros = [
      "Extremely low cost per printed page",
      "Refillable ink tanks are mess-free",
      "Fast first-page print out time",
    ];
    cons = ["Heavy footprint for desktop placement", "Scanner feeder lacks auto-duplex"];
    boxContents = [
      "All-in-one printer unit",
      "4-bottle ink set (CMYK)",
      "Power Cable",
      "Installation setup CD & USB cable",
    ];
  } else if (isScanner) {
    peripheralType = "Scanner";
    tags = ["Area Imager 2D", "Rugged IP52", "60 scans/sec"];
    images = [
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=800", // Handheld barcode scanner
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800",
    ];
    specsList = [
      ["Scan Engine", "Area Imager (1280 x 800 pixel array)"],
      ["Scan Rate", "Up to 60 scans per second motion tolerance"],
      ["Depth of Field", "3.0cm to 45.0cm scanning distance"],
      ["Supported Symbologies", "All standard 1D and 2D barcodes"],
      ["Drop Spec", "Designed to withstand 1.8m drops to concrete"],
      ["IP Rating", "IP52 dust and moisture protection"],
    ];
    pros = [
      "Ultra-fast decode rate",
      "Rugged shock-absorbent body",
      "Wireless Bluetooth link up to 10m",
    ];
    cons = ["Heavier than basic laser scanners", "Acoustic beep cannot be disabled"];
    boxContents = [
      "Handheld Area Imager",
      "Charging Cradle Base",
      "2m Coiled USB Connection Cable",
      "User configuration sheet",
    ];
  } else if (isTablet) {
    peripheralType = "Tablet";
    tags = ["8192 Levels", "Battery-Free Pen", '10"x6.25" Active'];
    images = [
      "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=800", // iPad / tablet sketching
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800",
    ];
    specsList = [
      ["Pressure Levels", "8,192 levels of pen tip sensitivity"],
      ["Active Area", "10 x 6.25 inches comfortable space"],
      ["Resolution", "5080 LPI (Lines Per Inch)"],
      ["Report Rate", "266 PPS (Points Per Second)"],
      ["Express Keys", "8 customizable shortcut tactile buttons"],
      ["Pen Type", "Battery-free electromagnetic resonance stylus"],
      ["Tilt Angle", "60 degrees support"],
    ];
    pros = [
      "Highly natural writing feeling",
      "Battery-free stylus requires zero charging",
      "Vast active drawing area",
    ];
    cons = ["Pen nibs wear down with high usage", "Tablet driver setup is complex"];
    boxContents = [
      "Digitalizer Drawing Tablet",
      "Battery-free Stylus Pen",
      "Pen Stand holder",
      "8 Replacement drawing nibs",
    ];
  } else if (isPower) {
    peripheralType = "Power Unit";
    tags = ["1500VA / 900W", "10 Outlets", "6ms Transfer"];
    images = [
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?q=80&w=800", // Server battery/power rack
    ];
    specsList = [
      ["Power Capacity", "1500VA / 900 Watts backup power"],
      ["Outlets", "10 outlets (5 battery backup + surge, 5 surge only)"],
      ["Waveform Type", "Simulated sine wave output"],
      ["Transfer Time", "6ms typical, 10ms maximum"],
      ["Battery Recharge", "16 hours typical recharge time"],
      ["Telemetry Link", "USB connection for automatic server shut-downs"],
    ];
    ((pros = [
      "Highly reliable server backup",
      "Surge protection prevents hardware damage",
      "Alert sounds can be muted",
    ]),
      (cons = [
        "Extremely heavy lead-acid battery unit",
        "Battery needs recycling replace every 3 years",
      ]));
    boxContents = [
      "Smart-UPS Battery Backup",
      "USB Communications Cable",
      "Hardware mounting bracket",
      "User manual log",
    ];
  } else if (isStorage) {
    peripheralType = "Storage";
    tags = ["1 TB Raw Space", "1050 MB/s Read", "IP65 Rugged"];
    images = [
      "https://images.unsplash.com/photo-1590156221122-c4465fe28d70?q=80&w=800", // Modern SSD
      "https://images.unsplash.com/photo-1601524909162-be87252be298?q=80&w=800",
    ];
    specsList = [
      ["Capacity", "1 TB (1000 GB) Raw Storage"],
      ["Read Speed", "Up to 1050 MB/s Sequential Read"],
      ["Write Speed", "Up to 1000 MB/s Sequential Write"],
      ["Interface", "USB 3.2 Gen 2 (10Gbps Type-C)"],
      ["Durability", "Shock-resistant silicone shell, 2-meter drop protection"],
      ["Encryption", "AES 256-bit hardware encryption option"],
    ];
    pros = [
      "Pocket-sized form factor",
      "Extremely fast file transfers",
      "IP65 water and dust resistance",
    ];
    cons = ["Gets slightly warm during massive reads", "No integrated cable storage wrap"];
    boxContents = [
      "External Portable SSD",
      "USB Type-C to C cable",
      "USB Type-C to A adapter cable",
      "Warranty pamphlet",
    ];
  } else if (isProjector) {
    peripheralType = "Projector";
    tags = ["4K UHD Native", "3000 Lumens", "4.2ms Low Latency"];
    images = [
      "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=800", // Projector lens beam
    ];
    specsList = [
      ["Resolution", "4K UHD (3840 x 2160) native"],
      ["Brightness", "3000 ANSI Lumens"],
      ["Contrast Ratio", "240,000:1 Dynamic Contrast"],
      ["Light Source", "Ultra-High Pressure Metal Halide Lamp"],
      ["Throw Ratio", "1.13 - 1.47 throw distance"],
      ["Input Latency", "4.2ms at 1080p@240Hz"],
    ];
    ((pros = [
      "Cinematic color accuracy",
      "High brightness fits daytime labs",
      "Low input delay for smooth presentation scrolling",
    ]),
      (cons = ["Cooling fan produces audible hum", "Replacement lamp cost is substantial"]));
    boxContents = [
      "Smart Projector Unit",
      "Backlit Remote Control (with batteries)",
      "1.8m Power Cable",
      "Quick Start Guide",
    ];
  } else if (isVr) {
    peripheralType = "VR Headset";
    tags = ["Standalone VR", "Snapdragon XR2", "120Hz Output"];
    images = [
      "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800", // Oculus VR headset
    ];
    specsList = [
      ["Panel Resolution", "1832 x 1920 per eye LCD"],
      ["Refresh Rate", "90Hz - 120Hz support"],
      ["Processor", "Qualcomm Snapdragon XR2 platform"],
      ["Tracking", "6DoF inside-out tracking with 4 cameras"],
      ["IPD Adjustment", "Three physical presets (58mm, 63mm, 68mm)"],
      ["Storage Capacity", "256 GB on-board Flash"],
    ];
    pros = [
      "Completely standalone - no PC required",
      "Immersive 3D audio experience",
      "Extensive productivity software selection",
    ];
    cons = ["Battery life is limited to 2 hours", "Stock headstrap can cause facial pressure"];
    boxContents = [
      "VR Headset Unit",
      "Two Touch Wireless Controllers",
      "Silicone Facial Interface Cover",
      "USB-C charging adapter & cable",
    ];
  } else if (isPresenter) {
    peripheralType = "Wireless Presenter";
    tags = ["20m BLE Range", "Class 2 Laser", "12-Mon Battery"];
    images = [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800", // Presenter clicker
    ];
    specsList = [
      ["Connection Type", "2.4GHz Wireless and Bluetooth Low Energy"],
      ["Wireless Range", "Up to 20 meters (65 feet)"],
      ["Laser Class", "Class 2 red laser pointer"],
      ["Battery Type", "1x AAA Battery (12 months life)"],
      ["Controls", "Next/Prev slides, Black Screen, Laser button"],
    ];
    pros = ["Intuitive button layout", "Ultra-long battery lifespan", "Compact pocketable shape"];
    cons = ["No physical volume buttons", "Dongle requires USB-A port"];
    boxContents = [
      "Wireless Presenter Remote",
      "Mini USB Receiver",
      "1x AAA Alkaline Battery",
      "User reference guide",
    ];
  } else if (isDongle) {
    peripheralType = "Dongle & Hub";
    tags = ["7-in-1 Hub", "10Gbps USB 3.2", "100W PD Charge"];
    images = [
      "https://images.unsplash.com/photo-1600541519468-4a87a74070a7?q=80&w=800", // USB-C adapter hub
    ];
    specsList = [
      ["Bandwidth", "Up to 10 Gbps (USB 3.2 Gen 2)"],
      ["Ports", "7-in-1 Hub (HDMI, 2x USB-A, 1x USB-C, SD, MicroSD)"],
      ["Video Output", "HDMI 4K at 60Hz"],
      ["Power Delivery", "USB-C Passthrough charging up to 100W"],
      ["Material", "Anodized space gray aluminum casing"],
      ["Compatibility", "Windows, MacOS, iPadOS, Linux compliant"],
    ];
    pros = [
      "Lightweight portable structure",
      "Sleek metallic heat dissipation",
      "No external power source required",
    ];
    cons = ["Short integrated cable", "Heats up when routing 100W charging"];
    boxContents = ["7-Port USB-C Hub Dongle", "Velvet carrying bag", "User Quick start card"];
  } else {
    peripheralType = "Accessory";
    tags = ["Lab-Certified", "High Bandwidth", "Gold-Plated"];
    images = [
      "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=800", // Minimal desk accessory
    ];
    specsList = [
      ["Compliance", "Lab-Certified Compliance standard"],
      ["Interface Port", p.interface || "USB-C Plug & Play"],
      ["Bandwidth Support", "High Speed Telemetry data stream"],
      ["Connector Pins", "Gold-Plated corrosion resistant pins"],
    ];
  }

  // Generate stable rating/review numbers based on string character value
  const seed = (p.name || "").length + (p.model || "").length;
  const rating = (4.5 + (seed % 5) * 0.1).toFixed(1);
  const reviews = 15 + (seed % 120);
  const specsListSimple = specsList.map(([key, val]) => `${key}: ${val}`);

  return {
    ...p,
    brand: p.brand || "Nano Banana",
    image_url: hasUploadedImage ? p.image_url : images[0] || p.image_url,
    images: hasUploadedImage ? [p.image_url] : images,
    rating,
    reviews,
    specsList: specsListSimple,
    specsRaw: specsList,
    pros,
    cons,
    boxContents,
    peripheralType,
    tags,
  };
}
