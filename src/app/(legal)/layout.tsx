import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { VolverLink } from "@/components/volver-link";
import { createClient } from "@/lib/supabase/server";

export default async function LegalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // con sesión, el logo devuelve a la app en vez de a la landing de marketing
  const inicio = user ? "/mis-viajes" : "/";

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href={inicio}>
            <Logo size={28} textClassName="text-lg" />
          </Link>
          <VolverLink destino={inicio} />
        </div>
      </header>

      <main className="flex-1 px-6 py-12">
        <article className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-6 sm:p-10">
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
