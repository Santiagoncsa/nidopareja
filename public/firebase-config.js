// Configuración de Firebase para sincronización entre dispositivos de la misma "Casa"
// Reemplaza estos valores con las credenciales de tu proyecto de Firebase Console si usas Firestore/Realtime DB

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-casa-app.firebaseapp.com",
  projectId: "tu-casa-app",
  storageBucket: "tu-casa-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicialización condicional (si los SDKs de Firebase están cargados)
let db = null;
if (typeof firebase !== "undefined" && firebase.initializeApp) {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore ? firebase.firestore() : null;
    console.log("Firebase inicializado correctamente para la Casa");
  } catch (err) {
    console.warn("Firebase no se pudo inicializar o ya estaba activo:", err);
  }
}

// Fallback robusto a LocalStorage para garantizar que nunca se pierdan datos
const CasaStorage = {
  getIdeas(casaId = "CASA-AMOR") {
    try {
      const data = localStorage.getItem(`casa_${casaId}_ideas`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  saveIdeas(ideas, casaId = "CASA-AMOR") {
    try {
      localStorage.setItem(`casa_${casaId}_ideas`, JSON.stringify(ideas));
      // Si Firebase está activo, sincroniza en Firestore
      if (db) {
        db.collection("casas").doc(casaId).set({ ideas }, { merge: true });
      }
    } catch (e) {
      console.error("Error al guardar ideas:", e);
    }
  },
  sendNotification(notification, casaId = "CASA-AMOR") {
    try {
      const notifs = JSON.parse(localStorage.getItem(`casa_${casaId}_notifs`) || "[]");
      notifs.unshift(notification);
      localStorage.setItem(`casa_${casaId}_notifs`, JSON.stringify(notifs.slice(0, 50)));

      // BroadcastChannel para sincronizar entre pestañas del mismo dispositivo
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel(`casa_${casaId}_channel`);
        bc.postMessage({ type: "notification", notification });
      }

      // Si Firebase Firestore está conectado, guarda en la colección de eventos
      if (db) {
        db.collection("casas").doc(casaId).collection("notificaciones").add(notification);
      }
    } catch (e) {
      console.error("Error al enviar notificación:", e);
    }
  }
};

if (typeof module !== "undefined") {
  module.exports = { firebaseConfig, CasaStorage };
}
