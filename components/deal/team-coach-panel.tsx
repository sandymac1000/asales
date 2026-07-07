"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, Sparkles, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  dealId: string;
  dealName: string;
  onClose: () => void;
  onSaveSession: (messages: CoachMessage[]) => Promise<void>;
}

const OPUS_INPUT_PER_TOKEN = 5 / 1_000_000;   // $5 per 1M input tokens
const OPUS_OUTPUT_PER_TOKEN = 25 / 1_000_000;  // $25 per 1M output tokens
const EST_OUTPUT_TOKENS = 500;

export function TeamCoachPanel({ dealId, dealName, onClose, onSaveSession }: Props) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [contextTokens, setContextTokens] = useState<number | null>(null);
  const [sessionCost, setSessionCost] = useState(0);
  const [exchanges, setExchanges] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch exact token count on mount
  useEffect(() => {
    fetch("/api/agents/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealId, messages: [], countOnly: true }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setContextTokens(d.inputTokens))
      .catch(() => {});
  }, [dealId]);

  useEffect(() => {
    const c = bottomRef.current?.parentElement;
    if (c) c.scrollTop = c.scrollHeight;
  }, [messages, streaming]);

  const costPerExchange = contextTokens != null
    ? (contextTokens + messages.length * 100) * OPUS_INPUT_PER_TOKEN + EST_OUTPUT_TOKENS * OPUS_OUTPUT_PER_TOKEN
    : null;

  function resizeTextarea() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || busy) return;

    const userMsg: CoachMessage = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setBusy(true);
    setStreaming("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/agents/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, messages: newMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreaming(full);
      }

      const assistantMsg: CoachMessage = { role: "assistant", content: full };
      setMessages([...newMessages, assistantMsg]);
      setStreaming("");
      setExchanges((n) => n + 1);
      setSessionCost((c) => c + (costPerExchange ?? 0));
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setStreaming("Something went wrong — please try again.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const handleClose = useCallback(async () => {
    abortRef.current?.abort();
    if (messages.length > 0) {
      await onSaveSession(messages);
    }
    onClose();
  }, [messages, onSaveSession, onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/10 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[420px] border-l border-border bg-background shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-border px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-sm font-semibold text-foreground">Team Coach</span>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[280px]">{dealName}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cost indicator */}
          <div className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-xs space-y-0.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Model</span>
              <span className="font-medium text-foreground">Claude Opus 4.8</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Context (deal + history)</span>
              <span>{contextTokens != null ? `~${contextTokens.toLocaleString()} tokens` : "counting…"}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Cost per exchange</span>
              <span className="text-accent font-medium">
                {costPerExchange != null ? `~$${(costPerExchange * 100).toFixed(1)}¢` : "—"}
              </span>
            </div>
            {exchanges > 0 && (
              <div className="flex items-center justify-between text-muted-foreground border-t border-border pt-1 mt-1">
                <span>This session ({exchanges} {exchanges === 1 ? "exchange" : "exchanges"})</span>
                <span className="text-foreground font-medium">${sessionCost.toFixed(3)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && !streaming && (
            <div className="pt-6 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                I have reviewed the deal. Ask me anything, or let me share my initial read on where this stands.
              </p>
              <button
                onClick={() => send("Give me your initial read on this deal.")}
                className="mt-3 text-xs text-accent hover:underline"
              >
                Get initial read →
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <Bubble key={i} msg={msg} />
          ))}

          {streaming && <Bubble msg={{ role: "assistant", content: streaming }} live />}

          {busy && !streaming && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground/60 mb-2">
            Each send is a paid API call to Anthropic. Press Esc or close to end the session.
          </p>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Ask the coach… (Enter to send, Shift+Enter for newline)"
              rows={1}
              disabled={busy}
              className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
            >
              {busy
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Bubble({ msg, live }: { msg: CoachMessage; live?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-muted text-foreground rounded-bl-sm",
        live && "border-r-2 border-accent animate-pulse"
      )}>
        {msg.content}
        {live && <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-accent align-middle animate-pulse" />}
      </div>
    </div>
  );
}
