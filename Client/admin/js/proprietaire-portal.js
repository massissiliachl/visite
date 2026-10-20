/**
 * Portail propriétaire — disponibilités de ses appartements
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

    const loginView = document.getElementById("ownerLogin");
    const appView = document.getElementById("ownerApp");
    const loginForm = document.getElementById("ownerLoginForm");
    const loginError = document.getElementById("ownerLoginError");
    const statusEl = document.getElementById("ownerStatus");
    const propsEl = document.getElementById("ownerProps");
    const calPanel = document.getElementById("ownerCalendarPanel");
    const blockedList = document.getElementById("ownerBlockedList");
    const selectedTitle = document.getElementById("ownerSelectedTitle");
    const resEl = document.getElementById("ownerReservations");

    let token = localStorage.getItem("owner_token") || "";
    let user = JSON.parse(localStorage.getItem("owner_user") || "null");
    let properties = [];
    let selectedId = null;
    let blocked = [];

    function setStatus(msg, type) {
        if (!statusEl) return;
        statusEl.textContent = msg || "";
        statusEl.className = "act-status" + (type ? ` is-${type}` : "");
    }

    async function api(path, options = {}) {
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || body.message || `Erreur ${res.status}`);
        return body;
    }

    function showApp() {
        loginView.classList.add("is-off");
        appView.classList.add("is-on");
        document.getElementById("ownerHello").textContent =
            `Bonjour ${user?.prenom || ""} ${user?.nom || ""}`.trim();
    }

    function showLogin() {
        loginView.classList.remove("is-off");
        appView.classList.remove("is-on");
        token = "";
        user = null;
        localStorage.removeItem("owner_token");
        localStorage.removeItem("owner_user");
    }

    function renderProps() {
        if (!properties.length) {
            propsEl.innerHTML = `
                <div class="admin-empty" style="grid-column:1/-1">
                    <i class="fas fa-building"></i>
                    <strong>Aucun hébergement</strong>
                    <p>Ajoutez un bien : il sera visible après validation par Visit Bejaia.</p>
                </div>`;
            return;
        }
        propsEl.innerHTML = properties
            .map((p) => {
                const status = p.approvalStatus || "approved";
                const statusLabel =
                    status === "pending"
                        ? "En attente de validation"
                        : status === "rejected"
                          ? "Refusé"
                          : "Validé";
                const statusClass =
                    status === "approved"
                        ? "act-badge--pub"
                        : "act-badge--draft";
                const canManage = status === "approved";
                const thumb = Array.isArray(p.images) && p.images[0]
                    ? p.images[0]
                    : "";
                return `
            <article class="owner-prop-card ${selectedId === p.id ? "is-active" : ""} ${!canManage ? "is-disabled" : ""}" data-id="${p.id}" data-approved="${canManage ? "1" : "0"}">
                ${thumb ? `<img src="${/^https?:|^\//.test(thumb) ? thumb : "../" + thumb}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:12px;margin-bottom:0.65rem" onerror="this.style.display='none'">` : ""}
                <h3>${p.title}</h3>
                <p>${p.location || ""} · ${p.type || ""}</p>
                <p style="margin-top:0.35rem;font-weight:600;color:var(--ink)">
                    ${(p.price || 0).toLocaleString("fr-DZ")} DA / nuit
                </p>
                <div class="act-badges" style="margin-top:0.5rem">
                    <span class="act-badge ${statusClass}">${statusLabel}</span>
                </div>
            </article>`;
            })
            .join("");
    }

    function renderBlocked() {
        if (!blocked.length) {
            blockedList.innerHTML =
                '<p class="act-status">Aucune date bloquée. Ajoutez une période ci-dessus.</p>';
            return;
        }
        blockedList.innerHTML = blocked
            .map(
                (b) => `
            <button type="button" class="owner-day is-blocked" data-date="${b.date}" title="${b.reason || ""}">
                ${b.date}<br><small>Débloquer</small>
            </button>`
            )
            .join("");
    }

    function datesBetween(from, to) {
        const out = [];
        const a = new Date(from + "T12:00:00");
        const b = new Date(to + "T12:00:00");
        if (Number.isNaN(a) || Number.isNaN(b) || a > b) return out;
        for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
            out.push(d.toISOString().slice(0, 10));
        }
        return out;
    }

    async function selectProperty(id) {
        const prop = properties.find((p) => p.id === id);
        if (!prop) return;
        if ((prop.approvalStatus || "approved") !== "approved") {
            selectedId = id;
            renderProps();
            calPanel.hidden = true;
            setStatus(
                prop.approvalStatus === "pending"
                    ? "Ce bien est en attente de validation admin."
                    : "Ce bien a été refusé par l’admin.",
                "error"
            );
            return;
        }
        selectedId = id;
        selectedTitle.textContent = prop
            ? `Disponibilités — ${prop.title}`
            : "Disponibilités";
        calPanel.hidden = false;
        renderProps();
        setStatus("Chargement des dates…");
        try {
            blocked = await api(`/api/owner/me/properties/${encodeURIComponent(id)}/blocked`);
            renderBlocked();
            setStatus(`${blocked.length} date(s) bloquée(s)`, "ok");
        } catch (err) {
            setStatus(err.message, "error");
        }
    }

    async function loadReservations() {
        try {
            const list = await api("/api/owner/me/reservations");
            if (!list.length) {
                resEl.innerHTML = `
                    <div class="admin-empty">
                        <i class="fas fa-inbox"></i>
                        <strong>Aucune réservation</strong>
                        <p>Les demandes sur vos appartements apparaîtront ici.</p>
                    </div>`;
                return;
            }
            resEl.innerHTML = `
                <div style="overflow-x:auto">
                <table style="width:100%;border-collapse:collapse;font-size:0.88rem">
                    <thead>
                        <tr style="text-align:left;color:var(--muted)">
                            <th style="padding:0.5rem">Bien</th>
                            <th style="padding:0.5rem">Client</th>
                            <th style="padding:0.5rem">Dates</th>
                            <th style="padding:0.5rem">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list
                            .map((r) => {
                                const title = r.Property?.title || r.propertyId;
                                const name = `${r.nom || ""} ${r.prenom || ""}`.trim() || r.email || "—";
                                return `<tr style="border-top:1px solid var(--line)">
                                    <td style="padding:0.55rem">${title}</td>
                                    <td style="padding:0.55rem">${name}</td>
                                    <td style="padding:0.55rem">${r.date_arrivee || r.arrivee || "—"} → ${r.date_depart || r.depart || "—"}</td>
                                    <td style="padding:0.55rem"><span class="act-badge act-badge--cat">${r.status || r.statut || "—"}</span></td>
                                </tr>`;
                            })
                            .join("")}
                    </tbody>
                </table>
                </div>`;
        } catch (err) {
            resEl.innerHTML = `<p class="act-status is-error">${err.message}</p>`;
        }
    }

    async function bootApp() {
        showApp();
        setStatus("Chargement…");
        try {
            properties = await api("/api/owner/me/properties");
            renderProps();
            setStatus(`${properties.length} hébergement(s)`, "ok");
            await loadReservations();
            const firstApproved = properties.find(
                (p) => (p.approvalStatus || "approved") === "approved"
            );
            if (firstApproved) selectProperty(firstApproved.id);
        } catch (err) {
            setStatus(err.message, "error");
            if (/token|401|403/i.test(err.message)) showLogin();
        }
    }

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        loginError.textContent = "";
        const fd = new FormData(loginForm);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: fd.get("email"),
                    password: fd.get("password"),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Connexion impossible");
            if (data.user?.role !== "proprietaire" && data.user?.role !== "admin") {
                throw new Error("Ce compte n’est pas un compte propriétaire.");
            }
            token = data.token;
            user = data.user;
            localStorage.setItem("owner_token", token);
            localStorage.setItem("owner_user", JSON.stringify(user));
            await bootApp();
        } catch (err) {
            loginError.textContent = err.message;
            loginError.className = "act-status is-error";
        }
    });

    document.getElementById("ownerLogout")?.addEventListener("click", showLogin);

    const addPanel = document.getElementById("ownerAddPanel");
    const addForm = document.getElementById("ownerAddForm");
    const imageFilesInput = document.getElementById("ownerImageFiles");
    const imagePreviews = document.getElementById("ownerImagePreviews");

    imageFilesInput?.addEventListener("change", () => {
        if (!imagePreviews) return;
        imagePreviews.innerHTML = "";
        const files = [...(imageFilesInput.files || [])];
        files.forEach((file) => {
            const url = URL.createObjectURL(file);
            const img = document.createElement("img");
            img.src = url;
            img.alt = file.name;
            imagePreviews.appendChild(img);
        });
    });

    async function uploadImages(files) {
        if (!files.length) return [];
        const body = new FormData();
        files.forEach((file) => body.append("images", file));
        const res = await fetch(`${API_BASE}/api/upload/multiple`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || data.message || "Upload impossible");
        }
        return Array.isArray(data.urls) ? data.urls : [];
    }

    document.getElementById("ownerBtnAdd")?.addEventListener("click", () => {
        if (addPanel) addPanel.hidden = !addPanel.hidden;
    });
    document.getElementById("ownerAddCancel")?.addEventListener("click", () => {
        if (addPanel) addPanel.hidden = true;
    });
    addForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const urlImages = String(fd.get("images") || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
        const files = [...(imageFilesInput?.files || [])];

        try {
            setStatus("Upload des images…");
            const uploaded = await uploadImages(files);
            const images = [...uploaded, ...urlImages];
            if (!images.length) {
                setStatus("Ajoutez au moins une image (fichier ou URL).", "error");
                return;
            }

            setStatus("Envoi de l’hébergement…");
            const payload = {
                title: fd.get("title"),
                type: fd.get("type"),
                location: fd.get("location"),
                description: fd.get("description"),
                price: Number(fd.get("price")) || 0,
                capacity: Number(fd.get("capacity")) || null,
                images,
            };
            await api("/api/owner/me/properties", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            addForm.reset();
            if (imagePreviews) imagePreviews.innerHTML = "";
            if (addPanel) addPanel.hidden = true;
            setStatus("Bien envoyé : en attente de validation admin.", "ok");
            properties = await api("/api/owner/me/properties");
            renderProps();
        } catch (err) {
            setStatus(err.message, "error");
        }
    });

    propsEl?.addEventListener("click", (e) => {
        const card = e.target.closest("[data-id]");
        if (card) selectProperty(card.dataset.id);
    });

    blockedList?.addEventListener("click", async (e) => {
        const btn = e.target.closest("[data-date]");
        if (!btn || !selectedId) return;
        const date = btn.dataset.date;
        if (!confirm(`Débloquer le ${date} ?`)) return;
        try {
            await api(
                `/api/owner/me/properties/${encodeURIComponent(selectedId)}/block/${date}`,
                { method: "DELETE" }
            );
            await selectProperty(selectedId);
            setStatus(`Date ${date} débloquée.`, "ok");
        } catch (err) {
            setStatus(err.message, "error");
        }
    });

    document.getElementById("ownerBlockBtn")?.addEventListener("click", async () => {
        if (!selectedId) return;
        const from = document.getElementById("ownerDateFrom").value;
        const to = document.getElementById("ownerDateTo").value || from;
        const reason = document.getElementById("ownerReason").value.trim();
        const dates = datesBetween(from, to);
        if (!dates.length) {
            setStatus("Choisissez une date de début (et fin).", "error");
            return;
        }
        try {
            const result = await api(
                `/api/owner/me/properties/${encodeURIComponent(selectedId)}/block`,
                {
                    method: "POST",
                    body: JSON.stringify({ dates, reason }),
                }
            );
            await selectProperty(selectedId);
            setStatus(`${result.count || dates.length} date(s) bloquée(s).`, "ok");
        } catch (err) {
            setStatus(err.message, "error");
        }
    });

    const today = new Date().toISOString().slice(0, 10);
    const fromEl = document.getElementById("ownerDateFrom");
    const toEl = document.getElementById("ownerDateTo");
    if (fromEl) fromEl.min = today;
    if (toEl) toEl.min = today;

    if (token && user?.role === "proprietaire") {
        bootApp();
    } else if (token && user?.role === "admin") {
        bootApp();
    }
})();
