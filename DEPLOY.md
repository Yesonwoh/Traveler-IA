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

## 1. Redesplegar (bloquea a todo lo demás)

Las variables `NEXT_PUBLIC_*` **se incrustan al compilar**, no se leen en caliente. El
despliegue que está sirviendo ahora se construyó *antes* de que existiera
`NEXT_PUBLIC_SITE_URL`, así que la web sigue anunciando el dominio viejo.

- [ ] Redesplegar producción (`vercel --prod`, o push a `main`)

**Comprobación:** `https://traveleria.app/robots.txt` debe decir
`Sitemap: https://traveleria.app/sitemap.xml`. Si sigue diciendo `traveler-ia.vercel.app`,
el valor de la variable en Vercel está mal escrito.

**Si te lo saltas:** Google indexa el dominio de Vercel en vez del tuyo, y al compartir un
enlace en WhatsApp o Instagram aparece la URL de Vercel.

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
