import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/callback"];

/**
 * Redirect while keeping the cookies Supabase set on this request.
 *
 * `getUser()` may rotate the session (or clear it, when the refresh token is
 * dead) via the `setAll` hook below. A bare NextResponse.redirect() throws
 * those away, so the browser keeps replaying the same stale token on every
 * request: the user is bounced to /login for ever and can only recover by
 * clearing site data by hand. Copying the cookies onto the redirect is what
 * lets a dead session actually die.
 */
function redirectTo(pathname: string, request: NextRequest, carry: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url);
  for (const cookie of carry.cookies.getAll()) response.cookies.set(cookie);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectTo("/login", request, supabaseResponse);
  }

  // Org-membership gate (page navigations only — API routes resolve their own
  // org and would only add a second DB round-trip here). A user who has
  // authenticated but not yet claimed an invite has no org and must go to /join.
  if (!pathname.startsWith("/api") && !pathname.startsWith("/join")) {
    const { data: profile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!(profile as { organization_id: string } | null)?.organization_id) {
      return redirectTo("/join", request, supabaseResponse);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
