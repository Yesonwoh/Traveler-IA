"use client";

import { useActionState, useState, useTransition } from "react";
import { cambiarContrasena, eliminarCuenta, type PerfilState } from "@/actions/perfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: PerfilState = { error: null };

export function CuentaSection() {
  const [state, formAction, isPending] = useActionState(cambiarContrasena, initialState);
  const [confirmando, setConfirmando] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-3">
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Cambiar contraseña
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="password"
            name="password"
            placeholder="Nueva contraseña (mínimo 8 caracteres)"
            minLength={8}
            className="sm:flex-1"
          />
          <Button type="submit" variant="outline" disabled={isPending} className="shrink-0">
            {isPending ? "Cambiando..." : "Cambiar"}
          </Button>
        </div>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-600">Contraseña actualizada.</p>}
      </form>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-700">Eliminar cuenta</p>
        <p className="mt-1 text-sm text-red-600">
          Se borran todos tus viajes, mensajes, favoritos y reservas, y se cancela tu
          suscripción si tienes una. No se puede deshacer.
        </p>
        {errorBorrado && (
          <p className="mt-3 rounded-lg bg-white p-3 text-sm text-red-700">{errorBorrado}</p>
        )}
        {confirmando ? (
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
              onClick={() =>
                startDelete(async () => {
                  setErrorBorrado(null);
                  // si todo va bien la acción redirige y esto no llega a ejecutarse
                  const res = await eliminarCuenta();
                  if (res?.error) setErrorBorrado(res.error);
                })
              }
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="outline" className="mt-3" onClick={() => setConfirmando(true)}>
            Eliminar mi cuenta
          </Button>
        )}
      </div>
    </div>
  );
}
