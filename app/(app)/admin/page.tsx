import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { UsageTable } from "@/components/admin/usage-table";
import { ProvisionForm } from "@/components/admin/provision-form";
import type { AdminOrgUsage } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/pipeline");

  // Cross-org metadata via the service role. Metadata only — no deal content, no keys.
  const svc = createServiceClient();
  const { data } = await svc
    .from("admin_org_usage")
    .select("*")
    .order("last_sign_in_at", { ascending: false, nullsFirst: false });
  const orgs = (data ?? []) as AdminOrgUsage[];

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-lg font-semibold text-foreground">Operator console</h1>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Admin
        </span>
      </div>
      <p className="mb-8 text-xs text-muted-foreground">
        Provision organisations and watch adoption. Usage is metadata only — never deal
        contents or keys. You are signed in as {admin}.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Provision an organisation
        </h2>
        <ProvisionForm />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Organisations ({orgs.length})
        </h2>
        <UsageTable initialOrgs={orgs} />
      </section>
    </div>
  );
}
