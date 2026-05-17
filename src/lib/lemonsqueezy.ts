const STORE_SLUG = process.env.NEXT_PUBLIC_LS_STORE_SLUG ?? "studypilote";
const PRO_VARIANT = process.env.NEXT_PUBLIC_LS_PRO_VARIANT_ID ?? "";
const MAX_VARIANT = process.env.NEXT_PUBLIC_LS_MAX_VARIANT_ID ?? "";

export const LS_CONFIGURED = PRO_VARIANT && PRO_VARIANT !== "a_configurer";

export function checkoutUrl(plan: "pro" | "max", email?: string): string {
  if (!LS_CONFIGURED) return "/pricing";
  const variantId = plan === "pro" ? PRO_VARIANT : MAX_VARIANT;
  const base = `https://${STORE_SLUG}.lemonsqueezy.com/checkout/buy/${variantId}`;
  return email
    ? `${base}?checkout[email]=${encodeURIComponent(email)}`
    : base;
}

export function customerPortalUrl(): string {
  return `https://${STORE_SLUG}.lemonsqueezy.com/billing`;
}
