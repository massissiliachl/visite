/**
 * Admin — comptes employeurs (accès adminreservation.html)
 */
(function () {
    const els = {
        list: document.getElementById("empList"),
        form: document.getElementById("empForm"),
        status: document.getElementById("empStatus"),
        search: document.getElementById("empSearch"),
        refresh: document.getElementById("empRefresh"),
        btnNew: document.getElementById("empBtnNew"),
        btnSave: document.getElementById("empBtnSave"),
        editorTitle: document.getElementById("empEditorTitle"),
        passwordField: document.getElementById("empPasswordField"),
        resetField: document.getElementById("empResetField"),
        creds: document.getElementById("empCreds"),
        credEmail: document.getElementById("empCredEmail"),
        credPass: document.getElementById("empCredPass"),
        genPass: document.getElementById("empGenPass"),
        genReset: document.getElementById("empGenReset"),
    };

    if (!els.list || !els.form) return;

    let employeurs = [];
    let selectedId = null;
    let q = "";

    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    function setStatus(msg, type) {
        if (!els.status) return;
        els.status.textContent = msg || "";
        els.status.className = "act-status" + (type ? ` is-${type}` : "");
    }

    function genPassword() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        let out = "";
        for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
    }

    function fmtWhen(d) {
        if (!d) return "—";
        const x = new Date(d);
        if (isNaN(x)) return "—";
        return x.toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function showCreds(email, password) {
        if (!els.creds) return;
        els.creds.hidden = !password;
        if (els.credEmail) els.credEmail.textContent = email || "—";
        if (els.credPass) els.credPass.textContent = password || "—";
    }

    function fillForm(emp) {
        selectedId = emp?.id || null;
        els.form.prenom.value = emp?.prenom || "";
        els.form.nom.value = emp?.nom || "";
        els.form.email.value = emp?.email || "";
        els.form.telephone.value = emp?.telephone || "";
        els.form.password.value = "";
        if (els.form.newPassword) els.form.newPassword.value = "";
        const editing = !!selectedId;
        if (els.passwordField) els.passwordField.hidden = editing;
        if (els.resetField) els.resetField.hidden = !editing;
        els.form.password.required = !editing;
        if (els.editorTitle) els.editorTitle.textContent = editing ? "Modifier l'employeur" : "Nouvel employeur";
        if (els.btnSave) els.btnSave.innerHTML = editing
            ? '<i class="fas fa-floppy-disk"></i><span>Enregistrer</span>'
            : '<i class="fas fa-user-plus"></i><span>Créer le compte</span>';
        showCreds("", "");
        setStatus("");
        renderList();
    }

    function filtered() {
        const needle = q.trim().toLowerCase();
        if (!needle) return employeurs;
        return employeurs.filter((e) =>
            `${e.prenom || ""} ${e.nom || ""} ${e.email || ""} ${e.telephone || ""}`.toLowerCase().includes(needle)
        );
    }

    function renderList() {
        const rows = filtered();
        if (!rows.length) {
            els.list.innerHTML = `<div class="admin-empty"><i class="fas fa-users"></i><strong>${employeurs.length ? "Aucun résultat" : "Aucun employeur"}</strong><p>${employeurs.length ? "Modifiez la recherche." : "Créez le premier compte à droite."}</p></div>`;
            return;
        }
        els.list.innerHTML = rows
            .map((e) => {
                const name = `${e.prenom || ""} ${e.nom || ""}`.trim() || "Employeur";
                const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                const active = selectedId === e.id;
                return `<article class="emp-card${active ? " is-active" : ""}${e.isActive === false ? " is-off" : ""}" data-id="${e.id}">
                    <span class="emp-card__avatar">${esc(initials)}<i class="emp-dot ${e.isOnline ? "is-on" : ""}"></i></span>
                    <div class="emp-card__body">
                        <strong>${esc(name)}</strong>
                        <span>${esc(e.email || "")}</span>
                        <small>
                            <em class="dash-pill ${e.isActive === false ? "is-ko" : "is-ok"}">${e.isActive === false ? "Désactivé" : "Actif"}</em>
                            <button type="button" class="emp-resa-link" data-action="guichet" title="Voir ses réservations">${e.reservationsCount || 0} résa.</button>
                            ${e.lastReservationAt ? `<em>Dernière : ${esc(fmtWhen(e.lastReservationAt))}</em>` : ""}
                        </small>
                    </div>
                    <div class="emp-card__actions">
                        <button type="button" data-action="edit" title="Modifier"><i class="fas fa-pen"></i></button>
                        <button type="button" data-action="toggle" title="${e.isActive === false ? "Activer" : "Désactiver"}"><i class="fas fa-${e.isActive === false ? "toggle-off" : "toggle-on"}"></i></button>
                        <button type="button" data-action="delete" title="Supprimer"><i class="fas fa-trash"></i></button>
                    </div>
                </article>`;
            })
            .join("");
    }

    async function load() {
        els.list.innerHTML = Array.from({ length: 3 }, () => '<div class="resa-card resa-card--skeleton" style="min-height:88px"></div>').join("");
        try {
            const data = await window.AdminAPI.fetch("/api/auth/employeurs");
            employeurs = Array.isArray(data) ? data : data.data || [];
            renderList();
            setStatus(`${employeurs.length} employeur(s)`, "ok");
        } catch (err) {
            els.list.innerHTML = `<div class="admin-empty"><i class="fas fa-triangle-exclamation"></i><strong>Chargement impossible</strong><p>${esc(err.message)}</p></div>`;
        }
    }

    els.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            prenom: els.form.prenom.value.trim(),
            nom: els.form.nom.value.trim(),
            email: els.form.email.value.trim().toLowerCase(),
            telephone: els.form.telephone.value.trim() || null,
        };
        if (!payload.prenom || !payload.nom || !payload.email) {
            return setStatus("Prénom, nom et email sont obligatoires.", "error");
        }

        const btn = els.btnSave;
        if (btn) btn.disabled = true;
        try {
            if (!selectedId) {
                const password = els.form.password.value.trim() || genPassword();
                if (password.length < 6) throw new Error("Mot de passe trop court (6 caractères min.)");
                await window.AdminAPI.fetch("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify({ ...payload, password, role: "employeur" }),
                });
                const createdEmail = payload.email;
                fillForm(null);
                showCreds(createdEmail, password);
                setStatus("Compte créé. Transmettez les identifiants à l'employeur.", "ok");
            } else {
                await window.AdminAPI.fetch(`/api/auth/${selectedId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                const newPass = els.form.newPassword?.value.trim();
                if (newPass) {
                    if (newPass.length < 6) throw new Error("Mot de passe trop court (6 caractères min.)");
                    await window.AdminAPI.fetch(`/api/auth/${selectedId}/reset-password`, {
                        method: "PUT",
                        body: JSON.stringify({ password: newPass }),
                    });
                    showCreds(payload.email, newPass);
                    setStatus("Profil et mot de passe mis à jour.", "ok");
                } else {
                    setStatus("Profil mis à jour.", "ok");
                    showCreds("", "");
                }
            }
            await load();
        } catch (err) {
            setStatus(err.message, "error");
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    els.list.addEventListener("click", async (e) => {
        const card = e.target.closest("[data-id]");
        if (!card) return;
        const id = Number(card.dataset.id);
        const emp = employeurs.find((x) => x.id === id);
        if (!emp) return;
        const action = e.target.closest("[data-action]")?.dataset.action;

        if (action === "guichet") {
            e.stopPropagation();
            location.hash = `guichet?staff=${id}`;
            return;
        }

        if (action === "delete") {
            if (!confirm(`Supprimer le compte de ${emp.prenom} ${emp.nom} ?`)) return;
            try {
                await window.AdminAPI.fetch(`/api/auth/${id}`, { method: "DELETE" });
                if (selectedId === id) fillForm(null);
                await load();
                setStatus("Employeur supprimé.", "ok");
            } catch (err) {
                setStatus(err.message, "error");
            }
            return;
        }

        if (action === "toggle") {
            try {
                await window.AdminAPI.fetch(`/api/auth/${id}/status`, {
                    method: "PUT",
                    body: JSON.stringify({ isActive: emp.isActive === false }),
                });
                await load();
            } catch (err) {
                setStatus(err.message, "error");
            }
            return;
        }

        fillForm(emp);
    });

    els.btnNew?.addEventListener("click", () => fillForm(null));
    els.refresh?.addEventListener("click", load);
    els.search?.addEventListener("input", () => {
        q = els.search.value;
        renderList();
    });
    els.genPass?.addEventListener("click", () => {
        els.form.password.value = genPassword();
    });
    els.genReset?.addEventListener("click", () => {
        if (els.form.newPassword) els.form.newPassword.value = genPassword();
    });

    window.addEventListener("admin:navigate", (e) => {
        if (e.detail?.page === "employeurs") load();
    });
    if ((location.hash || "").slice(1) === "employeurs") load();
})();
