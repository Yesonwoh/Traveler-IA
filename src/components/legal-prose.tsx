import type { ReactNode } from "react";

/**
 * Estilos compartidos para los documentos legales, para que los tres
 * (términos, privacidad, cookies) se vean exactamente igual.
 */
export function LegalProse({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  actualizado: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h1 className="text-3xl font-black text-stone-900">{titulo}</h1>
      <p className="mt-2 text-sm text-stone-500">Última actualización: {actualizado}</p>

      <div
        className="mt-8 text-[15px] leading-relaxed text-stone-600 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-stone-900 [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-stone-900 [&_li]:mb-1.5 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-stone-900 [&_table]:w-full [&_td]:border-t [&_td]:border-stone-200 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_th]:text-stone-900 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5"
      >
        {children}
      </div>
    </div>
  );
}
