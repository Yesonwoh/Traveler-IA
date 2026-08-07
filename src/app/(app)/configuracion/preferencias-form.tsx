"use client";

import { useState, useTransition } from "react";
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
  // Envío manual y NO `<form action={serverAction}>` a propósito.
  //
  // React 19 resetea el formulario en cuanto termina una Server Action. Con campos
  // controlados eso deja el DOM y el estado desacompasados: el estado ya tiene el
  // valor nuevo, el reset devuelve el `<select>` al que tenía al renderizar, y como
  // para React nada ha cambiado, no vuelve a escribirlo. Resultado: guardas, sale
  // "Guardado." y en pantalla sigue el valor viejo hasta que recargas.
  //
  // Se puede tapar remontando el formulario con una `key`, pero eso reinicia el
  // estado de useActionState y entonces se pierde el mensaje. Controlando el envío
  // a mano no hay reset que tapar.
  const [state, setState] = useState<PerfilState>(initialState);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    const datos = new FormData(e.currentTarget);
    startTransition(async () => {
      setState(await actualizarPerfil(initialState, datos));
    });
  }

  // Todos los campos controlados, incluidos ubicación y fecha: el formulario envía
  // SIEMPRE los siete, así que uno solo que se quede con un valor viejo lo escribe
  // encima del bueno al guardar.
  const [ubi, setUbi] = useState(ubicacion);
  const [nacimiento, setNacimiento] = useState(fechaNacimiento);
  const [intereses, setIntereses] = useState<string[]>(interesesIniciales);
  const [presupuesto, setPresupuesto] = useState(presupuestoEstilo);
  const [alojamiento, setAlojamiento] = useState(tipoAlojamiento);
  const [ritmo, setRitmo] = useState(ritmoViaje);
  const [notas, setNotas] = useState(notasViaje);

  // Resincronización con el servidor SIN remontar.
  //
  // `useState(prop)` solo mira el valor inicial en el primer montaje, así que sin esto
  // el formulario se queda sordo a lo que traiga el servidor después. Con una `key` en
  // la página también se arreglaba, pero remontar reinicia el estado de useActionState
  // y con él se perdía el "Guardado." en verde. Este es el patrón de React para ajustar
  // estado cuando cambian las props: comparar con lo último visto y corregir en el render.
  const delServidor = [
    ubicacion,
    fechaNacimiento,
    interesesIniciales.join(","),
    presupuestoEstilo,
    tipoAlojamiento,
    ritmoViaje,
    notasViaje,
  ].join("|");
  const [visto, setVisto] = useState(delServidor);

  if (visto !== delServidor) {
    setVisto(delServidor);
    setUbi(ubicacion);
    setNacimiento(fechaNacimiento);
    setIntereses(interesesIniciales);
    setPresupuesto(presupuestoEstilo);
    setAlojamiento(tipoAlojamiento);
    setRitmo(ritmoViaje);
    setNotas(notasViaje);
  }

  function toggleInteres(interes: string) {
    setIntereses((prev) =>
      prev.includes(interes) ? prev.filter((i) => i !== interes) : [...prev, interes]
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Dónde vives</label>
          <Input
            type="text"
            name="ubicacion"
            value={ubi}
            onChange={(e) => setUbi(e.target.value)}
            placeholder="Ej: Madrid, España"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Fecha de nacimiento
          </label>
          <Input
            type="date"
            name="fecha_nacimiento"
            value={nacimiento}
            onChange={(e) => setNacimiento(e.target.value)}
          />
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
