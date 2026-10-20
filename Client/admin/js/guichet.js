/**
 * Admin — Guichet : qui a pris chaque réservation (ReservationAdmin)
 */
(function () {
    const els = {
        stats: document.getElementById("guiStats"),
        tabs: document.getElementById("guiStaffTabs"),
        list: document.getElementById("guiList"),
        status: document.getElementById("guiStatus"),
        search: document.getElementById("guiSearch"),
        date: document.getElementById("guiDate"),
        refresh: document.getElementById("guiRefresh"),
    };

    if (!els.list || !els.tabs) return;

    const state = {
        rows: [],
        employeurs: [],
        staff: "all",
        q: "",
        date: "",
        loaded: false,
    };

    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0));

    function fmtWhen(d) {
        if (!d) return "—";
        const x = new Date(d);
        if (isNaN(x)) return "—";
        return x.toLocaleString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function fmtDate(d) {
        if (!d) return "—";
        const x = new Date(d);
        if (!isNaN(x)) {
            return x.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
        }
        return String(d);
    }

    function payLabel(r) {
        const status = r.paymentStatus || "non_paye";
        if (status === "paye") return { text: "Payé", cls: "is-ok" };
        if (status === "verse") return { text: "Acompte", cls: "is-pending" };
        return { text: "Non payé", cls: "is-ko" };
    }

    function staffKey(r) {
        if (r.createdById) return String(r.createdById);
        if (r.createdByName) return `name:${r.createdByName}`;
        return "none";
    }

    function flash(msg, isError) {
        if (!els.status) return;
        els.status.textContent = msg || "";
        els.status.classList.toggle("is-error", !!isError);
        clearTimeout(flash.t);
        flash.t = setTimeout(() => {
            els.status.textContent = "";
            els.status.classList.remove("is-error");
        }, 4000);
    }

    function staffCounts() {
        const c = { all: state.rows.length, none: 0 };
        state.rows.forEach((r) => {
            const k = staffKey(r);
            if (k === "none") c.none++;
            else c[k] = (c[k] || 0) + 1;
        });
        return c;
    }

    function rebuildTabs() {
        const counts = staffCounts();
        const byEmp = state.employeurs
            .map((e) => ({
                id: String(e.id),
                label: `${e.prenom || ""} ${e.nom || ""}`.trim() || e.email || `Employeur #${e.id}`,
                n: counts[String(e.id)] || 0,
            }))
            .filter((e) => e.n > 0 || true);

        // Noms orphelins (Admin, compte supprimé)
        const knownIds = new Set(state.employeurs.map((e) => String(e.id)));
        const orphans = [];
        state.rows.forEach((r) => {
            const k = staffKey(r);
            if (k === "none" || knownIds.has(k) || orphans.some((o) => o.id === k)) return;
            if (k.startsWith("name:")) {
                orphans.push({ id: k, label: r.createdByName || "Inconnu", n: counts[k] || 0 });
            } else if (!knownIds.has(k)) {
                orphans.push({ id: k, label: r.createdByName || `Staff #${k}`, n: counts[k] || 0 });
            }
        });

        const staffBtns = [...byEmp.filter((s) => s.n > 0), ...orphans]
            .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "fr"))
            .map(
                (s) =>
                    `<button type="button" data-staff="${esc(s.id)}" class="${state.staff === s.id ? "is-active" : ""}">${esc(s.label)} <em>${s.n}</em></button>`
            )
            .join("");

        els.tabs.innerHTML = `
            <button type="button" data-staff="all" class="${state.staff === "all" ? "is-active" : ""}">Tous <em>${counts.all}</em></button>
            <button type="button" data-staff="none" class="${state.staff === "none" ? "is-active" : ""}">Sans attribution <em>${counts.none}</em></button>
            ${staffBtns}`;
    }

    function renderStats() {
        if (!els.stats) return;
        const today = new Date().toISOString().slice(0, 10);
        const todayN = state.rows.filter((r) => r.date === today).length;
        const attributed = state.rows.filter((r) => r.createdByName || r.createdById).length;
        const staffActive = new Set(
            state.rows.filter((r) => r.createdById || r.createdByName).map((r) => staffKey(r))
        ).size;
        const totalCA = state.rows.reduce((s, r) => s + (parseFloat(r.totalAPayer) || 0), 0);

        els.stats.innerHTML = `
            <div class="gui-stat"><strong>${state.rows.length}</strong><span>Réservations</span></div>
            <div class="gui-stat"><strong>${todayN}</strong><span>Aujourd'hui</span></div>
            <div class="gui-stat"><strong>${attributed}</strong><span>Attribuées</span></div>
            <div class="gui-stat"><strong>${staffActive}</strong><span>Employeurs actifs</span></div>
            <div class="gui-stat"><strong>${fmt(totalCA)}</strong><span>Total DA</span></div>`;
    }

    function filtered() {
        return state.rows.filter((r) => {
            if (state.date && r.date !== state.date) return false;
            if (state.staff === "none") {
                if (r.createdById || r.createdByName) return false;
            } else if (state.staff !== "all" && staffKey(r) !== state.staff) {
                return false;
            }
            if (!state.q) return true;
            const hay = [
                r.nom,
                r.prenom,
                r.tel,
                r.activite,
                r.createdByName,
                r.id,
                r.date,
            ]
                .join(" ")
                .toLowerCase();
            return hay.includes(state.q);
        });
    }

    function staffOptions(selectedId, selectedName) {
        const opts = [`<option value="">— Non attribué —</option>`];
        state.employeurs.forEach((e) => {
            const label = `${e.prenom || ""} ${e.nom || ""}`.trim() || e.email;
            const sel = String(e.id) === String(selectedId) ? " selected" : "";
            opts.push(`<option value="${e.id}" data-name="${esc(label)}"${sel}>${esc(label)}</option>`);
        });
        // Keep current name if not in list
        if (selectedName && !state.employeurs.some((e) => String(e.id) === String(selectedId))) {
            opts.push(
                `<option value="${esc(selectedId || "")}" data-name="${esc(selectedName)}" selected>${esc(selectedName)} (ancien)</option>`
            );
        }
        return opts.join("");
    }

    function card(r) {
        const name = `${r.nom || ""} ${r.prenom || ""}`.trim() || "Client";
        const initials = name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
        const pay = payLabel(r);
        const taken = r.createdByName || "Non attribué";

        return `
        <article class="gui-card" data-id="${esc(r.id)}">
            <header class="gui-card__head">
                <div class="gui-card__client">
                    <i class="resa-avatar">${esc(initials)}</i>
                    <div>
                        <strong>${esc(name)}</strong>
                        <span>#${esc(r.id)} · ${esc(r.activite || "—")}</span>
                    </div>
                </div>
                <em class="dash-pill ${pay.cls}">${pay.text}</em>
            </header>
            <dl class="gui-card__facts">
                <div><dt>Date</dt><dd>${esc(fmtDate(r.date))}${r.heure ? ` · ${esc(r.heure)}` : ""}</dd></div>
                <div><dt>Pers.</dt><dd>${esc(r.personnes ?? "—")}</dd></div>
                <div><dt>Total</dt><dd class="resa-amount">${fmt(r.totalAPayer)} DA</dd></div>
                <div><dt>Versé</dt><dd>${fmt(r.versement)} DA</dd></div>
                <div><dt>Reste</dt><dd>${fmt(r.resteAPayer ?? r.resteapayer)} DA</dd></div>
                <div><dt>Tél.</dt><dd>${esc(r.tel || "—")}</dd></div>
            </dl>
            <div class="gui-card__taken">
                <div class="gui-taken-meta">
                    <i class="fas fa-user-tie"></i>
                    <div>
                        <strong>${esc(taken)}</strong>
                        <span>Prise le ${esc(fmtWhen(r.createdAt))}</span>
                    </div>
                </div>
                <label class="gui-reassign">
                    <span>Réattribuer</span>
                    <select data-action="assign">${staffOptions(r.createdById, r.createdByName)}</select>
                </label>
            </div>
            ${r.note && r.note !== "Aucune note" ? `<p class="resa-card__note"><i class="fas fa-quote-left"></i>${esc(r.note)}</p>` : ""}
            <footer class="gui-card__actions">
                <button type="button" class="resa-btn resa-btn--icon" data-action="delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </footer>
        </article>`;
    }

    function render() {
        renderStats();
        rebuildTabs();
        if (!state.loaded) return;
        const rows = filtered().sort((a, b) => {
            const da = `${a.date || ""} ${a.heure || ""}`;
            const db = `${b.date || ""} ${b.heure || ""}`;
            return db.localeCompare(da);
        });
        els.list.innerHTML = rows.length
            ? rows.map(card).join("")
            : `<div class="admin-empty"><i class="fas fa-user-check"></i><strong>Aucune réservation</strong><p>Modifiez les filtres ou ouvrez le guichet pour en créer.</p></div>`;
    }

    async function load() {
        els.list.innerHTML = Array.from(
            { length: 3 },
            () => '<div class="resa-card resa-card--skeleton" style="min-height:120px"></div>'
        ).join("");
        try {
            const [resa, emps] = await Promise.all([
                window.AdminAPI.fetch("/api/reservations-admin"),
                window.AdminAPI.fetch("/api/auth/employeurs").catch(() => []),
            ]);
            state.rows = Array.isArray(resa) ? resa : resa.data || [];
            state.employeurs = Array.isArray(emps) ? emps : emps.data || [];
            state.loaded = true;
            render();
            flash(`${state.rows.length} réservation(s) guichet`);
        } catch (err) {
            state.loaded = false;
            els.list.innerHTML = `<div class="admin-empty"><i class="fas fa-triangle-exclamation"></i><strong>Chargement impossible</strong><p>${esc(err.message)}</p></div>`;
        }
    }

    els.tabs.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-staff]");
        if (!btn) return;
        state.staff = btn.dataset.staff;
        render();
    });

    els.search?.addEventListener("input", () => {
        state.q = els.search.value.trim().toLowerCase();
        render();
    });

    els.date?.addEventListener("change", () => {
        state.date = els.date.value || "";
        render();
    });

    els.refresh?.addEventListener("click", load);

    els.list.addEventListener("change", async (e) => {
        const select = e.target.closest("select[data-action='assign']");
        if (!select) return;
        const cardEl = select.closest("[data-id]");
        const id = cardEl?.dataset.id;
        const row = state.rows.find((r) => String(r.id) === String(id));
        if (!row) return;

        const opt = select.selectedOptions[0];
        const createdById = select.value ? parseInt(select.value, 10) || null : null;
        const createdByName = opt?.dataset.name || opt?.textContent || null;

        cardEl.classList.add("is-busy");
        try {
            const updated = await window.AdminAPI.fetch(`/api/reservations-admin/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    nom: row.nom,
                    prenom: row.prenom,
                    tel: row.tel,
                    activite: row.activite,
                    heure: row.heure,
                    date: row.date,
                    personnes: row.personnes,
                    slot: row.slot,
                    subslot: row.subslot,
                    bateau: row.bateau,
                    duree: row.duree,
                    totalAPayer: row.totalAPayer,
                    versement: row.versement,
                    resteAPayer: row.resteAPayer ?? row.resteapayer,
                    note: row.note,
                    createdById,
                    createdByName: createdById || createdByName ? createdByName : null,
                }),
            });
            Object.assign(row, updated);
            flash(createdByName ? `Réattribuée à ${createdByName}` : "Attribution retirée");
            render();
        } catch (err) {
            flash(err.message, true);
            select.value = row.createdById || "";
        } finally {
            cardEl.classList.remove("is-busy");
        }
    });

    els.list.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-action='delete']");
        if (!btn) return;
        const cardEl = btn.closest("[data-id]");
        const id = cardEl?.dataset.id;
        const row = state.rows.find((r) => String(r.id) === String(id));
        if (!row) return;
        const name = `${row.nom || ""} ${row.prenom || ""}`.trim();
        if (!confirm(`Supprimer la réservation de ${name || "#" + id} ?`)) return;
        cardEl.classList.add("is-busy");
        try {
            await window.AdminAPI.fetch(`/api/reservations-admin/${id}`, { method: "DELETE" });
            state.rows = state.rows.filter((r) => r !== row);
            flash("Réservation supprimée.");
            render();
        } catch (err) {
            flash(err.message, true);
            cardEl.classList.remove("is-busy");
        }
    });

    window.addEventListener("admin:navigate", (e) => {
        if (e.detail?.page !== "guichet") return;
        if (e.detail?.staff) state.staff = String(e.detail.staff);
        load();
    });

    // Deep-link #guichet or #guichet?staff=12
    const hash = (location.hash || "").slice(1);
    if (hash.startsWith("guichet")) {
        const params = new URLSearchParams(hash.split("?")[1] || "");
        if (params.get("staff")) state.staff = params.get("staff");
        load();
    }
})();
