import Link from "next/link";

const ENLACES = [
  { href: "/terminos", label: "Términos de servicio" },
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/cookies", label: "Política de cookies" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        <p className="text-sm text-stone-500">Viaja más, gastando menos.</p>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {ENLACES.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-stone-500 underline-offset-4 transition-colors hover:text-brand hover:underline"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="max-w-2xl text-xs leading-relaxed text-stone-400">
          Traveler IA puede incluir enlaces de afiliado. Si reservas a través de ellos podemos
          recibir una comisión sin coste adicional para ti. Los precios y la disponibilidad los
          fija cada proveedor y pueden cambiar.
        </p>

        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} Traveler IA — Yeseong Oh. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
