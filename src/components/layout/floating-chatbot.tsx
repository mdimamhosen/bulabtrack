import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { askLabTalk } from "@/lib/api/rag.functions";
import {
  Brain,
  Send,
  Sparkles,
  X,
  MessageSquare,
  KeyRound,
  User,
  AlertTriangle,
  Clock,
  Database,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Message = {
  role: "user" | "model";
  text: string;
};

// Light inline formatting parser: **bold**, `code`, [link](url)
function parseInline(text: string) {
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
  const matches = text.split(regex);

  return matches.map((match, idx) => {
    if (match.startsWith("**") && match.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {match.slice(2, -2)}
        </strong>
      );
    }
    if (match.startsWith("`") && match.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1 py-0.5 rounded bg-muted font-mono text-[10px] border border-border/40 text-accent"
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

function MiniMarkdown({ content }: { content: string }) {
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
        className="overflow-x-auto w-full border border-border/30 rounded-xl my-2 bg-muted/5"
      >
        <table className="w-full border-collapse text-left text-[10px]">
          <thead>
            <tr className="bg-muted/70 border-b border-border/40">
              {headers.map((h, idx) => {
                const align = alignments[idx] || "left";
                return (
                  <th
                    key={idx}
                    className="px-2 py-1 font-bold text-foreground border-r border-border/20 last:border-r-0"
                    style={{ textAlign: align as any }}
                  >
                    {parseInline(h)}
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
                      className="px-2 py-1 text-muted-foreground border-r border-border/10 last:border-r-0"
                      style={{ textAlign: align as any }}
                    >
                      {parseInline(cell)}
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
        <h5 key={idx} className="text-xs font-bold text-primary mt-1.5">
          {line.slice(4)}
        </h5>
      );
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <div key={idx} className="flex gap-1.5 items-start pl-1">
          <span className="text-primary mt-1">•</span>
          <span>{parseInline(line.slice(2))}</span>
        </div>
      );
    }
    if (line === "---") {
      return <hr key={idx} className="border-border/20 my-2" />;
    }
    if (!line.trim()) {
      return <div key={idx} className="h-1" />;
    }
    return <p key={idx}>{parseInline(line)}</p>;
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

  return <div className="space-y-1 text-xs leading-relaxed text-foreground">{elements}</div>;
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("labtalk_chat_history");
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
        text: "Hi! I am LabTalk. Ask me anything about our devices, stock levels, orders, or ratings. How can I help?",
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
    localStorage.setItem("labtalk_chat_history", JSON.stringify(messages));
  }, [messages]);

  // Fetch profile to know role
  const { data: profile } = useQuery({
    queryKey: ["floating-chatbot-profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  // Load API Key
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gemini_api_key");
      if (stored) {
        setApiKey(stored);
        setApiKeyInput(stored);
      }
    }
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollViewportRef.current) {
      const scrollContainer = scrollViewportRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, loading, isOpen]);

  const userRole = profile?.role || "customer";

  const suggestions =
    userRole === "admin"
      ? ["Low stock alerts?", "Total orders summary", "Average device ratings"]
      : userRole === "staff"
        ? ["Device catalog list", "Recent orders received", "Logitech keyboard stock"]
        : ["Keyboards available?", "Orders status?", "Devices under $150"];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

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
        },
      });

      if (!result.success) {
        if (result.noApiKey) {
          setShowKeySetup(true);
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text: `⚠️ **Error**: ${result.error || "Failed to respond."}`,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "model", text: result.answer || "No response." }]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `⚠️ **Exception**: ${error.message || "An error occurred."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) return;
    localStorage.setItem("gemini_api_key", apiKeyInput.trim());
    setApiKey(apiKeyInput.trim());
    setShowKeySetup(false);
    toast.success("API Key saved");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-card/95 border border-border/60 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 backdrop-blur-md">
          {/* Header */}
          <div className="flex h-14 items-center justify-between px-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/15 border border-primary/20 text-primary animate-pulse">
                <Brain className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-sm font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-1">
                  LabTalk AI <Sparkles className="h-3 w-3 text-accent animate-pulse" />
                </h4>
                <p className="text-[9px] text-muted-foreground">Connected to bulabtrack database</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const defaultMsg: Message[] = [
                    {
                      role: "model",
                      text: "Hi! I am LabTalk. Ask me anything about our devices, stock levels, orders, or ratings. How can I help?",
                    },
                  ];
                  setMessages(defaultMsg);
                  localStorage.removeItem("labtalk_chat_history");
                  toast.success("Chat history cleared");
                }}
                title="Clear Chat History"
                className="p-1.5 rounded-lg hover:bg-secondary border border-transparent hover:border-border/60 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary border border-transparent hover:border-border/60 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* API Key Banner inside Widget */}
          {showKeySetup && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 space-y-2 animate-in slide-in-from-top duration-300">
              <div className="flex gap-2 items-start text-[10px] text-amber-500/90 font-medium">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>Gemini API Key required to run prompts locally. Kept inside browser memory.</p>
              </div>
              <div className="flex gap-1.5">
                <Input
                  type="password"
                  placeholder="Paste Key (AIzaSy...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="glass-input h-7 text-[10px] rounded-lg flex-1 font-mono"
                />
                <Button
                  size="sm"
                  onClick={handleSaveKey}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg h-7 text-[10px] px-3.5"
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* Message Area */}
          <ScrollArea ref={scrollViewportRef} className="flex-1 p-3">
            <div className="space-y-4">
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex gap-2 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${
                        isUser
                          ? "bg-primary text-primary-foreground border-primary/20"
                          : "bg-secondary border-border/60 text-primary"
                      }`}
                    >
                      {isUser ? <User className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className={`flex items-center gap-1 ${isUser ? "justify-end" : ""}`}>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          {isUser ? profile?.name || "User" : "LabTalk"}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-xl border ${
                          isUser
                            ? "bg-primary/10 border-primary/20 rounded-tr-none"
                            : "bg-card border-border/30 rounded-tl-none shadow-sm"
                        }`}
                      >
                        <MiniMarkdown content={m.text} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-2 max-w-[80%] mr-auto animate-pulse">
                  <div className="h-7 w-7 rounded-full bg-secondary border border-border/60 flex items-center justify-center shrink-0 text-primary animate-bounce">
                    <Brain className="h-3 w-3" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      Thinking...
                    </span>
                    <div className="p-3 rounded-xl border bg-card border-border/30 rounded-tl-none flex items-center gap-1.5 text-[10px] text-muted-foreground italic">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                      Loading live context...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Mini Suggestion Chips */}
          {messages.length === 1 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(s);
                    handleSend(s);
                  }}
                  className="flex items-center gap-0.5 px-2 py-1 text-[10px] rounded-lg bg-secondary/80 hover:bg-primary/10 border border-border/60 hover:border-primary/20 text-muted-foreground hover:text-foreground cursor-pointer transition-all active:scale-95"
                >
                  {s}
                  <ChevronRight className="h-2.5 w-2.5" />
                </button>
              ))}
            </div>
          )}

          {/* Mini Input Box */}
          <div className="p-3 border-t border-border/10 flex gap-2">
            <Input
              placeholder={apiKey ? "Ask AI assistant..." : "Configure Gemini key..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              disabled={loading}
              className="glass-input flex-1 h-9 px-3 text-xs rounded-xl"
            />
            <Button
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-bold rounded-xl h-9 w-9 p-0 shrink-0 shadow-glow"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center shadow-glow cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group relative border border-primary/20"
        aria-label="Toggle AI Chatbot"
      >
        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:opacity-30 duration-1000" />
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}
