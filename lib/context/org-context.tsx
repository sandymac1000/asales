"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization, User } from "@/lib/supabase/types";

interface OrgContextValue {
  org: Organization | null
  user: User | null
  loading: boolean
  refreshOrg: () => Promise<void>
}

export const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); return; }

    const { data: profileRaw } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    const profile = profileRaw as unknown as User | null;
    if (!profile) { setLoading(false); return; }
    setUser(profile);

    const { data: orgRaw } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();

    const organization = orgRaw as unknown as Organization | null;
    if (organization) setOrg(organization);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <OrgContext.Provider value={{ org, user, loading, refreshOrg: load }}>
      {children}
    </OrgContext.Provider>
  );
}
