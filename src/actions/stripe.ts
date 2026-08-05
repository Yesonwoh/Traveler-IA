"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_IDS } from "@/lib/stripe/client";

async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined
): Promise<string> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  await supabase.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);

  return customer.id;
}

export async function crearCheckoutSession(plan: "monthly" | "yearly") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");

  const origin = (await headers()).get("origin");
  const customerId = await getOrCreateStripeCustomer(user.id, user.email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${origin}/mis-viajes?premium=1`,
    cancel_url: `${origin}/premium`,
  });

  if (!session.url) throw new Error("No se pudo crear la sesión de pago.");
  redirect(session.url);
}

/** Rutas a las que se puede volver desde el portal, para no aceptar cualquier URL. */
const RETORNOS_VALIDOS = new Set(["/premium", "/configuracion"]);

export async function crearPortalSession(formData?: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const origin = (await headers()).get("origin");
  const customerId = await getOrCreateStripeCustomer(user.id, user.email);

  // se vuelve a la página desde la que se abrió el portal, no siempre a configuración
  const pedido = formData?.get("retorno");
  const retorno =
    typeof pedido === "string" && RETORNOS_VALIDOS.has(pedido) ? pedido : "/configuracion";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}${retorno}`,
  });

  redirect(session.url);
}
