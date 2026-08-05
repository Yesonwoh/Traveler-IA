import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Link href="/">
          <Logo size={28} textClassName="text-base sm:text-lg" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
          <Compass size={30} />
        </span>
        <p className="text-sm font-bold uppercase tracking-widest text-brand">Error 404</p>
        <h1 className="max-w-lg text-3xl font-black leading-tight text-stone-900 sm:text-4xl">
          Esta parada no está en el mapa
        </h1>
        <p className="max-w-md text-stone-500">
          La página que buscas no existe o ha cambiado de sitio. Volvamos a terreno conocido.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/30 transition-colors hover:bg-brand-dark"
          >
            Ir al inicio
          </Link>
          <Link
            href="/mis-viajes"
            className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-600 transition-colors hover:border-brand hover:text-brand"
          >
            Mis viajes
          </Link>
        </div>
      </main>
    </div>
  );
}
