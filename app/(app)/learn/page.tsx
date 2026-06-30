import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Concept } from "@/lib/supabase/types";

const TIER_LABELS: Record<number, string> = {
  [-1]: "Chapter 1 — Your product",
  0: "Chapter 2 — Foundations of a deal",
  1: "Chapter 3 — Expansion motion",
  2: "Chapter 4 — MEDDPICC",
  3: "Chapter 5 — MEDDPICC advanced",
};

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: raw } = await supabase
    .from("concepts")
    .select("*")
    .order("tier")
    .order("sort_order");

  const concepts = (raw ?? []) as unknown as Concept[];

  const byTier = concepts.reduce<Record<number, Concept[]>>((acc, c) => {
    acc[c.tier] = [...(acc[c.tier] ?? []), c];
    return acc;
  }, {});

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-lg font-semibold text-foreground">Learn</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-xl">
          Start with your product. Before any deal mechanics matter, you need to
          know what you are selling, who you are selling it to, and what it is
          worth. Then: the small number of concepts that explain most of what goes
          wrong in enterprise selling — with the failure modes that catch technical
          founders by surprise.
        </p>
      </div>

      <div className="space-y-10">
        {Object.entries(byTier).sort((a, b) => Number(a[0]) - Number(b[0])).map(([tier, tierConcepts]) => (
          <section key={tier}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
              {TIER_LABELS[Number(tier)] ?? `Tier ${tier}`}
            </h2>
            <div className="space-y-2">
              {tierConcepts.map((concept) => (
                <Link
                  key={concept.id}
                  href={`/learn/${concept.slug}`}
                  className="block rounded-md border border-border bg-card px-5 py-4 hover:border-accent/50 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {concept.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {concept.short_explanation}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
