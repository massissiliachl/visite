/**
 * Connexion admin avant le tableau de bord.
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

    const ADMIN_EMAIL = "admin@visitbejaia.com";
    const TOKEN_KEY = "admin_jwt";

    function showGate() {
        document.body.classList.add("is-locked");
        const gate = document.getElementById("adminGate");
        const shell = document.getElementById("adminShell");
        if (shell) shell.style.display = "none";
        if (gate) {
            gate.style.display = "grid";
            gate.style.position = "fixed";
            gate.style.inset = "0";
            gate.style.zIndex = "99999";
        }
    }

    function unlock() {
        document.body.classList.remove("is-locked");
        const gate = document.getElementById("adminGate");
        const shell = document.getElementById("adminShell");
        if (gate) gate.style.display = "none";
        if (shell) shell.style.display = "";
        window.dispatchEvent(new CustomEvent("admin:ready"));
    }

    function logout() {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
        showGate();
        location.replace(location.pathname);
    }

    window.__adminLogout = logout;

    window.AdminAPI = {
        base: API_BASE,

        async getToken() {
            const cached = sessionStorage.getItem(TOKEN_KEY);
            if (!cached) throw new Error("Connexion requise");
            return cached;
        },

        async login(password) {
            const res = await fetch(`${API_BASE}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: ADMIN_EMAIL,
                    password,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.token) {
                throw new Error(data.error || "Mot de passe incorrect");
            }
            sessionStorage.setItem(TOKEN_KEY, data.token);
            const remember = document.getElementById("adminGateRemember")?.checked;
            if (remember) localStorage.setItem(TOKEN_KEY, data.token);
            else localStorage.removeItem(TOKEN_KEY);
            unlock();
            return data.token;
        },

        logout,

        async fetch(path, options = {}) {
            const token = await this.getToken();
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {}),
            };
            const res = await fetch(`${API_BASE}${path}`, {
                ...options,
                headers,
            });
            const body = await res.json().catch(() => ({}));
            if (res.status === 401) {
                logout();
                throw new Error("Session expirée");
            }
            if (!res.ok) {
                throw new Error(body.error || body.message || `Erreur ${res.status}`);
            }
            return body;
        },
    };

    const eyeBtn = document.getElementById("adminGateEye");
    const passInput = document.getElementById("adminGatePass");
    eyeBtn?.addEventListener("click", () => {
        if (!passInput) return;
        const show = passInput.type === "password";
        passInput.type = show ? "text" : "password";
        eyeBtn.classList.toggle("is-on", show);
        eyeBtn.setAttribute("aria-pressed", show ? "true" : "false");
        eyeBtn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
        const icon = eyeBtn.querySelector("i");
        if (icon) icon.className = show ? "fas fa-eye-slash" : "fas fa-eye";
        passInput.focus();
    });

    document.getElementById("adminGateForgot")?.addEventListener("click", () => {
        const errorEl = document.getElementById("adminGateError");
        if (errorEl) errorEl.textContent = "Contactez l'équipe Visit Béjaïa pour récupérer l'accès.";
    });

    const form = document.getElementById("adminGateForm");
    const errorEl = document.getElementById("adminGateError");
    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = new FormData(form).get("password");
        const btn = form.querySelector("button[type='submit']");
        if (errorEl) errorEl.textContent = "";
        if (btn) btn.disabled = true;
        try {
            await window.AdminAPI.login(String(password || ""));
        } catch (err) {
            if (errorEl) errorEl.textContent = err.message || "Connexion impossible";
        } finally {
            if (btn) btn.disabled = false;
        }
    });

    window.addEventListener("admin:logout", logout);
    document.getElementById("adminLogoutBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        logout();
    });

    const remembered = localStorage.getItem(TOKEN_KEY);
    if (remembered && !sessionStorage.getItem(TOKEN_KEY)) {
        sessionStorage.setItem(TOKEN_KEY, remembered);
    }
    if (sessionStorage.getItem(TOKEN_KEY)) unlock();
    else showGate();
})();
