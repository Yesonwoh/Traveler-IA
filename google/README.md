# Estilo del mapa de Traveler IA

`map-style.json` es el aspecto del mapa base. **No se aplica desde el código**: con un
`mapId` activo, la API de Google **ignora la opción `styles`**, y `mapId` es obligatorio
porque los pines usan `AdvancedMarker`. El estilo vive en Google Cloud y el código solo
apunta a él con `NEXT_PUBLIC_GOOGLE_MAPS_ID`.

Mientras esa variable no exista, el código usa `DEMO_MAP_ID`, que es el mapa de fábrica de
Google: correcto, pero de nadie.

## Cómo aplicarlo

> ⚠️ **Hay DOS formatos de JSON de estilo de Google y no son compatibles.**
>
> - El **clásico** (`[{ "featureType": …, "elementType": …, "stylers": […] }]`) es el que
>   se usaba con la opción `styles` en código y con los Map ID **raster**.
> - El **de estilo en la nube** (`{ "variant", "backgroundColor", "styles": [{ "id",
>   "geometry", "label" }] }`) es el que aceptan los Map ID **vector**, que es el nuestro.
>
> `map-style.json` está en el **formato nuevo**. Si se pega el clásico, la consola marca
> una advertencia por regla, las descarta todas y vuelve al estilo por defecto — sin decir
> en ningún sitio que el problema es el formato.

1. **Google Cloud Console** → *Google Maps Platform* → **Map Styles** → *Create Style*
2. Elegir *Import JSON* y pegar el contenido de `map-style.json`
3. Guardar con un nombre reconocible (p. ej. `Traveler IA — papel cálido`)
4. En la ficha del estilo, **Associated Map IDs** → *Add Map ID* → crear uno nuevo de tipo
   **JavaScript** (los `AdvancedMarker` solo funcionan con Map IDs de JavaScript)
5. Copiar ese Map ID
6. Vercel → variable de entorno **`NEXT_PUBLIC_GOOGLE_MAPS_ID`** con ese valor, en
   Production y Preview
7. **Redesplegar.** Es `NEXT_PUBLIC_`, o sea que se incrusta al compilar: añadir la variable
   no basta nunca, hay que reconstruir (misma trampa que `NEXT_PUBLIC_SITE_URL`, ver
   `DEPLOY.md`)

Los cambios de estilo posteriores se publican desde la consola y llegan al mapa **sin
redesplegar**: el Map ID no cambia. Solo hay que redesplegar la primera vez, al crear la
variable.

## Qué decide este estilo, y por qué

**El mapa calla para que hablen los sitios.** El mapa de fábrica de Google trae rojos,
azules y verdes saturados por todas partes, más su propia capa de POIs. Sobre eso, un pin
naranja es un color más entre muchos.

Aquí el mapa base baja a papel cálido —los mismos tonos `stone` de la interfaz— y **el
naranja de marca pasa a ser lo único saturado de la pantalla**. El ojo va a las
recomendaciones, que es el primer principio de `PRODUCT.md`: de la idea al lugar concreto.

En detalle:

- **POIs de Google apagados.** Eran competencia directa: la app ya marca los sitios que
  importan, que son los que ha propuesto la IA. El código además tapa los que quedan con
  `collisionBehavior` (ver `trip-map.tsx`).
- **Transporte apagado.** Las líneas de metro son ruido en un mapa cuyo trabajo es enseñar
  dónde están cinco sitios.
- **Etiquetas de calle local apagadas, arterias y autovías atenuadas.** Se conserva la
  estructura de la ciudad, que es lo que orienta, sin la letra pequeña.
- **Agua en un azul grisáceo apagado** (`#ccd7da`): sigue leyéndose como agua sin gritar.
- **Parques en verde salvia apagado** (`#e2e6dc`), no el verde de fábrica.
- **Texto en `stone-500` con halo claro**, para que las etiquetas se lean sobre cualquier
  zona sin recuadros.

## Si quieres tocarlo

Se edita en la consola de Google con controles visuales, sin JSON. Dos avisos:

- **Bajar el contraste del texto del mapa por estética se paga en usabilidad.** El límite es
  4,5:1 sobre el fondo donde caiga.
- **No apagues el agua ni los parques del todo.** Son las referencias que hacen reconocible
  una ciudad de un vistazo; sin ellas el mapa se vuelve una mancha beige.

Si lo cambias en la consola, actualiza también este JSON para que el repo no mienta.
