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

**Verificado el 7 de agosto de 2026 con una suscripción real.** Comprobado en la base de
datos: Stripe creó el cliente, el webhook llegó, `subscription_status` pasó a `premium`,
`subscription_trial_end` quedó a 3 días exactos y `trial_used` a `true`, así que esa cuenta
no puede repetir la prueba. La cadena entera funciona.

**Ojo:** esa cuenta está dentro de la prueba, no ha pagado. Se le cobra al terminar si no se
cancela antes.

### Nota: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no se usa

No aparece en ningún sitio del código: el pago va por Checkout alojado, con la sesión
creada en el servidor (`src/actions/stripe.ts`) y un redirect. No hay Stripe.js en el
navegador. Se mantiene cargada por si algún día se integra el pago embebido, pero hoy no
hace nada.

---

## 3. URLs de Supabase — ahora solo afecta al login con Google

Supabase → *Authentication → URL Configuration*

- [ ] **Site URL**: `https://traveleria.app`
- [ ] **Redirect URLs**:
  - `https://traveleria.app/auth/callback`
  - `http://localhost:3000/auth/callback`

**Ojo, esto cambió el 6 de agosto de 2026.** Antes hacía falta añadir también las variantes
`…/auth/callback?next=*`, porque el reset de contraseña volvía con esa query. Ya no: desde
que los correos usan `/auth/confirm` con `token_hash`, **el enlace del correo va directo a
nuestro dominio y no pasa por la validación de redirects de Supabase**. Si las variantes con
`?next=*` siguen ahí, no molestan, pero ya no hacen nada.

Quien sí depende de esta lista es el **login con Google**, que sigue usando
`/auth/callback` con el flujo PKCE (y hace bien: ida y vuelta ocurren en la misma pestaña).

**Si te lo saltas:** el login con Google redirige a `localhost` y falla para todo el mundo
menos para ti.

**Comprobación:** registrarse con Google desde el móvil, con otra cuenta. Ya **no** sirve
probar el reset de contraseña: ese flujo dejó de pasar por aquí.

**Site URL sí sigue importando para los correos**, porque las plantillas construyen el
enlace con `{{ .SiteURL }}`. Si apuntara a `localhost`, los correos llevarían enlaces a
localhost. Que el reset funcione en producción demuestra que está bien puesta.

---

## 4. SMTP propio — hecho el 6 de agosto de 2026

Resend enviando desde `contacto@traveleria.app`, dominio verificado, plantillas de marca
aplicadas y reset de contraseña probado **en cruzado** (pedido en el ordenador, abierto en
el móvil), que es el caso que fallaba.

**Dos trampas que costaron tiempo y conviene no repetir:**

1. **Supabase no siempre guarda la plantilla.** Se pega el HTML, se le da a *Save*, parece
   que ha ido, y sigue sirviendo la anterior. Se comprueba abriendo el correo recibido y
   mirando la URL gris del final: si empieza por `https://traveleria.app/auth/confirm` está
   bien; si empieza por `https://…supabase.co/auth/v1/verify` es la vieja. Después de
   guardar, salir de la pantalla y volver a entrar para confirmar que se quedó.
2. **Los correos viejos de la bandeja llevan el enlace viejo para siempre.** Al probar un
   cambio de plantilla hay que pedir un reset NUEVO y borrar los anteriores, o se pica con
   el equivocado y parece que el arreglo no funciona.

El mensaje de la pantalla de login dice cuál de los dos casos es: *"No se pudo iniciar
sesión"* viene de `/auth/callback` (enlace viejo) y *"El enlace no es válido o ha caducado"*
de `/auth/confirm` (enlace nuevo). Merece la pena mirarlo antes de tocar nada.

### Contexto (por qué se hizo así)

El servicio de email que trae Supabase de serie está limitado a **2 correos por hora en
todo el proyecto** (dato de su propia documentación, no una estimación). No es un límite
generoso que se agota de vez en cuando: son dos. Está pensado para probar, no para
producción.

Y además, con el servicio integrado Supabase **no deja editar las plantillas de correo**:
sale el aviso *"Set up custom SMTP to edit templates"*. Las plantillas de marca ya están
escritas y commiteadas en `supabase/emails/`, pero no se pueden aplicar hasta tener SMTP.

Así que este paso desbloquea tres cosas de golpe: el límite de envíos, el remitente
`@traveleria.app` y las plantillas.

**Proveedor elegido: Resend** — es la única opción de email del marketplace de Vercel
(`vercel integration discover --category messaging`).

**Alta directa en resend.com, no por el marketplace.** La ventaja de instalarlo desde Vercel
es que inyecta la API key en las variables de entorno del proyecto, pero aquí no sirve de
nada: quien manda los correos es **Supabase**, no nuestro código, así que la clave tiene que
acabar en el panel de Supabase. Además hay que entrar a Resend igualmente para verificar el
dominio y crear la key. (`vercel integration add` tampoco acepta `--yes`: es interactivo y
pide elegir plan.)

- [x] Cuenta en resend.com (plan gratuito: 3.000 correos/mes)
- [x] Resend → *Domains → Add Domain* → `traveleria.app` → copiar los registros DNS (SPF,
      DKIM y, si lo ofrece, DMARC)
- [x] Pegarlos en **Porkbun**, que es donde está el dominio, y darle a *Verify*

**Trampa de Porkbun:** añade el dominio solo al nombre del registro. Si Resend pide el host
`resend._domainkey`, hay que escribir exactamente eso, **no**
`resend._domainkey.traveleria.app`: quedaría duplicado y no verificaría nunca.

**TTL:** Resend pone "Auto" y Porkbun solo acepta números. Da igual: el TTL es cuánto se
cachea el registro y **no interviene en la verificación**. Poner `600` en todos. Conviene
tenerlo bajo mientras se configura, para que una corrección se propague en diez minutos y no
al día siguiente.
- [x] Crear una API key en Resend
### Correo de contacto y respuestas

El correo del proyecto es **`contacto.traveleria@gmail.com`**, pero **no se puede usar como
remitente**: Resend solo envía desde dominios verificados, y Gmail marcaría como suplantación
un `@gmail.com` enviado desde otro sitio.

Montaje elegido:

- **Remitente:** `contacto@traveleria.app` (mismo criterio que el nombre del Gmail)
- **Respuestas:** reenvío en Porkbun de `contacto@traveleria.app` →
  `contacto.traveleria@gmail.com`

- [x] Resend → apagar **Enable Receiving** y borrar el MX `@` de Porkbun si se llegó a añadir
- [x] Porkbun → *Email Forwarding* → `contacto@traveleria.app` a
      `contacto.traveleria@gmail.com`
- [x] Comprobarlo: enviar un correo desde otra cuenta a `contacto@traveleria.app` y ver si
      llega al Gmail

**No hay conflicto con Resend:** sus registros verificados viven en `send` y
`resend._domainkey`, que son subdominios. El MX del reenvío va en `@`, que queda libre justo
porque se apaga *Enable Receiving*. Ese es el motivo real de apagarlo, no quitar el aviso
amarillo.

- [x] Supabase → *Authentication → Emails → SMTP Settings*:
  - Host: `smtp.resend.com`
  - Puerto: `465` (SSL) o `587` (STARTTLS)
  - Usuario: `resend` (literalmente esa palabra, no tu email)
  - Contraseña: la API key de Resend
  - Sender email: `contacto@traveleria.app` · Sender name: `Traveler IA`
- [x] Subir el límite en *Authentication → Rate Limits*: al activar SMTP propio, Supabase
      deja por defecto **30 correos por hora**, que también se queda corto
- [x] Ya con SMTP activo, pegar las plantillas de `supabase/emails/` (ver su README)

**Comprobación:** pedir tres resets seguidos desde tres cuentas distintas y que lleguen los
tres, con el remitente `@traveleria.app` y el diseño de marca.

---

## 5. Confirmación de email — decidido NO activarla todavía

Sigue **desactivada** (`mailer_autoconfirm: true`): quien se registra entra directo. El
código soporta las dos configuraciones, así que es un interruptor y se puede activar el día
que toque.

**Decisión del 6 de agosto de 2026: se deja apagada a propósito.** El bloqueo técnico
(el límite de 2 correos/hora) ya no existe, pero el motivo de producto sí: con poquísimos
usuarios, meter un correo entre el registro y el primer viaje es un paso más donde perder
gente, y el cuello de botella confirmado es la adquisición (ver `PRODUCT.md`). Hoy cuesta
más de lo que protege.

**Qué se pierde mientras esté apagada:** quien se equivoque al teclear su correo se queda
sin forma de recuperar la contraseña, y sin forma de que le contactemos. Con este volumen es
asumible.

**Cuándo reconsiderarlo:** cuando haya volumen real, registros basura, o cuando el correo
pase a ser un canal de retención y no solo de recuperación de contraseña.

- [ ] *(cuando toque)* Supabase → *Authentication → Sign In / Providers → Email* →
      **Confirm email** ✅ — la plantilla `confirm-signup.html` ya está puesta y esperando

---

## 6. Restringir la clave de Google Maps — hacen falta DOS claves

`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` **se ve en el navegador**: cualquiera la saca del código
fuente. Sin restringir, te gastan la cuota.

> ⚠️ **Restringir esa clave por HTTP referrer y quedarse ahí ROMPE el producto.** La misma
> clave se usa desde dos sitios incompatibles: el mapa del navegador (`trip-map.tsx`, que sí
> manda `Referer`) y el servidor (`geocode.ts` y `places-photo.ts`, llamados por
> `lib/chat/responder.ts`, que **no manda referrer**). Con la restricción puesta, Google
> responde `REQUEST_DENIED` a las llamadas del servidor y las recomendaciones se quedan
> **sin coordenadas y sin foto, en silencio**. El chat parece funcionar y el mapa sale vacío.

Por eso el código ya está preparado (`src/lib/google/claves.ts`) para usar dos claves. Orden:

- [ ] Google Cloud → *Credentials* → **crear una clave nueva** para el servidor
  - *Application restrictions*: **None** (las funciones de Vercel no tienen IP fija)
  - *API restrictions*: **Geocoding API** y **Places API**, nada más
- [ ] Vercel → variable de entorno **`GOOGLE_SERVER_API_KEY`** con esa clave, en Production
      (y en Preview si quieres que allí también funcione). **Sin** prefijo `NEXT_PUBLIC_`:
      así Next no la incrusta en el bundle del navegador
- [ ] **Redesplegar**
- [ ] Comprobar que el chat sigue poniendo pines y fotos **antes** de tocar la clave vieja
- [ ] Ya entonces, restringir `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`:
  - *Application restrictions*: **HTTP referrers** → `https://traveleria.app/*`,
    `https://www.traveleria.app/*`, `http://localhost:3000/*`
  - *API restrictions*: **Maps JavaScript API** y **Places API** (la de fotos)

Mientras `GOOGLE_SERVER_API_KEY` no exista, el código cae a la pública y funciona como
siempre: se puede desplegar sin coordinar nada con Google.

**Por qué la clave pública sigue haciendo falta en el servidor:** las URLs de foto de Places
se guardan en `recomendaciones.fotos_urls` con la clave dentro, y las pide luego el navegador
con un `<img>`. Esas llevan la **pública** a propósito — meter ahí la de servidor sería
publicarla en cada tarjeta.

**Deuda conocida:** esas URLs guardadas llevan la clave incrustada. Si algún día rotas la
clave pública, las fotos ya guardadas dejarán de cargar y habrá que regenerarlas.

**Comprobación:** crear un viaje nuevo y ver que las tarjetas salen con foto y con pin en el
mapa, en producción. Que el mapa cargue no basta: eso solo prueba la clave del navegador.

---

## 7. Un solo dominio canónico (SEO)

Hoy `traveleria.app`, `www.traveleria.app` y `traveler-ia.vercel.app` sirven **la misma
página con HTTP 200**. Para Google eso es contenido duplicado.

- [ ] Vercel → *Settings → Domains* → dejar `traveleria.app` como principal y marcar
      `www.traveleria.app` como **Redirect** a él

El dominio `.vercel.app` no se puede quitar, pero con `metadataBase` apuntando a
`traveleria.app` (paso 1) el canonical ya resuelve la ambigüedad.

---

## 8. Repaso final en producción

- [ ] La portada carga y "Empezar viaje" lleva a registro
- [x] Registro con email y con Google
- [ ] Crear un viaje y ver que la IA responde
- [ ] El mapa carga con sus pines
- [ ] "Entradas" en un monumento lleva a la ficha de Tiqets con tu tracking
- [ ] La pestaña Vuelos busca precios y aparece "Al aterrizar"
- [x] "Empezar gratis" abre el pago de Stripe y el resumen dice "3 días de prueba"
- [x] Tras terminar el checkout, el usuario aparece como Premium y `/premium` dice
      "Quedan 3 días"
- [ ] Con una cuenta que ya haya tenido suscripción, `/premium` **no** ofrece la prueba

---

## Base de datos

**Todas las migraciones hasta la `0013` están aplicadas.** No hay ninguna pendiente.

| Migración | Qué hizo | Aplicada |
|---|---|---|
| `0009`–`0010` | Duplicados y nombre en recomendaciones | sí |
| `0011_prueba_gratis` | Columnas de la prueba de 3 días | 6 ago 2026 |
| `0012_blindar_suscripcion` | Privilegios por columna en `profiles` + índice de mensajes | 8 ago 2026 |
| `0013_indice_viajes_por_usuario` | Índice para el tope de creación de viajes | 8 ago 2026 |

Cualquier migración futura, igual: a mano contra Supabase, en *SQL Editor*.

**Dos cosas que se olvidan y cuestan un rato de depuración:**

- La detección de columnas opcionales se cachea **una vez por proceso** (`hayNombreEn` y
  compañía). Tras una migración que añada columnas hace falta un arranque nuevo del
  servidor: recargar la página no basta.
- Una migración que solo crea índices (como la `0013`) no cambia el comportamiento, solo
  el coste. Si se olvida, nada falla — simplemente se escanea de más.

### Comprobar que la `0012` sigue en pie

Es la única con consecuencias de seguridad. En *SQL Editor*:

```sql
select string_agg(column_name, ', ' order by column_name) as escribibles
from information_schema.column_privileges
where grantee = 'authenticated'
  and table_name = 'profiles'
  and privilege_type = 'UPDATE';
```

Deben salir 13 columnas y **no** deben aparecer `subscription_status`, `trial_used` ni
`stripe_customer_id`. Si aparecen, cualquiera puede regalarse Premium.
