# Publicar Traveler IA

**Dominio:** https://traveleria.app
**Proyecto Vercel:** `traveler-ia` · **Repo:** github.com/Yesonwoh/Traveler-IA

Estado a 6 de agosto de 2026. Marca cada casilla según la vayas cerrando.

---

## Ya hecho

- [x] Código en GitHub (sin ficheros `.env*`, verificado)
- [x] Proyecto importado en Vercel y desplegado
- [x] Las 30 variables de entorno cargadas en Producción
- [x] Dominio `traveleria.app` registrado (Porkbun) y conectado a Vercel
- [x] `NEXT_PUBLIC_SITE_URL` creada en Vercel

---

## 1. Redesplegar con el dominio bueno — hecho

- [x] `NEXT_PUBLIC_SITE_URL` recreada sin BOM y desplegada

Las variables `NEXT_PUBLIC_*` **se incrustan al compilar**, no se leen en caliente: añadir
una no basta nunca, hay que reconstruir.

El primer intento se cayó con `Invalid URL` porque el valor guardado llevaba un **BOM**
(U+FEFF) invisible delante — PowerShell escribe UTF-8 con BOM por defecto. Si vuelves a
cargar variables desde un fichero generado en PowerShell, usa
`Out-File -Encoding utf8NoBOM` o pásalas por `printf`. El código ahora sanea el valor
(`src/lib/site-url.ts`), así que un BOM ya no tumba el build, pero la variable limpia
sigue siendo lo correcto.

**Verificado el 6 de agosto:** `robots.txt`, `sitemap.xml` y `og:url` anuncian
`traveleria.app`.

---

## 2. Webhook de Stripe — *no existe ninguno hoy*

Comprobado contra la API de Stripe el 6 de agosto: **cero endpoints configurados**, y la
cuenta está en **modo test**.

- [ ] Decidir si pasas a modo **live** (cobrar de verdad) o sigues en test
- [ ] Si pasas a live: sustituir en Vercel `STRIPE_SECRET_KEY`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID_MONTHLY` y
      `STRIPE_PRICE_ID_YEARLY` por los de live (los precios **no** se comparten entre modos)
- [ ] Stripe → *Developers → Webhooks* → **Add endpoint**
- [ ] URL: `https://traveleria.app/api/webhooks/stripe`
- [ ] Eventos: `checkout.session.completed`, `customer.subscription.updated`,
      `customer.subscription.deleted`
- [ ] Copiar su secreto (`whsec_...`) a `STRIPE_WEBHOOK_SECRET` en Vercel
- [ ] Redesplegar

**Si te lo saltas:** el usuario paga, Stripe cobra y tu base de datos nunca se entera.
Cobras sin dar Premium.

**Comprobación:** pago con tarjeta de prueba → `profiles.subscription_status` pasa a `premium`.

---

## 3. URLs de Supabase

- [ ] Supabase → *Authentication → URL Configuration*
- [ ] **Site URL**: `https://traveleria.app`
- [ ] **Redirect URLs**: añadir `https://traveleria.app/auth/callback`
      (y conservar `http://localhost:3000/auth/callback` para seguir trabajando en local)

**Si te lo saltas:** el login con Google y el reset de contraseña redirigen a `localhost` y
fallan para todo el mundo menos para ti.

**Comprobación:** registrarse con Google desde el móvil, con otra cuenta.

---

## 4. Restringir la clave de Google Maps

`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` **se ve en el navegador**: cualquiera puede sacarla del
código fuente. Sin restringir, te pueden gastar la cuota.

- [ ] Google Cloud → *Credentials* → tu clave
- [ ] **Application restrictions → HTTP referrers**
- [ ] Añadir `https://traveleria.app/*`, `https://www.traveleria.app/*` y
      `http://localhost:3000/*`

**Comprobación:** el mapa del chat sigue cargando en producción y en local.

---

## 5. Un solo dominio canónico (SEO)

Hoy `traveleria.app`, `www.traveleria.app` y `traveler-ia.vercel.app` sirven **la misma
página con HTTP 200**. Para Google eso es contenido duplicado.

- [ ] Vercel → *Settings → Domains* → dejar `traveleria.app` como principal y marcar
      `www.traveleria.app` como **Redirect** a él

El dominio `.vercel.app` no se puede quitar, pero con `metadataBase` apuntando a
`traveleria.app` (paso 1) el canonical ya resuelve la ambigüedad.

---

## 6. Repaso final en producción

- [ ] La portada carga y "Empezar viaje" lleva a registro
- [ ] Registro con email y con Google
- [ ] Crear un viaje y ver que la IA responde
- [ ] El mapa carga con sus pines
- [ ] "Entradas" en un monumento lleva a la ficha de Tiqets con tu tracking
- [ ] La pestaña Vuelos busca precios y aparece "Al aterrizar"
- [ ] "Hazte Premium" abre el pago de Stripe
- [ ] Tras pagar, el usuario aparece como Premium

---

## Base de datos

Las migraciones `0009_evitar_duplicados.sql` y `0010_nombre_en_recomendaciones.sql` ya están
aplicadas. Cualquier migración nueva hay que correrla a mano contra Supabase antes de
desplegar el código que la necesita.
