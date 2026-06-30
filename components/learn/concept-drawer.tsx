"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, MessageSquare } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Concept } from "@/lib/supabase/types";

interface Props {
  slug: string
  onClose: () => void
}

export function ConceptDrawer({ slug, onClose }: Props) {
  const [concept, setConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: raw } = await supabase
        .from("concepts")
        .select("*")
        .eq("slug", slug)
        .single();
      const data = raw as unknown as Concept | null;
      setConcept(data);
      setLoading(false);

      // Record view
      if (data) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("concept_views")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .upsert({ user_id: user.id, concept_id: data.id } as any, { onConflict: "user_id,concept_id" });
        }
      }
    }
    load();
  }, [slug]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/10"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card border-l border-border shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Concept
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          ) : concept ? (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground">
                {concept.title}
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {concept.short_explanation}
              </p>

              {/* Test question — the key didactic element */}
              <div className="rounded-md border border-accent/30 bg-accent/5 px-4 py-3">
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div>
                    <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">
                      Ask the prospect
                    </p>
                    <p className="text-sm text-foreground leading-relaxed italic">
                      &ldquo;{concept.test_question}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Red pattern */}
              <div>
                <p className="text-xs font-semibold text-health-red uppercase tracking-wide mb-1.5">
                  Warning signs
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {concept.red_pattern}
                </p>
              </div>

              {/* Green pattern */}
              <div>
                <p className="text-xs font-semibold text-health-green uppercase tracking-wide mb-1.5">
                  What good looks like
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {concept.green_pattern}
                </p>
              </div>

              {/* Failure anecdote */}
              <div className="rounded-md bg-muted px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  How this plays out
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {concept.failure_anecdote}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Concept not found.
            </p>
          )}
        </div>

        {/* Footer */}
        {concept && (
          <div className="border-t border-border px-6 py-4">
            <Link
              href={`/learn/${concept.slug}`}
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              Read full explanation
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
