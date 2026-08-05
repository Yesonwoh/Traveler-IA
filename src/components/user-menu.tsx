"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  CreditCard,
  Sparkles,
  FileText,
  ShieldCheck,
  Cookie,
  LogOut,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { Avatar } from "@/components/avatar";

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50";

export function UserMenu({
  nombre,
  email,
  isPremium,
  fotoUrl,
}: {
  nombre: string;
  email: string;
  isPremium: boolean;
  fotoUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const inicial = (nombre || email || "?").charAt(0).toUpperCase();
  const cerrar = () => setOpen(false);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="cursor-pointer">
        <Avatar fotoUrl={fotoUrl} inicial={inicial} isPremium={isPremium} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          <div className="border-b border-stone-100 px-4 py-2 text-sm">
            <p className="flex items-center gap-1.5 truncate font-semibold text-stone-900">
              {nombre || "Viajero"}
              {isPremium && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  PREMIUM
                </span>
              )}
            </p>
            <p className="truncate text-stone-500">{email}</p>
          </div>

          <Link href="/configuracion" className={ITEM_CLASS} onClick={cerrar}>
            <Settings size={15} className="text-stone-400" />
            Configuración
          </Link>

          {/* Esto era un <form> con acción de servidor y un onClick que cerraba el menú:
              al cerrarlo, React desmontaba el formulario ANTES de que se enviara, así que
              el botón no hacía absolutamente nada. Ahora es un enlace normal a la página
              de planes, que es además donde se cancela. */}
          {isPremium ? (
            <Link href="/premium" className={ITEM_CLASS} onClick={cerrar}>
              <CreditCard size={15} className="text-stone-400" />
              Gestionar suscripción
            </Link>
          ) : (
            <Link
              href="/premium"
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm font-semibold text-brand transition-colors hover:bg-brand-light"
              onClick={cerrar}
            >
              <Sparkles size={15} />
              Hazte premium
            </Link>
          )}

          <div className="my-1 border-t border-stone-100" />

          <Link href="/terminos" className={ITEM_CLASS} onClick={cerrar}>
            <FileText size={15} className="text-stone-400" />
            Términos de servicio
          </Link>
          <Link href="/privacidad" className={ITEM_CLASS} onClick={cerrar}>
            <ShieldCheck size={15} className="text-stone-400" />
            Política de privacidad
          </Link>
          <Link href="/cookies" className={ITEM_CLASS} onClick={cerrar}>
            <Cookie size={15} className="text-stone-400" />
            Política de cookies
          </Link>

          <div className="my-1 border-t border-stone-100" />

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
