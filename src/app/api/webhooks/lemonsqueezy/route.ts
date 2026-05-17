import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";

type LSPlan = "free" | "pro" | "max";

const VARIANT_TO_PLAN: Record<string, LSPlan> = {
  [process.env.NEXT_PUBLIC_LS_PRO_VARIANT_ID ?? ""]: "pro",
  [process.env.NEXT_PUBLIC_LS_MAX_VARIANT_ID ?? ""]: "max",
};

function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-signature") ?? "";
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

  const digest = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  const eventName: string = event.meta?.event_name ?? "";
  const data = event.data?.attributes ?? {};
  const userEmail: string = data.user_email ?? "";
  const variantId = String(data.variant_id ?? "");
  const subscriptionId = String(event.data?.id ?? "");
  const customerId = String(data.customer_id ?? "");
  const endsAt: string | null = data.ends_at ?? null;

  if (!userEmail) return NextResponse.json({ ok: true });

  const supabase = adminClient();
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find((u) => u.email === userEmail);
  if (!authUser) return NextResponse.json({ ok: true });

  const userId = authUser.id;
  const plan: LSPlan = VARIANT_TO_PLAN[variantId] ?? "pro";

  if (eventName === "subscription_created" || eventName === "subscription_updated" || eventName === "subscription_resumed") {
    await supabase.from("subscriptions").upsert({
      user_id: userId,
      plan,
      status: "active",
      lemon_squeezy_subscription_id: subscriptionId,
      lemon_squeezy_customer_id: customerId,
      current_period_end: endsAt,
    }, { onConflict: "user_id" });
  }

  if (eventName === "subscription_cancelled") {
    await supabase.from("subscriptions")
      .update({ status: "cancelled", current_period_end: endsAt })
      .eq("lemon_squeezy_subscription_id", subscriptionId);
  }

  if (eventName === "subscription_expired") {
    await supabase.from("subscriptions")
      .update({ status: "expired", plan: "free" })
      .eq("lemon_squeezy_subscription_id", subscriptionId);
  }

  return NextResponse.json({ ok: true });
}
