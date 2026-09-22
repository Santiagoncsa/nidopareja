import React, { useState } from "react";
import { SubCategory, PlanIdea, PresetIdea } from "../types";
import { RuletaIndeciso } from "./RuletaIndeciso";
import { CatalogoSinIdeas } from "./CatalogoSinIdeas";
import { HeartHandshake, HelpCircle, Compass, Sparkles } from "lucide-react";

interface CitasYPlanesProps {
  presetIdeas: PresetIdea[];
  customIdeas: PlanIdea[];
  onAddCustomIdea: (idea: { title: string; description?: string; tag?: string }) => Promise<void>;
  onUpdateCustomIdea: (id: string, updated: { title: string; description?: string; tag?: string }) => Promise<void>;
  onDeleteCustomIdea: (id: string) => Promise<void>;
  onNotifyWinner: (winner: string) => Promise<void>;
  casaName: string;
  myUserName: string;
}

export const CitasYPlanes: React.FC<CitasYPlanesProps> = ({
  presetIdeas,
  customIdeas,
  onAddCustomIdea,
  onUpdateCustomIdea,
  onDeleteCustomIdea,
  onNotifyWinner,
  casaName,
  myUserName,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubCategory>("indeciso");
  const [transferredPlanForRoulette, setTransferredPlanForRoulette] = useState<string | null>(null);

  const handleTransferToRoulette = (planTitle: string) => {
    setTransferredPlanForRoulette(planTitle);
    setActiveSubTab("indeciso");
  };

  return (
    <div id="contenedor-citas-y-planes" className="w-full">
      {/* Category Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-bold text-rose-600 mb-2">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Categoría Especial del Hogar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight font-display">
            Citas y Planes
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Soluciones interactivas para decidir qué hacer juntos, ya sea cuando tienen varias ideas en mente o cuando necesitan inspiración desde cero.
          </p>
        </div>

        {/* Tab Switcher: "Indeciso" vs "Sin ideas" */}
        <div className="flex items-center p-1.5 bg-slate-200/70 rounded-2xl shrink-0 self-start sm:self-auto border border-slate-200/60 shadow-inner">
          <button
            id="tab-indeciso"
            onClick={() => setActiveSubTab("indeciso")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeSubTab === "indeciso"
                ? "bg-white text-rose-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Indeciso</span>
            <span className="text-[11px] font-medium px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-500">
              Ruleta
            </span>
          </button>

          <button
            id="tab-sin-ideas"
            onClick={() => setActiveSubTab("sin_ideas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeSubTab === "sin_ideas"
                ? "bg-white text-indigo-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Sin ideas</span>
            <span className="text-[11px] font-medium px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-500">
              Catálogo ({presetIdeas.length + customIdeas.length})
            </span>
          </button>
        </div>
      </div>

      {/* Notice when plan was transferred */}
      {transferredPlanForRoulette && activeSubTab === "indeciso" && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
          <span>
            ✨ Agregado desde el catálogo: <strong>"{transferredPlanForRoulette}"</strong>
          </span>
          <button
            onClick={() => setTransferredPlanForRoulette(null)}
            className="text-amber-600 font-bold hover:underline"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Main Content Area based on Active Sub-Tab */}
      <div className="transition-all duration-300">
        {activeSubTab === "indeciso" ? (
          <RuletaIndeciso
            key={transferredPlanForRoulette || "default-roulette"}
            casaName={casaName}
            myUserName={myUserName}
            onNotifyWinner={onNotifyWinner}
            initialOptions={
              transferredPlanForRoulette
                ? [
                    transferredPlanForRoulette,
                    "Ir a comer sushi 🍣",
                    "Cocinar en casa y pedir helado 🍦",
                    "Paseo y café ☕",
                  ]
                : undefined
            }
          />
        ) : (
          <CatalogoSinIdeas
            presetIdeas={presetIdeas}
            customIdeas={customIdeas}
            onAddCustomIdea={onAddCustomIdea}
            onUpdateCustomIdea={onUpdateCustomIdea}
            onDeleteCustomIdea={onDeleteCustomIdea}
            onTransferToRoulette={handleTransferToRoulette}
            casaName={casaName}
          />
        )}
      </div>
    </div>
  );
};
