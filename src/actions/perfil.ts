"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import {
  INTERESES,
  VALORES_ALOJAMIENTO,
  VALORES_PRESUPUESTO,
  VALORES_RITMO,
} from "@/lib/preferencias";

export type PerfilState = { error: string | null; success?: boolean };

/**
 * Lo que el servidor acepta de Configuración, campo a campo.
 *
 * Este formulario era el único que llegaba a la base de datos sin pasar por un
 * esquema: cogía lo que viniera en el FormData, le hacía `trim()` y lo guardaba. El
 * navegador limita longitudes y ofrece desplegables, pero una Server Action se puede
 * llamar directamente, así que ninguna de esas dos cosas es una defensa.
 *
 * Importa por dos motivos distintos:
 *  - `ubicacion` y `notas_viaje` acaban DENTRO del contexto que lee la IA, así que sin
 *    tope de longitud cada mensaje de esa persona costaría más dinero.
 *  - los cuatro desplegables tienen valores conocidos; cualquier otra cosa es texto
 *    inventado que la app luego no sabe traducir a etiqueta y se muestra en blanco.
 *
 * `viajes.ts` ya usaba este mismo patrón con `BriefingSchema`.
 */
const OPCIONES_INTERES = new Set<string>(INTERESES);

const opcional = (valores: readonly string[]) =>
  z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || valores.includes(v), "opción no reconocida")
    .transform((v) => v || null);

const PerfilSchema = z.object({
  nombre: z.string().trim().max(80).optional(),
  telefono: z.string().trim().max(30).optional(),
  ubicacion: z.string().trim().max(120).transform((v) => v || null).optional(),
  // el navegador manda "" cuando el campo de fecha está vacío
  fecha_nacimiento: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "fecha no válida")
    .transform((v) => v || null)
    .optional(),
  intereses: z
    .array(z.string().trim())
    // se descarta lo que no esté en el catálogo en vez de rechazar el formulario
    // entero: así un chip retirado del catálogo no bloquea el guardado.
    .transform((lista) => lista.filter((i) => OPCIONES_INTERES.has(i)).slice(0, INTERESES.length))
    .optional(),
  presupuesto_estilo: opcional(VALORES_PRESUPUESTO).optional(),
  tipo_alojamiento: opcional(VALORES_ALOJAMIENTO).optional(),
  ritmo_viaje: opcional(VALORES_RITMO).optional(),
  notas_viaje: z.string().trim().max(600).transform((v) => v || null).optional(),
});

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

  // Solo se recogen los campos presentes: hay varios formularios parciales y cada uno
  // manda los suyos. Lo que no viene no se toca.
  const crudo: Record<string, unknown> = {};
  for (const campo of [
    "nombre",
    "telefono",
    "ubicacion",
    "fecha_nacimiento",
    "presupuesto_estilo",
    "tipo_alojamiento",
    "ritmo_viaje",
    "notas_viaje",
  ]) {
    if (formData.has(campo)) crudo[campo] = String(formData.get(campo) ?? "");
  }
  // los chips van como inputs hidden: sin marcador no se distinguiría "ninguno" de "no enviado"
  if (formData.has("intereses_form")) {
    crudo.intereses = formData.getAll("intereses").map((i) => String(i));
  }

  const parsed = PerfilSchema.safeParse(crudo);
  if (!parsed.success) return { error: "Revisa los datos: hay algún campo que no cuadra." };

  // Fuera las claves sin valor, para no mandarle a Supabase un `undefined` que no
  // significa nada. Si no queda ninguna, no hay nada que guardar.
  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, valor]) => valor !== undefined)
  );
  if (Object.keys(updates).length === 0) return { error: null, success: true };

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return { error: "No se pudo guardar." };

  revalidatePath("/configuracion");
  return { error: null, success: true };
}

/**
 * Formatos aceptados para el avatar, y la extensión con la que se guarda cada uno.
 *
 * Antes bastaba con que el tipo empezara por `image/` y la extensión salía del nombre
 * del fichero. Dos problemas: el tipo lo declara el navegador y se puede falsear, y de
 * un nombre como `foto.svg` salía un SVG guardado en un bucket **público** — y un SVG
 * es un documento que puede llevar `<script>` dentro. Ahora la extensión la decide el
 * servidor a partir de una lista, nunca el nombre que venga.
 */
const FORMATOS_AVATAR: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function subirAvatar(_prev: PerfilState, formData: FormData): Promise<PerfilState> {
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "Elige una imagen." };
  const extension = FORMATOS_AVATAR[file.type];
  if (!extension) return { error: "La foto tiene que ser JPG, PNG o WebP." };
  if (file.size > 4 * 1024 * 1024) return { error: "La imagen no puede pesar más de 4MB." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión no válida." };

  const path = `${user.id}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    // `contentType` explícito: sin él, Supabase se cree la cabecera del fichero subido
    .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
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
