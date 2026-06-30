"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { ConceptDrawer } from "./concept-drawer";

interface Props {
  slug: string
}

export function ConceptBadge({ slug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded text-muted-foreground hover:text-accent transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
        aria-label="Learn more"
      >
        <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      {open && <ConceptDrawer slug={slug} onClose={() => setOpen(false)} />}
    </>
  );
}
