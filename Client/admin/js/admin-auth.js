/**
 * Token admin pour appels API protégés
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

    window.AdminAPI = {
        base: API_BASE,

        async getToken() {
            const cached = sessionStorage.getItem("admin_jwt");
            if (cached) return cached;

            const res = await fetch(`${API_BASE}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "admin@visitbejaia.com",
                    password: "adminvb2026",
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.token) {
                throw new Error(data.error || "Login admin impossible");
            }
            sessionStorage.setItem("admin_jwt", data.token);
            return data.token;
        },

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
            if (!res.ok) {
                throw new Error(body.error || body.message || `Erreur ${res.status}`);
            }
            return body;
        },
    };
})();
