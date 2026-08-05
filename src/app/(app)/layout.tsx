import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre, subscription_status, foto_perfil_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/mis-viajes">
            <Logo size={28} textClassName="text-lg" />
          </Link>
          <UserMenu
            nombre={profile?.nombre ?? ""}
            email={user.email ?? ""}
            isPremium={profile?.subscription_status === "premium"}
            fotoUrl={profile?.foto_perfil_url ?? undefined}
          />
        </div>
      </header>
      <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
