/**
 * Admin — Statistiques (activités, hébergements, guichet, employeurs)
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

    const fmt = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0));
    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const asList = (r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []);
    const statusOf = (r) => String(r.status || "en_attente").toLowerCase();

    const root = $("statsRoot");
    if (!root) return;

    let loaded = false;

    async function safe(path) {
        try {
            return asList(await window.AdminAPI.fetch(path));
        } catch (e) {
            console.warn("[stats]", path, e.message);
            return [];
        }
    }

    function monthBuckets() {
        const now = new Date();
        const buckets = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({
                key: d.getFullYear() + "-" + d.getMonth(),
                label: MONTHS[d.getMonth()],
                acts: 0,
                heb: 0,
                gui: 0,
                ca: 0,
            });
        }
        return buckets;
    }

    function fillMonths(buckets, list, field, dateFields, amountField) {
        const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
        list.forEach((r) => {
            let d = null;
            for (const f of dateFields) {
                if (r[f]) {
                    d = new Date(r[f]);
                    if (!isNaN(d)) break;
                }
            }
            if (!d || isNaN(d)) return;
            const i = idx[d.getFullYear() + "-" + d.getMonth()];
            if (i === undefined) return;
            buckets[i][field]++;
            if (amountField) buckets[i].ca += Number(r[amountField]) || 0;
        });
    }

    function payOf(r) {
        const s = r.paymentStatus || "non_paye";
        if (s === "paye") return "paye";
        if (s === "verse") return "verse";
        return "non_paye";
    }

    function barsHtml(buckets, keys) {
        const max = Math.max(1, ...buckets.map((b) => Math.max(...keys.map((k) => b[k] || 0))));
        return (
            '<div class="stats-bars">' +
            buckets
                .map(
                    (b) => `
            <div class="stats-bars__col">
                <div class="stats-bars__pair">
                    ${keys
                        .map(
                            (k) =>
                                `<span class="stats-bar stats-bar--${k}" style="--h:${((b[k] || 0) / max) * 100}%" title="${b[k] || 0}"><em>${b[k] || ""}</em></span>`
                        )
                        .join("")}
                </div>
                <small>${b.label}</small>
            </div>`
                )
                .join("") +
            "</div>"
        );
    }

    function statusRows(counts) {
        const total = Math.max(1, Object.values(counts).reduce((a, b) => a + b, 0));
        return Object.entries(counts)
            .map(([k, v]) => {
                const meta = STATUS[k] || { label: k, cls: "is-pending" };
                return `
                <div class="stats-status__row ${meta.cls}">
                    <div class="stats-status__meta"><span>${meta.label}</span><strong>${v}</strong></div>
                    <div class="stats-status__track"><i style="width:${(v / total) * 100}%"></i></div>
                </div>`;
            })
            .join("");
    }

    function render(data) {
        const { acts, props, guichet, employeurs, properties, activities } = data;
        const allSite = [...acts, ...props];
        const pending = allSite.filter((r) => statusOf(r) === "en_attente").length;
        const accepted = allSite.filter((r) => statusOf(r) === "acceptee");
        const revenue = accepted.reduce((s, r) => s + (Number(r.prix_total) || 0), 0);
        const guiCA = guichet.reduce((s, r) => s + (Number(r.totalAPayer) || 0), 0);
        const guiVerse = guichet.reduce((s, r) => s + (Number(r.versement) || 0), 0);
        const attributed = guichet.filter((r) => r.createdByName || r.createdById).length;

        const statusCounts = { en_attente: 0, acceptee: 0, refusee: 0 };
        allSite.forEach((r) => {
            const s = statusOf(r);
            if (s in statusCounts) statusCounts[s]++;
            else if (s === "annulee") statusCounts.refusee++;
        });

        const payCounts = { paye: 0, verse: 0, non_paye: 0 };
        guichet.forEach((r) => {
            payCounts[payOf(r)]++;
        });

        const staffMap = {};
        guichet.forEach((r) => {
            if (!r.createdByName && !r.createdById) return;
            const key = r.createdByName || `Staff #${r.createdById}`;
            if (!staffMap[key]) staffMap[key] = { n: 0, ca: 0 };
            staffMap[key].n++;
            staffMap[key].ca += Number(r.totalAPayer) || 0;
        });
        const topStaff = Object.entries(staffMap)
            .sort((a, b) => b[1].n - a[1].n)
            .slice(0, 6);

        const buckets = monthBuckets();
        fillMonths(buckets, acts, "acts", ["createdAt", "date_depart"], "prix_total");
        fillMonths(buckets, props, "heb", ["createdAt", "date_arrivee"], "prix_total");
        fillMonths(buckets, guichet, "gui", ["createdAt", "date"], "totalAPayer");

        const topActs = {};
        acts.forEach((r) => {
            const name = r.nom_item || "Activité";
            topActs[name] = (topActs[name] || 0) + 1;
        });
        guichet.forEach((r) => {
            const name = r.activite || "Guichet";
            topActs[name] = (topActs[name] || 0) + 1;
        });
        const topActList = Object.entries(topActs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        const published = activities.filter((a) => a.published).length;
        const pendingProps = properties.filter((p) => p.approvalStatus === "pending").length;

        root.innerHTML = `
            <div class="stats-kpis">
                <article class="stats-kpi stats-kpi--coral">
                    <span class="stats-kpi__icon"><i class="fas fa-calendar-check"></i></span>
                    <div>
                        <strong>${fmt(allSite.length)}</strong>
                        <span>Réservations site</span>
                        <em>${pending} en attente</em>
                    </div>
                </article>
                <article class="stats-kpi stats-kpi--sea">
                    <span class="stats-kpi__icon"><i class="fas fa-coins"></i></span>
                    <div>
                        <strong>${fmt(revenue)}</strong>
                        <span>CA accepté (DA)</span>
                        <em>${accepted.length} acceptée(s)</em>
                    </div>
                </article>
                <article class="stats-kpi stats-kpi--sun">
                    <span class="stats-kpi__icon"><i class="fas fa-user-check"></i></span>
                    <div>
                        <strong>${fmt(guichet.length)}</strong>
                        <span>Guichet</span>
                        <em>${attributed} attribuée(s)</em>
                    </div>
                </article>
                <article class="stats-kpi stats-kpi--teal">
                    <span class="stats-kpi__icon"><i class="fas fa-wallet"></i></span>
                    <div>
                        <strong>${fmt(guiVerse)}</strong>
                        <span>Encaissé guichet</span>
                        <em>sur ${fmt(guiCA)} DA</em>
                    </div>
                </article>
            </div>

            <div class="stats-grid">
                <div class="admin-surface">
                    <div class="admin-surface__head">
                        <h4>Volume 6 mois</h4>
                        <div class="stats-legend">
                            <span><i class="dot dot--sea"></i> Activités</span>
                            <span><i class="dot dot--coral"></i> Héberg.</span>
                            <span><i class="dot dot--sun"></i> Guichet</span>
                        </div>
                    </div>
                    ${barsHtml(buckets, ["acts", "heb", "gui"])}
                </div>
                <div class="admin-surface">
                    <div class="admin-surface__head">
                        <h4>Statuts site</h4>
                        <span>${allSite.length} au total</span>
                    </div>
                    <div class="stats-status">${statusRows(statusCounts)}</div>
                    <div class="stats-mini">
                        <div><strong>${fmt(acts.length)}</strong><span>Activités</span></div>
                        <div><strong>${fmt(props.length)}</strong><span>Hébergements</span></div>
                        <div><strong>${fmt(published)}</strong><span>Act. publiées</span></div>
                        <div><strong>${fmt(pendingProps)}</strong><span>Biens à valider</span></div>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="admin-surface">
                    <div class="admin-surface__head">
                        <h4>Paiements guichet</h4>
                        <span>${guichet.length} résa.</span>
                    </div>
                    <div class="stats-pay">
                        <div class="stats-pay__item is-ok"><strong>${payCounts.paye}</strong><span>Payé</span></div>
                        <div class="stats-pay__item is-pending"><strong>${payCounts.verse}</strong><span>Acompte</span></div>
                        <div class="stats-pay__item is-ko"><strong>${payCounts.non_paye}</strong><span>Non payé</span></div>
                    </div>
                    <div class="admin-surface__head" style="margin-top:1.1rem">
                        <h4>Top activités</h4>
                    </div>
                    <ul class="stats-rank">
                        ${
                            topActList.length
                                ? topActList
                                      .map(
                                          ([name, n], i) =>
                                              `<li><em>${i + 1}</em><span>${esc(name)}</span><strong>${n}</strong></li>`
                                      )
                                      .join("")
                                : "<li class='is-empty'>Aucune donnée</li>"
                        }
                    </ul>
                </div>
                <div class="admin-surface">
                    <div class="admin-surface__head">
                        <h4>Performance employeurs</h4>
                        <span>${employeurs.length} compte(s)</span>
                    </div>
                    <ul class="stats-rank">
                        ${
                            topStaff.length
                                ? topStaff
                                      .map(
                                          ([name, v], i) =>
                                              `<li><em>${i + 1}</em><span>${esc(name)}</span><strong>${v.n} · ${fmt(v.ca)} DA</strong></li>`
                                      )
                                      .join("")
                                : "<li class='is-empty'>Aucune attribution pour l’instant</li>"
                        }
                    </ul>
                    <button type="button" class="stats-link" data-admin-page="guichet">
                        <i class="fas fa-user-check"></i> Voir les attributions
                    </button>
                </div>
            </div>
        `;
    }

    async function load() {
        root.innerHTML = `<div class="admin-empty"><i class="fas fa-chart-line"></i><strong>Chargement des statistiques…</strong></div>`;
        const [acts, props, guichet, employeurs, properties, activities] = await Promise.all([
            safe("/api/reservations?light=1"),
            safe("/api/property-reservations"),
            safe("/api/reservations-admin"),
            safe("/api/auth/employeurs"),
            safe("/api/admin/properties"),
            safe("/api/admin/activities"),
        ]);
        loaded = true;
        render({ acts, props, guichet, employeurs, properties, activities });
    }

    window.addEventListener("admin:navigate", (e) => {
        if (e.detail?.page !== "stats") return;
        load();
    });

    const hash = (location.hash || "").slice(1).split("?")[0];
    if (hash === "stats") load();
})();
