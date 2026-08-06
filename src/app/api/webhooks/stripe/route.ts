import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await actualizarSuscripcionPorCustomer(supabase, subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await actualizarSuscripcionPorCustomer(supabase, subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function actualizarSuscripcionPorCustomer(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const activa = subscription.status === "active" || subscription.status === "trialing";
  const periodEnd = subscription.items.data[0]?.current_period_end;

  const base = {
    subscription_status: activa ? "premium" : "free",
    subscription_current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
  };

  // `trial_used` solo sube a true, nunca vuelve atrás: es lo que impide encadenar
  // pruebas gratis cancelando y volviendo a contratar. `subscription_trial_end` en
  // cambio se limpia en cuanto la prueba termina, porque solo describe la actual.
  const conPrueba = {
    ...base,
    subscription_trial_end:
      subscription.status === "trialing" && subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    ...(subscription.trial_end ? { trial_used: true } : {}),
  };

  const { error } = await supabase
    .from("profiles")
    .update(conPrueba)
    .eq("stripe_customer_id", subscription.customer as string);

  // Si la migración 0011 todavía no está aplicada, la consulta falla entera por las
  // columnas nuevas. Se reintenta con lo de siempre para no perder el alta de la
  // suscripción, que es lo que de verdad no puede fallar aquí.
  if (error) {
    await supabase
      .from("profiles")
      .update(base)
      .eq("stripe_customer_id", subscription.customer as string);
  }
}
