"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signInWithGoogle, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/google-icon";

const initialState: AuthState = { error: null };

export function LoginForm({ next, oauthError }: { next: string; oauthError?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Inicia sesión</h1>
      <p className="mt-1 text-sm text-stone-500">
        Vuelve a por más viajes chollo con IA.
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
        <input type="hidden" name="next" value={next} />
        <Input type="email" name="email" placeholder="Email" required autoComplete="email" />
        <Input
          type="password"
          name="password"
          placeholder="Contraseña"
          required
          autoComplete="current-password"
        />
        {(state.error || oauthError) && (
          <p className="text-sm text-red-600">{state.error ?? oauthError}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/reset-password" className="text-stone-500 hover:text-brand">
          ¿Olvidaste tu contraseña?
        </Link>
        <Link href="/registro" className="font-semibold text-brand hover:text-brand-dark">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
