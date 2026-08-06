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

## 2. Stripe en modo live — hecho

- [x] Cuenta verificada para cobrar (`charges_enabled` y `payouts_enabled`, España, EUR)
- [x] Precio anual creado en live: `price_1U1Px599OOsPnX7673YJ2AGa` — 39,00 €/año
- [x] Precio mensual live reutilizado: `price_1TklLF99OOsPnX76oUDWlFT8` — 4,99 €/mes
- [x] Webhook `we_1U1Pxo99OOsPnX76FMlFjnya` en `https://traveleria.app/api/webhooks/stripe`
- [x] Claves live y `whsec_` cargadas en Vercel **solo en Production**
- [x] Redesplegado

**Producción cobra de verdad. Preview se queda en modo test a propósito**, para poder
probar el flujo de pago sin mover dinero. Si algún día vuelves a tocar estas variables,
`vercel env rm NOMBRE production` **borra también la copia de Preview** cuando la entrada
es compartida: hay que volver a añadirla con el valor de test.

**Verificado el 6 de agosto:** el endpoint responde `Firma inválida` (400) ante una firma
falsa, lo que prueba que `STRIPE_WEBHOOK_SECRET` llega a la función y la verificación
funciona.

**Pendiente de probar con dinero real:** un pago de verdad (puedes reembolsarlo desde
Stripe al momento) y confirmar que `profiles.subscription_status` pasa a `premium`.

### Nota: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no se usa

No aparece en ningún sitio del código: el pago va por Checkout alojado, con la sesión
creada en el servidor (`src/actions/stripe.ts`) y un redirect. No hay Stripe.js en el
navegador. Se mantiene cargada por si algún día se integra el pago embebido, pero hoy no
hace nada.

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
