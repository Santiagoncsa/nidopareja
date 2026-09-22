export type SubCategory = "indeciso" | "sin_ideas";

export type MainCategory = "citas_planes" | "hogar_tareas" | "lista_compras";

export interface PlanIdea {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  category?: "aire_libre" | "gastronomia" | "en_casa" | "romantico" | "aventura" | "cultural";
  isCustom?: boolean;
  createdBy?: string;
  createdAt: number;
}

export interface RouletteOption {
  id: string;
  text: string;
  color: string;
}

export interface CasaNotification {
  id: string;
  casaId: string;
  fromUser: string;
  message: string;
  type: "roulette_winner" | "alert" | "plan_added" | "plan_updated" | "custom";
  data?: any;
  timestamp: number;
  read?: boolean;
}

export interface CasaConfig {
  casaId: string;
  casaName: string;
  myUserName: string;
  soundEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export interface PresetIdea {
  id: string;
  title: string;
  description: string;
  tag: string;
  category: "aire_libre" | "gastronomia" | "en_casa" | "romantico" | "aventura" | "cultural";
}
