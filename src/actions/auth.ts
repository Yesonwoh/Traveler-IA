"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rutaSegura, urlDelSitio } from "@/lib/auth-redirects";

export type AuthState = { error: string | null; success?: boolean; message?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = rutaSegura(formData.get("next")?.toString());

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nombre = String(formData.get("nombre") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: nombre },
      emailRedirectTo: `${await urlDelSitio()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Con la confirmación de email activada (por defecto en Supabase) no viene
  // sesión: hay que avisar en vez de mandar a /mis-viajes, porque allí el proxy
  // devolvería al login y parecería que el registro ha fallado.
  // Un `identities` vacío significa que ese email ya estaba registrado; Supabase
  // no lo distingue a propósito, así que damos la misma respuesta en ambos casos
  // para no revelar qué emails tienen cuenta.
  if (!data.session) {
    return {
      error: null,
      success: true,
      message:
        "Te hemos enviado un email para confirmar tu cuenta. Ábrelo desde este dispositivo para entrar.",
    };
  }

  redirect("/mis-viajes");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await urlDelSitio()}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=No se pudo iniciar sesión con Google");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Sin esto, la caché del router del cliente conserva las páginas ya renderizadas
  // y la siguiente cuenta que entre en este navegador vería un instante los datos
  // de la anterior.
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await urlDelSitio()}/auth/callback?next=/reset-password/confirmar`,
  });

  if (error) {
    return { error: "No se pudo enviar el email de recuperación." };
  }

  return { error: null, success: true };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "No se pudo actualizar la contraseña." };
  }

  redirect("/mis-viajes");
}
