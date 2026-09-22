import React, { useState } from "react";
import { Home, User, Volume2, Bell, Share2, Copy, Check, X, Shield, Smartphone } from "lucide-react";
import { CasaConfig } from "../types";

interface CasaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CasaConfig;
  onSaveConfig: (newConfig: CasaConfig) => void;
  isConnected: boolean;
}

export const CasaConfigModal: React.FC<CasaConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  isConnected,
}) => {
  const [casaId, setCasaId] = useState(config.casaId);
  const [casaName, setCasaName] = useState(config.casaName);
  const [myUserName, setMyUserName] = useState(config.myUserName);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      casaId: (casaId.trim().toUpperCase() || "CASA-AMOR"),
      casaName: casaName.trim() || `Casa ${casaId.trim().toUpperCase()}`,
      myUserName: myUserName.trim() || "Pareja",
      soundEnabled,
    });
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(casaId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="modal-configuracion-casa"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base font-display">
                Configuración de la "Casa"
              </h3>
              <p className="text-xs text-slate-500">
                Sincronización entre dispositivos de la pareja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync instructions */}
        <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-2xl mb-4 text-xs text-rose-950">
          <p className="font-bold mb-1 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-rose-500" />
            ¿Cómo conectar los otros dispositivos?
          </p>
          <p className="text-rose-800 leading-relaxed">
            Abran esta misma aplicación en el teléfono o computador de su pareja e ingresen el mismo <strong>Código de Casa</strong>. Ambos dispositivos se sincronizarán al instante.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Código de la Casa (Identificador Único)
            </label>
            <div className="flex gap-2">
              <input
                id="input-codigo-casa"
                type="text"
                required
                value={casaId}
                onChange={(e) => setCasaId(e.target.value.toUpperCase())}
                placeholder="Ej: CASA-AMOR, HOGAR-2026..."
                className="flex-1 px-3.5 py-2 text-sm uppercase font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <button
                type="button"
                id="btn-copiar-codigo-casa"
                onClick={handleCopyCode}
                title="Copiar código para enviar a mi pareja"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre o Apodo de la Casa
            </label>
            <input
              id="input-nombre-casa"
              type="text"
              value={casaName}
              onChange={(e) => setCasaName(e.target.value)}
              placeholder="Ej: Nuestro Nido, Casa Bonita..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tu Nombre en este Dispositivo
            </label>
            <input
              id="input-mi-nombre"
              type="text"
              required
              value={myUserName}
              onChange={(e) => setMyUserName(e.target.value)}
              placeholder="Ej: Santi, Valentina, Mi Amor..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400" />
              Efectos de sonido (campana y ruleta)
            </span>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
            />
          </div>

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 text-xs py-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
            <span className="text-slate-500">
              Estado de sincronización: <strong className={isConnected ? "text-emerald-700" : "text-amber-700"}>{isConnected ? "En vivo (Conectado)" : "Local / Reconectando"}</strong>
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              id="btn-guardar-config-casa"
              type="submit"
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
            >
              Guardar Ajustes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
