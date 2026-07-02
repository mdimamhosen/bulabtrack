import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { askLabTalk } from "@/lib/api/rag.functions";
import {
  Brain,
  Send,
  Sparkles,
  RefreshCw,
  KeyRound,
  User,
  Shield,
  Clock,
  HelpCircle,
  Database,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";

type Message = {
  role: "user" | "model";
  text: string;
};

// Light regex-based markdown parser to render lists, code, and bold text beautifully
function LightMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentTableLines: string[] = [];
  let insideTable = false;

  const renderTable = (tableLines: string[], key: number) => {
    if (tableLines.length < 2) return null;

    const headerLine = tableLines[0];
    const headers = headerLine
      .split("|")
      .map((h) => h.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1);

    const alignLine = tableLines[1];
    const alignments = alignLine
      .split("|")
      .map((a) => a.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1)
      .map((a) => {
        if (a.startsWith(":") && a.endsWith(":")) return "center";
        if (a.endsWith(":")) return "right";
        return "left";
      });

    const bodyRows = tableLines.slice(2).map((rowLine) => {
      return rowLine
        .split("|")
        .map((cell) => cell.trim())
        .filter((_, i, arr) => i > 0 && i < arr.length - 1);
    });

    return (
      <div
        key={key}
        className="overflow-x-auto w-full border border-border/30 rounded-xl my-3 bg-muted/5"
      >
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-muted/70 border-b border-border/40">
              {headers.map((h, idx) => {
                const align = alignments[idx] || "left";
                return (
                  <th
                    key={idx}
                    className="px-3 py-2 font-bold text-foreground border-r border-border/20 last:border-r-0"
                    style={{ textAlign: align as any }}
                  >
                    {parseInlineMarkdown(h)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="border-b border-border/20 last:border-b-0 hover:bg-muted/20 odd:bg-muted/5 transition-colors"
              >
                {row.map((cell, cIdx) => {
                  const align = alignments[cIdx] || "left";
                  return (
                    <td
                      key={cIdx}
                      className="px-3 py-2 text-muted-foreground border-r border-border/10 last:border-r-0"
                      style={{ textAlign: align as any }}
                    >
                      {parseInlineMarkdown(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const processLine = (line: string, idx: number) => {
    if (line.startsWith("### ")) {
      return (
        <h4 key={idx} className="text-base font-bold text-primary mt-3 mb-1">
          {line.slice(4)}
        </h4>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h3 key={idx} className="text-lg font-bold text-primary mt-4 mb-2">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("# ")) {
      return (
        <h2 key={idx} className="text-xl font-bold text-primary mt-5 mb-2">
          {line.slice(2)}
        </h2>
      );
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <div key={idx} className="flex gap-2 items-start pl-2">
          <span className="text-primary mt-1.5">•</span>
          <span>{parseInlineMarkdown(line.slice(2))}</span>
        </div>
      );
    }

    if (line === "---") {
      return <hr key={idx} className="border-border/30 my-4" />;
    }

    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={idx}
          className="border-l-2 border-primary bg-primary/5 px-3 py-1.5 rounded-r-lg my-2 italic"
        >
          {parseInlineMarkdown(line.slice(2))}
        </blockquote>
      );
    }

    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }

    return <p key={idx}>{parseInlineMarkdown(line)}</p>;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    const isTableLine = trimmed.startsWith("|");

    if (isTableLine) {
      if (!insideTable) {
        insideTable = true;
        currentTableLines = [];
      }
      currentTableLines.push(rawLine);
    } else {
      if (insideTable) {
        insideTable = false;
        elements.push(renderTable(currentTableLines, i - 1));
      }
      elements.push(processLine(rawLine, i));
    }
  }

  if (insideTable) {
    elements.push(renderTable(currentTableLines, lines.length - 1));
  }

  return <div className="space-y-2 text-sm leading-relaxed text-foreground">{elements}</div>;
}

// Inline formatting parser: **bold**, `code`, [link](url)
function parseInlineMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  // Regular expression to match bold, inline code, and links
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
  const matches = text.split(regex);

  return matches.map((match, idx) => {
    if (match.startsWith("**") && match.endsWith("**")) {
      return (
        <strong key={idx} className="font-extrabold text-foreground">
          {match.slice(2, -2)}
        </strong>
      );
    }
    if (match.startsWith("`") && match.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs border border-border/40 text-accent"
        >
          {match.slice(1, -1)}
        </code>
      );
    }
    if (match.startsWith("[") && match.includes("](")) {
      const closeBracket = match.indexOf("]");
      const linkText = match.slice(1, closeBracket);
      const url = match.slice(closeBracket + 2, -1);
      return (
        <a
          key={idx}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-semibold"
        >
          {linkText}
        </a>
      );
    }
    return match;
  });
}

export function AiAssistantPage({ roleBase }: { roleBase: string }) {
  const { items, clear } = useCart();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("labtalk_assistant_history");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }
    return [
      {
        role: "model",
        text: "Hello! I am LabTalk, your LabTrack AI Assistant. I can help search devices, check inventory levels, summarize orders, and analyze customer feedback using live data. How can I assist you today?",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKeySetup, setShowKeySetup] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem("labtalk_assistant_history", JSON.stringify(messages));
  }, [messages]);

  // Fetch current profile to customize chips
  const { data: profile } = useQuery({
    queryKey: ["current-profile-ai"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

      return data;
    },
  });

  // Load saved API Key from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gemini_api_key");
      if (stored) {
        setApiKey(stored);
        setApiKeyInput(stored);
      } else {
        setShowKeySetup(true);
      }
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollViewportRef.current) {
      const scrollContainer = scrollViewportRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, loading]);

  const userRole = profile?.role || "customer";

  // Suggestion chips based on user role
  const suggestions =
    userRole === "admin"
      ? [
          "Which devices are low on stock?",
          "Show a summary of all recent orders",
          "What is the average rating for devices?",
          "Are there any security/role changes in logs?",
        ]
      : userRole === "staff"
        ? [
            "Which items are currently out of stock?",
            "Summarize the recent orders received",
            "What reviews did users post for keyboards?",
            "What is the price of Logitech mechanical keyboard?",
          ]
        : [
            "What keyboards are available for order?",
            "Find gaming devices in the catalog",
            "What is the status of my orders?",
            "Show devices under $150 in the catalog",
          ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Format history for Gemini (excluding the newly added user message)
    // Convert text into parts array structure required by the Gemini schema
    const chatHistory = messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const result = await askLabTalk({
        data: {
          message: textToSend,
          chatHistory,
          clientApiKey: apiKey || undefined,
          cartItems: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      });

      if (!result.success) {
        if (result.noApiKey) {
          setShowKeySetup(true);
          toast.warning("Gemini API Key required to process prompt.");
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `⚠️ **Error**: ${result.error || "Failed to generate response."}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: result.answer || "No response text generated." },
        ]);
        if (result.orderCreated) {
          clear();
          toast.success("Order placed successfully via chat!");
        }
        if (result.stats) {
          console.log("RAG Index Query Success:", result.stats);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Request failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `⚠️ **Exception**: ${error.message || "A network or server error occurred."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    localStorage.setItem("gemini_api_key", apiKeyInput.trim());
    setApiKey(apiKeyInput.trim());
    setShowKeySetup(false);
    toast.success("Gemini API Key saved to browser settings.");
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setApiKeyInput("");
    setShowKeySetup(true);
    toast.info("Gemini API Key removed.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full gap-4 max-w-5xl mx-auto">
      {/* Header Info Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary animate-pulse">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-primary via-accent to-accent/70 bg-clip-text text-transparent flex items-center gap-1.5">
                LabTalk AI Assistant <Sparkles className="h-4 w-4 text-accent" />
              </h1>
              <p className="text-xs text-muted-foreground">
                RAG-powered intelligence queries MongoDB for accurate real-time inventory and order
                lookups.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge className="bg-primary/10 hover:bg-primary/15 border-primary/30 text-primary font-bold text-xs py-1 px-3 flex items-center gap-1.5 rounded-full capitalize">
            <Database className="h-3.5 w-3.5" />
            {userRole} Mode
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeySetup(!showKeySetup)}
            className="border-border/60 hover:bg-secondary rounded-xl text-xs flex items-center gap-1 h-9"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {apiKey ? "Edit API Key" : "Add API Key"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const defaultMsg: Message[] = [
                {
                  role: "model",
                  text: "Hello! I am LabTalk, your LabTrack AI Assistant. I can help search devices, check inventory levels, summarize orders, and analyze customer feedback using live data. How can I assist you today?",
                },
              ];
              setMessages(defaultMsg);
              localStorage.removeItem("labtalk_assistant_history");
              toast.success("Chat history cleared");
            }}
            className="border-border/60 hover:bg-secondary hover:text-destructive rounded-xl text-xs flex items-center gap-1 h-9"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Warning/setup API key banner */}
      {showKeySetup && (
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-md rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-foreground">Provide Gemini API Key</p>
                <p className="text-xs text-muted-foreground max-w-xl">
                  To communicate with the AI assistant, please paste your Google Gemini API Key. It
                  will be kept locally in your browser storage.
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="glass-input h-9 text-xs rounded-xl flex-1 sm:w-48 font-mono"
              />
              <Button
                size="sm"
                onClick={handleSaveApiKey}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl h-9 text-xs px-4"
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat messages viewport */}
      <Card className="flex-1 min-h-0 border-border/40 bg-card/40 backdrop-blur-md rounded-3xl shadow-xl flex flex-col">
        <ScrollArea ref={scrollViewportRef} className="flex-1 p-4 lg:p-6">
          <div className="space-y-6">
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border ${
                      isUser
                        ? "bg-primary text-primary-foreground border-primary/20"
                        : "bg-secondary border-border/60 text-primary"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className={`flex items-center gap-1.5 ${isUser ? "justify-end" : ""}`}>
                      <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                        {isUser ? profile?.name || "User" : "LabTalk"}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50">•</span>
                      <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        Live
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border ${
                        isUser
                          ? "bg-primary/10 border-primary/20 text-foreground rounded-tr-none"
                          : "bg-card border-border/30 rounded-tl-none text-foreground shadow-sm"
                      }`}
                    >
                      <LightMarkdown content={message.text} />
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
                <div className="h-9 w-9 rounded-full bg-secondary border border-border/60 flex items-center justify-center shrink-0 text-primary animate-bounce">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    LabTalk is retrieving context & thinking...
                  </span>
                  <div className="p-4 rounded-2xl border bg-card border-border/30 rounded-tl-none flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                    <span className="text-xs text-muted-foreground italic">
                      Querying database indexes and generating response...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggestion Chips Banner */}
        {messages.length === 1 && !loading && (
          <div className="px-6 pb-4 border-b border-border/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Quick suggestions:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(s);
                    handleSend(s);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl bg-secondary/80 hover:bg-primary/10 border border-border/60 hover:border-primary/20 text-muted-foreground hover:text-foreground cursor-pointer transition-all active:scale-95"
                >
                  {s}
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-4 border-t border-border/10 flex gap-2">
          <Input
            placeholder={
              apiKey
                ? "Ask about device status, stock, prices, or orders..."
                : "Configure your Gemini API key to start chatting..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            disabled={loading}
            className="glass-input flex-1 h-11 px-4 text-sm rounded-2xl"
          />
          <Button
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold rounded-2xl h-11 w-11 p-0 shrink-0 shadow-glow"
            aria-label="Send message"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
