"use client";

import { useState, useEffect } from "react";
import { Trophy, X } from "lucide-react";
import { ConceptBadge } from "@/components/learn/concept-badge";
import { cn } from "@/lib/utils";
import type { LossCategory } from "@/lib/supabase/types";

export interface WonData {
  win_reason: string
  win_notes: string
  createExpansion: boolean
}

export interface LostData {
  loss_category: LossCategory
  lost_to_competitor: string
  lost_reason: string
}

interface WonModalProps {
  dealName: string
  expansionEnabled: boolean
  onConfirm: (data: WonData) => void
  onCancel: () => void
}

interface LostModalProps {
  dealName: string
  onConfirm: (data: LostData) => void
  onCancel: () => void
}

const LOSS_CATEGORIES: { value: LossCategory; label: string; hint: string }[] = [
  { value: "price", label: "Price", hint: "We couldn't justify the value at our price point" },
  { value: "product", label: "Product gap", hint: "Missing a feature or capability they needed" },
  { value: "timing", label: "Timing", hint: "Not the right moment — budget, priority, or org change" },
  { value: "political", label: "Political", hint: "Internal decision we couldn't influence" },
  { value: "no_decision", label: "No decision", hint: "Status quo won — they chose to do nothing" },
  { value: "other", label: "Other", hint: "Something else" },
];

export function WonModal({ dealName, expansionEnabled, onConfirm, onCancel }: WonModalProps) {
  const [winReason, setWinReason] = useState("");
  const [winNotes, setWinNotes] = useState("");
  const [createExpansion, setCreateExpansion] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <Overlay onClose={onCancel}>
      <div className="flex items-start gap-3 mb-5">
        <div className="rounded-full bg-green-100 p-2 shrink-0">
          <Trophy className="h-4 w-4 text-health-green" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Deal won</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Capture what worked before it fades. This becomes your playbook.
          </p>
        </div>
        <button onClick={onCancel} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              What was the decisive factor?
            </label>
            <ConceptBadge slug="win_loss_debrief" />
          </div>
          <input
            type="text"
            value={winReason}
            onChange={(e) => setWinReason(e.target.value)}
            placeholder="The single thing that tipped the decision in your favour"
            className={INPUT}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            What would you do exactly the same?
          </label>
          <textarea
            value={winNotes}
            onChange={(e) => setWinNotes(e.target.value)}
            placeholder="Specific actions, conversations, or materials that worked — your repeatable process"
            rows={3}
            className={cn(INPUT, "resize-none")}
          />
        </div>

        {expansionEnabled && (
          <label className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 cursor-pointer hover:bg-muted transition-colors">
            <input
              type="checkbox"
              checked={createExpansion}
              onChange={(e) => setCreateExpansion(e.target.checked)}
              className="mt-0.5 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium text-foreground">Start expansion deal now</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Open a linked expansion deal immediately — strike while the relationship is warm.
              </p>
            </div>
          </label>
        )}
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onConfirm({ win_reason: winReason, win_notes: winNotes, createExpansion })}
          disabled={!winReason.trim()}
          className="rounded-md bg-health-green text-white px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Close as Won
        </button>
      </div>
    </Overlay>
  );
}

export function LostModal({ dealName, onConfirm, onCancel }: LostModalProps) {
  const [category, setCategory] = useState<LossCategory | "">("");
  const [lostTo, setLostTo] = useState("");
  const [lostReason, setLostReason] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <Overlay onClose={onCancel}>
      <div className="flex items-start gap-3 mb-5">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold text-foreground">Deal lost</h2>
            <ConceptBadge slug="win_loss_debrief" />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Document this before it fades. Honest losses build better processes.
          </p>
        </div>
        <button onClick={onCancel} className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            Why did you lose?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LOSS_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left transition-colors",
                  category === c.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs mt-0.5 leading-relaxed">{c.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            Lost to (optional)
          </label>
          <input
            type="text"
            value={lostTo}
            onChange={(e) => setLostTo(e.target.value)}
            placeholder="Competitor name, or 'Internal build', or 'Status quo'"
            className={INPUT}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">
            What would you do differently?
          </label>
          <textarea
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder="The real reason, not the polite one the prospect gave you"
            rows={3}
            className={cn(INPUT, "resize-none")}
            autoFocus
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onConfirm({
            loss_category: category as LossCategory,
            lost_to_competitor: lostTo,
            lost_reason: lostReason,
          })}
          disabled={!category}
          className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          Close as Lost
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-xl p-6">
        {children}
      </div>
    </div>
  );
}

const INPUT = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";
