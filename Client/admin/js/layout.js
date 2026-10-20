/**
 * Admin layout — sidebar, header, navigation, content zone
 */
(function () {
    const PAGE_META = {
        dashboard: {
            title: "Tableau de bord",
            subtitle: "Vue d'ensemble de Visit Bejaia",
        },
        activites: {
            title: "Activités",
            subtitle: "Créer, modifier, publier sur le site",
        },
        proprietaires: {
            title: "Propriétaires",
            subtitle: "Comptes et hébergements assignés",
        },
        reservations: {
            title: "Réservations",
            subtitle: "Demandes clients activités",
        },
        "reservations-hebergement": {
            title: "Réservations hébergements",
            subtitle: "Demandes de logement",
        },
        properties: {
            title: "Hébergements",
            subtitle: "Tous les biens du site — validation et gestion",
        },
        bloquer: {
            title: "Bloquer une date",
            subtitle: "Indisponibilités activités",
        },
        "bloquer-hebergement": {
            title: "Bloquer hébergement",
            subtitle: "Indisponibilités logements",
        },
        stats: {
            title: "Statistiques",
            subtitle: "Volumes, CA, guichet et employeurs",
        },
        employeurs: {
            title: "Employeurs",
            subtitle: "Comptes et accès",
        },
        guichet: {
            title: "Attributions",
            subtitle: "Qui a pris chaque réservation guichet",
        },
        settings: {
            title: "Paramètres",
            subtitle: "Configuration admin",
        },
    };

    const shell = document.getElementById("adminShell");
    const overlay = document.getElementById("adminOverlay");
    const menuBtn = document.getElementById("adminMenuBtn");
    const collapseBtn = document.getElementById("adminCollapseBtn");
    const titleEl = document.getElementById("adminPageTitle");
    const subtitleEl = document.getElementById("adminPageSubtitle");
    const contentHost = document.getElementById("adminContentHost");
    const navLinks = document.querySelectorAll("[data-admin-page]");

    function isMobile() {
        return window.matchMedia("(max-width: 900px)").matches;
    }

    function closeMobileSidebar() {
        shell?.classList.remove("sidebar-open");
        overlay?.classList.remove("is-open");
        document.body.style.overflow = "";
    }

    function openMobileSidebar() {
        shell?.classList.add("sidebar-open");
        overlay?.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function toggleSidebar() {
        if (isMobile()) {
            if (shell?.classList.contains("sidebar-open")) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
            return;
        }
        shell?.classList.toggle("sidebar-collapsed");
    }

    function setActiveNav(pageId) {
        navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.dataset.adminPage === pageId);
        });
    }

    function updateHeader(pageId) {
        const meta = PAGE_META[pageId] || PAGE_META.dashboard;
        if (titleEl) {
            titleEl.style.animation = "none";
            // force reflow for title fade-in
            void titleEl.offsetWidth;
            titleEl.style.animation = "";
            titleEl.textContent = meta.title;
        }
        if (subtitleEl) subtitleEl.textContent = meta.subtitle;
        document.title = `${meta.title} | Admin Visit Bejaia`;
    }

    function showPanel(pageId) {
        if (!contentHost) return;
        const panels = contentHost.querySelectorAll("[data-admin-panel]");
        panels.forEach((panel) => {
            panel.hidden = panel.dataset.adminPanel !== pageId;
        });
    }

    function navigate(pageId, extra) {
        const id = String(pageId || "").split("?")[0];
        if (!PAGE_META[id]) return;
        setActiveNav(id);
        updateHeader(id);
        showPanel(id);
        if (isMobile()) closeMobileSidebar();
        const staff = extra?.staff;
        const hash = staff ? `${id}?staff=${encodeURIComponent(staff)}` : id;
        history.replaceState(null, "", `#${hash}`);
        window.dispatchEvent(
            new CustomEvent("admin:navigate", {
                detail: { page: id, ...(extra || {}) },
            })
        );
    }

    function initFromHash() {
        const raw = (location.hash || "#dashboard").slice(1);
        const pageId = raw.split("?")[0];
        const params = new URLSearchParams(raw.includes("?") ? raw.split("?")[1] : "");
        const staff = params.get("staff");
        navigate(PAGE_META[pageId] ? pageId : "dashboard", staff ? { staff } : undefined);
    }

    menuBtn?.addEventListener("click", toggleSidebar);
    collapseBtn?.addEventListener("click", toggleSidebar);
    overlay?.addEventListener("click", closeMobileSidebar);

    document.addEventListener("click", (e) => {
        const link = e.target.closest("[data-admin-page]");
        if (!link) return;
        e.preventDefault();
        navigate(link.dataset.adminPage);
    });

    window.addEventListener("hashchange", initFromHash);
    window.addEventListener("resize", () => {
        if (!isMobile()) closeMobileSidebar();
    });

    document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
        // Hook prêt pour l'auth réelle
        window.dispatchEvent(new CustomEvent("admin:logout"));
        console.info("[admin] logout demandé — brancher l'auth ici");
    });

    initFromHash();
})();
