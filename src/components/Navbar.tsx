import React from "react";
import { Home, Bell, Settings, Heart, Sparkles, Smartphone, Wifi, WifiOff } from "lucide-react";
import { CasaConfig, CasaNotification } from "../types";

interface NavbarProps {
  config: CasaConfig;
  unreadCount: number;
  isConnected: boolean;
  onOpenNotifications: () => void;
  onOpenConfig: () => void;
  onQuickRing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  unreadCount,
  isConnected,
  onOpenNotifications,
  onOpenConfig,
  onQuickRing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Casa Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
            <Heart className="w-5 h-5 fill-white/90" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 tracking-tight font-display flex items-center gap-1.5">
                {config.casaName}
              </h1>
              {/* Live Connection Pill */}
              <button
                onClick={onOpenConfig}
                title={`Sincronización ${isConnected ? "activa" : "reconectando"}`}
                className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-colors ${
                  isConnected
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    : "bg-amber-50 text-amber-700 border border-amber-200/60"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span>{config.casaId}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Dispositivo de <span className="font-semibold text-slate-600">{config.myUserName}</span>
            </p>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Quick ring bell button */}
          <button
            id="btn-timbre-rapido"
            onClick={onQuickRing}
            title="Llamar la atención en los otros dispositivos de la casa"
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-rose-200/60 transition-all cursor-pointer"
          >
            <span>🛎️</span>
            <span className="hidden md:inline">Tocar Timbre</span>
          </button>

          {/* Notifications Center Bell */}
          <button
            id="btn-abrir-notificaciones"
            onClick={onOpenNotifications}
            title="Centro de notificaciones de la casa"
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* House Settings */}
          <button
            id="btn-abrir-ajustes-casa"
            onClick={onOpenConfig}
            title="Ajustes de la Casa y sincronización"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
