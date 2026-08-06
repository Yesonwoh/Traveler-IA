# Correos de Traveler IA

Plantillas de los correos que manda Supabase. **No se despliegan solas**: hay que pegarlas
a mano en el panel, igual que las migraciones.

> **Antes hace falta SMTP propio.** Con el servicio de email integrado, Supabase bloquea la
> edición de plantillas: sale *"Set up custom SMTP to edit templates"*. Es el paso 4 de
> `DEPLOY.md`. Hasta entonces estos ficheros no se pueden aplicar.

> **Estas plantillas dependen de `/auth/confirm`.** Hay que desplegar esa ruta ANTES de
> pegarlas, o los enlaces darán 404.

## Por qué los enlaces NO usan `{{ .ConfirmationURL }}`

Es la variable que Supabase pone por defecto, y con ella el enlace pasa por el endpoint
`/auth/v1/verify` de Supabase, que acaba en nuestro `/auth/callback` con un `code`. Ese
código se canjea con `exchangeCodeForSession`, que es **PKCE**: necesita una cookie *code
verifier* que solo existe en **el mismo navegador** que pidió el correo.

Para el login con Google va bien, porque ida y vuelta ocurren en la misma pestaña. Para los
correos **no**: la gente pide el reset en el móvil y abre el enlace en la app de Gmail, que
es otro contexto. Sin la cookie, el canje falla y el usuario acaba en `/login` sin entender
nada. En un producto que se usa sobre todo desde el móvil, eso no es un caso raro: es el
caso normal.

Por eso los enlaces apuntan a `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&…`,
que resuelve `src/app/auth/confirm/route.ts` con `verifyOtp`. No necesita cookie previa, así
que funciona en cualquier navegador y en cualquier dispositivo. Es lo que documenta Supabase
para apps que renderizan en servidor.

`/auth/callback` se queda como está: lo sigue usando el login con Google, donde el flujo
PKCE es el correcto.

Supabase → *Authentication* → *Emails* → *Templates* → pestaña correspondiente → pegar el
HTML entero en el cuadro *Message body* → **Save**.

| Fichero | Pestaña de Supabase | Asunto sugerido | ¿Se usa hoy? |
|---|---|---|---|
| `reset-password.html` | Reset Password | `Cambia tu contraseña de Traveler IA` | Sí |
| `confirm-signup.html` | Confirm signup | `Confirma tu correo y empezamos` | No — hasta que se active "Confirm email" (paso 5 de `DEPLOY.md`) |

Las demás plantillas (Magic Link, Invite user, Change Email) no las usa ningún flujo del
código: `src/actions/auth.ts` solo llama a `signUp`, `resetPasswordForEmail` y
`signInWithOAuth`. No hace falta tocarlas.

---

## Lo que estas plantillas NO arreglan

Cambian **el contenido** del correo, no **el remitente**. Mientras siga activo el servicio
de email que trae Supabase de serie, el "De:" seguirá siendo una dirección suya, no
`@traveleria.app`. Y el remitente es lo primero que mira la gente.

Eso se arregla con el SMTP propio (paso 4 de `DEPLOY.md`), y de paso quita el límite de
unos pocos envíos por hora. Al configurarlo se elige el nombre y la dirección: por ejemplo
`Traveler IA <hola@traveleria.app>`.

---

## Decisiones de estas plantillas

- **El nombre "Traveler IA" va como texto, no como imagen.** Buena parte de los clientes de
  correo bloquean las imágenes por defecto; si la marca fuese una imagen, mucha gente vería
  un recuadro roto justo donde debería estar. El logo va al lado, pequeño, y si se bloquea
  no se pierde nada (`alt` vacío a propósito para que no aparezca texto suelto).
- **Tablas y estilos en línea.** No es HTML antiguo por gusto: Outlook no entiende flexbox,
  ni grid, ni hojas de estilo externas.
- **Botón sobre celda con `bgcolor`.** Es lo único que Outlook pinta con color de fondo de
  verdad.
- **Siempre la URL en texto debajo del botón.** Hay clientes que rompen los botones, y sin
  la dirección visible el usuario se queda sin salida.
- **`color-scheme: light`.** Sin esto, los clientes que invierten colores solos destrozan el
  naranja de marca.
- **No se promete una duración concreta del enlace.** Dice "caduca pronto" porque el plazo
  real depende de *Authentication → Sessions → Email OTP Expiration*. Si algún día fijas ese
  valor, se puede escribir el número exacto aquí.
- **El logo de correo es `public/email-logo.png`** (128×128, 2,5 KB), no `logo.png`, que pesa
  281 KB y es demasiado para un correo. Se genera con `sharp` desde el original.

## Comprobación

Pide un reset de contraseña con tu cuenta y mira el correo **en el móvil**, que es donde lo
va a abrir casi todo el mundo. Si tienes Outlook a mano, míralo también ahí: es el que peor
se porta.
