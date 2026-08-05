"use client";

import { useActionState, useState } from "react";
import { actualizarPerfil, type PerfilState } from "@/actions/perfil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  INTERESES,
  PRESUPUESTO_ESTILOS,
  TIPOS_ALOJAMIENTO,
  RITMOS_VIAJE,
} from "@/lib/preferencias";
import { cn } from "@/lib/utils";

const initialState: PerfilState = { error: null };

const SELECT_CLASS =
  "h-11 w-full cursor-pointer rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20";

export function PreferenciasForm({
  ubicacion,
  fechaNacimiento,
  intereses: interesesIniciales,
  presupuestoEstilo,
  tipoAlojamiento,
  ritmoViaje,
  notasViaje,
}: {
  ubicacion: string;
  fechaNacimiento: string;
  intereses: string[];
  presupuestoEstilo: string;
  tipoAlojamiento: string;
  ritmoViaje: string;
  notasViaje: string;
}) {
  const [state, formAction, isPending] = useActionState(actualizarPerfil, initialState);
  // controlados: si fueran `defaultValue`, al revalidar tras guardar volverían
  // visualmente a "Sin preferencia" aunque el valor sí estuviera guardado.
  const [intereses, setIntereses] = useState<string[]>(interesesIniciales);
  const [presupuesto, setPresupuesto] = useState(presupuestoEstilo);
  const [alojamiento, setAlojamiento] = useState(tipoAlojamiento);
  const [ritmo, setRitmo] = useState(ritmoViaje);
  const [notas, setNotas] = useState(notasViaje);

  function toggleInteres(interes: string) {
    setIntereses((prev) =>
      prev.includes(interes) ? prev.filter((i) => i !== interes) : [...prev, interes]
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Dónde vives</label>
          <Input
            type="text"
            name="ubicacion"
            defaultValue={ubicacion}
            placeholder="Ej: Madrid, España"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Fecha de nacimiento
          </label>
          <Input type="date" name="fecha_nacimiento" defaultValue={fechaNacimiento} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-stone-700">Qué te gusta</label>
        {/* marcador para que la acción sepa distinguir "sin intereses" de "este formulario no los envía" */}
        <input type="hidden" name="intereses_form" value="1" />
        <div className="flex flex-wrap gap-2">
          {INTERESES.map((interes) => {
            const activo = intereses.includes(interes);
            return (
              <button
                key={interes}
                type="button"
                onClick={() => toggleInteres(interes)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activo
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                {interes}
              </button>
            );
          })}
        </div>
        {intereses.map((i) => (
          <input key={i} type="hidden" name="intereses" value={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Estilo de gasto</label>
          <select
            name="presupuesto_estilo"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Sin preferencia</option>
            {PRESUPUESTO_ESTILOS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Alojamiento</label>
          <select
            name="tipo_alojamiento"
            value={alojamiento}
            onChange={(e) => setAlojamiento(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Sin preferencia</option>
            {TIPOS_ALOJAMIENTO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Ritmo de viaje</label>
          <select
            name="ritmo_viaje"
            value={ritmo}
            onChange={(e) => setRitmo(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Sin preferencia</option>
            {RITMOS_VIAJE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Algo que la IA deba tener siempre en cuenta
        </label>
        <textarea
          name="notas_viaje"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          maxLength={600}
          placeholder="Ej: soy vegetariano, viajo con movilidad reducida, odio madrugar..."
          className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Guardado.</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar preferencias"}
      </Button>
    </form>
  );
}
