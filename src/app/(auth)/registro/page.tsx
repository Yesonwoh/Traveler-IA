"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, signInWithGoogle, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/google-icon";

const initialState: AuthState = { error: null };

export default function RegistroPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  if (state.success) {
    return (
      <div>
        <h1 className="text-xl font-bold text-stone-900">Confirma tu email</h1>
        <p className="mt-6 rounded-xl bg-brand-light p-4 text-sm text-brand-dark">
          {state.message}
        </p>
        <p className="mt-6 text-center text-sm text-stone-500">
          <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Crea tu cuenta</h1>
      <p className="mt-1 text-sm text-stone-500">
        Gratis. Empieza a viajar barato con IA en 30 segundos.
      </p>

      <form action={signInWithGoogle} className="mt-6">
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon /> Continuar con Google
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-stone-500">
        <div className="h-px flex-1 bg-stone-200" />
        o con email
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form action={formAction} className="space-y-3">
        <Input type="text" name="nombre" placeholder="Nombre" required autoComplete="name" />
        <Input type="email" name="email" placeholder="Email" required autoComplete="email" />
        <Input
          type="password"
          name="password"
          placeholder="Contraseña (mínimo 8 caracteres)"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-stone-500">
        Al crear una cuenta aceptas nuestros{" "}
        <Link href="/terminos" className="underline underline-offset-2 hover:text-brand">
          Términos de servicio
        </Link>{" "}
        y nuestra{" "}
        <Link href="/privacidad" className="underline underline-offset-2 hover:text-brand">
          Política de privacidad
        </Link>
        .
      </p>

      <p className="mt-6 text-center text-sm text-stone-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
