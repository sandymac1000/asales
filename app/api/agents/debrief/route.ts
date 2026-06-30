import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { runDebriefAgent } from "@/lib/agents/debrief";
import type { DealFull } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  // Auth
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deal_id, transcript } = await request.json() as { deal_id: string; transcript: string };

  if (!deal_id || !transcript?.trim()) {
    return NextResponse.json({ error: "deal_id and transcript are required" }, { status: 400 });
  }

  // Fetch full deal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: raw, error } = await db
    .from("deals")
    .select(`*, account:accounts(*), economic_buyer:contacts(*), deal_contacts(*, contact:contacts(*))`)
    .eq("id", deal_id)
    .single();

  if (error || !raw) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const deal = raw as unknown as DealFull;

  try {
    const result = await runDebriefAgent(deal, transcript);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Debrief agent error:", err);
    return NextResponse.json(
      { error: "The AI couldn't process this transcript. You can fill in the fields manually." },
      { status: 500 }
    );
  }
}
