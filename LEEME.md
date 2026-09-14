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
   y la misma **contraseña** (cualquier palabra/número que inventen entre los
   dos, ej. código `casa-verde-2026` y contraseña a elección). La primera
   persona que entra con ese código+contraseña los "registra" como los de su
   casa; a partir de ahí, cualquiera que quiera entrar necesita escribir
   exactamente los mismos dos datos. Si alguien pone el código correcto pero
   la contraseña incorrecta, la app se lo va a rechazar.
2. Después cada uno elige su nombre y color.
3. A partir de ahí, todo lo que cargue uno aparece **al instante** en el
   celular del otro (sin botón de actualizar ni demoras — la sincronización
   sigue siendo en tiempo real), incluyendo el saldo del **fondo común**.
4. En **Tareas** ahora pueden marcar una actividad como **"Diaria"** o
   **"Días específicos"** (por ejemplo, todos los martes y jueves) y
   ponerle un **rango horario** ("Desde" / "Hasta", ambos opcionales). Ese
   horario de inicio dispara una notificación del navegador para no
   olvidarse (la app va a pedir permiso de notificaciones la primera vez
   que carguen una tarea con horario — hay que aceptarlo). Las tareas
   diarias o de días específicos se "reinician" solas en las fechas que
   corresponda, sin que nadie tenga que volver a cargarlas. Las que son de
   días específicos y no tocan hoy aparecen igual, más abajo, en
   "Programadas para otros días", para poder editarlas o borrarlas cuando
   quieran.
5. En **Fondo común** (pestaña nueva) pueden registrar aportes y ver el
   saldo compartido en tiempo real. Desde **Gastos**, tildando "Pagar con
   fondo común", un gasto se descuenta automáticamente de ese saldo.

⚠️ **Sobre las notificaciones:** al ser una app web (sin servidor propio),
los avisos solo se disparan mientras el celular tiene la app abierta o
en segundo plano reciente, y el navegador debe tener permiso concedido.
No llegan si cerraste la app del todo o reiniciaste el celular hace rato.
Si más adelante quieren notificaciones "push" reales (que lleguen incluso
con la app cerrada), hace falta un paso extra con Firebase Cloud
Messaging — avisen y lo agregamos.

⚠️ **Sobre la contraseña de la casa:** este control impide que alguien
entre a la app sin conocer el código y la contraseña, pero la base de
datos de Firebase (según las reglas del Paso 3) sigue técnicamente abierta
a quien tenga la URL exacta y sepa buscar por fuera de la app. Para una
app personal, sin datos ultra sensibles, este nivel alcanza para que un
desconocido no entre "de casualidad". Si en algún momento quieren
seguridad a nivel de base de datos (no solo de la app), se puede sumar
Firebase Authentication — es un paso más de configuración.

---

### Si algo no funciona

- **Pantalla que dice "Falta configurar Firebase"**: revisá que hayas
  guardado bien `firebase-config.js` con los valores reales.
- **No sincroniza entre los dos**: confirmá que escribieron exactamente el
  mismo código de casa en ambos celulares (mayúsculas/minúsculas no importan,
  pero los espacios sí).
- **La app no ofrece "Instalar"**: asegurate de estar usando Chrome (no el
  navegador de Samsung u otro) y de haber entrado por `https://`.
