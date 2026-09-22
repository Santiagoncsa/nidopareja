import React, { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Plus, Trash2, RotateCw, Sparkles, Bell, CheckCircle2, Shuffle, AlertCircle } from "lucide-react";
import { playTickSound, playWinFanfare } from "../utils/audio";
import { RouletteOption } from "../types";

interface RuletaIndecisoProps {
  onNotifyWinner: (winner: string) => Promise<void>;
  casaName: string;
  myUserName: string;
  initialOptions?: string[];
}

const PALETTE = [
  "#f43f5e", // Rose
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

const PRESET_ROULETTES = [
  {
    name: "Comida de hoy",
    items: ["Pedir Sushi 🍣", "Hamburguesas artesanales 🍔", "Cocinar pasta juntos 🍝", "Tacos mexicanos 🌮"],
  },
  {
    name: "Cita rápida",
    items: ["Paseo por el centro 🚶", "Café y charla ☕", "Cine y palomitas 🎬", "Picnic en el parque 🧺"],
  },
  {
    name: "Noche en casa",
    items: ["Juegos de mesa 🎲", "Ver serie nueva 📺", "Cocinar pizza casera 🍕", "Masajes y relax 🕯️"],
  },
];

export const RuletaIndeciso: React.FC<RuletaIndecisoProps> = ({
  onNotifyWinner,
  casaName,
  initialOptions,
}) => {
  const [options, setOptions] = useState<RouletteOption[]>(() => {
    if (initialOptions && initialOptions.length >= 2) {
      return initialOptions.slice(0, 6).map((text, idx) => ({
        id: `opt-${idx}-${Date.now()}`,
        text,
        color: PALETTE[idx % PALETTE.length],
      }));
    }
    return [
      { id: "1", text: "Ir a comer sushi 🍣", color: PALETTE[0] },
      { id: "2", text: "Cocinar en casa y pedir helado 🍦", color: PALETTE[1] },
      { id: "3", text: "Probar restaurante nuevo 🍽️", color: PALETTE[2] },
      { id: "4", text: "Hacer noche de películas y snacks 🍿", color: PALETTE[3] },
    ];
  });

  const [newOptionText, setNewOptionText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [winnerResult, setWinnerResult] = useState<string | null>(null);
  const [notifiedSuccess, setNotifiedSuccess] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Redraw roulette wheel on canvas
  const drawWheel = useCallback((currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 16;

    ctx.clearRect(0, 0, width, height);

    if (options.length === 0) return;

    const sliceAngle = (Math.PI * 2) / options.length;

    // Draw slices
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentRotation);

    options.forEach((opt, i) => {
      const angle = i * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = opt.color;
      ctx.fill();

      // Border between slices
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Text inside slice
      ctx.save();
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px 'Outfit', 'Plus Jakarta Sans', sans-serif";
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 4;

      // Truncate text if long
      const maxTextLen = 22;
      const displayStr = opt.text.length > maxTextLen ? `${opt.text.substring(0, maxTextLen)}...` : opt.text;
      ctx.fillText(displayStr, radius - 26, 6);
      ctx.restore();
    });

    ctx.restore();

    // Outer decorative rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#cbd5e1";
    ctx.stroke();

    // Center icon dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#f43f5e";
    ctx.fill();

    // Top pointer indicator (fixed pointing downwards)
    ctx.save();
    ctx.translate(centerX, 4);
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 28);
    ctx.closePath();
    ctx.fillStyle = "#1e293b";
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.restore();
  }, [options]);

  useEffect(() => {
    drawWheel(rotationRef.current);
  }, [drawWheel]);

  // Handle adding an option (limit 2 to 6)
  const handleAddOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newOptionText.trim();
    if (!trimmed) return;
    if (options.length >= 6) return;

    const newOpt: RouletteOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: trimmed,
      color: PALETTE[options.length % PALETTE.length],
    };

    setOptions((prev) => [...prev, newOpt]);
    setNewOptionText("");
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const loadPreset = (presetItems: string[]) => {
    if (isSpinning) return;
    const newOpts = presetItems.slice(0, 6).map((text, idx) => ({
      id: `preset-${idx}-${Date.now()}`,
      text,
      color: PALETTE[idx % PALETTE.length],
    }));
    setOptions(newOpts);
  };

  // Spin animation physics
  const spinWheel = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setNotifiedSuccess(false);

    // Random winner index
    const totalOptions = options.length;
    const winnerIndex = Math.floor(Math.random() * totalOptions);
    const chosenOption = options[winnerIndex];

    const sliceAngle = (Math.PI * 2) / totalOptions;
    
    // Top pointer is at -Math.PI / 2 (or 3*PI/2)
    // To land slice at top pointer:
    // angle for winner slice center is: winnerIndex * sliceAngle + sliceAngle / 2
    // pointer is at top: 3*PI/2
    // target rotation = (3*PI/2) - (winnerIndex * sliceAngle + sliceAngle/2) + extra full spins
    const targetSliceCenter = winnerIndex * sliceAngle + sliceAngle / 2;
    const pointerAngle = (3 * Math.PI) / 2; // 270 degrees = top
    
    // Current rotation normalized
    const currentRot = rotationRef.current;
    const fullSpins = 6 + Math.floor(Math.random() * 3); // 6 to 8 full turns
    const targetFinalAngle = currentRot + fullSpins * Math.PI * 2 + (pointerAngle - (currentRot % (Math.PI * 2)) - targetSliceCenter + Math.PI * 4) % (Math.PI * 2);

    const spinDuration = 4200; // ms
    const startTime = performance.now();
    const startAngle = currentRot;
    const totalDistance = targetFinalAngle - startAngle;

    let lastTickAngle = startAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Ease-out cubic deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3.2);
      const currentAngle = startAngle + totalDistance * easeProgress;
      rotationRef.current = currentAngle;
      drawWheel(currentAngle);

      // Trigger audio tick when passing slices
      const angleDiff = currentAngle - lastTickAngle;
      if (angleDiff > sliceAngle) {
        playTickSound();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsSpinning(false);
        setWinnerResult(chosenOption.text);
        setWinnerModalOpen(true);
        playWinFanfare();

        // Fire celebratory confetti
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
        });
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleSendNotification = async () => {
    if (!winnerResult || isNotifying) return;
    try {
      setIsNotifying(true);
      await onNotifyWinner(winnerResult);
      setNotifiedSuccess(true);
    } catch {
      // handled
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div id="seccion-indeciso" className="w-full flex flex-col items-center">
      {/* Top Banner / Guidance */}
      <div className="w-full mb-6 p-4 rounded-2xl bg-white border border-rose-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 font-bold shrink-0">
            🎡
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-base">
              Ruleta de Decisión Rápida
            </h3>
            <p className="text-sm text-slate-500">
              ¿No se ponen de acuerdo? Ingresen entre 2 y 6 opciones y dejen que el destino decida por la casa.
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Shuffle className="w-3.5 h-3.5" /> Plantillas:
          </span>
          {PRESET_ROULETTES.map((preset) => (
            <button
              key={preset.name}
              id={`preset-btn-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => loadPreset(preset.items)}
              disabled={isSpinning}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Canvas Wheel */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="w-full h-full max-w-[380px] max-h-[380px] drop-shadow-md select-none"
            />
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              id="btn-girar-ruleta"
              onClick={spinWheel}
              disabled={isSpinning || options.length < 2}
              className={`px-8 py-3.5 rounded-full font-bold text-base shadow-lg transition-all duration-200 flex items-center gap-2.5 ${
                isSpinning
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : options.length < 2
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 hover:shadow-rose-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
              }`}
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? "animate-spin" : ""}`} />
              {isSpinning ? "Girando Ruleta..." : "¡Girar Ruleta!"}
            </button>

            {options.length < 2 && (
              <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Agrega al menos 2 opciones para poder girar
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Manage Options (2 to 6) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">
                  Opciones para la Ruleta
                </h4>
                <p className="text-xs text-slate-500">
                  {options.length}/6 opciones ingresadas (mínimo 2, máximo 6)
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                options.length >= 6
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-50 text-rose-600"
              }`}>
                {options.length} de 6
              </span>
            </div>

            {/* Input to Add Option */}
            <form onSubmit={handleAddOption} className="flex gap-2 mb-4">
              <input
                id="input-nueva-opcion-ruleta"
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder={
                  options.length >= 6
                    ? "Límite máximo alcanzado (6)"
                    : "Ej: Comer sushi, Cine, Cocinar..."
                }
                disabled={options.length >= 6 || isSpinning}
                maxLength={45}
                className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                id="btn-agregar-opcion-ruleta"
                type="submit"
                disabled={!newOptionText.trim() || options.length >= 6 || isSpinning}
                className="px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </form>

            {/* List of Current Options */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {options.map((opt, index) => (
                <div
                  key={opt.id}
                  id={`opcion-ruleta-${opt.id}`}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-xs font-semibold text-slate-400 w-4">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {opt.text}
                    </span>
                  </div>

                  <button
                    id={`btn-eliminar-opcion-${opt.id}`}
                    onClick={() => handleRemoveOption(opt.id)}
                    disabled={options.length <= 2 || isSpinning}
                    title={options.length <= 2 ? "Se requieren mínimo 2 opciones" : "Eliminar opción"}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Tips footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>💡 También puedes transferir planes desde "Sin ideas"</span>
            </div>
          </div>
        </div>
      </div>

      {/* Celebratory Winner Modal */}
      {winnerModalOpen && winnerResult && (
        <div
          id="modal-ganador-ruleta"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-rose-100 transform transition-all relative">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-rose-500 to-amber-400 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-rose-200">
              🎉
            </div>

            <span className="inline-block px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              ¡Tenemos un Ganador!
            </span>

            <h3 className="text-2xl font-extrabold text-slate-800 mb-2 font-display">
              {winnerResult}
            </h3>

            <p className="text-sm text-slate-500 mb-6">
              La ruleta de <span className="font-semibold text-slate-700">{casaName}</span> ha elegido el plan definitivo para hoy.
            </p>

            {/* Notification to Casa button */}
            <div className="space-y-3">
              <button
                id="btn-notificar-casa-ganador"
                onClick={handleSendNotification}
                disabled={isNotifying || notifiedSuccess}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  notifiedSuccess
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white hover:shadow-lg"
                }`}
              >
                {notifiedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    ¡Notificación enviada a la casa!
                  </>
                ) : isNotifying ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Enviando a los otros dispositivos...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-amber-300" />
                    Notificar a los otros dispositivos en "{casaName}"
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  id="btn-girar-otra-vez-modal"
                  onClick={() => {
                    setWinnerModalOpen(false);
                    setTimeout(() => spinWheel(), 200);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCw className="w-4 h-4 text-slate-400" />
                  Girar otra vez
                </button>

                <button
                  id="btn-cerrar-modal-ganador"
                  onClick={() => setWinnerModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  ¡Genial, hecho!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
