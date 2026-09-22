import React, { useState } from "react";
import { Plus, Edit2, Trash2, Heart, Sparkles, Send, Search, Check, X, Tag } from "lucide-react";
import { PlanIdea, PresetIdea } from "../types";

interface CatalogoSinIdeasProps {
  presetIdeas: PresetIdea[];
  customIdeas: PlanIdea[];
  onAddCustomIdea: (idea: { title: string; description?: string; tag?: string }) => Promise<void>;
  onUpdateCustomIdea: (id: string, updated: { title: string; description?: string; tag?: string }) => Promise<void>;
  onDeleteCustomIdea: (id: string) => Promise<void>;
  onTransferToRoulette: (planTitle: string) => void;
  casaName: string;
}

export const CatalogoSinIdeas: React.FC<CatalogoSinIdeasProps> = ({
  presetIdeas,
  customIdeas,
  onAddCustomIdea,
  onUpdateCustomIdea,
  onDeleteCustomIdea,
  onTransferToRoulette,
  casaName,
}) => {
  const [filterTab, setFilterTab] = useState<"todos" | "sugeridos" | "personalizados">("todos");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTag, setNewTag] = useState("Romántico");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingIdea, setEditingIdea] = useState<PlanIdea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTag, setEditTag] = useState("");

  const TAGS_LIST = ["Romántico", "En Casa", "Gastronomía", "Aire Libre", "Aventura", "Cultural", "Relax"];

  const handleOpenAdd = () => {
    setNewTitle("");
    setNewDescription("");
    setNewTag("Romántico");
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await onAddCustomIdea({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        tag: newTag,
      });
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (idea: PlanIdea) => {
    setEditingIdea(idea);
    setEditTitle(idea.title);
    setEditDescription(idea.description || "");
    setEditTag(idea.tag || "Romántico");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea || !editTitle.trim()) return;

    try {
      setIsSubmitting(true);
      await onUpdateCustomIdea(editingIdea.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        tag: editTag,
      });
      setEditingIdea(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine and filter
  const allDisplayIdeas: Array<{
    id: string;
    title: string;
    description?: string;
    tag?: string;
    isCustom: boolean;
    createdBy?: string;
    originalItem?: PlanIdea;
  }> = [
    // Custom ideas first
    ...customIdeas.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      tag: c.tag || "Personalizado",
      isCustom: true,
      createdBy: c.createdBy,
      originalItem: c,
    })),
    // Suggested presets
    ...presetIdeas.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      tag: p.tag,
      isCustom: false,
    })),
  ];

  const filteredIdeas = allDisplayIdeas.filter((item) => {
    if (filterTab === "sugeridos" && item.isCustom) return false;
    if (filterTab === "personalizados" && !item.isCustom) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchTag = item.tag?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchTag;
    }
    return true;
  });

  return (
    <div id="seccion-sin-ideas" className="w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
              💡
            </span>
            <h3 className="font-semibold text-slate-800 text-base">
              Catálogo de Planes y Citas Prediseñadas
            </h3>
          </div>
          <p className="text-sm text-slate-500">
            Inspírense con nuestras 10 ideas seleccionadas o creen, editen y gestionen sus propios planes compartidos en "{casaName}".
          </p>
        </div>

        {/* Action: Add custom idea */}
        <button
          id="btn-abrir-crear-idea"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Plan Personalizado</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0">
          <button
            id="filtro-todos"
            onClick={() => setFilterTab("todos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "todos"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Todos ({allDisplayIdeas.length})
          </button>
          <button
            id="filtro-sugeridos"
            onClick={() => setFilterTab("sugeridos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "sugeridos"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sugeridos ({presetIdeas.length})
          </button>
          <button
            id="filtro-personalizados"
            onClick={() => setFilterTab("personalizados")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "personalizados"
                ? "bg-white text-rose-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Personalizados ({customIdeas.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-buscar-planes"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palabra clave o categoría..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIdeas.map((plan) => (
          <div
            key={plan.id}
            id={`tarjeta-plan-${plan.id}`}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Badge & Creator tag */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    plan.isCustom
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {plan.tag || (plan.isCustom ? "Personalizado" : "Sugerido")}
                </span>

                {plan.isCustom && plan.createdBy && (
                  <span className="text-[11px] text-slate-400">
                    Por {plan.createdBy}
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="font-bold text-slate-800 text-base mb-1.5 group-hover:text-indigo-600 transition-colors">
                {plan.title}
              </h4>

              {/* Description */}
              {plan.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {plan.description}
                </p>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {/* Quick transfer to roulette */}
              <button
                id={`btn-ruleta-${plan.id}`}
                onClick={() => onTransferToRoulette(plan.title)}
                title="Cargar esta opción en la Ruleta de Indeciso"
                className="text-xs font-semibold text-slate-600 hover:text-rose-600 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Llevar a Ruleta</span>
              </button>

              {/* CRUD Actions if custom */}
              {plan.isCustom && plan.originalItem && (
                <div className="flex items-center gap-1">
                  <button
                    id={`btn-editar-plan-${plan.id}`}
                    onClick={() => handleStartEdit(plan.originalItem!)}
                    title="Editar idea"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`btn-eliminar-plan-${plan.id}`}
                    onClick={() => onDeleteCustomIdea(plan.id)}
                    title="Eliminar idea"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredIdeas.length === 0 && (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-2">
            No se encontraron planes con los filtros actuales.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterTab("todos");
            }}
            className="text-xs text-indigo-600 font-semibold underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Modal: Add Custom Plan */}
      {isAddModalOpen && (
        <div
          id="modal-agregar-plan"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 font-display">
                Nuevo Plan Personalizado
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título del Plan *
                </label>
                <input
                  id="input-crear-titulo"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Picnic en el jardín botánico, Tarde de karts..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detalles o notas (Opcional)
                </label>
                <textarea
                  id="input-crear-descripcion"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Qué llevar, presupuesto, hora ideal, enlaces o ideas adicionales..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoría o Ambiente
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_LIST.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setNewTag(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        newTag === tag
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-guardar-nuevo-plan"
                  type="submit"
                  disabled={!newTitle.trim() || isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Guardar y Sincronizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Custom Plan */}
      {editingIdea && (
        <div
          id="modal-editar-plan"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 font-display">
                Editar Plan Personalizado
              </h3>
              <button
                onClick={() => setEditingIdea(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título del Plan *
                </label>
                <input
                  id="input-editar-titulo"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detalles o notas (Opcional)
                </label>
                <textarea
                  id="input-editar-descripcion"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoría o Ambiente
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS_LIST.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setEditTag(tag)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        editTag === tag
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-guardar-edicion-plan"
                  type="submit"
                  disabled={!editTitle.trim() || isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
