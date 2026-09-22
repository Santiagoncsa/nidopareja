import re

with open("original_nidopareja/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Update state object
old_state = """    members: [], expenses: [], dues: [], tasks: [], events: [], fund: [],
    membersLoaded: false,
    activeTab: "gastos",
    identityAdding: false,
    identityColor: null,
    calCursor: (() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; })(),
    calSelected: todayISO(),
    houseGateBusy: false,
    houseGateError: null,
    mobileMenuOpen: false,
    viewingReceipt: null,"""

new_state = """    members: [], expenses: [], dues: [], tasks: [], events: [], fund: [],
    datesPlans: [], alerts: [],
    membersLoaded: false,
    activeTab: "gastos",
    citasSubTab: "indeciso", // 'indeciso' | 'sin_ideas'
    rouletteOptions: ["Cena en casa", "Salir a comer", "Paseo y helado", "Noche de pelis"],
    rouletteWinner: null,
    isSpinning: false,
    editingPlan: null,
    planFilterTag: "Todos",
    activeAlertToast: null,
    bellModalOpen: false,
    identityAdding: false,
    identityColor: null,
    calCursor: (() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; })(),
    calSelected: todayISO(),
    houseGateBusy: false,
    houseGateError: null,
    mobileMenuOpen: false,
    viewingReceipt: null,"""

assert old_state in html, "Could not find old_state in html"
html = html.replace(old_state, new_state)

# 2. Add alert helpers and subscribeHouse extensions
old_sub_house = """    const u1 = subscribeList(house, "members", (list) => { state.members = list; state.membersLoaded = true; render(); });
    const u2 = subscribeList(house, "expenses", (list) => { state.expenses = list; render(); });
    const u3 = subscribeList(house, "dues", (list) => { state.dues = list; render(); });
    const u4 = subscribeList(house, "tasks", (list) => { state.tasks = list; render(); checkTaskNotifications(); });
    const u5 = subscribeList(house, "events", (list) => { state.events = list; render(); });
    const u6 = subscribeList(house, "fund", (list) => { state.fund = list; render(); });
    unsubHouse = () => { u1(); u2(); u3(); u4(); u5(); u6(); };"""

new_sub_house = """    const u1 = subscribeList(house, "members", (list) => { state.members = list; state.membersLoaded = true; render(); });
    const u2 = subscribeList(house, "expenses", (list) => { state.expenses = list; render(); });
    const u3 = subscribeList(house, "dues", (list) => { state.dues = list; render(); });
    const u4 = subscribeList(house, "tasks", (list) => { state.tasks = list; render(); checkTaskNotifications(); });
    const u5 = subscribeList(house, "events", (list) => { state.events = list; render(); });
    const u6 = subscribeList(house, "fund", (list) => { state.fund = list; render(); });
    const u7 = subscribeList(house, "dates_plans", (list) => {
      state.datesPlans = list && list.length > 0 ? list : DEFAULT_CITAS_PLANS;
      render();
    });
    const u8 = subscribeList(house, "alerts", (list) => {
      handleIncomingAlerts(list);
    });
    unsubHouse = () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); };"""

assert old_sub_house in html, "Could not find old_sub_house in html"
html = html.replace(old_sub_house, new_sub_house)

# 3. Add alert sending and receiving logic
alert_helpers = """
  /* ---------- Sistema de Notificaciones / Timbre de la Casa ---------- */
  let lastSeenAlertTimestamp = Date.now();
  let toastTimeout = null;

  function handleIncomingAlerts(list) {
    state.alerts = list || [];
    if (!state.alerts.length) return;
    
    // Buscar la alerta más reciente
    const sorted = [...state.alerts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const newest = sorted[0];
    
    if (newest && newest.timestamp > lastSeenAlertTimestamp) {
      lastSeenAlertTimestamp = newest.timestamp;
      // Solo notificar si no fue enviada por mí mismo
      if (state.me && newest.fromUser !== state.me.name) {
        playDingDong();
        state.activeAlertToast = newest;
        
        // Notificación del sistema si está habilitada
        if (notifSupported && Notification.permission === "granted") {
          try {
            new Notification(`Nido · ${newest.fromUser}`, {
              body: newest.message,
              icon: "./icon-192.png",
              tag: `alert-${newest.id}`
            });
          } catch (e) {}
        }

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          state.activeAlertToast = null;
          render();
        }, 8000);
      }
    }
    render();
  }

  function sendHouseAlert(type, message) {
    if (!state.house || !state.me) return;
    const alertObj = {
      id: uid(),
      fromUser: state.me.name,
      fromColor: state.me.color,
      type: type || "bell",
      message: message,
      timestamp: Date.now()
    };
    lastSeenAlertTimestamp = alertObj.timestamp;
    const current = state.alerts || [];
    // Mantener las últimas 25 alertas
    const updated = [...current.slice(-24), alertObj];
    saveList(state.house, "alerts", updated);
  }
"""

if "/* ---------- Sistema de Notificaciones" not in html:
    html = html.replace(
        "/* ---------- Firebase helpers ---------- */",
        alert_helpers + "\n  /* ---------- Firebase helpers ---------- */"
    )

# 4. In buildHomeApp(): add tabContent for 'citas', bell button, and toast / modal
old_tab_branch = """    let tabContent;
    if (state.activeTab === "gastos") tabContent = buildGastosTab();
    else if (state.activeTab === "fondo") tabContent = buildFondoTab();
    else if (state.activeTab === "vencimientos") tabContent = buildVencimientosTab();
    else if (state.activeTab === "tareas") tabContent = buildTareasTab();
    else tabContent = buildCalendarioTab();"""

new_tab_branch = """    let tabContent;
    if (state.activeTab === "gastos") tabContent = buildGastosTab();
    else if (state.activeTab === "fondo") tabContent = buildFondoTab();
    else if (state.activeTab === "vencimientos") tabContent = buildVencimientosTab();
    else if (state.activeTab === "tareas") tabContent = buildTareasTab();
    else if (state.activeTab === "citas") tabContent = buildCitasTab();
    else tabContent = buildCalendarioTab();"""

assert old_tab_branch in html, "Could not find old_tab_branch in html"
html = html.replace(old_tab_branch, new_tab_branch)

# Add Bell button to topbar and sidebar, and render modal/toast
old_mobile_topbar = """    const mobileTopbar = h("div", { class: "mobile-topbar" },
      h("button", { class: "brand-trigger", onClick: () => toggleMobileMenu(true), "aria-label": "Abrir menú" },
        MenuIcon(18), h("h1", {}, "Nido")
      ),
      h("span", { class: "mobile-topbar-tab" }, TABS.find((t) => t.id === state.activeTab).label)
    );"""

new_mobile_topbar = """    const bellBtnMobile = h("button", {
      class: "bell-btn",
      style: { padding: "0.25rem 0.6rem" },
      onClick: () => { state.bellModalOpen = true; render(); },
      title: "Tocar el timbre o mandar un aviso a la casa"
    }, BellIcon(14), h("span", { style: { fontSize: "0.75rem", fontWeight: "600" } }, "Avisar"));

    const mobileTopbar = h("div", { class: "mobile-topbar" },
      h("button", { class: "brand-trigger", onClick: () => toggleMobileMenu(true), "aria-label": "Abrir menú" },
        MenuIcon(18), h("h1", {}, "Nido")
      ),
      h("div", { style: { display: "flex", alignItems: "center", gap: "0.6rem" } },
        h("span", { class: "mobile-topbar-tab" }, TABS.find((t) => t.id === state.activeTab).label),
        bellBtnMobile
      )
    );"""

assert old_mobile_topbar in html, "Could not find old_mobile_topbar in html"
html = html.replace(old_mobile_topbar, new_mobile_topbar)

# Also add bell button to main desktop header
old_main_header = """      h("div", { class: "main-header" },
        h("div", {}, h("h2", {}, TABS.find((t) => t.id === state.activeTab).label), h("p", {}, headerCopy(state.activeTab))),
        h("div", { class: "sync-badge" }, h("span", { class: "sync-dot" }), " Sincronizado")
      ),"""

new_main_header = """      h("div", { class: "main-header" },
        h("div", {}, h("h2", {}, TABS.find((t) => t.id === state.activeTab).label), h("p", {}, headerCopy(state.activeTab))),
        h("div", { style: { display: "flex", alignItems: "center", gap: "0.6rem" } },
          h("button", {
            class: "bell-btn",
            onClick: () => { state.bellModalOpen = true; render(); },
            title: "Tocar el timbre o mandar un aviso a la casa"
          }, BellIcon(15), h("span", {}, "Avisar a la casa")),
          h("div", { class: "sync-badge" }, h("span", { class: "sync-dot" }), " Sincronizado")
        )
      ),"""

assert old_main_header in html, "Could not find old_main_header in html"
html = html.replace(old_main_header, new_main_header)

# Modals and Toasts in return of buildHomeApp()
old_home_return = """    return h("div", { class: "nido" }, backdrop, mobileTopbar, sidebar, main, receiptModal);"""

new_home_return = """    // Toast flotante cuando entra una notificación de la otra persona
    const alertToast = !state.activeAlertToast ? null : h("div", { class: "alert-toast" },
      h("div", { style: { width: "10px", height: "10px", borderRadius: "50%", background: state.activeAlertToast.fromColor || "var(--warn)", flex: "none" } }),
      h("div", { style: { flex: "1", minWidth: "0" } },
        h("div", { style: { fontSize: "0.82rem", fontWeight: "700", color: "var(--ink)" } }, `Aviso de ${state.activeAlertToast.fromUser}`),
        h("div", { style: { fontSize: "0.85rem", color: "var(--ink-muted)", marginTop: "0.1rem" } }, state.activeAlertToast.message)
      ),
      h("button", { class: "icon-btn", onClick: () => { state.activeAlertToast = null; render(); } }, XIcon(14))
    );

    // Modal para tocar el timbre o mandar aviso rápido
    const bellModal = !state.bellModalOpen ? null : buildBellModal();

    return h("div", { class: "nido" }, backdrop, mobileTopbar, sidebar, main, receiptModal, alertToast, bellModal);"""

assert old_home_return in html, "Could not find old_home_return in html"
html = html.replace(old_home_return, new_home_return)

with open("original_nidopareja/index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Step 2 done. Length:", len(html))
