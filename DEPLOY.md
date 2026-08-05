# Publicar Traveler IA

Pasos para poner la app en internet con Vercel, en orden. Los cuatro últimos **no se
pueden comprobar hasta que el sitio esté desplegado**, así que primero se despliega y
luego se cierran uno a uno.

Marca cada casilla según la vayas haciendo.

---

## 1. Subir el código a GitHub

- [ ] Crear el repositorio en GitHub (privado vale)
- [ ] Conectarlo y subir:

```bash
git remote add origin https://github.com/<tu-usuario>/traveler-ia.git
git push -u origin main
```

**Comprobación:** en GitHub NO debe aparecer ningún fichero `.env*`. Si aparece, para y
avisa: habría claves publicadas y hay que rotarlas.

---

## 2. Importar el proyecto en Vercel

- [ ] vercel.com → **Add New → Project** → conectar GitHub → elegir el repositorio
- [ ] Dejar la configuración que detecta sola (Next.js). No tocar nada.
- [ ] **No desplegar todavía**: primero el paso 3.

---

## 3. Variables de entorno

- [ ] Copiar las **29 variables** de `.env.local` a *Settings → Environment Variables*
- [ ] Añadir una que no existe en local:

```
NEXT_PUBLIC_SITE_URL=https://<tu-dominio>
```

Sin ella, los metadatos, el `sitemap.xml` y los enlaces al compartir apuntan al dominio
de reserva que hay escrito en `src/app/layout.tsx`, que puede no ser el tuyo.

**Ojo con las de afiliados (`TP_*`)**: si faltan, la app funciona igual pero no ofrece
los botones de reserva, porque `estaConfigurado()` los desactiva. Es dinero que no entra
y no da ningún error visible.

- [ ] Desplegar

---

## 4. Webhook de Stripe (el que más se olvida)

`STRIPE_WEBHOOK_SECRET` **es distinto para cada endpoint**. El que tienes en `.env.local`
es el de tu ordenador y no sirve en producción.

- [ ] Stripe → *Developers → Webhooks* → **Add endpoint**
- [ ] URL: `https://<tu-dominio>/api/webhooks/stripe`
- [ ] Eventos: los de suscripción (`checkout.session.completed`,
      `customer.subscription.updated`, `customer.subscription.deleted`)
- [ ] Copiar su secreto (`whsec_...`) y sustituir `STRIPE_WEBHOOK_SECRET` en Vercel
- [ ] Volver a desplegar (Vercel no aplica variables nuevas hasta el siguiente deploy)

**Si te lo saltas:** el usuario paga, Stripe cobra y tu base de datos nunca se entera.
Cobras sin dar Premium.

**Comprobación:** hacer un pago con una tarjeta de prueba de Stripe y confirmar que
`profiles.subscription_status` pasa a `premium`.

---

## 5. URLs de Supabase

- [ ] Supabase → *Authentication → URL Configuration*
- [ ] **Site URL**: `https://<tu-dominio>`
- [ ] **Redirect URLs**: añadir `https://<tu-dominio>/auth/callback`

**Si te lo saltas:** el login con Google y el reset de contraseña redirigen a
`localhost` y fallan para todo el mundo menos para ti.

**Comprobación:** registrarse con Google desde el móvil, con otra cuenta.

---

## 6. Restringir la clave de Google Maps

`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` **se ve en el navegador**: cualquiera puede sacarla
del código fuente de la página. Sin restringir, te pueden gastar la cuota.

- [ ] Google Cloud → *Credentials* → tu clave
- [ ] **Application restrictions → HTTP referrers**
- [ ] Añadir `https://<tu-dominio>/*` (y `http://localhost:3000/*` para seguir
      trabajando en local)

**Comprobación:** el mapa del chat sigue cargando en producción y en local.

---

## 7. Repaso final en producción

- [ ] La portada carga y el botón "Empezar viaje" lleva a registro
- [ ] Registro con email y con Google
- [ ] Crear un viaje y ver que la IA responde
- [ ] El mapa carga con sus pines
- [ ] "Entradas" en un monumento lleva a la ficha de Tiqets con tu tracking
- [ ] La pestaña Vuelos busca precios y aparece "Al aterrizar"
- [ ] "Hazte Premium" abre el pago de Stripe
- [ ] Tras pagar, el usuario aparece como Premium

---

## Base de datos

Las migraciones `0009_evitar_duplicados.sql` y `0010_nombre_en_recomendaciones.sql` ya
están aplicadas. Cualquier migración nueva hay que correrla a mano contra el proyecto de
Supabase antes de desplegar el código que la necesita.
