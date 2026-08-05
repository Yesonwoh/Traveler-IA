"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { crearViajeGuiado, type BriefingViaje } from "@/actions/viajes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { INTERESES } from "@/lib/preferencias";
import { cn } from "@/lib/utils";

const CUANDO_OPCIONES = [
  "Cuando salga más barato",
  "Este mes",
  "El mes que viene",
  "En 2-3 meses",
  "En verano",
  "En invierno",
  "En un puente o festivo",
];

export function CrearViajeDialog({
  origenPorDefecto = "",
  interesesPorDefecto = [],
}: {
  origenPorDefecto?: string;
  interesesPorDefecto?: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left transition-colors hover:border-brand hover:bg-brand-light/40"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <Plus size={20} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold text-stone-900">Nuevo viaje</span>
          <span className="block truncate text-sm text-stone-500">
            Cuéntanos lo básico y la IA te monta la primera propuesta.
          </span>
        </span>
      </button>

      {open && (
        <FormularioViaje
          origenPorDefecto={origenPorDefecto}
          interesesPorDefecto={interesesPorDefecto}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function FormularioViaje({
  origenPorDefecto,
  interesesPorDefecto,
  onClose,
}: {
  origenPorDefecto: string;
  interesesPorDefecto: string[];
  onClose: () => void;
}) {
  const [destino, setDestino] = useState("");
  const [fechasTipo, setFechasTipo] = useState<"exactas" | "flexible">("exactas");
  const [fechaIda, setFechaIda] = useState("");
  const [fechaVuelta, setFechaVuelta] = useState("");
  const [duracion, setDuracion] = useState("");
  const [cuando, setCuando] = useState(CUANDO_OPCIONES[0]);
  const [origen, setOrigen] = useState(origenPorDefecto);
  const [viajeros, setViajeros] = useState("1");
  const [presupuesto, setPresupuesto] = useState("");
  const [intereses, setIntereses] = useState<string[]>(interesesPorDefecto);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Bloquea el scroll del fondo y permite cerrar con Escape (salvo mientras crea).
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previo;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isPending, onClose]);

  function toggleInteres(interes: string) {
    setIntereses((prev) =>
      prev.includes(interes) ? prev.filter((i) => i !== interes) : [...prev, interes]
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError(null);

    const datos: BriefingViaje = {
      destino,
      fechasTipo,
      fechaIda,
      fechaVuelta,
      duracion,
      cuando,
      origen,
      viajeros,
      presupuesto,
      intereses,
      notas,
    };

    startTransition(async () => {
      const res = await crearViajeGuiado(datos);
      // si todo va bien la acción redirige al chat y esto no llega a ejecutarse
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        onClick={() => !isPending && onClose()}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-stone-900">Nuevo viaje</h2>
            <p className="text-xs text-stone-500">Solo el destino es imprescindible... y ni eso.</p>
          </div>
          <button
            onClick={() => !isPending && onClose()}
            aria-label="Cerrar"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <Campo label="¿A dónde quieres ir?">
              <Input
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ej: Lisboa, Japón, los Balcanes..."
                autoFocus
              />
              <p className="mt-1 text-xs text-stone-400">
                Déjalo vacío si quieres que la IA te proponga un chollo.
              </p>
            </Campo>

            <Campo label="Fechas">
              <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
                {(["exactas", "flexible"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFechasTipo(tipo)}
                    className={cn(
                      "cursor-pointer rounded-lg py-2 text-sm font-semibold capitalize transition-colors",
                      fechasTipo === tipo
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {tipo === "exactas" ? "Exactas" : "Flexibles"}
                  </button>
                ))}
              </div>

              {fechasTipo === "exactas" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="mb-1 block text-xs text-stone-500">Ida</span>
                    <Input
                      type="date"
                      value={fechaIda}
                      onChange={(e) => setFechaIda(e.target.value)}
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-stone-500">Vuelta</span>
                    <Input
                      type="date"
                      value={fechaVuelta}
                      min={fechaIda || undefined}
                      onChange={(e) => setFechaVuelta(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="mb-1 block text-xs text-stone-500">¿Cuántos días?</span>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={duracion}
                      onChange={(e) => setDuracion(e.target.value)}
                      placeholder="Ej: 4"
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs text-stone-500">¿Cuándo?</span>
                    <Select value={cuando} onChange={(e) => setCuando(e.target.value)}>
                      {CUANDO_OPCIONES.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}
            </Campo>

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Salgo desde">
                <Input
                  value={origen}
                  onChange={(e) => setOrigen(e.target.value)}
                  placeholder="Ej: Madrid"
                />
              </Campo>
              <Campo label="Viajeros">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={viajeros}
                  onChange={(e) => setViajeros(e.target.value)}
                />
              </Campo>
            </div>

            <Campo label="Presupuesto por persona" opcional>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                  placeholder="Ej: 200"
                  className="pr-9"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400">
                  €
                </span>
              </div>
            </Campo>

            <Campo label="¿Qué te apetece?" opcional>
              <div className="flex flex-wrap gap-2">
                {INTERESES.map((interes) => {
                  const activo = intereses.includes(interes);
                  return (
                    <button
                      key={interes}
                      type="button"
                      onClick={() => toggleInteres(interes)}
                      aria-pressed={activo}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        // seleccionado va en relleno sólido: el borde naranja claro de
                        // antes apenas se distinguía del estado normal
                        activo
                          ? "border-brand bg-brand text-white hover:bg-brand-dark"
                          : "border-stone-200 font-medium text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                      )}
                    >
                      {interes}
                    </button>
                  );
                })}
              </div>
            </Campo>

            <Campo label="Algo más que deba saber" opcional>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                maxLength={600}
                placeholder="Ej: viajo con mi perro, soy vegetariano, no quiero madrugar..."
                className="w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </Campo>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="shrink-0 border-t border-stone-100 px-5 py-4">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Montando tu viaje...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Crear viaje con la IA
                </>
              )}
            </Button>
            {isPending && (
              <p className="mt-2 text-center text-xs text-stone-400">
                Buscando destino, precios y sitios concretos. Tarda unos segundos.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({
  label,
  opcional,
  children,
}: {
  label: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-stone-700">
        {label}
        {opcional && <span className="ml-1.5 font-normal text-stone-400">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-11 w-full cursor-pointer rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
    />
  );
}
