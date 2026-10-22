/**
 * Tableau de bord admin — statistiques, graphique, dernières réservations
 */
(function () {
    const $ = (id) => document.getElementById(id);
    const MONTHS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    const STATUS = {
        en_attente: { label: "En attente", cls: "is-pending" },
        acceptee: { label: "Acceptée", cls: "is-ok" },
        refusee: { label: "Refusée", cls: "is-ko" },
        annulee: { label: "Annulée", cls: "is-ko" },
    };

    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const asList = (r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []);
    const statusOf = (r) => String(r.status || "en_attente").toLowerCase();

    async function safe(path) {
        try {
            return asList(await window.AdminAPI.fetch(path));
        } catch (e) {
            console.warn("[dashboard]", path, e.message);
            return [];
        }
    }

    function setBadge(id, n) {
        const el = $(id);
        if (!el) return;
        el.hidden = !n;
        el.textContent = n > 99 ? "99+" : String(n);
    }

    function renderHeader(pending, acceptRate) {
        const now = new Date();
        const h = now.getHours();
        $("dashGreeting").textContent = h < 18 ? "Bonjour, Admin" : "Bonsoir, Admin";
        $("dashDate").innerHTML =
            '<i class="fas fa-sun"></i> ' +
            esc(now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
        $("dashSummary").textContent = pending
            ? `Vous avez ${pending} réservation${pending > 1 ? "s" : ""} en attente de traitement.`
            : "Tout est à jour, aucune réservation en attente.";

        const ring = $("dashRing");
        const circ = 2 * Math.PI * 50;
        ring.style.strokeDasharray = String(circ);
        ring.style.strokeDashoffset = String(circ * (1 - acceptRate));
        $("dashRingValue").textContent = Math.round(acceptRate * 100) + "%";
    }

    function renderChart(acts, props) {
        const host = $("dashChart");
        const now = new Date();
        const buckets = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({ key: d.getFullYear() + "-" + d.getMonth(), label: MONTHS[d.getMonth()], a: 0, p: 0 });
        }
        const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
        const add = (list, field) =>
            list.forEach((r) => {
                const d = new Date(r.createdAt || r.date_depart || r.date_arrivee);
                if (isNaN(d)) return;
                const i = idx[d.getFullYear() + "-" + d.getMonth()];
                if (i !== undefined) buckets[i][field]++;
            });
        add(acts, "a");
        add(props, "p");

        const max = Math.max(1, ...buckets.map((b) => Math.max(b.a, b.p)));
        host.innerHTML =
            '<div class="dash-bars">' +
            buckets
                .map(
                    (b) => `
                <div class="dash-bars__col">
                    <div class="dash-bars__pair">
                        <span class="bar bar--sea" style="--h:${(b.a / max) * 100}%" title="${b.a} activité(s)"><em>${b.a || ""}</em></span>
                        <span class="bar bar--coral" style="--h:${(b.p / max) * 100}%" title="${b.p} hébergement(s)"><em>${b.p || ""}</em></span>
                    </div>
                    <small>${b.label}</small>
                </div>`
                )
                .join("") +
            "</div>";
    }

    function renderStatus(all) {
        const counts = { en_attente: 0, acceptee: 0, refusee: 0 };
        all.forEach((r) => {
            const s = statusOf(r);
            if (s in counts) counts[s]++;
            else if (s === "annulee") counts.refusee++;
        });
        const total = Math.max(1, all.length);
        $("dashStatus").innerHTML = Object.entries(counts)
            .map(
                ([k, v]) => `
            <div class="dash-status__row ${STATUS[k].cls}">
                <div class="dash-status__meta"><span>${STATUS[k].label}</span><strong>${v}</strong></div>
                <div class="dash-status__track"><i style="width:${(v / total) * 100}%"></i></div>
            </div>`
            )
            .join("");
    }

    function renderRecent(acts, props) {
        const rows = [
            ...acts.map((r) => ({
                kind: "act",
                name: `${r.prenom || ""} ${r.nom || ""}`.trim(),
                item: r.nom_item,
                date: r.date_depart,
                total: r.prix_total,
                status: statusOf(r),
                created: r.createdAt || r.date_depart,
                page: "reservations",
            })),
            ...props.map((r) => ({
                kind: "heb",
                name: `${r.prenom || ""} ${r.nom || ""}`.trim(),
                item: r.Property?.title || "Hébergement #" + r.propertyId,
                date: r.date_arrivee,
                total: r.prix_total,
                status: statusOf(r),
                created: r.createdAt || r.date_arrivee,
                page: "reservations-hebergement",
            })),
        ]
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 8);

        $("dashRecentCount").textContent = `${acts.length + props.length} au total`;
        if (!rows.length) {
            $("dashRecent").innerHTML =
                '<div class="admin-empty"><i class="fas fa-inbox"></i><strong>Aucune réservation</strong><p>Les nouvelles demandes apparaîtront ici.</p></div>';
            return;
        }

        $("dashRecent").innerHTML = `
            <div class="dash-table">
                <div class="dash-table__head">
                    <span>Client</span><span>Réservation</span><span>Date</span><span>Montant</span><span>Statut</span>
                </div>
                ${rows
                    .map((r) => {
                        const st = STATUS[r.status] || STATUS.en_attente;
                        const initials = (r.name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                        const d = r.date ? new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—";
                        return `
                    <div class="dash-table__row">
                        <span class="dash-client"><i class="dash-avatar dash-avatar--${r.kind}">${esc(initials)}</i><b>${esc(r.name || "Client")}</b></span>
                        <span class="dash-item"><i class="fas ${r.kind === "act" ? "fa-person-swimming" : "fa-house"}"></i>${esc(r.item || "—")}</span>
                        <span>${esc(d)}</span>
                        <span class="dash-amount">${r.total ? fmt(r.total) + " DA" : "—"}</span>
                        <span><em class="dash-pill ${st.cls}">${st.label}</em></span>
                    </div>`;
                    })
                    .join("")}
            </div>`;
    }

    function renderGuichetSummary(rows) {
        const host = $("dashGuichet");
        if (!host) return;
        const attributed = rows.filter((r) => r.createdByName || r.createdById);
        const counts = {};
        attributed.forEach((r) => {
            const key = r.createdByName || `Staff #${r.createdById}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        const top = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const none = rows.length - attributed.length;

        host.innerHTML = `
            <div class="dash-guichet__stats">
                <div><strong>${rows.length}</strong><span>Guichet</span></div>
                <div><strong>${attributed.length}</strong><span>Attribuées</span></div>
                <div><strong>${none}</strong><span>Sans nom</span></div>
            </div>
            ${
                top.length
                    ? `<ul class="dash-guichet__list">${top
                          .map(
                              ([name, n]) =>
                                  `<li><span>${esc(name)}</span><em>${n}</em></li>`
                          )
                          .join("")}</ul>`
                    : `<p class="dash-guichet__empty">Aucune prise enregistrée pour l’instant.</p>`
            }
            <button type="button" class="dash-guichet__btn" data-admin-page="guichet">
                <i class="fas fa-user-check"></i> Voir toutes les attributions
            </button>`;
    }

    async function load() {
        const [acts, props, properties, activities, guichet] = await Promise.all([
            safe("/api/reservations?light=1"),
            safe("/api/property-reservations"),
            safe("/api/admin/properties"),
            safe("/api/admin/activities"),
            safe("/api/reservations-admin"),
        ]);
        const all = [...acts, ...props];

        const pendingActs = acts.filter((r) => statusOf(r) === "en_attente").length;
        const pendingHeb = props.filter((r) => statusOf(r) === "en_attente").length;
        const pending = pendingActs + pendingHeb;
        const accepted = all.filter((r) => statusOf(r) === "acceptee");
        const revenue = accepted.reduce((s, r) => s + (Number(r.prix_total) || 0), 0);
        const decided = all.filter((r) => ["acceptee", "refusee", "annulee"].includes(statusOf(r))).length;
        const pendingProps = properties.filter((p) => p.approvalStatus === "pending").length;
        const published = activities.filter((a) => a.published).length;

        $("statPending").textContent = fmt(pending);
        $("statPendingChip").textContent = `${pendingActs} act. · ${pendingHeb} héb.`;
        $("statRevenue").textContent = fmt(revenue);
        $("statRevenueChip").textContent = `${accepted.length} acceptées`;
        $("statProps").textContent = fmt(properties.length);
        $("statPropsChip").textContent = pendingProps ? `${pendingProps} à valider` : "À jour";
        $("statActs").textContent = fmt(published);
        $("statActsChip").textContent = `${activities.length} au total`;
        $("statActsHint").textContent = `${activities.length - published} brouillon(s)`;

        setBadge("badgeResaAct", pendingActs);
        setBadge("badgeResaHeb", pendingHeb);
        setBadge("badgePropsPending", pendingProps);

        renderHeader(pending, decided ? accepted.length / decided : 0);
        renderChart(acts, props);
        renderStatus(all);
        renderRecent(acts, props);
        renderGuichetSummary(guichet);
    }

    if (sessionStorage.getItem("admin_jwt")) load();
    window.addEventListener("admin:ready", () => load());
    window.addEventListener("admin:navigate", (e) => {
        if (e.detail?.page === "dashboard" && window.AdminAPI) load();
    });
})();
