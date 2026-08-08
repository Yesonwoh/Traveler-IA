"use client";

import { useActionState, useRef } from "react";
import { Camera } from "lucide-react";
import { subirAvatar, type PerfilState } from "@/actions/perfil";
import { Avatar } from "@/components/avatar";

const initialState: PerfilState = { error: null };

export function AvatarUpload({
  fotoUrl,
  inicial,
  isPremium,
}: {
  fotoUrl: string;
  inicial: string;
  isPremium: boolean;
}) {
  const [state, formAction, isPending] = useActionState(subirAvatar, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={formAction} ref={formRef} className="flex items-center gap-4">
      <label className="group relative cursor-pointer">
        <input
          type="file"
          name="avatar"
          accept="image/*"
          className="hidden"
          disabled={isPending}
          onChange={() => formRef.current?.requestSubmit()}
        />
        <Avatar fotoUrl={fotoUrl} inicial={inicial} isPremium={isPremium} size="lg" />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={18} className="text-white" />
        </div>
      </label>
      <div className="text-sm">
        <p className="font-medium text-stone-700">Foto de perfil</p>
        <p className="text-stone-500">{isPending ? "Subiendo..." : "Haz clic para cambiarla"}</p>
        {state.error && <p className="text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
