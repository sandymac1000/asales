"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LayoutList,
  Building2,
  BookOpen,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useOrg } from "@/lib/hooks/use-org";

const NAV = [
  { href: "/home", label: "Home", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: LayoutList },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/learn", label: "Learn", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { org, user } = useOrg();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-sidebar">
      {/* Wordmark */}
      <div className="px-5 py-5 border-b border-border">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Salient
        </span>
        {org && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {org.name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-3 py-3 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Settings
        </Link>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Sign out
        </button>

        {user && (
          <p className="px-2.5 pt-1 text-xs text-muted-foreground truncate">
            {user.name || "—"}
          </p>
        )}
      </div>
    </aside>
  );
}
