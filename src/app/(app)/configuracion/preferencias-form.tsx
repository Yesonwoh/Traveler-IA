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

/**
 * Desplegable de preferencia.
 *
 * Si el valor guardado no está entre las opciones, se añade como opción extra en vez
 * de dejar que el `<select>` lo pinte como "Sin preferencia". Sin esto, un valor que
 * la lista no reconozca desaparece de la pantalla y **el siguiente guardado lo borra
 * de la base de datos**, sin que el usuario haya tocado ese campo.
 */
function SelectorPreferencia({
  name,
  label,
  valor,
  onChange,
  opciones,
}: {
  name: string;
  label: string;
  valor: string;
  onChange: (v: string) => void;
  opciones: readonly { readonly value: string; readonly label: string }[];
}) {
  const desconocido = valor !== "" && !opciones.some((o) => o.value === valor);

  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-stone-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">Sin preferencia</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {desconocido && <option value={valor}>{valor}</option>}
      </select>
    </div>
  );
}

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
  // Controlados: si fueran `defaultValue`, al revalidar tras guardar volverían
  // visualmente a "Sin preferencia" aunque el valor sí estuviera guardado.
  //
  // Ojo: `useState(prop)` solo hace caso al valor inicial en el primer montaje, así que
  // esto por sí solo deja el formulario sordo a lo que traiga el servidor después. Quien
  // lo resincroniza es la `key` que le pone la página (ver configuracion/page.tsx).
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
        <SelectorPreferencia
          name="presupuesto_estilo"
          label="Estilo de gasto"
          valor={presupuesto}
          onChange={setPresupuesto}
          opciones={PRESUPUESTO_ESTILOS}
        />
        <SelectorPreferencia
          name="tipo_alojamiento"
          label="Alojamiento"
          valor={alojamiento}
          onChange={setAlojamiento}
          opciones={TIPOS_ALOJAMIENTO}
        />
        <SelectorPreferencia
          name="ritmo_viaje"
          label="Ritmo de viaje"
          valor={ritmo}
          onChange={setRitmo}
          opciones={RITMOS_VIAJE}
        />
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
          className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
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
