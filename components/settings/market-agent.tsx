"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Map, Save, RotateCcw, RefreshCw, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const OPENER_NEW: Message = {
  role: "assistant",
  content: "Let's build your market and buyer profile — it trains your coach to give advice specific to your sector and the people you actually sell to.\n\nTo start, paint the picture: what industry and size of company are you selling into, who's the buyer you're aiming at (their title), and what tends to make them act — the trigger that turns interest into urgency?",
};

const OPENER_REVISIT: Message = {
  role: "assistant",
  content: "You have an existing market profile. What's changed — new verticals, different buyer titles, lessons from recent deals?\n\nIf it still holds, just confirm and we'll close out.",
};

export function MarketAgent({
  marketContext,
  productContext,
  onSaved,
}: {
  marketContext: string | null;
  productContext: string | null;
  onSaved?: () => void;
}) {
  const hasExisting = !!marketContext;
  const [mode, setMode] = useState<"view" | "chat">(hasExisting ? "view" : "chat");
  const [messages, setMessages] = useState<Message[]>(
    hasExisting ? [OPENER_REVISIT] : [OPENER_NEW]
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [context, setContext] = useState(marketContext ?? "");
  const [showUpdatedContext, setShowUpdatedContext] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = bottomRef.current?.parentElement;
    if (c) c.scrollTop = c.scrollHeight;
  }, [messages, streaming]);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || streaming) return;

    // For revisit mode, inject the existing market context in the first user turn
    let next: Message[];
    if (hasExisting && messages.length === 1) {
      next = [
        OPENER_REVISIT,
        {
          role: "user",
          content: `Current market profile:\n\n${marketContext}\n\n${productContext ? `Product value narrative for reference:\n\n${productContext}\n\n---\n\n` : ""}${text}`,
        },
      ];
    } else {
      next = [...messages, { role: "user", content: text }];
    }

    // Display version — inject product context silently on first new message
    const displayMessages: Message[] =
      hasExisting && messages.length === 1
        ? [...messages, { role: "user", content: text }]
        : next;

    // For new sessions, inject product context silently on first message
    let apiMessages = next;
    if (!hasExisting && messages.length === 1 && productContext) {
      apiMessages = [
        OPENER_NEW,
        {
          role: "user",
          content: `For context, here is our product value narrative:\n\n${productContext}\n\n---\n\n${text}`,
        },
      ];
    }

    setMessages(displayMessages);
    setInput("");
    setStreaming(true);

    const res = await fetch("/api/agents/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages }),
    });
    if (!res.body) { setStreaming(false); return; }

    let assistant = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistant += decoder.decode(value, { stream: true });
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: assistant };
        return updated;
      });
    }
    setStreaming(false);

    // Surface save option when agent produces a complete profile
    if (assistant.includes("## Target market") && assistant.includes("## Buyer profile")) {
      setContext(assistant);
      setShowUpdatedContext(true);
    }
  }

  async function saveContext() {
    setSaving(true);
    await fetch("/api/agents/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], save: context }),
    });
    setSaving(false);
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 3000);
  }

  function startRevisit() {
    setMode("chat");
    setMessages([OPENER_REVISIT]);
    setInput("");
    setShowUpdatedContext(false);
  }

  // ── View mode ───────────────────────────────────────────────────────────────
  if (mode === "view" && hasExisting) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your market profile
            </p>
            <button
              onClick={startRevisit}
              className="flex items-center gap-1.5 text-xs text-accent hover:underline"
            >
              <RefreshCw className="h-3 w-3" />
              Revisit &amp; update
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs text-foreground font-mono leading-relaxed max-h-64 overflow-y-auto">
            {marketContext}
          </pre>
        </div>
        <p className="text-xs text-muted-foreground">
          The Team Coach reads this to give advice that is specific to your sector and buyers. Update it when you enter a new vertical or learn something from a lost deal.
        </p>
      </div>
    );
  }

  // ── Chat mode ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Talk it through below, then{" "}
        <span className="text-foreground font-medium">Write it up</span>{" "}
        to turn the conversation into a saveable profile. A rough first pass is fine — you can refine and re-save anytime. Only the saved profile trains your coach and seeds your segments; the chat itself isn&apos;t stored.
      </p>
      {showUpdatedContext && context && (
        <div className="rounded-md border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide">
              Market profile — ready to save
            </p>
            <div className="flex gap-3">
              <button
                onClick={saveContext}
                disabled={saving}
                className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                {saving ? "Saving…" : saved ? "Saved" : "Save to org"}
              </button>
              {hasExisting && (
                <button
                  onClick={() => setMode("view")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to current
                </button>
              )}
            </div>
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={12}
            className="w-full rounded border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
          <p className="text-xs text-muted-foreground">This is exactly what gets saved to your org — edit it here if you like, then Save. You can revisit and refine it anytime.</p>
        </div>
      )}

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-semibold text-foreground">
              {hasExisting ? "Revise your market profile" : "Market & buyer profile"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => send("Based on what we've covered so far, write my full market and buyer profile now using the section headers. If it's still early, make sensible assumptions, flag them as assumptions, and keep it as a first pass I can refine later.")}
              disabled={streaming || messages.length < 3}
              title={messages.length < 3 ? "Chat a little first, then write it up" : "Write up a saveable profile from the conversation"}
              className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-default"
            >
              <FileText className="h-3 w-3" />
              Write it up
            </button>
            <span className="text-xs text-muted-foreground">Claude · paid per send</span>
            {(hasExisting || messages.length > 1) && (
              <button
                onClick={() => hasExisting ? setMode("view") : undefined}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                {hasExisting ? "Cancel" : "Restart"}
              </button>
            )}
          </div>
        </div>

        <div className="h-80 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}>
                {m.content}
                {i === messages.length - 1 && streaming && m.role === "assistant" && (
                  <span className="inline-block w-1 h-3.5 bg-foreground/40 ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border px-4 py-3 flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={hasExisting
              ? "What's changed? Or say 'nothing changed' to confirm…"
              : "Your industry and company size, the buyer's title, and what triggers them to act… (Enter to send, Shift+Enter for newline)"
            }
            rows={2}
            disabled={streaming}
            className="flex-1 resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="self-end px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
