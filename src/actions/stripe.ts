"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, PRICE_IDS } from "@/lib/stripe/client";
import { DIAS_PRUEBA } from "@/lib/suscripcion/prueba";
import { tienePruebaDisponible } from "@/lib/suscripcion/elegibilidad";

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

  // Con service_role y no con la sesión del usuario: desde la migración 0012, el rol
  // `authenticated` ya no tiene UPDATE sobre stripe_customer_id, precisamente para que
  // nadie pueda apuntar su checkout al cliente de Stripe de otra persona. El dato que
  // se escribe aquí lo acaba de generar Stripe y el userId ya viene verificado por
  // quien llama, así que saltarse RLS es seguro y necesario.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  // Si no se guarda, el siguiente intento crearía OTRO cliente en Stripe para la misma
  // persona y la comprobación de "prueba ya gastada" dejaría de encontrar su historial.
  if (error) throw new Error("No se pudo guardar el cliente de Stripe.");

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
  const conPrueba = await tienePruebaDisponible(supabase, user.id, customerId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    ...(conPrueba && {
      subscription_data: {
        trial_period_days: DIAS_PRUEBA,
        // Checkout pide tarjeta igualmente en modo suscripción, pero si por lo que
        // sea la prueba llegase al final sin método de pago, que se cancele: una
        // suscripción impagada dando acceso Premium es peor que perder al usuario.
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
    }),
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
