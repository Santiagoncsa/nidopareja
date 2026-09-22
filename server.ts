import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory real-time state for houses (Casa)
interface CasaNotification {
  id: string;
  casaId: string;
  fromUser: string;
  message: string;
  type: "roulette_winner" | "alert" | "plan_added" | "plan_updated" | "custom";
  data?: any;
  timestamp: number;
}

interface PlanIdea {
  id: string;
  title: string;
  description?: string;
  tag?: string;
  isCustom?: boolean;
  createdBy?: string;
  createdAt: number;
}

interface CasaData {
  casaId: string;
  casaName: string;
  customIdeas: PlanIdea[];
  notifications: CasaNotification[];
  lastSpin?: {
    winner: string;
    fromUser: string;
    timestamp: number;
  };
}

const casasStore: Record<string, CasaData> = {};
const sseClients: Record<string, express.Response[]> = {};

function getOrCreateCasa(casaId: string): CasaData {
  const normalizedId = (casaId || "CASA-AMOR").toUpperCase().trim();
  if (!casasStore[normalizedId]) {
    casasStore[normalizedId] = {
      casaId: normalizedId,
      casaName: `Casa ${normalizedId}`,
      customIdeas: [],
      notifications: [
        {
          id: "welcome-1",
          casaId: normalizedId,
          fromUser: "Sistema",
          message: "¡Bienvenidos a su Casa compartida! Las notificaciones y planes se sincronizan aquí.",
          type: "custom",
          timestamp: Date.now() - 60000,
        },
      ],
    };
  }
  return casasStore[normalizedId];
}

function broadcastToCasa(casaId: string, event: string, payload: any) {
  const normalizedId = (casaId || "CASA-AMOR").toUpperCase().trim();
  const clients = sseClients[normalizedId] || [];
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(message);
    } catch {
      // client disconnected
    }
  });
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// SSE endpoint for real-time house events (notifications, ideas updates, spins)
app.get("/api/casa/:casaId/events", (req, res) => {
  const casaId = (req.params.casaId || "CASA-AMOR").toUpperCase().trim();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  if (!sseClients[casaId]) {
    sseClients[casaId] = [];
  }
  sseClients[casaId].push(res);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected", casaId })}\n\n`);

  req.on("close", () => {
    sseClients[casaId] = sseClients[casaId].filter((c) => c !== res);
  });
});

// Get casa full state
app.get("/api/casa/:casaId/state", (req, res) => {
  const casa = getOrCreateCasa(req.params.casaId);
  res.json({
    casaId: casa.casaId,
    casaName: casa.casaName,
    customIdeas: casa.customIdeas,
    notifications: casa.notifications,
    lastSpin: casa.lastSpin,
  });
});

// Send notification to other devices in the same casa
app.post("/api/casa/:casaId/notifications", (req, res) => {
  const casa = getOrCreateCasa(req.params.casaId);
  const { fromUser, message, type, data } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: "El mensaje es requerido" });
  }

  const notification: CasaNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    casaId: casa.casaId,
    fromUser: fromUser || "Compañero/a",
    message: message.trim(),
    type: type || "custom",
    data: data || null,
    timestamp: Date.now(),
  };

  casa.notifications.unshift(notification);
  // Keep only the last 50 notifications
  if (casa.notifications.length > 50) {
    casa.notifications = casa.notifications.slice(0, 50);
  }

  broadcastToCasa(casa.casaId, "notification", notification);
  res.status(201).json(notification);
});

// CRUD: Add idea
app.post("/api/casa/:casaId/ideas", (req, res) => {
  const casa = getOrCreateCasa(req.params.casaId);
  const { title, description, tag, createdBy } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "El título de la idea es requerido" });
  }

  const newIdea: PlanIdea = {
    id: `idea-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    description: description ? description.trim() : "",
    tag: tag || "Romántico",
    isCustom: true,
    createdBy: createdBy || "Pareja",
    createdAt: Date.now(),
  };

  casa.customIdeas.unshift(newIdea);

  // Notify casa members
  const notif: CasaNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    casaId: casa.casaId,
    fromUser: newIdea.createdBy || "Pareja",
    message: `Agregó un nuevo plan: "${newIdea.title}"`,
    type: "plan_added",
    data: { idea: newIdea },
    timestamp: Date.now(),
  };
  casa.notifications.unshift(notif);

  broadcastToCasa(casa.casaId, "idea_added", { idea: newIdea, notification: notif });
  res.status(201).json({ idea: newIdea, notification: notif });
});

// CRUD: Update idea
app.put("/api/casa/:casaId/ideas/:id", (req, res) => {
  const casa = getOrCreateCasa(req.params.casaId);
  const { id } = req.params;
  const { title, description, tag, updatedBy } = req.body;

  const ideaIndex = casa.customIdeas.findIndex((item) => item.id === id);
  if (ideaIndex === -1) {
    return res.status(404).json({ error: "Idea no encontrada" });
  }

  casa.customIdeas[ideaIndex] = {
    ...casa.customIdeas[ideaIndex],
    title: title !== undefined ? title.trim() : casa.customIdeas[ideaIndex].title,
    description: description !== undefined ? description.trim() : casa.customIdeas[ideaIndex].description,
    tag: tag || casa.customIdeas[ideaIndex].tag,
  };

  const updatedIdea = casa.customIdeas[ideaIndex];

  const notif: CasaNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    casaId: casa.casaId,
    fromUser: updatedBy || "Pareja",
    message: `Actualizó el plan: "${updatedIdea.title}"`,
    type: "plan_updated",
    data: { idea: updatedIdea },
    timestamp: Date.now(),
  };
  casa.notifications.unshift(notif);

  broadcastToCasa(casa.casaId, "idea_updated", { idea: updatedIdea, notification: notif });
  res.json({ idea: updatedIdea, notification: notif });
});

// CRUD: Delete idea
app.delete("/api/casa/:casaId/ideas/:id", (req, res) => {
  const casa = getOrCreateCasa(req.params.casaId);
  const { id } = req.params;

  const deletedIdea = casa.customIdeas.find((item) => item.id === id);
  casa.customIdeas = casa.customIdeas.filter((item) => item.id !== id);

  broadcastToCasa(casa.casaId, "idea_deleted", { id });
  res.json({ success: true, id, deletedIdea });
});

// Roulette spin broadcast
app.post("/api/casa/:casaId/roulette-winner", (req, res) => {
  const casa = getOrCreateCasa(req.params.casaId);
  const { winner, fromUser } = req.body;

  casa.lastSpin = {
    winner: winner || "Opción elegida",
    fromUser: fromUser || "Alguien en la casa",
    timestamp: Date.now(),
  };

  const notification: CasaNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    casaId: casa.casaId,
    fromUser: fromUser || "Pareja",
    message: `¡Giró la Ruleta de Citas y salió ganador: "${winner}"! 🎡`,
    type: "roulette_winner",
    data: { winner },
    timestamp: Date.now(),
  };

  casa.notifications.unshift(notification);
  broadcastToCasa(casa.casaId, "roulette_winner", {
    winner,
    fromUser,
    notification,
  });

  res.json({ success: true, notification });
});

// Sync custom ideas bulk (e.g. from local storage or cloud)
app.post("/api/casa/:casaId/sync", (req, res) => {
  const casa = getOrCreateCasa(req.params.casaId);
  const { ideas } = req.body;

  if (Array.isArray(ideas)) {
    // Merge without duplicates by ID
    const existingIds = new Set(casa.customIdeas.map((i) => i.id));
    ideas.forEach((idea: PlanIdea) => {
      if (idea && idea.id && !existingIds.has(idea.id)) {
        casa.customIdeas.push(idea);
        existingIds.add(idea.id);
      }
    });
  }

  res.json({ customIdeas: casa.customIdeas });
});

// Route to download updated files as zip
app.get("/download-zip", (_req, res) => {
  res.download(path.join(process.cwd(), "public", "nidopareja-actualizado.zip"), "nidopareja-actualizado.zip");
});

// Serve original_nidopareja as primary app in preview
const originalNidoPath = path.join(process.cwd(), "original_nidopareja");
app.use(express.static(originalNidoPath));
app.get("/", (_req, res) => {
  res.sendFile(path.join(originalNidoPath, "index.html"));
});

// Direct standalone route for pure HTML/JS version
app.get("/standalone", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "standalone-citas-y-planes.html"));
});

// Vite Integration
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(originalNidoPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
