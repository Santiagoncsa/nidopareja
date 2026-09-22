import { CasaConfig, CasaNotification, PlanIdea } from "../types";

const CONFIG_KEY = "nuestra_casa_config";
const IDEAS_KEY = "nuestra_casa_custom_ideas";
const NOTIFS_KEY = "nuestra_casa_notifications";

export const DEFAULT_CONFIG: CasaConfig = {
  casaId: "CASA-AMOR",
  casaName: "Hogar Compartido",
  myUserName: "Santiago",
  soundEnabled: true,
  pushNotificationsEnabled: true,
};

export function getLocalConfig(): CasaConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
}

export function saveLocalConfig(config: CasaConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getLocalIdeas(): PlanIdea[] {
  try {
    const raw = localStorage.getItem(IDEAS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalIdeas(ideas: PlanIdea[]) {
  try {
    localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  } catch {
    // ignore
  }
}

export function getLocalNotifications(): CasaNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalNotifications(notifs: CasaNotification[]) {
  try {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
  } catch {
    // ignore
  }
}

// Request Web Notifications API permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  try {
    if (Notification.permission === "granted") return true;
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch {
    return false;
  }
  return false;
}

// Display native system push notification if allowed
export function showSystemNotification(title: string, body: string, icon = "/icon-192.png") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
      });
    } catch {
      // Some mobile browsers need ServiceWorker registration.showNotification
      if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, { body, icon });
        });
      }
    }
  }
}
