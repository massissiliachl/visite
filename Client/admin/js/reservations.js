/**
 * Réservations admin — activités (/api/reservations) et hébergements (/api/property-reservations)
 */
(function () {
    const STATUS = {
        en_attente: { label: "En attente", cls: "is-pending" },
        acceptee: { label: "Acceptée", cls: "is-ok" },
        refusee: { label: "Refusée", cls: "is-ko" },
        annulee: { label: "Annulée", cls: "is-ko" },
    };

    const KINDS = {
        act: {
            page: "reservations",
            endpoint: "/api/reservations",
            listQuery: "?light=1",
            icon: "fa-person-swimming",
            normalize: (r) => ({
                id: r.id,
                name: `${r.prenom || ""} ${r.nom || ""}`.trim() || "Client",
                email: r.email,
                phone: r.telephone,
                item: r.nom_item || r.type_reservation || "Activité",
                dateLabel: fmtDate(r.date_depart),
                dateSort: r.date_depart,
                persons: r.nb_personnes,
                total: r.prix_total,
                deposit: r.acompte_30pct,
                payMode: r.mode_paiement,
                payStatus: r.paiement_statut,
                payRef: r.transaction_ref,
                proof: r.payment_proof || (r.has_proof ? "lazy" : null),
                note: r.demandes_speciales,
                status: String(r.status || "en_attente").toLowerCase(),
                created: r.createdAt,
            }),
        },
        heb: {
            page: "reservations-hebergement",
            endpoint: "/api/property-reservations",
            icon: "fa-house",
            normalize: (r) => ({
                id: r.id,
                name: `${r.prenom || ""} ${r.nom || ""}`.trim() || "Client",
                email: r.email,
                phone: r.telephone,
                item: r.Property?.title || `Hébergement #${r.propertyId}`,
                dateLabel: `${fmtDate(r.date_arrivee)} → ${fmtDate(r.date_depart)}`,
                nights: nightsBetween(r.date_arrivee, r.date_depart),
                dateSort: r.date_arrivee,
                persons: r.nb_personnes,
                total: r.prix_total,
                payStatus: r.payment_status,
                proof: r.payment_proof,
                note: r.message,
                status: String(r.status || "en_attente").toLowerCase(),
                created: r.createdAt,
            }),
        },
    };

    function fmtDate(d) {
        if (!d) return "—";
        const x = new Date(d);
        return isNaN(x) ? String(d) : x.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    }

    function nightsBetween(a, b) {
        const n = Math.round((new Date(b) - new Date(a)) / 86400000);
        return n > 0 ? n : 0;
    }

    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0));
    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const waNumber = (p) => {
        let d = String(p || "").replace(/\D/g, "");
        if (d.startsWith("00")) d = d.slice(2);
        else if (d.startsWith("0")) d = "213" + d.slice(1);
        return d;
    };

    function openProof(src) {
        let box = document.getElementById("resaProofBox");
        if (!box) {
            box = document.createElement("div");
            box.id = "resaProofBox";
            box.className = "resa-proof";
            box.innerHTML = '<div class="resa-proof__inner"><button type="button" class="resa-proof__close" aria-label="Fermer"><i class="fas fa-xmark"></i></button><div class="resa-proof__media"></div></div>';
            box.addEventListener("click", (e) => {
                if (e.target === box || e.target.closest(".resa-proof__close")) box.classList.remove("is-open");
            });
            document.body.appendChild(box);
        }
        const url = /^(data:|https?:|blob:)/.test(src) ? src : `${window.AdminAPI.base}/${String(src).replace(/^\/+/, "")}`;
        box.querySelector(".resa-proof__media").innerHTML = /pdf/i.test(url.slice(0, 60))
            ? `<iframe src="${esc(url)}" title="Preuve de paiement"></iframe>`
            : `<img src="${esc(url)}" alt="Preuve de paiement">`;
        box.classList.add("is-open");
    }

    function createModule(host) {
        const kind = KINDS[host.dataset.resaKind];
        const state = { rows: [], filter: "en_attente", q: "", loaded: false, loading: false };

        host.innerHTML = `
            <div class="resa-toolbar">
                <div class="resa-tabs" role="tablist">
                    <button type="button" data-f="en_attente" class="is-active">En attente <em>0</em></button>
                    <button type="button" data-f="acceptee">Acceptées <em>0</em></button>
                    <button type="button" data-f="refusee">Refusées <em>0</em></button>
                    <button type="button" data-f="all">Toutes <em>0</em></button>
                </div>
                <div class="resa-toolbar__right">
                    <label class="resa-search"><i class="fas fa-search"></i><input type="search" placeholder="Client, email, ${host.dataset.resaKind === "act" ? "activité" : "bien"}…"></label>
                    <button type="button" class="resa-refresh" title="Actualiser"><i class="fas fa-rotate"></i></button>
                </div>
            </div>
            <p class="resa-status" aria-live="polite"></p>
            <div class="resa-list"></div>`;

        const list = host.querySelector(".resa-list");
        const statusEl = host.querySelector(".resa-status");
        const tabs = host.querySelectorAll(".resa-tabs button");

        tabs.forEach((t) =>
            t.addEventListener("click", () => {
                state.filter = t.dataset.f;
                tabs.forEach((x) => x.classList.toggle("is-active", x === t));
                render();
            })
        );
        host.querySelector(".resa-search input").addEventListener("input", (e) => {
            state.q = e.target.value.trim().toLowerCase();
            render();
        });
        host.querySelector(".resa-refresh").addEventListener("click", load);

        list.addEventListener("click", async (e) => {
            const btn = e.target.closest("[data-action]");
            if (!btn) return;
            const card = btn.closest("[data-id]");
            const id = card?.dataset.id;
            const row = state.rows.find((r) => String(r.id) === id);
            if (!row) return;

            const action = btn.dataset.action;
            if (action === "proof") {
                if (row.proof !== "lazy") return openProof(row.proof);
                card.classList.add("is-busy");
                try {
                    const full = await window.AdminAPI.fetch(`${kind.endpoint}/${id}`);
                    row.proof = full?.payment_proof || null;
                    if (row.proof) openProof(row.proof);
                    else alert("Aucune preuve de paiement trouvée.");
                } catch (err) {
                    alert(err.message);
                } finally {
                    card.classList.remove("is-busy");
                }
                return;
            }

            if (action === "delete") {
                if (!confirm(`Supprimer définitivement la réservation de ${row.name} ?`)) return;
            } else if (action === "refusee") {
                if (!confirm(`Refuser la réservation de ${row.name} ?`)) return;
            }

            card.classList.add("is-busy");
            try {
                if (action === "delete") {
                    await window.AdminAPI.fetch(`${kind.endpoint}/${id}`, { method: "DELETE" });
                    state.rows = state.rows.filter((r) => r !== row);
                    flash("Réservation supprimée.");
                } else {
                    await window.AdminAPI.fetch(`${kind.endpoint}/${id}/status`, {
                        method: "PUT",
                        body: JSON.stringify({ status: action }),
                    });
                    row.status = action;
                    flash(`Réservation de ${row.name} : ${STATUS[action].label.toLowerCase()}.`);
                }
                render();
            } catch (err) {
                card.classList.remove("is-busy");
                flash(err.message, true);
            }
        });

        function flash(msg, isError) {
            statusEl.textContent = msg;
            statusEl.classList.toggle("is-error", !!isError);
            clearTimeout(flash.t);
            flash.t = setTimeout(() => (statusEl.textContent = ""), 4000);
        }

        function counts() {
            const c = { en_attente: 0, acceptee: 0, refusee: 0, all: state.rows.length };
            state.rows.forEach((r) => {
                if (r.status === "annulee") c.refusee++;
                else if (r.status in c) c[r.status]++;
            });
            tabs.forEach((t) => (t.querySelector("em").textContent = c[t.dataset.f]));
        }

        function card(r) {
            const st = STATUS[r.status] || STATUS.en_attente;
            const initials = r.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const wa = waNumber(r.phone);
            const actions =
                r.status === "en_attente"
                    ? `<button type="button" class="resa-btn resa-btn--ok" data-action="acceptee"><i class="fas fa-check"></i> Accepter</button>
                       <button type="button" class="resa-btn resa-btn--ko" data-action="refusee"><i class="fas fa-xmark"></i> Refuser</button>`
                    : `<button type="button" class="resa-btn" data-action="en_attente"><i class="fas fa-rotate-left"></i> Remettre en attente</button>`;

            return `
            <article class="resa-card ${st.cls}" data-id="${esc(r.id)}">
                <header class="resa-card__head">
                    <div class="resa-card__client">
                        <i class="resa-avatar">${esc(initials)}</i>
                        <div>
                            <strong>${esc(r.name)}</strong>
                            <span>#${esc(r.id)}${r.created ? " · reçue le " + esc(fmtDate(r.created)) : ""}</span>
                        </div>
                    </div>
                    <em class="dash-pill ${st.cls}">${st.label}</em>
                </header>

                <div class="resa-card__item"><i class="fas ${kind.icon}"></i>${esc(r.item)}</div>

                <dl class="resa-card__facts">
                    <div><dt>Date</dt><dd>${esc(r.dateLabel)}${r.nights ? ` <small>${r.nights} nuit${r.nights > 1 ? "s" : ""}</small>` : ""}</dd></div>
                    <div><dt>Personnes</dt><dd>${esc(r.persons ?? "—")}</dd></div>
                    <div><dt>Montant</dt><dd class="resa-amount">${r.total ? fmt(r.total) + " DA" : "Sur devis"}</dd></div>
                    ${r.deposit ? `<div><dt>Acompte 30%</dt><dd>${fmt(r.deposit)} DA</dd></div>` : ""}
                    ${r.payMode ? `<div><dt>Paiement</dt><dd>${esc(r.payMode)}</dd></div>` : ""}
                    ${r.payStatus ? `<div><dt>Statut paiement</dt><dd>${esc(String(r.payStatus).replace(/_/g, " "))}</dd></div>` : ""}
                    ${r.payRef ? `<div><dt>Référence</dt><dd>${esc(r.payRef)}</dd></div>` : ""}
                </dl>

                ${r.note ? `<p class="resa-card__note"><i class="fas fa-quote-left"></i>${esc(r.note)}</p>` : ""}

                <div class="resa-card__contact">
                    ${r.phone ? `<a href="tel:${esc(r.phone)}"><i class="fas fa-phone"></i>${esc(r.phone)}</a>` : ""}
                    ${wa ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener" class="is-wa"><i class="fab fa-whatsapp"></i>WhatsApp</a>` : ""}
                    ${r.email ? `<a href="mailto:${esc(r.email)}"><i class="fas fa-envelope"></i>${esc(r.email)}</a>` : ""}
                    ${r.proof ? `<button type="button" data-action="proof"><i class="fas fa-receipt"></i>Preuve de paiement</button>` : ""}
                </div>

                <footer class="resa-card__actions">
                    ${actions}
                    <button type="button" class="resa-btn resa-btn--icon" data-action="delete" title="Supprimer"><i class="fas fa-trash"></i></button>
                </footer>
            </article>`;
        }

        function render() {
            counts();
            if (!state.loaded) return;
            const rows = state.rows
                .filter((r) => {
                    if (state.filter === "all") return true;
                    if (state.filter === "refusee") return r.status === "refusee" || r.status === "annulee";
                    return r.status === state.filter;
                })
                .filter((r) => !state.q || [r.name, r.email, r.phone, r.item, r.id].join(" ").toLowerCase().includes(state.q));

            list.innerHTML = rows.length
                ? rows.map(card).join("")
                : `<div class="admin-empty"><i class="fas fa-inbox"></i><strong>Aucune réservation</strong><p>${state.q ? "Aucun résultat pour cette recherche." : "Rien dans cette catégorie pour le moment."}</p></div>`;
        }

        async function load() {
            if (state.loading) return;
            state.loading = true;
            host.classList.add("is-loading");
            if (!state.loaded) {
                list.innerHTML = Array.from({ length: 4 }, () => '<div class="resa-card resa-card--skeleton"></div>').join("");
            }
            try {
                const res = await window.AdminAPI.fetch(kind.endpoint + (kind.listQuery || ""));
                const raw = Array.isArray(res) ? res : res?.data || [];
                state.rows = raw
                    .map(kind.normalize)
                    .sort((a, b) => new Date(b.created || b.dateSort) - new Date(a.created || a.dateSort));
                state.loaded = true;
                render();
            } catch (err) {
                list.innerHTML = `<div class="admin-empty"><i class="fas fa-triangle-exclamation"></i><strong>Chargement impossible</strong><p>${esc(err.message)}</p></div>`;
            } finally {
                state.loading = false;
                host.classList.remove("is-loading");
            }
        }

        return { page: kind.page, load, isLoaded: () => state.loaded };
    }

    const modules = [...document.querySelectorAll(".resa-module")].map(createModule);

    function onPage(page) {
        modules.forEach((m) => {
            if (m.page === page && !m.isLoaded()) m.load();
        });
    }

    window.addEventListener("admin:navigate", (e) => onPage(e.detail?.page));
    onPage((location.hash || "").slice(1));
})();
