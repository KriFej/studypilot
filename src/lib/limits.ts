import { createClient } from "@/lib/supabase/server";

export const PLAN_LIMITS = {
  free: { docs: 10,       messages: 50 },
  pro:  { docs: Infinity, messages: Infinity },
  max:  { docs: Infinity, messages: Infinity },
} as const;

export type Plan = "free" | "pro" | "max";

export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .single();

  if (!data || data.status === "cancelled" || data.status === "expired") return "free";
  return (data.plan as Plan) ?? "free";
}

export async function getDocCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function getMonthlyMessages(userId: string): Promise<number> {
  const supabase = createClient();
  const yearMonth = new Date().toISOString().slice(0, 7);
  const { data } = await supabase
    .from("usage")
    .select("messages_count")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .single();
  return data?.messages_count ?? 0;
}
