import React, { useState } from "react";
import { Bell, Send, CheckCheck, Sparkles, X, Volume2, VolumeX, ShieldAlert, Heart, MessageSquare } from "lucide-react";
import { CasaNotification } from "../types";
import { requestNotificationPermission } from "../utils/storage";

interface NotificationCenterProps {
  notifications: CasaNotification[];
  isOpen: boolean;
  onClose: () => void;
  onSendNotification: (message: string, type?: CasaNotification["type"], data?: any) => Promise<void>;
  casaId: string;
  casaName: string;
  myUserName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClearNotifications?: () => void;
}

const QUICK_ALERTS = [
  { label: "¡Hora de cenar! 🍽️", msg: "¡Hora de cenar juntos! ¿Qué pedimos o preparamos?" },
  { label: "¿Qué hacemos hoy? 🤔", msg: "¿Qué hacemos hoy? ¡Mira las opciones en Citas y Planes!" },
  { label: "¡Te toca elegir! 🎯", msg: "¡Te toca a ti elegir el plan de hoy en la Ruleta!" },
  { label: "¡Te extraño! ❤️", msg: "Un recordatorio cariñoso: ¡Te extraño mucho!" },
  { label: "¡Mira el plan nuevo! 💡", msg: "Acabo de agregar una idea nueva en el catálogo de Citas." },
];

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  isOpen,
  onClose,
  onSendNotification,
  casaId,
  casaName,
  myUserName,
  soundEnabled,
  onToggleSound,
}) => {
  const [customMsg, setCustomMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (message: string, type: CasaNotification["type"] = "custom") => {
    if (!message.trim() || isSending) return;
    try {
      setIsSending(true);
      await onSendNotification(message.trim(), type);
      setCustomMsg("");
      setSentNotice("¡Notificación enviada a todos los dispositivos!");
      setTimeout(() => setSentNotice(null), 3500);
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      alert("¡Notificaciones del navegador activadas para esta Casa!");
    } else {
      alert("Para recibir alertas con la app en segundo plano, permite las notificaciones en los ajustes de tu navegador.");
    }
  };

  return (
    <div
      id="modal-centro-notificaciones"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base font-display">
                Notificaciones de la Casa
              </h3>
              <p className="text-xs text-slate-500">
                Conectado a <span className="font-semibold text-slate-700">{casaName}</span> ({casaId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? "Sonido activado" : "Sonido silenciado"}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Push Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200/60 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-xs text-amber-900">
              <p className="font-semibold">¿Recibir alertas cuando no estés viendo la app?</p>
              <p className="text-amber-700">Activa las notificaciones del navegador para tu pareja y tú.</p>
            </div>
            <button
              onClick={handleRequestPush}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors shrink-0"
            >
              Activar Alertas
            </button>
          </div>

          {/* Quick Alert Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Alertas Rápidas para la Pareja / Casa
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_ALERTS.map((qa, idx) => (
                <button
                  key={idx}
                  id={`btn-alerta-rapida-${idx}`}
                  disabled={isSending}
                  onClick={() => handleSend(qa.msg, "alert")}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-transparent rounded-xl text-slate-700 transition-colors disabled:opacity-50"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Notification Input */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Enviar Mensaje Personalizado a los Otros Dispositivos
            </label>
            <div className="flex gap-2">
              <input
                id="input-notificacion-personalizada"
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Escribe un aviso para tu pareja o casa..."
                className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customMsg.trim()) {
                    handleSend(customMsg, "custom");
                  }
                }}
              />
              <button
                id="btn-enviar-notificacion-personalizada"
                onClick={() => handleSend(customMsg, "custom")}
                disabled={!customMsg.trim() || isSending}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                <span>Enviar</span>
              </button>
            </div>
            {sentNotice && (
              <p className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCheck className="w-4 h-4" /> {sentNotice}
              </p>
            )}
          </div>

          {/* Activity & Notification Feed */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Historial de Actividad en la Casa ({notifications.length})
              </label>
              <span className="text-[11px] text-slate-400">
                Sincronización en tiempo real
              </span>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                No hay notificaciones recientes en esta casa.
              </div>
            ) : (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    id={`notif-item-${item.id}`}
                    className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-sm transition-all ${
                      item.type === "roulette_winner"
                        ? "bg-rose-50/60 border-rose-200/80 text-rose-950"
                        : item.type === "alert"
                        ? "bg-amber-50/60 border-amber-200/80 text-amber-950"
                        : "bg-slate-50 border-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">
                        {item.type === "roulette_winner" ? "🎡" : item.type === "alert" ? "📢" : "💌"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-xs text-slate-700">
                            {item.fromUser}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          Cualquier acción enviada aquí aparece de inmediato en los otros teléfonos y pantallas vinculadas a {casaId}.
        </div>
      </div>
    </div>
  );
};
