import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageSquare } from "lucide-react";
import type { Concept } from "@/lib/supabase/types";

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: raw } = await supabase
    .from("concepts")
    .select("*")
    .eq("slug", slug)
    .single();

  const concept = raw as unknown as Concept | null;
  if (!concept) notFound();

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link
        href="/learn"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All concepts
      </Link>

      <h1 className="text-2xl font-semibold text-foreground">{concept.title}</h1>

      <p className="mt-3 text-base text-muted-foreground leading-relaxed">
        {concept.short_explanation}
      </p>

      {/* Test question */}
      <div className="mt-8 rounded-md border border-accent/30 bg-accent/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-4 w-4 text-accent shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1.5">
              Ask the prospect
            </p>
            <p className="text-base text-foreground italic leading-relaxed">
              &ldquo;{concept.test_question}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Full explanation */}
      <div className="mt-8">
        <ConceptBody text={concept.full_explanation} />
      </div>

      {/* Patterns */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-4">
          <p className="text-xs font-semibold text-health-red uppercase tracking-wide mb-2">
            Warning signs
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {concept.red_pattern}
          </p>
        </div>
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-4">
          <p className="text-xs font-semibold text-health-green uppercase tracking-wide mb-2">
            What good looks like
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {concept.green_pattern}
          </p>
        </div>
      </div>

      {/* Failure anecdote */}
      <div className="mt-6 rounded-md bg-muted border border-border px-5 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          How this plays out
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {concept.failure_anecdote}
        </p>
      </div>
    </div>
  );
}

function ConceptBody({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-base font-semibold text-foreground mt-6 mb-2">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-sm font-semibold text-foreground mt-4 mb-1">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 text-sm text-muted-foreground leading-relaxed list-disc">
              <InlineText text={line.replace("- ", "")} />
            </li>
          );
        }
        if (!line.trim()) return null;
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            <InlineText text={line} />
          </p>
        );
      })}
    </div>
  );
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
