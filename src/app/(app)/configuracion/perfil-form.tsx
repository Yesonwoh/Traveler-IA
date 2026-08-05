"use client";

import { useActionState } from "react";
import { actualizarPerfil, type PerfilState } from "@/actions/perfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: PerfilState = { error: null };

export function PerfilForm({ nombre, telefono }: { nombre: string; telefono: string }) {
  const [state, formAction, isPending] = useActionState(actualizarPerfil, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Nombre</label>
        <Input type="text" name="nombre" defaultValue={nombre} placeholder="Tu nombre" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Teléfono</label>
        <Input type="tel" name="telefono" defaultValue={telefono} placeholder="+34 ..." />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Guardado.</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
