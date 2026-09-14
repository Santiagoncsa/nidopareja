# Nido — guía para dejarla funcionando

Esta carpeta es una app completa. Solo falta: (1) conectarla a una base de
datos gratuita para que sincronice entre los dos celulares, y (2) subirla a
algún lugar donde viva con una dirección propia. Son ~15 minutos la primera vez.

## Paso 1 — Crear el proyecto de Firebase (gratis)

1. Andá a **console.firebase.google.com** e iniciá sesión con una cuenta de Google.
2. Tocá **"Agregar proyecto"**, ponele un nombre (ej: `nido-pareja`) y seguí los
   pasos (podés desactivar Google Analytics, no hace falta).
3. Dentro del proyecto, tocá el ícono **`</>`** ("Agregar app web").
4. Ponele un apodo (ej: "Nido web") y tocá **"Registrar app"**. NO hace falta
   activar Firebase Hosting en este paso.
5. Firebase te va a mostrar un bloque de código con un objeto `firebaseConfig`.
   Copiá esos valores.

## Paso 2 — Pegar la configuración

1. Abrí el archivo **`firebase-config.js`** de esta carpeta con cualquier editor
   de texto (o el Bloc de notas).
2. Reemplazá cada `"PEGAR_ACA"` por el valor correspondiente que copiaste de
   Firebase. Guardá el archivo.

## Paso 3 — Activar la base de datos

1. En el menú de la izquierda de Firebase, buscá **"Realtime Database"** (no
   es lo mismo que "Firestore" — asegurate de elegir Realtime Database).
2. Tocá **"Crear base de datos"**, elegí una ubicación y empezá en modo de
   prueba.
3. Andá a la pestaña **"Reglas"** de esa base de datos y reemplazá el
   contenido por esto:

   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

   Tocá **"Publicar"**.

   ⚠️ **Nota de seguridad:** esto deja la base de datos abierta a cualquiera
   que tenga la URL. Para una app personal sin datos sensibles (sin
   contraseñas ni tarjetas) es razonable, pero no compartas públicamente el
   código fuente ni el link de tu base de datos.

## Paso 4 — Publicar la app en internet

La forma más simple sin instalar nada:

1. Andá a **app.netlify.com/drop** desde la computadora.
2. Arrastrá esta carpeta completa (`nido-app`) sobre la página.
3. En unos segundos te da un link, algo como
   `https://nido-pareja-8f3a.netlify.app`.
4. (Recomendado) Creá una cuenta gratis en Netlify después para reclamar el
   sitio — así no se borra por inactividad y podés ponerle un nombre lindo.

## Paso 5 — Instalar en el celular

1. Abrí el link que te dio Netlify en **Chrome** en el Android.
2. Tocá el menú (los tres puntitos, arriba a la derecha) y elegí
   **"Instalar app"** o **"Agregar a pantalla de inicio"**.
3. Va a aparecer un ícono de Nido en la pantalla principal, como cualquier
   otra app.
4. Repetí este mismo paso en el otro celular, con el mismo link.

## Paso 6 — Usarla

1. La primera vez, cada uno abre la app y escribe el mismo **código de casa**
   (cualquier palabra que inventen entre los dos, ej: `casa-verde-2026`).
2. Después cada uno elige su nombre y color.
3. A partir de ahí, todo lo que cargue uno aparece **al instante** en el
   celular del otro (sin botón de actualizar ni demoras — la sincronización
   ahora es en tiempo real).

---

### Si algo no funciona

- **Pantalla que dice "Falta configurar Firebase"**: revisá que hayas
  guardado bien `firebase-config.js` con los valores reales.
- **No sincroniza entre los dos**: confirmá que escribieron exactamente el
  mismo código de casa en ambos celulares (mayúsculas/minúsculas no importan,
  pero los espacios sí).
- **La app no ofrece "Instalar"**: asegurate de estar usando Chrome (no el
  navegador de Samsung u otro) y de haber entrado por `https://`.
