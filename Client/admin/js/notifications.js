/**
 * Cloche de notifications : demandes en attente (activités, hébergements, biens à valider)
 */
(function () {
    const root = document.getElementById("adminNotif");
    if (!root) return;

    const btn = document.getElementById("adminNotifBtn");
    const panel = document.getElementById("adminNotifPanel");
    const list = document.getElementById("adminNotifList");
    const count = document.getElementById("adminNotifCount");
    const readBtn = document.getElementById("adminNotifRead");
    const SEEN_KEY = "admin_notif_seen";
    const REFRESH_MS = 60000;

    let items = [];
    let loading = false;

    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const seenAt = () => Number(localStorage.getItem(SEEN_KEY) || 0);
    const asList = (r) => (Array.isArray(r) ? r : r?.data || []);
    const fmtDate = (d) => {
        if (!d) return "";
        const x = new Date(d);
        return isNaN(x) ? String(d) : x.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    };

    function ago(d) {
        const t = new Date(d).getTime();
        if (!t) return "";
        const s = Math.max(0, (Date.now() - t) / 1000);
        if (s < 60) return "à l'instant";
        if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
        if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
        if (s < 86400 * 7) return `il y a ${Math.floor(s / 86400)} j`;
        return fmtDate(d);
    }

    const isPending = (s) => String(s || "en_attente").toLowerCase() === "en_attente";

    async function load() {
        if (loading || !window.AdminAPI) return;
        loading = true;
        const safe = (p) => window.AdminAPI.fetch(p).catch(() => []);
        try {
            const [acts, hebs, props] = await Promise.all([
                safe("/api/reservations?light=1"),
                safe("/api/property-reservations"),
                safe("/api/admin/properties"),
            ]);
            items = [
                ...asList(acts).filter((r) => isPending(r.status)).map((r) => ({
                    page: "reservations",
                    icon: "fa-person-swimming",
                    tone: "coral",
                    title: `${r.prenom || ""} ${r.nom || ""}`.trim() || "Nouveau client",
                    text: `${r.nom_item || "Activité"} · ${fmtDate(r.date_depart)}`,
                    at: r.createdAt,
                })),
                ...asList(hebs).filter((r) => isPending(r.status)).map((r) => ({
                    page: "reservations-hebergement",
                    icon: "fa-house",
                    tone: "sea",
                    title: `${r.prenom || ""} ${r.nom || ""}`.trim() || "Nouveau client",
                    text: `${r.Property?.title || "Hébergement #" + r.propertyId} · ${fmtDate(r.date_arrivee)} → ${fmtDate(r.date_depart)}`,
                    at: r.createdAt,
                })),
                ...asList(props).filter((p) => p.approvalStatus === "pending").map((p) => ({
                    page: "properties",
                    icon: "fa-building-circle-check",
                    tone: "sun",
                    title: "Bien à valider",
                    text: p.title || `Hébergement #${p.id}`,
                    at: p.createdAt || p.updatedAt,
                })),
            ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
            render();
        } finally {
            loading = false;
        }
    }

    function render() {
        const seen = seenAt();
        const unread = items.filter((i) => new Date(i.at || 0).getTime() > seen).length;
        count.hidden = unread === 0;
        count.textContent = unread > 99 ? "99+" : unread;
        btn.classList.toggle("has-unread", unread > 0);
        btn.setAttribute("aria-label", unread ? `Notifications (${unread} nouvelle${unread > 1 ? "s" : ""})` : "Notifications");
        readBtn.disabled = unread === 0;

        if (!items.length) {
            list.innerHTML = '<div class="notif__empty"><i class="fas fa-circle-check"></i><strong>Tout est à jour</strong><span>Aucune demande en attente.</span></div>';
            return;
        }
        list.innerHTML = items
            .slice(0, 30)
            .map((i) => {
                const isNew = new Date(i.at || 0).getTime() > seen;
                return `<button type="button" class="notif__item${isNew ? " is-new" : ""}" data-notif-go="${i.page}">
                    <span class="notif__icon is-${i.tone}"><i class="fas ${i.icon}"></i></span>
                    <span class="notif__body">
                        <strong>${esc(i.title)}</strong>
                        <span>${esc(i.text)}</span>
                        <small>${esc(ago(i.at))}</small>
                    </span>
                </button>`;
            })
            .join("");
        if (items.length > 30) {
            list.insertAdjacentHTML("beforeend", `<p class="notif__more">+ ${items.length - 30} autres demandes en attente</p>`);
        }
    }

    function markRead() {
        const latest = Math.max(Date.now(), ...items.map((i) => new Date(i.at || 0).getTime()));
        localStorage.setItem(SEEN_KEY, String(latest));
        render();
    }

    function open() {
        panel.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        root.classList.add("is-open");
        load();
    }

    function close() {
        panel.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        root.classList.remove("is-open");
    }

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.hidden ? open() : close();
    });
    readBtn.addEventListener("click", markRead);
    panel.addEventListener("click", (e) => {
        const go = e.target.closest("[data-notif-go]");
        if (!go) return;
        e.preventDefault();
        close();
        location.hash = go.dataset.notifGo;
    });
    document.addEventListener("click", (e) => {
        if (!panel.hidden && !root.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !panel.hidden) close();
    });

    function start() {
        load();
        if (!start.timer) {
            start.timer = setInterval(() => {
                if (document.visibilityState === "visible" && sessionStorage.getItem("admin_jwt")) load();
            }, REFRESH_MS);
        }
    }

    if (sessionStorage.getItem("admin_jwt")) start();
    window.addEventListener("admin:ready", start);
})();
