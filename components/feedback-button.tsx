"use client";

import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    if (!message.trim()) return;
    setStatus("sending");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() }),
    });
    if (res.ok) {
      setStatus("sent");
      setMessage("");
      setTimeout(() => { setOpen(false); setStatus("idle"); }, 1500);
    } else {
      setStatus("error");
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-80 rounded-lg border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Send feedback</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              autoFocus
              placeholder="What's working, what's broken, what's missing?"
              className="w-full resize-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {status === "error" && <p className="text-xs text-destructive">Couldn&apos;t send — try again.</p>}
            <button
              onClick={send}
              disabled={status === "sending" || !message.trim()}
              className="flex w-full items-center justify-center gap-1.5 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              <Send className="h-3.5 w-3.5" />
              {status === "sending" ? "Sending…" : status === "sent" ? "Thanks!" : "Send"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
