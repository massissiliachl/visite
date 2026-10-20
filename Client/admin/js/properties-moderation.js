/**
 * Admin — tous les hébergements (validation, suppression) + demandes par propriétaire
 */
(function () {
    const listEl = document.getElementById("propModList");
    const statusEl = document.getElementById("propModStatus");
    const tabsEl = document.getElementById("propModTabs");
    const typesEl = document.getElementById("propModTypes");
    const searchEl = document.getElementById("propModSearch");
    const panelEl = document.querySelector('[data-admin-panel="properties"]');
    const ownersResaEl = document.getElementById("propModOwnersResa");
    if (!listEl) return;

    const APPROVAL = {
        pending: { label: "À valider", cls: "is-pending" },
        approved: { label: "Validé", cls: "is-ok" },
        rejected: { label: "Refusé", cls: "is-ko" },
    };
    const MAIN_TYPES = ["appartement", "villa", "chalet"];

    const state = { items: [], filter: "all", type: "all", q: "", loading: false };

    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0));
    const asList = (r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []);

    function imgUrl(src) {
        if (!src) return "";
        if (/^(https?:|data:|blob:)/.test(src)) return src;
        return "../" + String(src).replace(/^\/+/, "");
    }

    function typeKey(t) {
        const k = String(t || "").toLowerCase();
        return MAIN_TYPES.find((m) => k.includes(m)) || "other";
    }

    let flashTimer;
    function flash(msg, isError) {
        statusEl.textContent = msg || "";
        statusEl.classList.toggle("is-error", !!isError);
        clearTimeout(flashTimer);
        if (msg) flashTimer = setTimeout(() => (statusEl.textContent = ""), 4000);
    }

    function updateCounts() {
        const c = { all: state.items.length, pending: 0, approved: 0, rejected: 0 };
        state.items.forEach((p) => c[p.approval]++);
        tabsEl.querySelectorAll("button").forEach((b) => (b.querySelector("em").textContent = c[b.dataset.f] ?? 0));
        const badge = document.getElementById("badgePropsPending");
        if (badge) {
            badge.hidden = !c.pending;
            badge.textContent = c.pending;
        }
    }

    function card(p) {
        const st = APPROVAL[p.approval] || APPROVAL.approved;
        const cover = imgUrl(p.images?.[0]);
        const features = (p.features || []).slice(0, 3);
        const actions = [];
        if (p.approval !== "approved")
            actions.push('<button type="button" class="resa-btn resa-btn--ok" data-action="approve"><i class="fas fa-check"></i> Valider</button>');
        if (p.approval !== "rejected")
            actions.push('<button type="button" class="resa-btn resa-btn--ko" data-action="reject"><i class="fas fa-ban"></i> Refuser</button>');

        return `
        <article class="prop-card ${st.cls}" data-id="${esc(p.id)}">
            <div class="prop-card__media">
                ${cover ? `<img src="${esc(cover)}" alt="" loading="lazy" onerror="this.remove()">` : ""}
                <span class="prop-card__type">${esc(p.type || "Hébergement")}</span>
                <em class="dash-pill ${st.cls}">${st.label}</em>
                ${p.images?.length > 1 ? `<span class="prop-card__count"><i class="fas fa-images"></i> ${p.images.length}</span>` : ""}
            </div>
            <div class="prop-card__body">
                <h4>${esc(p.title || "Sans titre")}</h4>
                <p class="prop-card__loc"><i class="fas fa-location-dot"></i>${esc(String(p.location || "Béjaïa").trim())}</p>
                ${features.length ? `<div class="prop-card__features">${features.map((f) => `<span><i class="fas ${esc(f.icon || "fa-check")}"></i>${esc(f.text || f)}</span>`).join("")}</div>` : ""}
                <div class="prop-card__meta">
                    <div>
                        <small>Prix / nuit</small>
                        <strong>${Number(p.price) > 0 ? fmt(p.price) + " DA" : "Sur devis"}</strong>
                    </div>
                    <div>
                        <small>Demandes</small>
                        <strong>${p.resaTotal}${p.resaPending ? ` <b class="prop-card__pending">${p.resaPending} en attente</b>` : ""}</strong>
                    </div>
                </div>
                <div class="prop-card__owner">
                    <i class="resa-avatar">${esc(p.ownerInitials)}</i>
                    <div>
                        <small>Propriétaire</small>
                        <strong>${esc(p.ownerName)}</strong>
                    </div>
                    ${p.ownerId ? `<button type="button" class="prop-card__link" data-action="owner" title="Voir ses demandes"><i class="fas fa-arrow-right"></i></button>` : ""}
                </div>
            </div>
            <footer class="resa-card__actions">
                ${actions.join("")}
                <a class="resa-btn resa-btn--icon" href="../hebergement.html" target="_blank" rel="noopener" title="Voir sur le site"><i class="fas fa-arrow-up-right-from-square"></i></a>
                <button type="button" class="resa-btn resa-btn--icon" data-action="delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </footer>
        </article>`;
    }

    function render() {
        updateCounts();
        const rows = state.items
            .filter((p) => state.filter === "all" || p.approval === state.filter)
            .filter((p) => state.type === "all" || typeKey(p.type) === state.type)
            .filter((p) => !state.q || [p.title, p.location, p.type, p.ownerName, p.id].join(" ").toLowerCase().includes(state.q));

        listEl.innerHTML = rows.length
            ? rows.map(card).join("")
            : `<div class="admin-empty"><i class="fas fa-building"></i><strong>Aucun hébergement</strong><p>${state.q ? "Aucun résultat pour cette recherche." : "Rien dans cette catégorie."}</p></div>`;
    }

    function renderOwnersOverview(owners) {
        if (!ownersResaEl) return;
        if (!owners.length) {
            ownersResaEl.innerHTML = '<div class="admin-empty"><i class="fas fa-users"></i><strong>Aucun propriétaire</strong></div>';
            return;
        }
        ownersResaEl.innerHTML = `
            <div style="overflow-x:auto">
            <table class="own-resa-table">
                <thead><tr><th>Propriétaire</th><th>Biens</th><th>En validation</th><th>Demandes totales</th><th>En attente</th><th></th></tr></thead>
                <tbody>
                    ${owners
                        .map((o) => {
                            const name = `${o.prenom || ""} ${o.nom || ""}`.trim();
                            return `<tr>
                                <td><strong>${esc(name)}</strong><br><small style="color:var(--muted)">${esc(o.email || "")}</small></td>
                                <td>${(o.properties || []).length}</td>
                                <td>${o.pendingProperties || 0}</td>
                                <td>${o.reservationsCount || 0}</td>
                                <td><span class="own-status ${o.pendingReservations ? "own-status--en_attente" : "own-status--acceptee"}">${o.pendingReservations || 0}</span></td>
                                <td><button type="button" class="act-btn act-btn--ghost act-btn--sm" data-goto-owner="${o.id}">Voir demandes</button></td>
                            </tr>`;
                        })
                        .join("")}
                </tbody>
            </table>
            </div>`;
    }

    async function load() {
        if (state.loading) return;
        state.loading = true;
        panelEl?.classList.add("is-loading");
        if (!state.items.length) {
            listEl.innerHTML = Array.from({ length: 6 }, () => '<div class="prop-card resa-card--skeleton"></div>').join("");
        }
        try {
            const [props, owners, resas] = await Promise.all([
                window.AdminAPI.fetch("/api/admin/properties"),
                window.AdminAPI.fetch("/api/owner/proprietaires").catch(() => []),
                window.AdminAPI.fetch("/api/property-reservations").catch(() => []),
            ]);

            const ownerById = {};
            const ownerByProp = {};
            asList(owners).forEach((o) => {
                ownerById[o.id] = o;
                (o.properties || []).forEach((p) => (ownerByProp[String(p.id)] = o));
            });

            const resaStats = {};
            asList(resas).forEach((r) => {
                const k = String(r.propertyId);
                resaStats[k] = resaStats[k] || { total: 0, pending: 0 };
                resaStats[k].total++;
                if (String(r.status || "en_attente") === "en_attente") resaStats[k].pending++;
            });

            state.items = asList(props).map((p) => {
                const owner = ownerById[p.ownerId] || ownerByProp[String(p.id)] || null;
                const ownerName = owner ? `${owner.prenom || ""} ${owner.nom || ""}`.trim() : "Visit Bejaia";
                const stats = resaStats[String(p.id)] || { total: 0, pending: 0 };
                return {
                    ...p,
                    approval: APPROVAL[p.approvalStatus] ? p.approvalStatus : "approved",
                    ownerId: owner?.id || null,
                    ownerName,
                    ownerInitials: ownerName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
                    resaTotal: stats.total,
                    resaPending: stats.pending,
                };
            });
            state.items.sort((a, b) => (a.approval === "pending" ? -1 : 0) - (b.approval === "pending" ? -1 : 0));

            render();
            renderOwnersOverview(asList(owners));
        } catch (err) {
            listEl.innerHTML = `<div class="admin-empty"><i class="fas fa-triangle-exclamation"></i><strong>Chargement impossible</strong><p>${esc(err.message)}</p></div>`;
        } finally {
            state.loading = false;
            panelEl?.classList.remove("is-loading");
        }
    }

    async function act(id, action, cardEl) {
        const p = state.items.find((x) => String(x.id) === String(id));
        if (!p) return;
        if (action === "owner") return gotoOwner(p.ownerId);
        if (action === "delete" && !confirm(`Supprimer définitivement « ${p.title} » ?`)) return;
        if (action === "reject" && !confirm(`Refuser « ${p.title} » ? Il ne sera plus visible sur le site.`)) return;

        cardEl.classList.add("is-busy");
        try {
            if (action === "delete") {
                await window.AdminAPI.fetch(`/api/owner/properties/${id}`, { method: "DELETE" });
                state.items = state.items.filter((x) => x !== p);
                flash("Hébergement supprimé.");
            } else {
                await window.AdminAPI.fetch(`/api/owner/properties/${id}/${action}`, {
                    method: "PATCH",
                    body: JSON.stringify({}),
                });
                p.approval = action === "approve" ? "approved" : "rejected";
                flash(action === "approve" ? `« ${p.title} » est validé et visible sur le site.` : `« ${p.title} » a été refusé.`);
            }
            render();
        } catch (err) {
            cardEl.classList.remove("is-busy");
            flash(err.message, true);
        }
    }

    function gotoOwner(id) {
        if (!id) return;
        location.hash = "proprietaires";
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent("admin:select-owner", { detail: { id: Number(id) } }));
        }, 200);
    }

    listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        const cardEl = e.target.closest("[data-id]");
        if (btn && cardEl) act(cardEl.dataset.id, btn.dataset.action, cardEl);
    });

    tabsEl.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-f]");
        if (!b) return;
        state.filter = b.dataset.f;
        tabsEl.querySelectorAll("button").forEach((x) => x.classList.toggle("is-active", x === b));
        render();
    });

    typesEl?.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-t]");
        if (!b) return;
        state.type = b.dataset.t;
        typesEl.querySelectorAll("button").forEach((x) => x.classList.toggle("is-active", x === b));
        render();
    });

    searchEl?.addEventListener("input", () => {
        state.q = searchEl.value.trim().toLowerCase();
        render();
    });

    ownersResaEl?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-goto-owner]");
        if (btn) gotoOwner(btn.dataset.gotoOwner);
    });

    document.getElementById("propModRefresh")?.addEventListener("click", load);

    window.addEventListener("admin:navigate", (e) => {
        if (e.detail?.page === "properties") load();
    });

    if ((location.hash || "").slice(1) === "properties") load();
})();
