# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jóvenes mochileros españoles de 18 a 30 años: estudiantes, recién graduados y gente
en sus primeros trabajos, con presupuesto muy ajustado y muchas ganas de salir. Planifican
sobre todo desde el móvil, en ratos sueltos (en la cama, en el bus, entre clases), y
llegan sin destino cerrado tan a menudo como con uno.

El producto está íntegramente en español (`lang="es"`, copy y prompts en español,
`locale: es_ES`). El mercado confirmado hoy es España; no hay compromiso de i18n.

## Product Purpose

Traveler IA convierte "quiero irme y tengo poco dinero" en un viaje concreto, reservable
y organizado. El usuario cuenta su plan en lenguaje natural —o rellena un briefing guiado
(destino, fechas o flexibilidad, origen, viajeros, presupuesto, intereses, notas)— y la IA
responde con una propuesta que aterriza en lugares reales sobre un mapa, con truco de ahorro
incluido cuando viene al caso.

Éxito significa que el usuario se registre, cree su primer viaje y vuelva a él: que el viaje
siga vivo en la app hasta que se hace, y que las reservas se hagan desde dentro.

## Positioning

Tres cosas que un competidor cercano no puede copiar sin más (confirmadas por el usuario):

1. **Los trucos "hacker" de ahorro.** Un banco de trucos de calle reales —fundas de cojín
   de cuello en Ryanair, la bolsa del Duty Free, buses nocturnos, ALSA Plus, el 10% de la
   tarjeta ESN en FlixBus, Too Good To Go— que **dice la IA dentro del chat**, inyectados de
   forma natural en el plan cuando vienen al caso. No son una sección, ni una lista, ni un
   contenido aparte: viven en la conversación. La voz es de colega, no de agencia.
2. **Workspace por viaje.** Cada viaje tiene su propia IA con memoria, su mapa, sus
   favoritos, sus reservas y su buscador de vuelos. No es un chat suelto que se pierde en el
   scroll: es un sitio al que se vuelve.
3. **La IA aterriza en lugares reales.** Cada recomendación sale del chat como tarjeta con
   nombre, dirección geocodificada, foto y botón de acción, y aparece marcada en el mapa del
   viaje. Del consejo a la reserva sin salir de la app.

El buscador de vuelos con precios reales existe y funciona, pero el usuario no lo considera
parte de la diferenciación: es higiene, no argumento.

## Operating Context

- **Cómo nace un viaje:** desde `/mis-viajes`, con el diálogo "Nuevo viaje" (briefing guiado)
  o conversando. El briefing se prellena con lo que el usuario guardó en Configuración
  (ubicación, intereses), y la IA tiene instrucción explícita de no volver a preguntar lo ya
  contestado.
- **Cómo se trabaja un viaje:** cuatro pestañas dentro de `/viaje/[id]` — Chat IA, Favoritos,
  Reservas, Vuelos.
- **Chat y mapa son una sola pantalla.** En escritorio el mapa vive **al lado del chat**, en
  la misma vista: la IA habla a la izquierda y sus recomendaciones aparecen marcadas a la
  derecha en tiempo real. En móvil el mapa se abre como hoja a pantalla completa desde un
  botón flotante "Ver mapa". El mapa no es una pestaña ni una pantalla aparte.
- **Cómo se convierte en dinero:** enlaces de afiliado (Travelpayouts: Aviasales, Hotellook,
  Tiqets, Klook, KKday, WeGoTrip, Go City, Kiwitaxi, GetYourGuide) en el botón de cada
  tarjeta, y suscripción Premium vía Stripe.
- **Perfil del viajero:** el usuario configura ubicación, fecha de nacimiento, intereses,
  estilo de presupuesto, tipo de alojamiento preferido, ritmo de viaje y notas. Ese perfil
  entra en el contexto de la IA para afinar propuestas, sin recitarse nunca al usuario.

## Capabilities and Constraints

**Funcionalidad confirmada (en producción):**

- Chat con IA por viaje, con briefing guiado en el primer turno y título + foto de portada
  generados automáticamente.
- Dos motores con alcance deliberadamente distinto:
  - **Free** (`gpt-5.4-nano`, temperatura 0.6): voz de colega, planes por franjas del día,
    rangos de precio y 3-5 sitios por respuesta. Menciona Premium solo si el usuario pide
    algo propio de Premium, una vez por conversación como mucho.
  - **Premium** (`gpt-5.4`, temperatura 0.4): itinerario hora por hora, presupuesto
    desglosado con total, ruta optimizada con tiempos entre paradas, plan B más barato
    sobre la partida más cara, logística fina (días de cierre, colas), control del
    presupuesto acumulado, 8-12 sitios por itinerario y un truco específico del destino.
- Recomendaciones tipadas (`vuelo`, `alojamiento`, `actividad`, `transporte`, `monumento`,
  `restaurante`, `otro`). El tipo decide el proveedor de afiliación y si la tarjeta muestra
  "Reservar" o "Guardar".
- Mapa Google Maps con pines por tipo, panel de pin y hoja de detalle; fotos vía Google
  Places y Unsplash.
- Favoritos y reservas por viaje, agrupadas por tipo con su estado.
- Buscador de vuelos con precios y rutas reales (Aviasales / Travelpayouts).
- Cuentas Supabase (email + Google), reset de contraseña, avatar, configuración de perfil.
- Premium por Stripe: 4,99 €/mes o 39 €/año (webhook propio en `/api/webhooks/stripe`).
- Páginas legales (términos, privacidad, cookies), banner de cookies, sitemap y robots.

**Restricciones técnicas y de producto:**

- Next.js 16 (App Router, Server Actions), React 19, Tailwind 4, TypeScript. Desplegado en
  Vercel. **Esta versión de Next.js tiene cambios que rompen respecto a lo conocido: leer
  `node_modules/next/dist/docs/` antes de escribir código** (ver AGENTS.md).
- La IA responde **siempre** en JSON estricto `{ chat, mapa[] }`. Cualquier cambio de
  formato de respuesta toca `src/lib/ai/prompts.ts` y rompe el parseo del chat.
- La IA tiene **prohibido** nombrar plataformas de reserva (Booking, Skyscanner, Kiwi,
  GetYourGuide…): el botón de afiliado lo pone la app. Sí puede citar marcas cuando el truco
  de ahorro *es* la marca (Too Good To Go, ALSA Plus, ESN).
- La IA tiene **prohibido** inventar números de vuelo, horas exactas de despegue o precios
  cerrados de billete: eso lo cubren las tarjetas de vuelo con datos reales.
- Divulgación de comisiones de afiliado, banner de cookies y páginas legales son obligación
  legal, no elección de diseño: se conservan aunque el mundo visual cambie.
- Terminología de producto en español y ya establecida en la interfaz: *viaje*, *Chat IA*,
  *Favoritos*, *Reservas*, *Vuelos*, *Mis viajes*, *Premium*.

## Brand Commitments

- **Nombre:** Traveler IA. Propiedad de Yeseong Oh.
- **Naranja de marca y logo:** `#f97316` (con `#ea580c` oscuro y `#fff7ed` claro) y el logo
  TRAVELER IA (`public/logo.png`, `logo TRAVELER IA.png`) son compromiso de marca, no una
  elección provisional. Se conservan.
- **Móvil primero:** la mayor parte del uso real ocurre en el móvil. El escritorio es
  secundario, no al revés.
- **Voz:** colega, no agencia. Tuteo, directo, con trucos de calle. La copy de producto y la
  de la IA comparten registro.
- **Todo lo demás visual es replanteable.** El usuario declaró explícitamente que, fuera del
  naranja, el logo y el enfoque móvil, nada del aspecto actual es intocable: tipografía,
  layout, componentes y tono visual pueden reemplazarse si el trabajo lo justifica.

## Evidence on Hand

- Producto real y desplegado, con todas las funciones anteriores operativas.
- Logo propio: `public/logo.png` y `logo TRAVELER IA.png` (raíz).
- Fotos reales de destinos vía Google Places y Unsplash en tiempo de ejecución.
- Precios de vuelo reales vía Travelpayouts / Aviasales.
- **No existen todavía:** testimonios, número de usuarios, cifras de ahorro medio, reseñas,
  menciones de prensa, casos de estudio ni logos de clientes. Nada de esto puede fabricarse
  ni insinuarse en ninguna superficie.

## Product Principles

1. **De la idea al lugar concreto.** Ninguna respuesta se queda en consejo genérico: acaba
   en un sitio con nombre, dirección y punto en el mapa.
2. **Colega, no agencia.** Se tutea, se va al grano y se habla como quien ya ha dormido en
   el aeropuerto. Nunca lenguaje corporativo de folleto.
3. **El ahorro es el producto, no un descuento.** El valor está en saber el truco, no en
   prometer precios. Los números exactos vienen de datos reales o no vienen.
4. **El viaje es el contenedor.** Todo —chat, mapa, favoritos, reservas, vuelos— vive dentro
   de un viaje y sigue ahí cuando el usuario vuelve.
5. **La monetización no se disfraza.** El botón de reserva es un botón de reserva, la
   comisión se declara y la IA nunca hace de vendedora.

## Accessibility & Inclusion

No se estableció ningún estándar formal obligatorio. Hay una decisión ya tomada en el código
que se conserva: `prefers-reduced-motion` está respetado globalmente en `globals.css` y
cualquier animación futura debe seguir haciéndolo.

## Estado actual y objetivo

Lanzado y en producción. El cuello de botella confirmado es la **adquisición**: que la gente
se registre y cree su primer viaje. Trabajo futuro sobre landing, registro y primer viaje
debe optimizar para eso antes que para conversión a Premium.
