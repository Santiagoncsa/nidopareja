import re

with open("original_nidopareja/index.html", "r", encoding="utf-8") as f:
    html = f.read()

citas_tab_code = """
  /* ---------- Modal de Timbre / Avisos Rápidos a la Casa ---------- */
  function buildBellModal() {
    const customMsgInput = h("input", { id: "input-custom-bell", placeholder: "Escribí un mensaje personalizado…", style: { flex: "1" } });
    const sendCustomBtn = h("button", { class: "primary-btn", style: { padding: "0.55rem 0.9rem" } }, "Enviar");
    
    const sendCustom = () => {
      const val = customMsgInput.value.trim();
      if (!val) return;
      sendHouseAlert("custom", val);
      state.bellModalOpen = false;
      render();
    };
    sendCustomBtn.addEventListener("click", sendCustom);
    customMsgInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendCustom(); });

    const quickOptions = [
      { text: "🔔 ¡Ding-dong! Te llamo desde la otra habitación", type: "bell" },
      { text: "🍽️ ¡La comida está lista para comer!", type: "food" },
      { text: "❤️ ¿Qué hacemos hoy? Miremos Citas y Planes", type: "date" },
      { text: "🛒 ¿Falta comprar algo más para casa?", type: "shop" },
      { text: "🎲 ¡Te toca a vos girar la ruleta!", type: "roulette" }
    ];

    const quickList = h("div", { class: "bell-quick-list" },
      ...quickOptions.map((opt) => h("button", {
        class: "bell-quick-item",
        onClick: () => {
          sendHouseAlert(opt.type, opt.text);
          state.bellModalOpen = false;
          render();
        }
      }, opt.text))
    );

    return h("div", { class: "bell-modal-backdrop", onClick: () => { state.bellModalOpen = false; render(); } },
      h("div", { class: "bell-modal", onClick: (e) => e.stopPropagation() },
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" } },
          h("h3", { style: { fontFamily: "Fraunces, serif", fontSize: "1.2rem" } }, "Avisar a la casa"),
          h("button", { class: "drawer-close", style: { display: "block" }, onClick: () => { state.bellModalOpen = false; render(); } }, XIcon(18))
        ),
        h("p", { style: { fontSize: "0.82rem", color: "var(--ink-muted)", margin: "0 0 0.8rem" } },
          "Mandale una alerta sonora instantánea a tu pareja en el otro celular:"
        ),
        quickList,
        h("div", { style: { borderTop: "1px solid var(--line)", paddingTop: "0.85rem", marginTop: "0.5rem" } },
          h("label", { style: { fontSize: "0.75rem", color: "var(--ink-muted)", display: "block", marginBottom: "0.35rem" } }, "O mandar un mensaje personalizado:"),
          h("div", { style: { display: "flex", gap: "0.4rem" } }, customMsgInput, sendCustomBtn)
        )
      )
    );
  }

  /* ---------- tab: citas y planes ---------- */
  let rouletteAngle = 0;
  let animFrameId = null;

  function buildCitasTab() {
    // Sub-pestañas: 'indeciso' (Ruleta) y 'sin_ideas' (Catálogo)
    const subtabs = h("div", { class: "subtabs" },
      h("button", {
        class: "subtab-btn" + (state.citasSubTab === "indeciso" ? " active" : ""),
        onClick: () => { state.citasSubTab = "indeciso"; render(); }
      }, DicesIcon(14), " Indeciso (Ruleta)"),
      h("button", {
        class: "subtab-btn" + (state.citasSubTab === "sin_ideas" ? " active" : ""),
        onClick: () => { state.citasSubTab = "sin_ideas"; render(); }
      }, SparklesIcon(14), ` Sin ideas (${(state.datesPlans || []).length})`)
    );

    let content;
    if (state.citasSubTab === "indeciso") {
      content = buildIndecisoSubTab();
    } else {
      content = buildSinIdeasSubTab();
    }

    return h("div", {}, subtabs, content);
  }

  /* --- Sub-pestaña: Indeciso (Ruleta) --- */
  function buildIndecisoSubTab() {
    const opts = state.rouletteOptions || ["Cena en casa", "Salir a comer", "Paseo y helado", "Noche de pelis"];
    
    // Plantillas rápidas
    const presets = [
      { label: "🍕 ¿Qué comemos?", items: ["Pizza casera", "Sushi", "Hamburguesas", "Cocinar en casa", "Empanadas"] },
      { label: "🎬 ¿Qué vemos?", items: ["Comedia", "Terror o misterio", "Serie pendiente", "Documental", "Elegir al azar"] },
      { label: "🌆 Planes de finde", items: ["Paseo y heladería", "Bar o café nuevo", "Picnic al parque", "Cine", "Quedarse en la cama"] }
    ];

    const presetRow = h("div", { style: { display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" } },
      ...presets.map((p) => h("button", {
        class: "subtab-btn",
        style: { fontSize: "0.78rem", padding: "0.3rem 0.65rem" },
        onClick: () => {
          state.rouletteOptions = [...p.items];
          state.rouletteWinner = null;
          render();
        }
      }, p.label)),
      (state.datesPlans && state.datesPlans.length >= 2) ? h("button", {
        class: "subtab-btn",
        style: { fontSize: "0.78rem", padding: "0.3rem 0.65rem", background: "var(--surface-muted)" },
        onClick: () => {
          const shuffled = [...state.datesPlans].sort(() => 0.5 - Math.random());
          state.rouletteOptions = shuffled.slice(0, Math.min(5, shuffled.length)).map((p) => p.title);
          state.rouletteWinner = null;
          render();
        }
      }, "💡 Cargar de 'Sin ideas'") : null
    );

    // Controles de opciones (entre 2 y 6)
    const newOptInput = h("input", { id: "input-new-option", placeholder: "Agregar opción (ej: Paseo al río)…", style: { flex: "1" } });
    const addOptBtn = h("button", { class: "add-btn", disabled: opts.length >= 6 }, PlusIcon(14), " Sumar");
    
    const addOption = () => {
      const val = newOptInput.value.trim();
      if (!val || opts.length >= 6) return;
      state.rouletteOptions = [...opts, val];
      state.rouletteWinner = null;
      newOptInput.value = "";
      render();
    };
    addOptBtn.addEventListener("click", addOption);
    newOptInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addOption(); });

    const optionsList = h("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "0.6rem 0 1rem" } },
      ...opts.map((opt, i) => {
        const color = PALETTE[i % PALETTE.length];
        return h("div", {
          style: {
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            background: "var(--surface)", border: "1px solid var(--line)",
            borderLeft: `4px solid ${color}`, borderRadius: "8px", padding: "0.35rem 0.65rem",
            fontSize: "0.85rem", color: "var(--ink)"
          }
        },
          h("span", {}, opt),
          opts.length > 2 ? h("button", {
            class: "icon-btn",
            style: { padding: "0.1rem" },
            onClick: () => {
              state.rouletteOptions = opts.filter((_, idx) => idx !== i);
              state.rouletteWinner = null;
              render();
            }
          }, XIcon(12)) : null
        );
      })
    );

    // Canvas de la ruleta
    const canvas = h("canvas", { width: "280", height: "280", style: { borderRadius: "50%", display: "block" } });
    const needle = h("div", { class: "needle" });
    const spinBtn = h("button", {
      class: "primary-btn",
      style: {
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "68px", height: "68px", borderRadius: "50%", padding: "0",
        fontWeight: "700", fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)", border: "3px solid #fff", zIndex: "5"
      },
      disabled: state.isSpinning
    }, state.isSpinning ? "…" : "GIRAR");

    // Función de dibujo del Canvas
    const numOpts = opts.length;
    const arc = (2 * Math.PI) / numOpts;
    const drawWheel = () => {
      const ctx = canvas.getContext("2d");
      const radius = canvas.width / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < numOpts; i++) {
        const angle = rouletteAngle + i * arc;
        ctx.beginPath();
        ctx.fillStyle = PALETTE[i % PALETTE.length];
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius - 4, angle, angle + arc, false);
        ctx.lineTo(radius, radius);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();

        // Texto de cada opción
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 3;
        
        let label = opts[i];
        if (label.length > 14) label = label.slice(0, 13) + "…";
        ctx.fillText(label, radius - 18, 4);
        ctx.restore();
      }

      // Círculo exterior elegante
      ctx.beginPath();
      ctx.arc(radius, radius, radius - 3, 0, 2 * Math.PI);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.stroke();
    };

    // Girar la ruleta con física y ticks
    const spin = () => {
      if (state.isSpinning || opts.length < 2) return;
      state.isSpinning = true;
      state.rouletteWinner = null;
      render();

      let velocity = 0.35 + Math.random() * 0.25; // Velocidad angular inicial
      const friction = 0.984; // Fricción suave
      let lastSliceIndex = -1;

      const animate = () => {
        rouletteAngle += velocity;
        velocity *= friction;

        // Calcular sector actual bajo la aguja (aguja arriba en 3*PI/2)
        const normalized = (2 * Math.PI - (rouletteAngle % (2 * Math.PI)) + (3 * Math.PI / 2)) % (2 * Math.PI);
        const currentSlice = Math.floor(normalized / arc) % numOpts;
        if (currentSlice !== lastSliceIndex) {
          playTick();
          lastSliceIndex = currentSlice;
        }

        drawWheel();

        if (velocity > 0.002) {
          animFrameId = requestAnimationFrame(animate);
        } else {
          // Detenido: determinar ganador
          state.isSpinning = false;
          const winnerIndex = currentSlice;
          const winner = opts[winnerIndex];
          state.rouletteWinner = winner;
          
          playFanfare();
          if (window.confetti) {
            try {
              window.confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
            } catch (e) {}
          }
          render();
        }
      };

      animate();
    };

    spinBtn.addEventListener("click", spin);

    // Dibujar en el próximo ciclo
    setTimeout(drawWheel, 10);

    const canvasWrapper = h("div", { class: "canvas-wrapper" }, needle, canvas, spinBtn);

    // Banner de resultado cuando hay un ganador
    let winnerSection = null;
    if (state.rouletteWinner) {
      const winner = state.rouletteWinner;
      winnerSection = h("div", { class: "winner-banner" },
        h("div", { style: { fontSize: "0.8rem", color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" } }, "🎉 ¡El plan elegido es!"),
        h("div", { class: "winner-title" }, `"${winner}"`),
        h("div", { class: "winner-actions" },
          h("button", {
            class: "primary-btn",
            style: { fontSize: "0.82rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" },
            onClick: () => {
              sendHouseAlert("roulette", `🎲 ¡Giré la ruleta en Citas y Planes y salió: "${winner}"!`);
              alert(`¡Aviso enviado a tu pareja! ("${winner}")`);
            }
          }, BellIcon(14), " Avisar a mi pareja"),
          h("button", {
            class: "subtab-btn",
            style: { background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line)" },
            onClick: () => {
              saveList(state.house, "events", [...state.events, { id: uid(), title: `Cita: ${winner}`, date: todayISO(), createdBy: state.me.name }]);
              alert(`Agendado en el Calendario para hoy.`);
            }
          }, CalendarIcon(14), " Agendar en Calendario"),
          h("button", {
            class: "ghost-btn",
            style: { padding: "0.45rem 0.75rem", fontSize: "0.82rem" },
            onClick: () => { state.rouletteWinner = null; spin(); }
          }, RepeatIcon(14), " Girar de nuevo")
        )
      );
    }

    return h("div", { class: "roulette-container" },
      h("div", { style: { width: "100%", maxWidth: "440px" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" } },
          h("h3", { style: { fontFamily: "Fraunces, serif", fontSize: "1.1rem" } }, "Ruleta de decisión rápida"),
          h("span", { style: { fontSize: "0.76rem", color: "var(--ink-muted)" } }, `${opts.length} de 6 opciones`)
        ),
        h("p", { style: { fontSize: "0.82rem", color: "var(--ink-muted)", margin: "0 0 0.75rem" } },
          "Ingresen entre 2 y 6 alternativas. La ruleta decide por ustedes sin vueltas:"
        ),
        presetRow,
        optionsList,
        opts.length < 6 ? h("div", { style: { display: "flex", gap: "0.4rem", marginBottom: "1rem" } }, newOptInput, addOptBtn) : null
      ),
      canvasWrapper,
      winnerSection
    );
  }

  /* --- Sub-pestaña: Sin ideas (Catálogo de Planes + CRUD) --- */
  function buildSinIdeasSubTab() {
    const plans = state.datesPlans || [];
    const filterTag = state.planFilterTag || "Todos";
    const TAGS = ["Todos", "En casa", "Salida", "Romántico", "Aire libre", "Gastronomía", "Cocina", "Relax"];

    // Formulario para agregar nuevo plan
    const titleInput = h("input", { id: "input-plan-title", placeholder: "Ej: Picnic nocturno en la terraza", style: { flex: "1" } });
    const tagSelect = h("select", { id: "input-plan-tag" },
      h("option", { value: "En casa" }, "En casa"),
      h("option", { value: "Salida" }, "Salida"),
      h("option", { value: "Romántico" }, "Romántico"),
      h("option", { value: "Aire libre" }, "Aire libre"),
      h("option", { value: "Gastronomía" }, "Gastronomía"),
      h("option", { value: "Cocina" }, "Cocina"),
      h("option", { value: "Relax" }, "Relax")
    );
    const descInput = h("input", { id: "input-plan-desc", placeholder: "Detalle opcional (ej: llevar manta y snacks)", style: { flex: "1" } });
    const addBtn = h("button", { class: "add-btn", disabled: true }, PlusIcon(14), " Agregar");

    const updateAdd = () => { addBtn.disabled = !titleInput.value.trim(); };
    titleInput.addEventListener("input", updateAdd);

    addBtn.addEventListener("click", () => {
      const title = titleInput.value.trim();
      if (!title) return;
      const newPlan = {
        id: uid(),
        title: title,
        tag: tagSelect.value,
        desc: descInput.value.trim() || null,
        createdBy: state.me.name
      };
      saveList(state.house, "dates_plans", [newPlan, ...plans]);
      titleInput.value = "";
      descInput.value = "";
      addBtn.disabled = true;
    });

    const addForm = h("div", { class: "entry-form", style: { marginBottom: "1.2rem" } },
      h("div", { class: "field grow" }, h("label", {}, "Nombre de la idea / plan"), titleInput),
      h("div", { class: "field" }, h("label", {}, "Tipo de plan"), tagSelect),
      h("div", { class: "field grow", style: { width: "100%" } }, h("label", {}, "Detalles u observaciones (opcional)"), descInput),
      addBtn
    );

    // Filtros por etiqueta
    const filterPills = h("div", { style: { display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "0.4rem", marginBottom: "0.8rem" } },
      ...TAGS.map((t) => h("button", {
        class: "subtab-btn" + (filterTag === t ? " active" : ""),
        style: { fontSize: "0.78rem", padding: "0.25rem 0.65rem" },
        onClick: () => { state.planFilterTag = t; render(); }
      }, t))
    );

    // Filtrar lista
    const filtered = filterTag === "Todos" ? plans : plans.filter((p) => p.tag === filterTag);

    // Renderizado de tarjetas de planes
    const listBody = filtered.length === 0
      ? h("div", { class: "empty-state" }, "No hay planes con esta categoría.", h("br"), "Agregá uno nuevo arriba para que quede guardado para los dos.")
      : h("div", {}, ...filtered.map((p) => {
          const isEditing = state.editingPlan && state.editingPlan.id === p.id;
          
          if (isEditing) {
            const editTitleInput = h("input", { value: state.editingPlan.title, style: { width: "100%", marginBottom: "0.4rem" } });
            const editDescInput = h("input", { value: state.editingPlan.desc || "", placeholder: "Detalle...", style: { width: "100%", marginBottom: "0.5rem" } });
            const saveEditBtn = h("button", { class: "primary-btn", style: { padding: "0.35rem 0.75rem", fontSize: "0.8rem" } }, "Guardar");
            const cancelEditBtn = h("button", { class: "ghost-btn", style: { padding: "0.35rem 0.75rem", fontSize: "0.8rem" }, onClick: () => { state.editingPlan = null; render(); } }, "Cancelar");
            
            saveEditBtn.addEventListener("click", () => {
              const val = editTitleInput.value.trim();
              if (!val) return;
              const updated = plans.map((x) => x.id === p.id ? { ...x, title: val, desc: editDescInput.value.trim() || null } : x);
              saveList(state.house, "dates_plans", updated);
              state.editingPlan = null;
            });

            return h("div", { class: "plan-card", style: { flexDirection: "column" } },
              h("label", { style: { fontSize: "0.75rem", color: "var(--ink-muted)" } }, "Modificar plan:"),
              editTitleInput,
              editDescInput,
              h("div", { style: { display: "flex", gap: "0.4rem" } }, saveEditBtn, cancelEditBtn)
            );
          }

          return h("div", { class: "plan-card" },
            h("div", { class: "plan-card-body" },
              h("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" } },
                h("span", { class: "plan-card-title" }, p.title),
                h("span", { class: "pill good", style: { fontSize: "0.7rem", padding: "0.1rem 0.45rem" } }, p.tag || "Plan")
              ),
              p.desc ? h("p", { class: "plan-card-desc" }, p.desc) : null,
              h("div", { style: { fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" } },
                "Agregado por ", h("strong", {}, p.createdBy || "Nido")
              )
            ),
            h("div", { class: "plan-actions" },
              h("button", {
                class: "subtab-btn",
                style: { padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "var(--surface-muted)" },
                onClick: () => {
                  // Cargar en la ruleta e ir directo a la pestaña de ruleta
                  const cur = state.rouletteOptions || [];
                  if (!cur.includes(p.title)) {
                    if (cur.length >= 6) cur.shift(); // Quita una vieja si llegó al límite
                    state.rouletteOptions = [...cur, p.title];
                  }
                  state.citasSubTab = "indeciso";
                  state.rouletteWinner = null;
                  render();
                },
                title: "Pasar esta idea a la ruleta"
              }, DicesIcon(13), " A la ruleta"),
              h("button", {
                class: "icon-btn",
                onClick: () => { state.editingPlan = { ...p }; render(); },
                title: "Editar texto"
              }, EditIcon(14)),
              h("button", {
                class: "icon-btn",
                onClick: () => {
                  if (confirm(`¿Eliminar la idea "${p.title}"?`)) {
                    saveList(state.house, "dates_plans", plans.filter((x) => x.id !== p.id));
                  }
                },
                title: "Eliminar"
              }, TrashIcon(14))
            )
          );
        }));

    return h("div", {}, addForm, filterPills, listBody);
  }
"""

if "function buildCitasTab" not in html:
    html = html.replace(
        "/* ---------- tab: calendario ---------- */",
        citas_tab_code + "\n  /* ---------- tab: calendario ---------- */"
    )

with open("original_nidopareja/index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("Step 3 applied! New file length:", len(html))
