/**
 * Admin — comptes propriétaires + assignation hébergements + demandes
 */
(function () {
    const els = {
        list: document.getElementById("ownList"),
        status: document.getElementById("ownStatus"),
        form: document.getElementById("ownForm"),
        propsBox: document.getElementById("ownPropsBox"),
        btnNew: document.getElementById("ownBtnNew"),
        btnSave: document.getElementById("ownBtnSave"),
        editorTitle: document.getElementById("ownEditorTitle"),
        search: document.getElementById("ownSearch"),
        resaPanel: document.getElementById("ownResaPanel"),
        resaList: document.getElementById("ownResaList"),
        resaTitle: document.getElementById("ownResaTitle"),
        resaCount: document.getElementById("ownResaCount"),
    };

    let owners = [];
    let allProperties = [];
    let editingId = null;
    let propTypeFilter = "all";
    let lastSelectedIds = [];
    let ownerReservations = [];
    let resaStatusFilter = "all";
    let selectedOwnerId = null;

    function setStatus(msg, type) {
        if (!els.status) return;
        els.status.textContent = msg || "";
        els.status.className = "act-status" + (type ? ` is-${type}` : "");
    }

    function selectedPropertyIds() {
        if (!els.propsBox) return lastSelectedIds;
        const visibleChecked = [
            ...els.propsBox.querySelectorAll('input[type="checkbox"]:checked'),
        ].map((c) => c.value);
        const visibleIds = new Set(
            [...els.propsBox.querySelectorAll('input[type="checkbox"]')].map(
                (c) => c.value
            )
        );
        const keptHidden = lastSelectedIds.filter((id) => !visibleIds.has(id));
        lastSelectedIds = [...new Set([...keptHidden, ...visibleChecked])];
        return lastSelectedIds;
    }

    function renderPropertyChecks(selectedIds = []) {
        if (!els.propsBox) return;
        lastSelectedIds = selectedIds.map(String);
        const selected = new Set(lastSelectedIds);
        const filtered = allProperties.filter(
            (p) => propTypeFilter === "all" || p.type === propTypeFilter
        );

        if (!allProperties.length) {
            els.propsBox.innerHTML =
                '<p class="act-status">Aucun hébergement. Cliquez « Sync biens du site ».</p>';
            return;
        }

        if (!filtered.length) {
            els.propsBox.innerHTML =
                '<p class="act-status">Aucun bien pour ce filtre.</p>';
            return;
        }

        const order = { appartement: 1, villa: 2, chalet: 3 };
        filtered.sort((a, b) => {
            const oa = order[a.type] || 9;
            const ob = order[b.type] || 9;
            if (oa !== ob) return oa - ob;
            return String(a.title).localeCompare(String(b.title), "fr");
        });

        els.propsBox.innerHTML = filtered
            .map((p) => {
                const takenByOther =
                    p.ownerId && Number(p.ownerId) !== Number(editingId);
                return `
                <label class="own-prop-check">
                    <input type="checkbox" value="${p.id}" ${
                        selected.has(String(p.id)) ? "checked" : ""
                    }>
                    <span>
                        <strong><span class="own-type-tag">${p.type || "bien"}</span>${p.title || "Sans titre"}</strong>
                        <small>${p.location || ""} · id ${p.id}</small>
                        ${
                            takenByOther
                                ? `<em>Actuellement chez un autre propriétaire (sera réassigné)</em>`
                                : ""
                        }
                    </span>
                </label>`;
            })
            .join("");
    }

    function fillForm(owner) {
        editingId = owner?.id || null;
        if (els.editorTitle) {
            els.editorTitle.textContent = owner
                ? "Modifier le propriétaire"
                : "Nouveau propriétaire";
        }
        if (!els.form) return;
        els.form.nom.value = owner?.nom || "";
        els.form.prenom.value = owner?.prenom || "";
        els.form.email.value = owner?.email || "";
        els.form.telephone.value = owner?.telephone || "";
        els.form.password.value = "";
        els.form.password.required = !owner;
        els.form.password.placeholder = owner
            ? "Laisser vide pour ne pas changer"
            : "Mot de passe temporaire";
        const ids = (owner?.properties || []).map((p) => p.id);
        renderPropertyChecks(ids);
    }

    function resetForm() {
        fillForm(null);
        selectedOwnerId = null;
        ownerReservations = [];
        if (els.resaPanel) els.resaPanel.hidden = true;
        renderList();
        setStatus("");
    }

    function statusLabel(status) {
        const map = {
            en_attente: "En attente",
            acceptee: "Acceptée",
            refusee: "Refusée",
        };
        return map[status] || status || "—";
    }

    function renderReservations() {
        if (!els.resaList) return;
        const list =
            resaStatusFilter === "all"
                ? ownerReservations
                : ownerReservations.filter(
                      (r) => (r.status || "") === resaStatusFilter
                  );

        const counts = { all: ownerReservations.length, en_attente: 0, acceptee: 0, refusee: 0 };
        ownerReservations.forEach((r) => {
            const s = r.status || "en_attente";
            if (s in counts) counts[s]++;
        });
        document.querySelectorAll("#ownResaPanel [data-c]").forEach((el) => {
            el.textContent = counts[el.dataset.c] ?? 0;
        });

        if (els.resaCount) {
            els.resaCount.textContent = `${ownerReservations.length} demande(s)${
                counts.en_attente ? ` · ${counts.en_attente} en attente` : ""
            }`;
        }

        if (!ownerReservations.length) {
            els.resaList.innerHTML = `
                <div class="admin-empty">
                    <i class="fas fa-inbox"></i>
                    <strong>Aucune demande</strong>
                    <p>Ce propriétaire n’a pas encore de réservation sur ses biens.</p>
                </div>`;
            return;
        }

        if (!list.length) {
            els.resaList.innerHTML = `
                <div class="admin-empty">
                    <i class="fas fa-filter"></i>
                    <strong>Aucun résultat</strong>
                    <p>Aucune réservation pour ce filtre.</p>
                </div>`;
            return;
        }

        const esc = (s) =>
            String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
        const fmtDate = (d) => {
            const x = new Date(d);
            return d && !isNaN(x) ? x.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
        };
        const pillCls = { en_attente: "is-pending", acceptee: "is-ok", refusee: "is-ko" };

        els.resaList.innerHTML = `<div class="own-resa-grid">${list
            .map((r) => {
                const status = r.status || "en_attente";
                const name = `${r.prenom || ""} ${r.nom || ""}`.trim() || r.email || "Client";
                const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                const nights = Math.round((new Date(r.date_depart) - new Date(r.date_arrivee)) / 86400000);
                let wa = String(r.telephone || "").replace(/\D/g, "");
                if (wa.startsWith("00")) wa = wa.slice(2);
                else if (wa.startsWith("0")) wa = "213" + wa.slice(1);
                const actions =
                    status === "en_attente"
                        ? `<button type="button" class="resa-btn resa-btn--ok" data-resa-action="acceptee" data-id="${r.id}"><i class="fas fa-check"></i> Accepter</button>
                           <button type="button" class="resa-btn resa-btn--ko" data-resa-action="refusee" data-id="${r.id}"><i class="fas fa-xmark"></i> Refuser</button>`
                        : `<button type="button" class="resa-btn" data-resa-action="en_attente" data-id="${r.id}"><i class="fas fa-rotate-left"></i> Remettre en attente</button>`;
                return `
                <article class="resa-card ${pillCls[status] || ""}" data-resa-id="${r.id}">
                    <header class="resa-card__head">
                        <div class="resa-card__client">
                            <i class="resa-avatar">${esc(initials)}</i>
                            <div>
                                <strong>${esc(name)}</strong>
                                <span>#${r.id}${r.createdAt ? " · reçue le " + fmtDate(r.createdAt) : ""}</span>
                            </div>
                        </div>
                        <em class="dash-pill ${pillCls[status] || ""}">${statusLabel(status)}</em>
                    </header>
                    <div class="resa-card__item"><i class="fas fa-house"></i>${esc(r.Property?.title || "Bien #" + r.propertyId)}</div>
                    <dl class="resa-card__facts">
                        <div><dt>Dates</dt><dd>${fmtDate(r.date_arrivee)} → ${fmtDate(r.date_depart)}${nights > 0 ? ` <small>${nights} nuit${nights > 1 ? "s" : ""}</small>` : ""}</dd></div>
                        <div><dt>Personnes</dt><dd>${esc(r.nb_personnes ?? "—")}</dd></div>
                        <div><dt>Montant</dt><dd class="resa-amount">${r.prix_total ? Number(r.prix_total).toLocaleString("fr-FR") + " DA" : "Sur devis"}</dd></div>
                    </dl>
                    ${r.message ? `<p class="resa-card__note"><i class="fas fa-quote-left"></i>${esc(r.message)}</p>` : ""}
                    <div class="resa-card__contact">
                        ${r.telephone ? `<a href="tel:${esc(r.telephone)}"><i class="fas fa-phone"></i>${esc(r.telephone)}</a>` : ""}
                        ${wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener" class="is-wa"><i class="fab fa-whatsapp"></i>WhatsApp</a>` : ""}
                        ${r.email ? `<a href="mailto:${esc(r.email)}"><i class="fas fa-envelope"></i>${esc(r.email)}</a>` : ""}
                    </div>
                    <footer class="resa-card__actions">${actions}</footer>
                </article>`;
            })
            .join("")}</div>`;
    }

    async function loadOwnerReservations(ownerId) {
        if (!els.resaPanel) return;
        els.resaPanel.hidden = false;
        const owner = owners.find((o) => o.id === ownerId);
        if (els.resaTitle) {
            els.resaTitle.textContent = owner
                ? `Demandes — ${owner.prenom || ""} ${owner.nom || ""}`.trim()
                : "Demandes de réservation";
        }
        els.resaList.innerHTML =
            '<p class="act-status">Chargement des demandes…</p>';
        try {
            const data = await window.AdminAPI.fetch(
                `/api/owner/proprietaires/${ownerId}/reservations`
            );
            ownerReservations = Array.isArray(data.reservations)
                ? data.reservations
                : Array.isArray(data)
                  ? data
                  : [];
            renderReservations();
        } catch (err) {
            els.resaList.innerHTML = `<p class="act-status is-error">${err.message}</p>`;
        }
    }

    async function selectOwner(owner) {
        if (!owner) return;
        selectedOwnerId = owner.id;
        fillForm(owner);
        renderList();
        await loadOwnerReservations(owner.id);
    }

    function filteredOwners() {
        const q = (els.search?.value || "").trim().toLowerCase();
        if (!q) return owners;
        return owners.filter((o) =>
            `${o.nom} ${o.prenom} ${o.email}`.toLowerCase().includes(q)
        );
    }

    function renderList() {
        if (!els.list) return;
        const items = filteredOwners();
        if (!items.length) {
            els.list.innerHTML = `
                <div class="admin-empty">
                    <i class="fas fa-key"></i>
                    <strong>Aucun propriétaire</strong>
                    <p>Créez un compte et assignez-lui des appartements.</p>
                </div>`;
            return;
        }

        els.list.innerHTML = items
            .map((o) => {
                const props = o.properties || [];
                const selected =
                    Number(selectedOwnerId) === Number(o.id) ? "is-selected" : "";
                return `
                <article class="act-row own-row ${selected}" data-id="${o.id}">
                    <div class="own-avatar">${(o.prenom || "P")[0]}${(o.nom || "")[0] || ""}</div>
                    <div class="act-row__meta">
                        <h4>${o.prenom || ""} ${o.nom || ""}</h4>
                        <p>${o.email}${o.telephone ? " · " + o.telephone : ""}</p>
                        <div class="act-badges">
                            <span class="act-badge ${o.isActive ? "act-badge--pub" : "act-badge--draft"}">
                                ${o.isActive ? "Actif" : "Inactif"}
                            </span>
                            <span class="act-badge act-badge--cat">${props.length} bien(s)</span>
                            ${
                                o.pendingReservations
                                    ? `<span class="act-badge act-badge--draft">${o.pendingReservations} résa en attente</span>`
                                    : o.reservationsCount
                                      ? `<span class="act-badge act-badge--cat">${o.reservationsCount} résa</span>`
                                      : ""
                            }
                            ${
                                o.pendingProperties
                                    ? `<span class="act-badge act-badge--draft">${o.pendingProperties} bien(s) à valider</span>`
                                    : ""
                            }
                        </div>
                        ${
                            props.length
                                ? `<ul class="own-prop-mini">${props
                                      .map((p) => `<li>${p.title}</li>`)
                                      .join("")}</ul>`
                                : ""
                        }
                    </div>
                    <div class="act-row__actions">
                        <button type="button" class="act-btn act-btn--ghost act-btn--sm" data-action="edit">
                            <i class="fas fa-pen"></i> Modifier
                        </button>
                        <button type="button" class="act-btn act-btn--danger act-btn--sm" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </article>`;
            })
            .join("");
    }

    async function loadAll() {
        setStatus("Chargement…");
        try {
            let [props, list] = await Promise.all([
                window.AdminAPI.fetch("/api/admin/properties"),
                window.AdminAPI.fetch("/api/owner/proprietaires"),
            ]);
            if (!Array.isArray(props) || !props.length) {
                try {
                    const synced = await window.AdminAPI.fetch("/api/owner/sync-site-properties", {
                        method: "POST",
                        body: JSON.stringify({}),
                    });
                    props = synced.properties || props;
                } catch (syncErr) {
                    console.warn("Sync site properties:", syncErr);
                }
            }
            allProperties = Array.isArray(props) ? props : [];
            owners = Array.isArray(list) ? list : [];
            renderList();
            renderPropertyChecks(
                editingId
                    ? (
                          owners.find((o) => o.id === editingId)?.properties ||
                          []
                      ).map((p) => p.id)
                    : lastSelectedIds
            );
            const byType = allProperties.reduce((acc, p) => {
                acc[p.type] = (acc[p.type] || 0) + 1;
                return acc;
            }, {});
            setStatus(
                `${owners.length} propriétaire(s) · ${allProperties.length} biens (${byType.appartement || 0} app., ${byType.villa || 0} villa(s), ${byType.chalet || 0} chalet(s))`,
                "ok"
            );
            if (selectedOwnerId) {
                await loadOwnerReservations(selectedOwnerId);
            } else if (owners.length && !editingId) {
                await selectOwner(owners[0]);
            }
        } catch (err) {
            console.error(err);
            setStatus(err.message || "Erreur API", "error");
        }
    }

    async function syncOnly() {
        setStatus("Synchronisation des biens du site…");
        try {
            const result = await window.AdminAPI.fetch(
                "/api/owner/sync-site-properties",
                { method: "POST", body: JSON.stringify({}) }
            );
            allProperties = Array.isArray(result.properties)
                ? result.properties
                : allProperties;
            renderPropertyChecks(selectedPropertyIds());
            setStatus(
                `Sync OK : ${result.created || 0} créés, ${result.updated || 0} mis à jour (${result.total || allProperties.length} au total).`,
                "ok"
            );
            await loadAll();
        } catch (err) {
            setStatus(err.message, "error");
        }
    }

    async function saveOwner() {
        const data = {
            nom: els.form.nom.value.trim(),
            prenom: els.form.prenom.value.trim(),
            email: els.form.email.value.trim(),
            telephone: els.form.telephone.value.trim(),
            password: els.form.password.value,
            propertyIds: selectedPropertyIds(),
        };

        if (!data.nom || !data.prenom || !data.email) {
            setStatus("Nom, prénom et email obligatoires.", "error");
            return;
        }

        try {
            if (!editingId) {
                if (!data.password) {
                    setStatus("Mot de passe obligatoire.", "error");
                    return;
                }
                setStatus("Création…");
                const created = await window.AdminAPI.fetch(
                    "/api/owner/proprietaires",
                    { method: "POST", body: JSON.stringify(data) }
                );
                editingId = created.id;
                selectedOwnerId = created.id;
                setStatus("Compte créé. Le propriétaire peut se connecter.", "ok");
            } else {
                setStatus("Mise à jour des biens…");
                await window.AdminAPI.fetch(
                    `/api/owner/proprietaires/${editingId}/properties`,
                    {
                        method: "PUT",
                        body: JSON.stringify({ propertyIds: data.propertyIds }),
                    }
                );
                if (data.password) {
                    await window.AdminAPI.fetch(
                        `/api/users/${editingId}/reset-password`,
                        {
                            method: "PUT",
                            body: JSON.stringify({ password: data.password }),
                        }
                    );
                }
                await window.AdminAPI.fetch(`/api/users/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        nom: data.nom,
                        prenom: data.prenom,
                        email: data.email,
                        telephone: data.telephone,
                    }),
                });
                setStatus("Propriétaire mis à jour.", "ok");
            }
            await loadAll();
            const owner = owners.find((o) => o.id === editingId);
            if (owner) await selectOwner(owner);
        } catch (err) {
            setStatus(err.message, "error");
        }
    }

    async function deleteOwner(id) {
        if (!confirm("Supprimer ce compte propriétaire ?")) return;
        try {
            await window.AdminAPI.fetch(`/api/users/${id}`, { method: "DELETE" });
            if (editingId === id || selectedOwnerId === id) resetForm();
            await loadAll();
            setStatus("Compte supprimé.", "ok");
        } catch (err) {
            setStatus(err.message, "error");
        }
    }

    async function updateReservationStatus(id, status) {
        try {
            await window.AdminAPI.fetch(
                `/api/property-reservations/${id}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({ status }),
                }
            );
            if (selectedOwnerId) await loadOwnerReservations(selectedOwnerId);
            setStatus(`Réservation #${id} → ${statusLabel(status)}`, "ok");
        } catch (err) {
            // fallback si AdminAPI exige auth et route est publique
            try {
                const res = await fetch(
                    `${window.AdminAPI.base}/api/property-reservations/${id}/status`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status }),
                    }
                );
                const body = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(body.error || body.message || "Erreur");
                if (selectedOwnerId) await loadOwnerReservations(selectedOwnerId);
                setStatus(`Réservation #${id} → ${statusLabel(status)}`, "ok");
            } catch (err2) {
                setStatus(err2.message || err.message, "error");
            }
        }
    }

    els.list?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        const row = e.target.closest("[data-id]");
        if (!row) return;
        const id = Number(row.dataset.id);
        const owner = owners.find((o) => o.id === id);
        if (!owner) return;

        if (btn?.dataset.action === "delete") {
            e.stopPropagation();
            deleteOwner(id);
            return;
        }
        // Clic sur la ligne ou Modifier → formulaire + demandes
        selectOwner(owner).then(() => {
            if (window.matchMedia("(max-width: 1100px)").matches) {
                els.resaPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    els.resaList?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-resa-action]");
        if (!btn) return;
        const id = btn.dataset.id;
        const status = btn.dataset.resaAction;
        if (status === "refusee" && !confirm("Refuser cette demande de réservation ?")) return;
        btn.closest(".resa-card")?.classList.add("is-busy");
        updateReservationStatus(id, status);
    });

    els.btnNew?.addEventListener("click", resetForm);
    els.btnSave?.addEventListener("click", (e) => {
        e.preventDefault();
        saveOwner();
    });
    els.search?.addEventListener("input", renderList);
    document.getElementById("ownBtnSync")?.addEventListener("click", syncOnly);

    document.querySelectorAll(".is-prop-filter").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll(".is-prop-filter")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            selectedPropertyIds();
            propTypeFilter = btn.dataset.type || "all";
            renderPropertyChecks(lastSelectedIds);
        });
    });

    document.querySelectorAll(".is-resa-filter").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll(".is-resa-filter")
                .forEach((b) => b.classList.toggle("is-active", b === btn));
            resaStatusFilter = btn.dataset.status || "all";
            renderReservations();
        });
    });

    els.propsBox?.addEventListener("change", () => {
        selectedPropertyIds();
    });

    window.addEventListener("admin:navigate", (e) => {
        if (e.detail?.page === "proprietaires") loadAll();
    });

    window.addEventListener("admin:select-owner", async (e) => {
        const id = Number(e.detail?.id);
        if (!id) return;
        if (!owners.length) await loadAll();
        const owner = owners.find((o) => o.id === id);
        if (owner) await selectOwner(owner);
    });

    if ((location.hash || "").slice(1) === "proprietaires") {
        loadAll();
    }

    resetForm();
})();
