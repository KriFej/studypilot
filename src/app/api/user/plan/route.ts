import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getDocCount, getMonthlyMessages, PLAN_LIMITS } from "@/lib/limits";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [plan, docCount, msgCount] = await Promise.all([
    getUserPlan(user.id),
    getDocCount(user.id),
    getMonthlyMessages(user.id),
  ]);

  const limits = PLAN_LIMITS[plan];

  return NextResponse.json({
    plan,
    docs: { count: docCount, limit: limits.docs === Infinity ? null : limits.docs },
    messages: { count: msgCount, limit: limits.messages === Infinity ? null : limits.messages },
  });
}
