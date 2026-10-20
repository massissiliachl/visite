/**
 * Admin CRUD activités — aperçu identique aux cartes du site
 */
(function () {
    const isLocal =
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";
    const API_BASE = isLocal
        ? location.port === "3000"
            ? location.origin
            : "http://127.0.0.1:3000"
        : "https://visitebejai.onrender.com";

    const assetPrefix = "../";

    const els = {
        list: document.getElementById("actList"),
        status: document.getElementById("actStatus"),
        search: document.getElementById("actSearch"),
        filter: document.getElementById("actFilter"),
        form: document.getElementById("actForm"),
        editorTitle: document.getElementById("actEditorTitle"),
        preview: document.getElementById("actPreview"),
        btnNew: document.getElementById("actBtnNew"),
        btnSave: document.getElementById("actBtnSave"),
        btnPublish: document.getElementById("actBtnPublish"),
        btnReset: document.getElementById("actBtnReset"),
    };

    let activities = [];
    let editingSlug = null;

    function setStatus(msg, type) {
        if (!els.status) return;
        els.status.textContent = msg || "";
        els.status.className = "act-status" + (type ? ` is-${type}` : "");
    }

    function resolveImage(src) {
        if (!src) return assetPrefix + "assets/images/all.jpg";
        if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
        if (src.startsWith("../") || src.startsWith("/")) return src;
        return assetPrefix + src.replace(/^\.\//, "");
    }

    function formValues() {
        const fd = new FormData(els.form);
        const notes = String(fd.get("activityNote") || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        const options = String(fd.get("options") || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [label, price] = line.split("|").map((s) => s.trim());
                return { label, price: Number(price) || 0 };
            })
            .filter((o) => o.label);

        const slug = String(fd.get("slug") || "").trim();
        return {
            slug,
            name: String(fd.get("name") || "").trim(),
            basePrice: String(fd.get("basePrice") || "").trim(),
            category: String(fd.get("category") || "mer"),
            icon: String(fd.get("icon") || "fa-star").trim(),
            image: String(fd.get("image") || "").trim(),
            desc: String(fd.get("desc") || "").trim(),
            hasChild: fd.get("hasChild") === "on",
            childPrice: Number(fd.get("childPrice")) || 0,
            sortOrder: Number(fd.get("sortOrder")) || 0,
            published: fd.get("published") === "on",
            activityNote: notes,
            options,
        };
    }

    function fillForm(act) {
        if (!els.form) return;
        els.form.slug.value = act?.slug || act?.id || "";
        els.form.slug.readOnly = !!act;
        els.form.name.value = act?.name || "";
        els.form.basePrice.value =
            act?.basePrice != null ? String(act.basePrice) : "";
        els.form.category.value = act?.category || "mer";
        els.form.icon.value = act?.icon || "fa-star";
        els.form.image.value = act?.image || "";
        els.form.desc.value = act?.desc || "";
        els.form.hasChild.checked = !!act?.hasChild;
        els.form.childPrice.value = act?.childPrice || 0;
        els.form.sortOrder.value = act?.sortOrder || 0;
        els.form.published.checked = !!act?.published;
        els.form.activityNote.value = (act?.activityNote || []).join("\n");
        els.form.options.value = (act?.options || [])
            .map((o) => `${o.label}|${o.price}`)
            .join("\n");
        editingSlug = act?.slug || act?.id || null;
        if (els.editorTitle) {
            els.editorTitle.textContent = act
                ? "Modifier l'activité"
                : "Nouvelle activité";
        }
        updatePreview();
    }

    function resetForm() {
        fillForm(null);
        setStatus("");
    }

    function toCardAct(data) {
        let basePrice = data.basePrice;
        if (/^\d+$/.test(String(basePrice).trim())) {
            basePrice = Number(basePrice);
        }
        return {
            id: data.slug || data.id || "preview",
            name: data.name || "Sans titre",
            basePrice: basePrice || 0,
            category: data.category || "mer",
            icon: data.icon || "fa-star",
            image: resolveImage(data.image),
            desc: data.desc || "Description…",
            hasChild: !!data.hasChild,
            childPrice: data.childPrice || 0,
        };
    }

    function updatePreview() {
        if (!els.preview || !window.ActivityCards) return;
        const act = toCardAct(formValues());
        els.preview.innerHTML = `
            <div class="activities-grid">
                ${ActivityCards.buildHTML(act, 0)}
            </div>`;
        const card = els.preview.querySelector(".activity-card");
        if (card) {
            card.style.opacity = "1";
            card.style.animation = "none";
        }
    }

    function filteredList() {
        const q = (els.search?.value || "").trim().toLowerCase();
        const f = els.filter?.value || "all";
        return activities.filter((a) => {
            if (f === "published" && !a.published) return false;
            if (f === "draft" && a.published) return false;
            if (f === "mer" || f === "terre" || f === "culture") {
                if (a.category !== f) return false;
            }
            if (!q) return true;
            return (
                a.name.toLowerCase().includes(q) ||
                String(a.id || a.slug).toLowerCase().includes(q)
            );
        });
    }

    function renderList() {
        if (!els.list) return;
        const items = filteredList();
        if (!items.length) {
            els.list.innerHTML = `
                <div class="admin-empty">
                    <i class="fas fa-layer-group"></i>
                    <strong>Aucune activité</strong>
                    <p>Créez une activité puis publiez-la sur le site.</p>
                </div>`;
            return;
        }

        els.list.innerHTML = items
            .map((a) => {
                const img = resolveImage(a.image);
                const price =
                    typeof a.basePrice === "number"
                        ? `${a.basePrice.toLocaleString("fr-DZ")} DA`
                        : a.basePrice;
                return `
                <article class="act-row" data-slug="${a.id || a.slug}">
                    <img class="act-row__thumb" src="${img}" alt="" onerror="this.src='${assetPrefix}assets/images/all.jpg'">
                    <div class="act-row__meta">
                        <h4>${a.name}</h4>
                        <p>${price} · ${a.id || a.slug}</p>
                        <div class="act-badges">
                            <span class="act-badge ${a.published ? "act-badge--pub" : "act-badge--draft"}">
                                ${a.published ? "Publiée" : "Brouillon"}
                            </span>
                            <span class="act-badge act-badge--cat">${a.category}</span>
                        </div>
                    </div>
                    <div class="act-row__actions">
                        <button type="button" class="act-btn act-btn--ghost act-btn--sm" data-action="edit">
                            <i class="fas fa-pen"></i> Modifier
                        </button>
                        <button type="button" class="act-btn act-btn--ghost act-btn--sm" data-action="toggle">
                            <i class="fas fa-${a.published ? "eye-slash" : "globe"}"></i>
                            ${a.published ? "Dépublier" : "Publier"}
                        </button>
                        <button type="button" class="act-btn act-btn--danger act-btn--sm" data-action="delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </article>`;
            })
            .join("");
    }

    async function loadActivities() {
        setStatus("Chargement…");
        try {
            const res = await fetch(`${API_BASE}/api/admin/activities`);
            if (!res.ok) throw new Error("API indisponible");
            activities = await res.json();
            renderList();
            setStatus(`${activities.length} activité(s)`, "ok");
        } catch (err) {
            console.error(err);
            setStatus(
                "Impossible de charger les activités (API). Vérifiez que le backend tourne.",
                "error"
            );
            activities = [];
            renderList();
        }
    }

    async function saveActivity(publishOverride) {
        const data = formValues();
        if (publishOverride !== undefined) data.published = publishOverride;

        if (!data.name || !data.desc) {
            setStatus("Nom et description obligatoires.", "error");
            return;
        }
        if (!editingSlug && !data.slug) {
            setStatus("Slug obligatoire pour une nouvelle activité.", "error");
            return;
        }

        const isEdit = !!editingSlug;
        const url = isEdit
            ? `${API_BASE}/api/admin/activities/${encodeURIComponent(editingSlug)}`
            : `${API_BASE}/api/admin/activities`;
        const method = isEdit ? "PUT" : "POST";

        setStatus("Enregistrement…");
        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || "Erreur sauvegarde");
            setStatus(
                data.published
                    ? "Enregistrée et publiée sur le site."
                    : "Enregistrée (brouillon).",
                "ok"
            );
            editingSlug = body.id || body.slug;
            fillForm(body);
            await loadActivities();
        } catch (err) {
            setStatus(err.message || "Erreur", "error");
        }
    }

    async function togglePublish(slug, published) {
        try {
            const res = await fetch(
                `${API_BASE}/api/admin/activities/${encodeURIComponent(slug)}/publish`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ published }),
                }
            );
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.error || "Erreur publish");
            await loadActivities();
            if (editingSlug === slug) fillForm(body);
            setStatus(
                published ? "Publiée sur le site." : "Retirée du site.",
                "ok"
            );
        } catch (err) {
            setStatus(err.message, "error");
        }
    }

    async function removeActivity(slug) {
        if (!confirm(`Supprimer l'activité « ${slug} » ?`)) return;
        try {
            const res = await fetch(
                `${API_BASE}/api/admin/activities/${encodeURIComponent(slug)}`,
                { method: "DELETE" }
            );
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Erreur suppression");
            }
            if (editingSlug === slug) resetForm();
            await loadActivities();
            setStatus("Activité supprimée.", "ok");
        } catch (err) {
            setStatus(err.message, "error");
        }
    }

    els.list?.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        const row = e.target.closest("[data-slug]");
        if (!btn || !row) return;
        const slug = row.dataset.slug;
        const act = activities.find((a) => (a.id || a.slug) === slug);
        if (!act) return;
        const action = btn.dataset.action;
        if (action === "edit") fillForm(act);
        if (action === "toggle") togglePublish(slug, !act.published);
        if (action === "delete") removeActivity(slug);
    });

    els.btnNew?.addEventListener("click", resetForm);
    els.btnReset?.addEventListener("click", (e) => {
        e.preventDefault();
        resetForm();
    });
    els.btnSave?.addEventListener("click", (e) => {
        e.preventDefault();
        saveActivity();
    });
    els.btnPublish?.addEventListener("click", (e) => {
        e.preventDefault();
        saveActivity(true);
    });

    els.form?.addEventListener("input", updatePreview);
    els.form?.addEventListener("change", updatePreview);
    els.search?.addEventListener("input", renderList);
    els.filter?.addEventListener("change", renderList);

    window.addEventListener("admin:navigate", (e) => {
        if (e.detail?.page === "activites") loadActivities();
    });

    if ((location.hash || "").slice(1) === "activites") {
        loadActivities();
    }

    resetForm();
})();
