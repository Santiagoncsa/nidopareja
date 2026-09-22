# Guía de Integración: Citas y Planes + Notificaciones de la Casa

Este paquete contiene la implementación completa y modular de las funciones solicitadas para la aplicación del hogar / pareja, diseñadas en HTML5 semántico, CSS moderno y JavaScript modular.

---

## 📁 Archivos Incluidos

1. **`index-standalone.html`** (o `index.html`):
   - Aplicación web completa y autónoma en un solo archivo.
   - Contenedor principal con pestañas de categorías del hogar:
     - **Citas y Planes (Nueva)**:
       - Subcategoría **"Indeciso"**: Ruleta interactiva en HTML5 Canvas con desaceleración física, sonidos sintetizados con Web Audio API, limitador dinámico de 2 a 6 opciones, plantillas rápidas y modal de celebración con confeti.
       - Subcategoría **"Sin ideas"**: Catálogo con las 10 ideas prediseñadas iniciales + Sistema CRUD completo (Agregar nuevo plan, Editar texto y categoría, Eliminar plan).
     - **Tareas del Hogar** y **Lista de Compras**.
   - Barra superior con timbre de la casa, contador de alertas y selector de Código de Casa (ej. `CASA-AMOR`).

2. **`firebase-config.js`**:
   - Configuración lista para Firebase (Firestore / Realtime DB).
   - Capa de persistencia híbrida `CasaStorage`: guarda en `localStorage` de forma inmediata y sincroniza automáticamente con Firebase Firestore si se configuran las credenciales.

3. **`service-worker.js`**:
   - Cache offline y soporte para notificaciones push en segundo plano entre dispositivos.

4. **`manifest.json`**:
   - Configuración PWA para instalar la app como aplicación nativa en móviles (Android / iOS) o escritorio.

---

## 🚀 ¿Cómo Integrarlo en tu Proyecto Original?

### Opción A: Usar el archivo completo `index-standalone.html`
Si deseas usar la interfaz completa directamente o reemplazar tu archivo principal:
1. Renombra `index-standalone.html` a `index.html`.
2. Coloca `firebase-config.js`, `manifest.json` y `service-worker.js` en la misma carpeta.
3. Abre `index.html` directamente en el navegador o súbelo a tu hosting (Firebase Hosting, GitHub Pages, Vercel, Netlify, etc.).

### Opción B: Si ya tienes un `index.html` existente y solo quieres insertar "Citas y Planes"
1. **HTML**: Copia el bloque `<div id="seccion-citas-planes">...</div>` de `index-standalone.html` dentro de tu contenedor principal.
2. **Botón en tu barra de navegación**: Agrega el botón `<button onclick="cambiarCategoria('citas')">❤️ Citas y Planes</button>`.
3. **JavaScript**: Copia las funciones `dibujarRuleta()`, `girarRuleta()`, `renderizarCatalogo()`, `guardarPlanForm()` y la lógica de `BroadcastChannel` a tu archivo `.js`.

---

## 🔔 ¿Cómo funciona la sincronización entre dispositivos?
- **Mismo Código de Casa**: En cualquier dispositivo, abre Ajustes (⚙️) y escribe el mismo código (ej. `CASA-AMOR`).
- **En la misma red o navegador**: Utiliza la API nativa `BroadcastChannel` para sincronización instantánea entre pestañas.
- **En la nube / remota**: En `firebase-config.js`, coloca tus claves de Firebase Console para sincronizar a través de Firestore en tiempo real desde cualquier lugar del mundo.
