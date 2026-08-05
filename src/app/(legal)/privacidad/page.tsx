import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse } from "@/components/legal-prose";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos tus datos personales en Traveler IA.",
};

export default function PrivacidadPage() {
  return (
    <LegalProse titulo="Política de privacidad" actualizado="5 de agosto de 2026">
      <p>
        En <strong>Traveler IA</strong> tratamos tus datos personales conforme al Reglamento (UE)
        2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD). Aquí te explicamos qué recogemos, para
        qué y qué puedes hacer al respecto.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>Yeseong Oh</strong> — NIF <strong>Y3392043V</strong> — domicilio en{" "}
        <strong>C/ Morrón del Mediodía, Nº 40, 18008 Granada (España)</strong>. Contacto para
        asuntos de privacidad:{" "}
        <a href="mailto:contacto.traveleria@gmail.com">contacto.traveleria@gmail.com</a>.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <table>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Datos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Cuenta</strong>
            </td>
            <td>Email, contraseña cifrada, nombre, foto de perfil y teléfono (opcionales).</td>
          </tr>
          <tr>
            <td>
              <strong>Uso del servicio</strong>
            </td>
            <td>
              Viajes creados, mensajes del chat, recomendaciones, favoritos y reservas guardadas.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Preferencias</strong>
            </td>
            <td>Ubicación de salida y fecha de nacimiento, si decides indicarlas.</td>
          </tr>
          <tr>
            <td>
              <strong>Facturación</strong>
            </td>
            <td>
              Estado de la suscripción e identificador de cliente en Stripe. Los datos de tu tarjeta
              los trata Stripe directamente: nosotros no los vemos ni los almacenamos.
            </td>
          </tr>
          <tr>
            <td>
              <strong>Técnicos</strong>
            </td>
            <td>Dirección IP, tipo de dispositivo y navegador, y registros de seguridad.</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Para qué los usamos y con qué base legal</h2>
      <table>
        <thead>
          <tr>
            <th>Finalidad</th>
            <th>Base legal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Crear y gestionar tu cuenta y prestarte el servicio.</td>
            <td>Ejecución del contrato (art. 6.1.b RGPD).</td>
          </tr>
          <tr>
            <td>Generar itinerarios y recomendaciones con IA.</td>
            <td>Ejecución del contrato.</td>
          </tr>
          <tr>
            <td>Gestionar cobros, suscripciones y facturación.</td>
            <td>Ejecución del contrato y obligación legal (art. 6.1.c).</td>
          </tr>
          <tr>
            <td>Seguridad, prevención del fraude y mejora del servicio.</td>
            <td>Interés legítimo (art. 6.1.f).</td>
          </tr>
          <tr>
            <td>Cookies analíticas y comunicaciones comerciales.</td>
            <td>Tu consentimiento (art. 6.1.a), revocable en cualquier momento.</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Tus mensajes y la inteligencia artificial</h2>
      <p>
        Para generar las respuestas enviamos el contenido de tu conversación a{" "}
        <strong>OpenAI</strong>, que actúa como encargado del tratamiento. Ten en cuenta que:
      </p>
      <ul>
        <li>
          <strong>No introduzcas datos sensibles</strong> (salud, ideología, religión, datos
          bancarios) en el chat: no son necesarios para planificar un viaje.
        </li>
        <li>
          Guardamos el historial de la conversación para que puedas retomar tus viajes más adelante.
        </li>
        <li>Puedes borrar un viaje —y con él sus mensajes— en cualquier momento.</li>
      </ul>

      <h2>5. Con quién los compartimos</h2>
      <p>
        No vendemos tus datos. Trabajamos con proveedores que los tratan por cuenta nuestra y bajo
        contrato:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — base de datos, autenticación y almacenamiento de archivos.
        </li>
        <li>
          <strong>OpenAI</strong> — generación de las respuestas del asistente.
        </li>
        <li>
          <strong>Stripe</strong> — procesamiento de pagos y gestión de suscripciones.
        </li>
        <li>
          <strong>Google Maps y Places</strong> — mapas, geolocalización y fotos de los lugares.
        </li>
        <li>
          <strong>Vercel</strong> — alojamiento de la aplicación.
        </li>
      </ul>
      <p>
        Algunos proveedores están fuera del Espacio Económico Europeo. En esos casos las
        transferencias se amparan en decisiones de adecuación o en cláusulas contractuales tipo de
        la Comisión Europea.
      </p>

      <h2>6. Cuánto tiempo los conservamos</h2>
      <ul>
        <li>
          <strong>Cuenta y contenidos:</strong> mientras la cuenta esté activa.
        </li>
        <li>
          <strong>Tras eliminar la cuenta:</strong> borrado en un plazo máximo de 30 días, salvo lo
          que debamos conservar por ley.
        </li>
        <li>
          <strong>Facturación:</strong> 6 años, según la normativa mercantil y fiscal española.
        </li>
        <li>
          <strong>Registros de seguridad:</strong> hasta 12 meses.
        </li>
      </ul>

      <h2>7. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento los derechos de:</p>
      <ul>
        <li>
          <strong>Acceso</strong> — saber qué datos tenemos sobre ti.
        </li>
        <li>
          <strong>Rectificación</strong> — corregir los que sean inexactos.
        </li>
        <li>
          <strong>Supresión</strong> — pedir que los borremos.
        </li>
        <li>
          <strong>Oposición y limitación</strong> — restringir determinados tratamientos.
        </li>
        <li>
          <strong>Portabilidad</strong> — recibir tus datos en un formato reutilizable.
        </li>
        <li>
          <strong>Retirar el consentimiento</strong> — sin que afecte al tratamiento previo.
        </li>
      </ul>
      <p>
        Escríbenos a{" "}
        <a href="mailto:contacto.traveleria@gmail.com">contacto.traveleria@gmail.com</a> indicando
        qué derecho quieres ejercer.
        Responderemos en el plazo máximo de un mes. Si consideras que no hemos atendido tu
        solicitud correctamente, puedes reclamar ante la{" "}
        <strong>Agencia Española de Protección de Datos</strong> (www.aepd.es).
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito
        (HTTPS), contraseñas almacenadas con funciones hash, control de acceso por usuario mediante
        políticas de seguridad a nivel de fila y acceso restringido a la información. Ningún sistema
        es infalible, pero trabajamos para minimizar el riesgo.
      </p>

      <h2>9. Menores</h2>
      <p>
        El Servicio no está dirigido a menores de 18 años. Si detectamos una cuenta de un menor sin
        autorización, la eliminaremos.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Si modificamos esta política te avisaremos por email o dentro de la aplicación antes de que
        los cambios relevantes entren en vigor. Consulta también nuestros{" "}
        <Link href="/terminos">Términos de servicio</Link> y la{" "}
        <Link href="/cookies">Política de cookies</Link>.
      </p>
    </LegalProse>
  );
}
