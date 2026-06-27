import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardList,
  Package,
  Truck,
  Check,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Node {
  id: string;
  label: string;
  detail: string;
  icon: any;
}

const NODES: Node[] = [
  {
    id: "Pending",
    label: "Pending",
    detail: "Awaiting validation or payment confirmation.",
    icon: ClipboardList,
  },
  {
    id: "Confirmed",
    label: "Confirmed",
    detail: "Order approved, items reserved in stock.",
    icon: CheckCircle2,
  },
  {
    id: "Processing",
    label: "Processing",
    detail: "Stock allocated, items packaged for transit.",
    icon: Package,
  },
  {
    id: "Shipped",
    label: "Shipped",
    detail: "Dispatched from warehouse and in transit.",
    icon: Truck,
  },
  {
    id: "Delivered",
    label: "Delivered",
    detail: "Successfully arrived and logged at destination.",
    icon: Check,
  },
  {
    id: "Cancelled",
    label: "Cancelled",
    detail: "Order cancelled and items returned to stock.",
    icon: XCircle,
  },
];

const ADJACENCY_LIST: Record<string, string[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing"],
  Processing: ["Shipped"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

// BFS traversal algorithm to find the state transition path
function getStatusPath(targetStatus: string): string[] {
  const start = "Pending";
  const queue: [string, string[]][] = [[start, [start]]];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (current === targetStatus) return path;

    const neighbors = ADJACENCY_LIST[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }
  return [start];
}

export function OrderGraphTracker({ currentStatus = "Pending" }: { currentStatus: string }) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(
    NODES.find((n) => n.id === currentStatus) || NODES[0],
  );

  // Compute active path using BFS graph algorithm
  const activePath = getStatusPath(currentStatus);
  const isActive = (id: string) => activePath.includes(id);
  const isCurrent = (id: string) => currentStatus === id;

  // Visual layout coordinates for graph nodes
  const getCoordinates = (id: string, index: number) => {
    if (id === "Cancelled") {
      return { x: 120, y: 110 }; // Cancelled branch below
    }
    // Main path lies horizontally
    return { x: 60 + index * 110, y: 40 };
  };

  // Determine horizontal index for standard nodes
  const getStandardIndex = (id: string) => {
    const stdOrder = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
    return stdOrder.indexOf(id);
  };

  return (
    <div className="liquid-card rounded-2xl border border-border/40 p-5 bg-card/30">
      <div className="mb-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5 text-primary" /> Order Flow Graph Tracker
        </h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Dynamic directed graph showing fulfillment transitions computed via BFS. Click a node to
          view state details.
        </p>
      </div>

      {/* SVG Graph Viewport */}
      <div className="relative overflow-x-auto scrollbar-none py-2 select-none">
        <svg className="h-[150px] w-[560px] mx-auto overflow-visible">
          {/* Arrow markers */}
          <defs>
            <marker
              id="arrow-active"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary)" />
            </marker>
            <marker
              id="arrow-inactive"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-border)" />
            </marker>
          </defs>

          {/* Draw Edges (Glow and lines) */}
          {Object.entries(ADJACENCY_LIST).map(([from, toNodes]) => {
            const fromIndex = getStandardIndex(from);
            const fromCoord = getCoordinates(from, fromIndex);

            return toNodes.map((to) => {
              const toIndex = getStandardIndex(to);
              const toCoord = getCoordinates(to, toIndex);
              const isPathActive = isActive(from) && isActive(to);

              return (
                <g key={`${from}-${to}`}>
                  {/* Glowing line for active path */}
                  {isPathActive && (
                    <line
                      x1={fromCoord.x}
                      y1={fromCoord.y}
                      x2={toCoord.x}
                      y2={toCoord.y}
                      stroke="var(--color-primary)"
                      strokeWidth={4}
                      strokeOpacity={0.15}
                      className="blur-[2px]"
                    />
                  )}
                  <line
                    x1={fromCoord.x}
                    y1={fromCoord.y}
                    x2={toCoord.x}
                    y2={toCoord.y}
                    stroke={isPathActive ? "var(--color-primary)" : "var(--color-border)"}
                    strokeWidth={1.5}
                    markerEnd={`url(#${isPathActive ? "arrow-active" : "arrow-inactive"})`}
                    strokeDasharray={from === "Pending" && to === "Cancelled" ? "3,3" : "0"}
                  />
                </g>
              );
            });
          })}

          {/* Draw Nodes */}
          {NODES.map((node) => {
            const isNodeActive = isActive(node.id);
            const isNodeCurrent = isCurrent(node.id);
            const isSelected = selectedNode?.id === node.id;
            const index = getStandardIndex(node.id);
            const coord = getCoordinates(node.id, index);

            // Skip rendering Cancelled node if the order is not cancelled
            if (node.id === "Cancelled" && currentStatus !== "Cancelled") {
              return null;
            }

            const Icon = node.icon;

            return (
              <g
                key={node.id}
                transform={`translate(${coord.x}, ${coord.y})`}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer group"
              >
                {/* Outer Glow ring */}
                {isNodeCurrent && (
                  <circle
                    r={22}
                    className="fill-none stroke-primary/30 stroke-2 animate-pulse-ring"
                    style={{ animationDuration: "2s" }}
                  />
                )}
                {/* Node Base Circle */}
                <circle
                  r={16}
                  className={`transition-all duration-300 ${
                    isNodeCurrent
                      ? "fill-primary stroke-primary shadow-glow"
                      : isNodeActive
                        ? "fill-primary/20 stroke-primary/80"
                        : "fill-zinc-950/40 stroke-border hover:stroke-primary/50"
                  } ${isSelected ? "stroke-primary stroke-2" : "stroke-1"}`}
                />
                {/* SVG Centered Icon */}
                <g transform="translate(-7, -7)">
                  <Icon
                    className={`h-3.5 w-3.5 transition-colors duration-300 ${
                      isNodeCurrent
                        ? "text-primary-foreground"
                        : isNodeActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                </g>
                {/* Label text */}
                <text
                  y={30}
                  textAnchor="middle"
                  className={`text-[9px] font-bold transition-colors duration-300 font-sans ${
                    isNodeCurrent
                      ? "fill-primary font-black"
                      : isNodeActive
                        ? "fill-foreground"
                        : "fill-muted-foreground group-hover:fill-foreground"
                  }`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Box */}
      {selectedNode && (
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-xl bg-zinc-950/20 border border-border/25 text-[11px]"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground flex items-center gap-1.5 capitalize">
              <span
                className={`h-2 w-2 rounded-full ${
                  selectedNode.id === "Cancelled"
                    ? "bg-destructive"
                    : activePath.includes(selectedNode.id)
                      ? "bg-success"
                      : "bg-muted-foreground"
                }`}
              />
              {selectedNode.label} Status Node
            </span>
            {selectedNode.id === currentStatus && (
              <Badge className="h-4.5 px-2 text-[8px] bg-primary/25 border-none text-primary uppercase font-bold tracking-wider">
                Current State
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 leading-relaxed">{selectedNode.detail}</p>
        </motion.div>
      )}
    </div>
  );
}
