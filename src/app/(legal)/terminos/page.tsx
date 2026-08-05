import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse } from "@/components/legal-prose";

export const metadata: Metadata = {
  title: "Términos de servicio",
  description: "Condiciones de uso del servicio Traveler IA.",
};

export default function TerminosPage() {
  return (
    <LegalProse titulo="Términos de servicio" actualizado="5 de agosto de 2026">
      <p>
        Estos términos regulan el acceso y uso de <strong>Traveler IA</strong> (el
        &laquo;Servicio&raquo;), una herramienta de planificación de viajes asistida por
        inteligencia artificial. Al crear una cuenta o utilizar el Servicio aceptas estos términos
        en su totalidad. Si no estás de acuerdo, no utilices el Servicio.
      </p>

      <h2>1. Titular del servicio</h2>
      <p>
        El Servicio es titularidad de <strong>Yeseong Oh</strong>, con NIF{" "}
        <strong>Y3392043V</strong> y domicilio en{" "}
        <strong>C/ Morrón del Mediodía, Nº 40, 18008 Granada (España)</strong>. Puedes contactarnos
        en{" "}
        <a href="mailto:contacto.traveleria@gmail.com">contacto.traveleria@gmail.com</a>.
      </p>

      <h2>2. Qué es (y qué no es) Traveler IA</h2>
      <p>
        Traveler IA genera sugerencias de itinerarios, alojamiento, actividades y transporte a
        partir de la información que nos facilitas. Es una <strong>herramienta de apoyo</strong>, no
        una agencia de viajes ni un intermediario de reservas.
      </p>
      <ul>
        <li>
          No vendemos vuelos, alojamiento ni entradas. Cuando reservas, lo haces directamente con el
          proveedor correspondiente y bajo sus propias condiciones.
        </li>
        <li>
          No garantizamos la exactitud, disponibilidad ni el precio de lo que se muestra. Los datos
          proceden de terceros y de modelos de IA, y <strong>pueden contener errores</strong>.
        </li>
        <li>
          Verifica siempre por tu cuenta la información crítica: requisitos de entrada, visados,
          horarios, condiciones de equipaje, seguros y cancelaciones.
        </li>
      </ul>

      <h2>3. Requisitos de la cuenta</h2>
      <ul>
        <li>Debes tener al menos 18 años, o la mayoría de edad de tu país de residencia.</li>
        <li>La información de registro debe ser veraz y mantenerse actualizada.</li>
        <li>
          Eres responsable de la confidencialidad de tus credenciales y de toda la actividad
          realizada desde tu cuenta.
        </li>
        <li>Una persona no puede mantener varias cuentas para eludir los límites del plan gratuito.</li>
      </ul>

      <h2>4. Planes y pagos</h2>
      <p>
        El Servicio ofrece un plan gratuito con límites de uso y un plan{" "}
        <strong>Premium</strong> de pago por suscripción. Los pagos se procesan a través de{" "}
        <strong>Stripe</strong>; no almacenamos los datos de tu tarjeta en nuestros sistemas.
      </p>
      <ul>
        <li>
          La suscripción se renueva automáticamente por periodos equivalentes hasta que la canceles.
        </li>
        <li>
          Puedes cancelar en cualquier momento desde <strong>Configuración → Suscripción</strong>.
          Mantendrás el acceso Premium hasta el final del periodo ya pagado.
        </li>
        <li>
          Podemos modificar los precios avisando con antelación razonable. El cambio nunca afectará
          a un periodo ya facturado.
        </li>
      </ul>

      <h3>Derecho de desistimiento</h3>
      <p>
        Si contratas como consumidor en la Unión Europea dispones de{" "}
        <strong>14 días naturales</strong> para desistir. Al tratarse de contenido digital de
        acceso inmediato, al contratar aceptas que la prestación comience de inmediato y reconoces
        que pierdes el derecho de desistimiento una vez el servicio ha sido plenamente ejecutado.
      </p>

      <h2>5. Enlaces de afiliado</h2>
      <p>
        Algunas recomendaciones incluyen enlaces de afiliado gestionados a través de{" "}
        <strong>TravelPayouts</strong> y sus proveedores asociados (Aviasales para vuelos, Hotellook
        para alojamiento, y plataformas de actividades como Tiqets, GetYourGuide o Klook). Si
        reservas a través de ellos podemos percibir una comisión{" "}
        <strong>sin coste adicional para ti</strong>. Esto no altera el orden ni el contenido de las
        recomendaciones, que se generan en función de tu consulta.
      </p>

      <h2>6. Uso aceptable</h2>
      <p>Al usar el Servicio te comprometes a no:</p>
      <ul>
        <li>Utilizarlo con fines ilícitos o para planificar actividades ilegales.</li>
        <li>
          Introducir datos personales de terceros sin su consentimiento, ni información sensible que
          no sea necesaria.
        </li>
        <li>
          Extraer datos de forma automatizada (scraping), realizar ingeniería inversa o sobrecargar
          la infraestructura.
        </li>
        <li>Revender, sublicenciar o explotar comercialmente el Servicio sin autorización escrita.</li>
        <li>Intentar eludir los límites de uso o los mecanismos de seguridad.</li>
      </ul>
      <p>
        Podemos suspender o cerrar cuentas que incumplan estas reglas, con aviso previo salvo en
        casos graves o urgentes.
      </p>

      <h2>7. Contenido generado por IA</h2>
      <p>
        Las respuestas se generan mediante modelos de lenguaje de terceros. Pueden ser inexactas,
        estar desactualizadas o resultar inadecuadas para tu caso concreto.{" "}
        <strong>
          Las decisiones que tomes a partir de ellas son de tu exclusiva responsabilidad.
        </strong>{" "}
        El Servicio no constituye asesoramiento legal, médico, migratorio ni financiero.
      </p>

      <h2>8. Propiedad intelectual</h2>
      <p>
        El software, la marca, el diseño y los contenidos propios del Servicio nos pertenecen. Los
        contenidos que tú introduces (tus mensajes, viajes y favoritos) siguen siendo tuyos; nos
        concedes únicamente la licencia necesaria para prestarte el Servicio.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        El Servicio se presta &laquo;tal cual&raquo;. En la medida permitida por la ley, no
        respondemos de daños indirectos, pérdida de beneficios, viajes frustrados, reservas
        erróneas ni gastos derivados de información inexacta. Nada en estos términos excluye la
        responsabilidad por dolo, negligencia grave o los derechos que la normativa de consumo te
        reconozca de forma imperativa.
      </p>

      <h2>10. Disponibilidad y cambios</h2>
      <p>
        Podemos modificar, suspender o discontinuar funcionalidades. Si un cambio es sustancial y te
        perjudica, te avisaremos por email o dentro de la aplicación con antelación razonable.
      </p>

      <h2>11. Cancelación de tu cuenta</h2>
      <p>
        Puedes eliminar tu cuenta cuando quieras desde <strong>Configuración → Cuenta</strong>. Al
        hacerlo se eliminan tus viajes, mensajes, favoritos y reservas guardadas, salvo la
        información que debamos conservar por obligación legal (por ejemplo, registros de
        facturación).
      </p>

      <h2>12. Ley aplicable</h2>
      <p>
        Estos términos se rigen por la legislación española. Para cualquier controversia, y cuando
        actúes como consumidor, serán competentes los juzgados de tu domicilio. Puedes acudir
        también a la plataforma europea de resolución de litigios en línea.
      </p>

      <h2>13. Contacto</h2>
      <p>
        Para cualquier duda sobre estos términos, escríbenos a{" "}
        <a href="mailto:contacto.traveleria@gmail.com">contacto.traveleria@gmail.com</a>. Consulta
        también nuestra{" "}
        <Link href="/privacidad">Política de privacidad</Link> y nuestra{" "}
        <Link href="/cookies">Política de cookies</Link>.
      </p>
    </LegalProse>
  );
}
