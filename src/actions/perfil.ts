"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";

export type PerfilState = { error: string | null; success?: boolean };

/** Actualiza solo los campos presentes en el FormData (para poder tener varios formularios parciales). */
export async function actualizarPerfil(
  _prev: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const updates: Record<string, string | string[] | null> = {};
  if (formData.has("nombre")) updates.nombre = String(formData.get("nombre") ?? "").trim();
  if (formData.has("telefono")) updates.telefono = String(formData.get("telefono") ?? "").trim();
  if (formData.has("ubicacion")) {
    updates.ubicacion = String(formData.get("ubicacion") ?? "").trim() || null;
  }
  if (formData.has("fecha_nacimiento")) {
    updates.fecha_nacimiento = String(formData.get("fecha_nacimiento") ?? "").trim() || null;
  }
  // los chips van como inputs hidden: sin marcador no se distinguiría "ninguno" de "no enviado"
  if (formData.has("intereses_form")) {
    updates.intereses = formData.getAll("intereses").map((i) => String(i).trim()).filter(Boolean);
  }
  for (const campo of ["presupuesto_estilo", "tipo_alojamiento", "ritmo_viaje", "notas_viaje"]) {
    if (formData.has(campo)) updates[campo] = String(formData.get(campo) ?? "").trim() || null;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return { error: "No se pudo guardar." };

  revalidatePath("/configuracion");
  return { error: null, success: true };
}

export async function subirAvatar(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Elige una imagen." };
  if (!file.type.startsWith("image/")) return { error: "El archivo debe ser una imagen." };
  if (file.size > 4 * 1024 * 1024) return { error: "La imagen no puede pesar más de 4MB." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) return { error: "No se pudo subir la imagen." };

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  const cacheBustedUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ foto_perfil_url: cacheBustedUrl })
    .eq("id", user.id);
  if (updateError) return { error: "No se pudo guardar la foto." };

  revalidatePath("/configuracion");
  return { error: null, success: true };
}

export async function cambiarContrasena(
  _prev: PerfilState,
  formData: FormData
): Promise<PerfilState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No se pudo cambiar la contraseña." };

  return { error: null, success: true };
}

/**
 * Suscripciones que siguen generando cobros. `canceled` e `incomplete_expired` ya
 * están muertas; el resto, incluida `trialing`, acaba pasando por caja.
 */
const SUSCRIPCION_VIVA = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "paused",
]);

export async function eliminarCuenta(): Promise<PerfilState | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // PRIMERO Stripe, y si falla no se borra nada.
  //
  // Borrar la cuenta no cancelaba la suscripción: a quien se diera de baja siendo
  // premium le seguían cobrando 4,99 € todos los meses, sin cuenta, sin servicio y
  // sin ninguna forma de pararlo desde la app. Y al desaparecer el perfil se perdía
  // el stripe_customer_id, así que ni siquiera quedaba rastro para devolvérselo.
  const { data: perfil } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<{ stripe_customer_id: string | null }>();

  if (perfil?.stripe_customer_id) {
    try {
      const suscripciones = await stripe.subscriptions.list({
        customer: perfil.stripe_customer_id,
        status: "all",
        limit: 100,
      });
      for (const suscripcion of suscripciones.data) {
        if (SUSCRIPCION_VIVA.has(suscripcion.status)) {
          await stripe.subscriptions.cancel(suscripcion.id);
        }
      }
    } catch {
      // Abortar es lo correcto: es preferible que se quede con la cuenta y lo intente
      // otra vez a borrársela dejándole un cobro recurrente que ya no puede parar.
      return {
        error:
          "No hemos podido cancelar tu suscripción, así que no hemos borrado nada para no dejarte pagando. Inténtalo en un rato o escríbenos a contacto@traveleria.app.",
      };
    }
  }

  // borra los viajes del usuario primero: encadena el borrado de mensajes,
  // recomendaciones, favoritos y reservas vía "on delete cascade" por viaje_id.
  await supabase.from("viajes").delete().eq("user_id", user.id);

  const admin = createAdminClient();
  // Los ficheros de storage no cuelgan de auth.users, así que hay que barrerlos a mano
  // o se quedan huérfanos ocupando sitio para siempre.
  await Promise.all([
    admin.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]),
    admin.storage.from("portadas").remove([`${user.id}/portada.jpg`, `${user.id}/portada.png`, `${user.id}/portada.webp`]),
  ]).catch(() => {
    // un fichero huérfano no justifica dejar la cuenta a medio borrar
  });

  await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  redirect("/");
}
