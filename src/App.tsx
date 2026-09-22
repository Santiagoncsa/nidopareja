import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { CitasYPlanes } from "./components/CitasYPlanes";
import { NotificationCenter } from "./components/NotificationCenter";
import { CasaConfigModal } from "./components/CasaConfigModal";
import { PRESET_IDEAS } from "./data/presetIdeas";
import { CasaConfig, CasaNotification, PlanIdea } from "./types";
import {
  getLocalConfig,
  saveLocalConfig,
  getLocalIdeas,
  saveLocalIdeas,
  getLocalNotifications,
  saveLocalNotifications,
  showSystemNotification,
} from "./utils/storage";
import { playChimeSound } from "./utils/audio";
import {
  Heart,
  Calendar,
  CheckSquare,
  ShoppingCart,
  Bell,
  Sparkles,
  Wifi,
  WifiOff,
  X,
  ExternalLink,
} from "lucide-react";

interface ToastMsg {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "winner";
}

export default function App() {
  const [config, setConfig] = useState<CasaConfig>(getLocalConfig);
  const [customIdeas, setCustomIdeas] = useState<PlanIdea[]>(getLocalIdeas);
  const [notifications, setNotifications] = useState<CasaNotification[]>(getLocalNotifications);
  const [isConnected, setIsConnected] = useState(false);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeMainCategory, setActiveMainCategory] = useState<"citas" | "tareas" | "compras">("citas");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Helper to trigger toast
  const addToast = useCallback((title: string, message: string, type: ToastMsg["type"] = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Sync state from server for this Casa
  const fetchCasaState = useCallback(async (casaId: string) => {
    try {
      const res = await fetch(`/api/casa/${encodeURIComponent(casaId)}/state`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.customIdeas)) {
          setCustomIdeas(data.customIdeas);
          saveLocalIdeas(data.customIdeas);
        }
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          saveLocalNotifications(data.notifications);
        }
      }
    } catch {
      // Local fallback in storage
    }
  }, []);

  // Connect to SSE for real-time multi-device sync in the same casa
  useEffect(() => {
    fetchCasaState(config.casaId);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = `/api/casa/${encodeURIComponent(config.casaId)}/events`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setIsConnected(true);
    });

    es.addEventListener("notification", (event) => {
      try {
        const notif: CasaNotification = JSON.parse(event.data);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          const updated = [notif, ...prev];
          saveLocalNotifications(updated);
          return updated;
        });

        // If from another user, play chime and show alert
        if (notif.fromUser !== config.myUserName) {
          if (config.soundEnabled) {
            playChimeSound();
          }
          showSystemNotification(`Aviso en ${config.casaName}`, `${notif.fromUser}: ${notif.message}`);
          addToast(notif.fromUser, notif.message, notif.type === "roulette_winner" ? "winner" : "info");
          setUnreadCount((c) => c + 1);
        }
      } catch {
        // format error
      }
    });

    es.addEventListener("idea_added", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.idea) {
          setCustomIdeas((prev) => {
            if (prev.some((i) => i.id === data.idea.id)) return prev;
            const updated = [data.idea, ...prev];
            saveLocalIdeas(updated);
            return updated;
          });
        }
        if (data.notification && data.notification.fromUser !== config.myUserName) {
          setNotifications((prev) => [data.notification, ...prev]);
          addToast("Nuevo Plan Agregado", `${data.notification.fromUser} agregó "${data.idea.title}"`, "success");
          if (config.soundEnabled) playChimeSound();
        }
      } catch {
        // error
      }
    });

    es.addEventListener("idea_updated", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.idea) {
          setCustomIdeas((prev) => {
            const updated = prev.map((i) => (i.id === data.idea.id ? data.idea : i));
            saveLocalIdeas(updated);
            return updated;
          });
        }
      } catch {
        // error
      }
    });

    es.addEventListener("idea_deleted", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id) {
          setCustomIdeas((prev) => {
            const updated = prev.filter((i) => i.id !== data.id);
            saveLocalIdeas(updated);
            return updated;
          });
        }
      } catch {
        // error
      }
    });

    es.addEventListener("roulette_winner", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.fromUser !== config.myUserName) {
          addToast(
            "¡Giraron la Ruleta!",
            `${data.fromUser} giró la ruleta y ganó: "${data.winner}" 🎉`,
            "winner"
          );
          if (config.soundEnabled) playChimeSound();
          showSystemNotification(
            `¡Plan de Cita Decidido!`,
            `${data.fromUser} giró la ruleta y ganó: ${data.winner}`
          );
          setUnreadCount((c) => c + 1);
        }
      } catch {
        // error
      }
    });

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
    };
  }, [config.casaId, config.myUserName, config.soundEnabled, config.casaName, addToast, fetchCasaState]);

  // Handle configuration update
  const handleSaveConfig = (newConfig: CasaConfig) => {
    setConfig(newConfig);
    saveLocalConfig(newConfig);
    addToast("Configuración Guardada", `Sincronizando con ${newConfig.casaName} (${newConfig.casaId})`);
  };

  // Add custom idea handler
  const handleAddCustomIdea = async (ideaData: { title: string; description?: string; tag?: string }) => {
    const tempIdea: PlanIdea = {
      id: `idea-${Date.now()}`,
      title: ideaData.title,
      description: ideaData.description,
      tag: ideaData.tag || "Romántico",
      isCustom: true,
      createdBy: config.myUserName,
      createdAt: Date.now(),
    };

    // Optimistic update
    setCustomIdeas((prev) => {
      const updated = [tempIdea, ...prev];
      saveLocalIdeas(updated);
      return updated;
    });

    try {
      const res = await fetch(`/api/casa/${encodeURIComponent(config.casaId)}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ideaData,
          createdBy: config.myUserName,
        }),
      });
      if (res.ok) {
        const result = await res.json();
        // Replace temp with server confirmed idea
        if (result.idea) {
          setCustomIdeas((prev) => prev.map((i) => (i.id === tempIdea.id ? result.idea : i)));
        }
        addToast("Plan Guardado", `"${ideaData.title}" ahora está en el catálogo.`);
      }
    } catch {
      addToast("Guardado Local", "Guardado en este dispositivo (sin conexión momentánea).");
    }
  };

  // Update custom idea handler
  const handleUpdateCustomIdea = async (id: string, updatedData: { title: string; description?: string; tag?: string }) => {
    setCustomIdeas((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updatedData } : item));
      saveLocalIdeas(updated);
      return updated;
    });

    try {
      await fetch(`/api/casa/${encodeURIComponent(config.casaId)}/ideas/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedData,
          updatedBy: config.myUserName,
        }),
      });
      addToast("Plan Actualizado", "Los cambios han sido guardados y sincronizados.");
    } catch {
      // offline
    }
  };

  // Delete custom idea handler
  const handleDeleteCustomIdea = async (id: string) => {
    setCustomIdeas((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveLocalIdeas(updated);
      return updated;
    });

    try {
      await fetch(`/api/casa/${encodeURIComponent(config.casaId)}/ideas/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      addToast("Plan Eliminado", "La idea ha sido eliminada del catálogo.");
    } catch {
      // offline
    }
  };

  // Send roulette winning notification to other devices in casa
  const handleNotifyWinner = async (winner: string) => {
    try {
      const res = await fetch(`/api/casa/${encodeURIComponent(config.casaId)}/roulette-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winner,
          fromUser: config.myUserName,
        }),
      });

      if (res.ok) {
        addToast("¡Notificado!", `Aviso enviado a los dispositivos en ${config.casaName}.`, "winner");
      }
    } catch {
      addToast("Aviso Local", "No se pudo contactar al servidor, verifiquen conexión.", "info");
    }
  };

  // Send custom notification or quick alert to casa
  const handleSendNotification = async (message: string, type: CasaNotification["type"] = "custom") => {
    try {
      const res = await fetch(`/api/casa/${encodeURIComponent(config.casaId)}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUser: config.myUserName,
          message,
          type,
        }),
      });
      if (res.ok) {
        const notif = await res.json();
        setNotifications((prev) => [notif, ...prev]);
        saveLocalNotifications([notif, ...notifications]);
      }
    } catch {
      // fallback
    }
  };

  // Quick door bell / ring attention
  const handleQuickRing = () => {
    if (config.soundEnabled) {
      playChimeSound();
    }
    handleSendNotification("🛎️ ¡Ding-Dong! Llamando a los miembros de la casa...", "alert");
    addToast("Timbre Sonado", "Has llamado la atención en los otros dispositivos.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] text-slate-800 antialiased selection:bg-rose-100 selection:text-rose-900">
      {/* Top Navbar with Casa and Notification bell */}
      <Navbar
        config={config}
        unreadCount={unreadCount}
        isConnected={isConnected}
        onOpenNotifications={() => {
          setIsNotifCenterOpen(true);
          setUnreadCount(0);
        }}
        onOpenConfig={() => setIsConfigOpen(true)}
        onQuickRing={handleQuickRing}
      />

      {/* Switcher & Guide banner */}
      <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-indigo-500/10 border-b border-rose-200/50 py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-base">📦</span>
            <span>
              <strong>¿Buscas el formato original de tu app (HTML + JS + PWA)?</strong> Tienes la versión clásica en un archivo directo listo para tu servidor o hosting.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/standalone"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-rose-600 hover:text-rose-700 underline flex items-center gap-1"
            >
              <span>Ver Versión Standalone HTML ↗</span>
            </a>
            <span className="text-slate-300">|</span>
            <a
              href="/modificaciones-citas-y-planes.zip"
              download
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors"
            >
              Descargar ZIP PWA
            </a>
          </div>
        </div>
      </div>

      {/* Main Household Categories Tabs Header */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainCategory("citas")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeMainCategory === "citas"
                  ? "bg-rose-50 text-rose-600 border border-rose-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Heart className="w-4 h-4 fill-rose-500/20 text-rose-500" />
              <span>Citas y Planes</span>
              <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-md text-[10px] font-extrabold uppercase">
                Nueva
              </span>
            </button>

            <button
              onClick={() => setActiveMainCategory("tareas")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeMainCategory === "tareas"
                  ? "bg-slate-100 text-slate-800 border border-slate-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Tareas del Hogar</span>
            </button>

            <button
              onClick={() => setActiveMainCategory("compras")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeMainCategory === "compras"
                  ? "bg-slate-100 text-slate-800 border border-slate-200 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-amber-600" />
              <span>Lista de Compras</span>
            </button>
          </div>

          {/* Quick Casa Sync Pill on right */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            {isConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <Wifi className="w-3.5 h-3.5" /> Sincronizado en vivo con {config.casaId}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                <WifiOff className="w-3.5 h-3.5" /> Modo local (reconectando)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Container Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeMainCategory === "citas" && (
          <CitasYPlanes
            presetIdeas={PRESET_IDEAS}
            customIdeas={customIdeas}
            onAddCustomIdea={handleAddCustomIdea}
            onUpdateCustomIdea={handleUpdateCustomIdea}
            onDeleteCustomIdea={handleDeleteCustomIdea}
            onNotifyWinner={handleNotifyWinner}
            casaName={config.casaName}
            myUserName={config.myUserName}
          />
        )}

        {activeMainCategory === "tareas" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800 font-display">Tareas del Hogar</h3>
                <p className="text-xs text-slate-400">Organización compartida de la casa</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                Sincronizado
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { text: "Comprar ingredientes para la cena", done: true, tag: "Cocina" },
                { text: "Limpiar y ordenar la sala de estar", done: false, tag: "Limpieza" },
                { text: "Regar las plantas del balcón", done: false, tag: "Jardín" },
                { text: "Planificar la cita del fin de semana (ver Citas y Planes)", done: false, tag: "Pareja" },
              ].map((task, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xs transition-all"
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked={task.done}
                      className="w-4 h-4 rounded text-rose-500 accent-rose-500"
                    />
                    <span className={`text-sm ${task.done ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}>
                      {task.text}
                    </span>
                  </label>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-200/60 text-slate-500 font-medium">
                    {task.tag}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setActiveMainCategory("citas")}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>❤️ Ir a Citas y Planes</span>
              </button>
              <button
                onClick={() => alert("Función para agregar tarea a la casa")}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                + Nueva Tarea
              </button>
            </div>
          </div>
        )}

        {activeMainCategory === "compras" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800 font-display">Lista de Compras</h3>
                <p className="text-xs text-slate-400">Despensa y compras pendientes</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
                Compartido
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { text: "Helado artesanal para el postre 🍨", qty: "1 pote", done: false },
                { text: "Frutas frescas y verduras 🥑", qty: "Para la semana", done: true },
                { text: "Café en grano tostado ☕", qty: "250g", done: false },
                { text: "Snacks para la noche de películas 🍿", qty: "2 paquetes", done: false },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xs transition-all"
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      defaultChecked={item.done}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                    />
                    <span className={`text-sm ${item.done ? "line-through text-slate-400" : "text-slate-700 font-medium"}`}>
                      {item.text}
                    </span>
                  </label>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
                    {item.qty}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                onClick={() => setActiveMainCategory("citas")}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <span>❤️ Ir a Citas y Planes</span>
              </button>
              <button
                onClick={() => alert("Función para agregar artículo de compra")}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                + Agregar Producto
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/60 bg-white/60 py-6 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5">
            <span>Nuestra Casa</span>
            <span>•</span>
            <span>Código: <strong className="text-slate-600">{config.casaId}</strong></span>
            <span>•</span>
            <span>Sincronización en tiempo real entre pareja</span>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="text-slate-500 hover:text-slate-800 underline"
            >
              Cambiar Casa / Dispositivo
            </button>
            <button
              onClick={() => setIsNotifCenterOpen(true)}
              className="text-slate-500 hover:text-slate-800 underline"
            >
              Avisos ({notifications.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        notifications={notifications}
        onSendNotification={handleSendNotification}
        casaId={config.casaId}
        casaName={config.casaName}
        myUserName={config.myUserName}
        soundEnabled={config.soundEnabled}
        onToggleSound={() => setConfig((c) => ({ ...c, soundEnabled: !c.soundEnabled }))}
      />

      {/* Casa Configuration Modal */}
      <CasaConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        isConnected={isConnected}
      />

      {/* In-app Toast Banner Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transform transition-all animate-slide-up ${
              toast.type === "winner"
                ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-300"
                : toast.type === "success"
                ? "bg-slate-900 text-white border-slate-800"
                : "bg-white text-slate-800 border-slate-200"
            }`}
          >
            <span className="text-xl">
              {toast.type === "winner" ? "🎡" : toast.type === "success" ? "✨" : "💌"}
            </span>
            <div className="flex-1">
              <h5 className="font-bold text-xs uppercase tracking-wider mb-0.5 opacity-90">
                {toast.title}
              </h5>
              <p className="text-xs leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="opacity-70 hover:opacity-100 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
