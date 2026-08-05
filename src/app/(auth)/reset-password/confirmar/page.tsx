"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { error: null };

export default function ConfirmarResetPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900">Nueva contraseña</h1>
      <p className="mt-1 text-sm text-stone-500">Elige una contraseña nueva para tu cuenta.</p>

      <form action={formAction} className="mt-6 space-y-3">
        <Input
          type="password"
          name="password"
          placeholder="Nueva contraseña (mínimo 8 caracteres)"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}
