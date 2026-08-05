"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { error: null };

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Recupera tu contraseña</h1>
      <p className="mt-1 text-sm text-stone-500">
        Te mandamos un email con un enlace para crear una nueva.
      </p>

      {state.success ? (
        <p className="mt-6 rounded-xl bg-brand-light p-4 text-sm text-brand-dark">
          Revisa tu bandeja de entrada y sigue el enlace para crear una nueva contraseña.
        </p>
      ) : (
        <form action={formAction} className="mt-6 space-y-3">
          <Input type="email" name="email" placeholder="Email" required autoComplete="email" />
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
