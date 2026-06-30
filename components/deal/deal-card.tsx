"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, isOverdue, healthBg, worstHealth } from "@/lib/format";
import { useFeatures } from "@/lib/hooks/use-features";
import type { DealWithAccount, Health } from "@/lib/supabase/types";

interface Props {
  deal: DealWithAccount & {
    meddpicc_healths?: (Health | null)[]
  }
}

export function DealCard({ deal }: Props) {
  const features = useFeatures();
  const overdue = isOverdue(deal.next_action_date);

  const qualHealth = features.tier2_meddpicc_lite
    ? worstHealth(deal.meddpicc_healths ?? [])
    : null;

  return (
    <Link
      href={`/pipeline/${deal.id}`}
      className="block rounded-md border border-border bg-card hover:border-accent/50 hover:shadow-sm transition-all group"
    >
      <div className="px-4 py-3.5">
        {/* Account + deal name */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {deal.account.name}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground truncate">
              {deal.name}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Economic buyer row */}
        <div className="mt-3 flex items-center gap-1.5">
          {deal.economic_buyer_met ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-health-green shrink-0" />
          ) : deal.economic_buyer ? (
            <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-health-red shrink-0" />
          )}
          <span className="text-xs text-muted-foreground">
            {deal.economic_buyer
              ? deal.economic_buyer.name
              : "No economic buyer identified"}
          </span>
          {deal.economic_buyer?.title && (
            <span className="text-xs text-muted-foreground">
              · {deal.economic_buyer.title}
            </span>
          )}
        </div>

        {/* Next action */}
        <div className="mt-2">
          <p className="text-xs text-muted-foreground truncate">
            {deal.next_action ? (
              <>
                <span
                  className={cn(
                    "font-mono text-xs",
                    overdue ? "text-health-red" : "text-muted-foreground"
                  )}
                >
                  {formatDate(deal.next_action_date)}
                </span>
                {" · "}
                {deal.next_action}
              </>
            ) : (
              <span className="text-health-red">No next action set</span>
            )}
          </p>
        </div>

        {/* Footer: ACV + qual health */}
        {(deal.acv_value != null || qualHealth) && (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-foreground">
              {formatCurrency(deal.acv_value, deal.currency)}
              <span className="text-muted-foreground"> ACV</span>
            </span>
            {qualHealth && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs font-medium",
                  healthBg(qualHealth)
                )}
              >
                {qualHealth.charAt(0).toUpperCase() + qualHealth.slice(1)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expansion indicator */}
      {deal.type === "expansion" && (
        <div className="border-t border-border px-4 py-1.5">
          <span className="text-xs text-accent font-medium">Expansion</span>
        </div>
      )}
    </Link>
  );
}
