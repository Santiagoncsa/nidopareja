import re

with open("original_nidopareja/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Add confetti script before </head>
if "confetti.browser.min.js" not in html:
    html = html.replace(
        "</head>",
        '  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js"></script>\n</head>'
    )

# 2. Add extra CSS in <style>
extra_css = """
  /* Estilos agregados para Citas y Planes + Notificaciones */
  .subtabs { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .subtab-btn {
    padding: 0.45rem 0.95rem; font-size: 0.85rem; font-weight: 500;
    border: 1px solid var(--line); background: var(--surface); color: var(--ink-muted);
    border-radius: 20px; cursor: pointer; transition: all 0.15s ease;
    display: inline-flex; align-items: center; gap: 0.35rem;
  }
  .subtab-btn.active {
    background: var(--ink); color: #fff; border-color: var(--ink); font-weight: 600;
  }
  .roulette-container {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--surface); border: 1px solid var(--line); border-radius: 16px;
    padding: 1.5rem 1rem; margin-bottom: 1.5rem; position: relative;
  }
  .canvas-wrapper { position: relative; width: 280px; height: 280px; margin: 0.75rem auto 1rem; }
  .needle {
    position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 14px solid transparent; border-right: 14px solid transparent;
    border-top: 24px solid var(--bad); z-index: 10;
    filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
  }
  .winner-banner {
    background: #FAF7EE; border: 1.5px solid var(--warn); border-radius: 14px;
    padding: 1rem 1.2rem; margin: 1rem 0; width: 100%; max-width: 440px; text-align: center;
    box-shadow: 0 4px 14px rgba(201, 138, 44, 0.12);
  }
  .winner-title { font-family: 'Fraunces', serif; font-size: 1.25rem; color: var(--ink); margin: 0.25rem 0 0.5rem; }
  .winner-actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-top: 0.75rem; }
  
  .alert-toast {
    position: fixed; top: calc(1rem + env(safe-area-inset-top, 0px)); right: 1rem; left: 1rem;
    max-width: 440px; margin: 0 auto; background: var(--surface); border: 1px solid var(--line);
    border-left: 5px solid var(--warn); box-shadow: 0 12px 35px rgba(0,0,0,0.18);
    border-radius: 12px; padding: 0.85rem 1rem; display: flex; align-items: center;
    gap: 0.75rem; z-index: 100; animation: toastSlide 0.25s ease;
  }
  @keyframes toastSlide { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
  
  .bell-btn {
    border: 1px solid var(--line); background: var(--surface); border-radius: 20px;
    padding: 0.35rem 0.75rem; font-size: 0.78rem; color: var(--ink);
    display: flex; align-items: center; gap: 0.4rem; cursor: pointer;
  }
  .bell-btn:hover { border-color: var(--ink); }
  .bell-modal-backdrop {
    position: fixed; inset: 0; background: rgba(20, 24, 16, 0.5); z-index: 65;
    display: flex; align-items: center; justify-content: center; padding: 1.25rem;
  }
  .bell-modal {
    background: var(--bg); border-radius: 16px; padding: 1.25rem; max-width: 420px;
    width: 100%; box-shadow: 0 16px 45px rgba(0,0,0,0.22); border: 1px solid var(--line);
  }
  .bell-quick-list { display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0; }
  .bell-quick-item {
    background: var(--surface); border: 1px solid var(--line); border-radius: 10px;
    padding: 0.65rem 0.9rem; text-align: left; font-size: 0.88rem; color: var(--ink);
    cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: border-color 0.15s;
  }
  .bell-quick-item:hover { border-color: var(--ink); background: var(--surface-muted); }
  .plan-card {
    display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.85rem 1rem;
    background: var(--surface); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 0.6rem;
  }
  .plan-card-body { flex: 1; min-width: 0; }
  .plan-card-title { font-size: 0.95rem; font-weight: 600; color: var(--ink); margin-bottom: 0.2rem; }
  .plan-card-desc { font-size: 0.82rem; color: var(--ink-muted); line-height: 1.4; margin-top: 0.2rem; }
  .plan-actions { display: flex; gap: 0.35rem; align-items: center; flex: none; }
"""

if "/* Estilos agregados para Citas y Planes" not in html:
    html = html.replace("</style>", extra_css + "\n</style>")

# 3. Add Web Audio sound functions and icons
audio_and_icons = """
  /* ---------- Sonidos sintetizados (Web Audio API: 100% autónomo) ---------- */
  function getAudioCtx() {
    if (!window._audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) window._audioCtx = new AudioContext();
    }
    if (window._audioCtx && window._audioCtx.state === "suspended") {
      window._audioCtx.resume().catch(() => {});
    }
    return window._audioCtx;
  }

  function playDingDong() {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Ding (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Dong (C5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(523.25, now + 0.24);
      gain2.gain.setValueAtTime(0, now + 0.24);
      gain2.gain.linearRampToValueAtTime(0.32, now + 0.28);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.24);
      osc2.stop(now + 1.0);
    } catch (e) {}
  }

  function playTick() {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {}
  }

  function playFanfare() {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx === 3 ? 0.65 : 0.25));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      });
    } catch (e) {}
  }

  /* Nuevos iconos */
  const HeartIcon = (size) => icon(["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"], size);
  const DicesIcon = (size) => svg("svg", { width: size || 16, height: size || 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" },
    svg("rect", { width: "12", height: "12", x: "2", y: "10", rx: "2", ry: "2" }),
    svg("path", { d: "m17.92 14 3.5-3.5a2.24 2.24 0 0 0 0-3.18l-5.74-5.74a2.24 2.24 0 0 0-3.18 0L9 5.08" }),
    svg("path", { d: "M6 14h.01" }),
    svg("path", { d: "M10 18h.01" }),
    svg("path", { d: "M15 6h.01" })
  );
  const EditIcon = (size) => icon(["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"], size);
  const SparklesIcon = (size) => icon(["m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"], size);
"""

if "playDingDong" not in html:
    html = html.replace(
        "/* ---------- constantes ---------- */",
        audio_and_icons + "\n  /* ---------- constantes ---------- */"
    )

# 4. Update TABS to include 'citas'
old_tabs = """  const TABS = [
    { id: "gastos", label: "Gastos", icon: WalletIcon },
    { id: "fondo", label: "Fondo común", icon: CoinsIcon },
    { id: "vencimientos", label: "Vencimientos", icon: ClockIcon },
    { id: "tareas", label: "Tareas", icon: CheckSquareIcon },
    { id: "calendario", label: "Calendario", icon: CalendarIcon },
  ];"""

new_tabs = """  const TABS = [
    { id: "gastos", label: "Gastos", icon: WalletIcon },
    { id: "fondo", label: "Fondo común", icon: CoinsIcon },
    { id: "vencimientos", label: "Vencimientos", icon: ClockIcon },
    { id: "tareas", label: "Tareas", icon: CheckSquareIcon },
    { id: "citas", label: "Citas y Planes", icon: HeartIcon },
    { id: "calendario", label: "Calendario", icon: CalendarIcon },
  ];"""

html = html.replace(old_tabs, new_tabs)

# 5. Add default plans array
default_plans_code = """
  const DEFAULT_CITAS_PLANS = [
    { id: "plan-1", title: "Noche de películas y pochoclos caseros", tag: "En casa", desc: "Elegir una peli o maratón que ninguno haya visto, apagar luces y preparar algo rico.", createdBy: "Nido" },
    { id: "plan-2", title: "Cena sorpresa: cada uno prepara un plato", tag: "Romántico", desc: "Uno cocina la entrada/plato principal y el otro el postre sin revelarlo antes.", createdBy: "Nido" },
    { id: "plan-3", title: "Paseo y heladería artesanal en un barrio nuevo", tag: "Salida", desc: "Caminar sin rumbo fijo y probar gustos exóticos que nunca pidieron.", createdBy: "Nido" },
    { id: "plan-4", title: "Picnic al atardecer en el parque", tag: "Aire libre", desc: "Llevar una manta, mate, frutas o vino y desconectar de los celulares.", createdBy: "Nido" },
    { id: "plan-5", title: "Visitar una cafetería o bar de especialidad", tag: "Salida", desc: "Conocer un rinconcito nuevo con buena música y ricos cafés o tragos.", createdBy: "Nido" },
    { id: "plan-6", title: "Tarde de juegos de mesa o cartas", tag: "En casa", desc: "Competencia divertida con picada, snacks y música de fondo.", createdBy: "Nido" },
    { id: "plan-7", title: "Noche de spa casero y masajes", tag: "Relax", desc: "Música tranquila, aceites esenciales, mascarillas y relajación total.", createdBy: "Nido" },
    { id: "plan-8", title: "Ir al cine a ver una función al azar", tag: "Salida", desc: "Llegar a la boletería y sacar para la película que empiece más pronto.", createdBy: "Nido" },
    { id: "plan-9", title: "Desayuno en la cama el domingo", tag: "En casa", desc: "Tostadas calientes, café recién hecho y fiaca juntos sin despertadores.", createdBy: "Nido" },
    { id: "plan-10", title: "Cocinar juntos pasta casera o pizza", tag: "Cocina", desc: "Amasar desde cero con buena música y una copita de vino.", createdBy: "Nido" }
  ];
"""

if "DEFAULT_CITAS_PLANS" not in html:
    html = html.replace("const CAT_GASTOS = [", default_plans_code + "\n  const CAT_GASTOS = [")

# 6. Update headerCopy(tab)
old_header_copy = """      case "calendario": return "Fechas importantes para los dos.";
      default: return "";"""

new_header_copy = """      case "citas": return "Planes de a dos, ideas para salir o quedarse y una ruleta para cuando no se deciden.";
      case "calendario": return "Fechas importantes para los dos.";
      default: return "";"""

html = html.replace(old_header_copy, new_header_copy)

with open("original_nidopareja/index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Step 1 done. Length:", len(html))
