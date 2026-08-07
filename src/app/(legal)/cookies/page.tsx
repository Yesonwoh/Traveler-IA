import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse } from "@/components/legal-prose";
import { CookieResetButton } from "./cookie-reset-button";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Qué cookies usamos en Traveler IA y cómo gestionarlas.",
};

export default function CookiesPage() {
  return (
    <LegalProse titulo="Política de cookies" actualizado="5 de agosto de 2026">
      <p>
        Una cookie es un pequeño archivo que se guarda en tu dispositivo al visitar una web. En{" "}
        <strong>Traveler IA</strong> usamos las mínimas necesarias para que el servicio funcione, y
        el resto solo si nos das tu consentimiento.
      </p>

      <h2>1. Cookies que utilizamos</h2>

      <h3>Necesarias (siempre activas)</h3>
      <p>
        Sin ellas la web no puede funcionar, así que no requieren consentimiento. No se usan para
        perfilarte.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Finalidad</th>
            <th>Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>sb-*-auth-token</strong>
            </td>
            <td>Mantiene tu sesión iniciada (Supabase Auth).</td>
            <td>1 año</td>
          </tr>
          <tr>
            <td>
              <strong>traveler-ia-cookies</strong>
            </td>
            <td>Recuerda tu decisión sobre este aviso de cookies.</td>
            <td>1 año</td>
          </tr>
          <tr>
            <td>
              <strong>__stripe_mid / __stripe_sid</strong>
            </td>
            <td>Prevención del fraude en los pagos (Stripe).</td>
            <td>1 año / 30 min</td>
          </tr>
        </tbody>
      </table>

      <h3>Analíticas (opcionales)</h3>
      <p>
        Nos ayudan a entender de forma agregada cómo se usa la web para mejorarla. Solo se activan
        si las aceptas, y puedes retirar el consentimiento cuando quieras.
      </p>
      <p>
        Usamos <strong>Vercel Web Analytics</strong>, que mide páginas vistas y de dónde llega la
        visita <strong>sin instalar ninguna cookie</strong> y sin construir un perfil tuyo ni
        seguirte por otras webs. Aun así, solo lo activamos si aceptas las cookies opcionales.
      </p>

      <h3>De terceros</h3>
      <p>
        Al mostrar mapas y fotos de lugares, <strong>Google Maps</strong> puede instalar cookies
        propias sujetas a la política de privacidad de Google. Del mismo modo, si sigues un enlace
        de afiliado, <strong>TravelPayouts</strong> y el proveedor de destino (Aviasales, Hotellook,
        Tiqets, GetYourGuide, Klook…) pueden registrar una cookie para atribuir la reserva. Esas
        cookies se rigen por las políticas de cada proveedor.
      </p>

      <h2>2. No usamos cookies publicitarias</h2>
      <p>
        No instalamos cookies de publicidad comportamental ni compartimos tu navegación con redes
        publicitarias.
      </p>

      <h2>3. Cómo gestionar tus preferencias</h2>
      <p>
        Puedes cambiar tu decisión en cualquier momento con este botón, que volverá a mostrarte el
        aviso de cookies:
      </p>
      <CookieResetButton />
      <p>
        También puedes bloquear o eliminar cookies desde la configuración de tu navegador
        (Chrome, Firefox, Safari o Edge, en su sección de privacidad). Ten en cuenta que si
        bloqueas las cookies necesarias no podrás mantener la sesión iniciada.
      </p>

      <h2>4. Más información</h2>
      <p>
        Para saber cómo tratamos el resto de tus datos, consulta nuestra{" "}
        <Link href="/privacidad">Política de privacidad</Link> y los{" "}
        <Link href="/terminos">Términos de servicio</Link>. Si tienes dudas, escríbenos a{" "}
        <a href="mailto:contacto.traveleria@gmail.com">contacto.traveleria@gmail.com</a>.
      </p>
    </LegalProse>
  );
}
