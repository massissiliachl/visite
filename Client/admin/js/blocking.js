/**
 * Blocage de dates — activités et hébergements (/api/availability)
 */
(function () {
    const KINDS = {
        activity: {
            page: "bloquer",
            title: "Bloquer une date",
            subtitle: "Rendez une activité indisponible : les clients ne pourront plus réserver ces jours-là.",
            itemLabel: "Activité",
            allLabel: "Toutes les activités",
            icon: "fa-person-swimming",
            source: "/api/admin/activities",
            toItem: (a) => ({ key: a.name, label: a.name, img: a.image, meta: a.published === false ? "Non publiée" : "" }),
            keyOf: (b) => b.nom_item,
            payload: (item) => ({ nom_item: item.key, item_type: "activity" }),
            perItemPath: (item) => `/api/availability/activity/${encodeURIComponent(item.key)}`,
            fromItem: (item) => ({ nom_item: item.key, item_type: "activity" }),
            deletePath: (b) => `/api/availability/activity/block/${encodeURIComponent(b.nom_item)}/${b.date}`,
        },
        property: {
            page: "bloquer-hebergement",
            title: "Bloquer un hébergement",
            subtitle: "Fermez un logement sur une période : les jours bloqués sont grisés dans le planning du site.",
            itemLabel: "Hébergement",
            allLabel: "Tous les hébergements",
            icon: "fa-house",
            source: "/api/admin/properties",
            toItem: (p) => ({
                key: String(p.id),
                label: p.title || `Hébergement #${p.id}`,
                img: Array.isArray(p.images) ? p.images[0] : null,
                meta: [p.type, p.location].filter(Boolean).join(" · "),
            }),
            keyOf: (b) => String(b.item_id),
            payload: (item) => ({ nom_item: item.label, item_type: "property", item_id: item.key }),
            perItemPath: (item) => `/api/availability/property/${encodeURIComponent(item.key)}`,
            fromItem: (item) => ({ item_id: item.key, item_type: "property" }),
            deletePath: (b) => `/api/availability/property/block/${encodeURIComponent(b.item_id)}/${b.date}`,
        },
    };

    const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

    const esc = (s) =>
        String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const pad = (n) => String(n).padStart(2, "0");
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const parse = (s) => {
        const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
        return new Date(y, m - 1, d);
    };
    const todayIso = () => iso(new Date());
    const nextDay = (s) => {
        const d = parse(s);
        d.setDate(d.getDate() + 1);
        return iso(d);
    };
    const fmtDay = (s) => parse(s).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const fmtShort = (s) => parse(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    const imgSrc = (src) => {
        if (!src) return "";
        if (/^(data:|https?:|blob:)/.test(src)) return src;
        return `${window.AdminAPI.base}/${String(src).replace(/^\/+/, "")}`;
    };

    function createModule(host) {
        const kind = KINDS[host.dataset.blockKind];
        const now = new Date();
        const state = {
            items: [],
            blocks: [],
            filter: "",
            month: new Date(now.getFullYear(), now.getMonth(), 1),
            range: false,
            loaded: false,
            loading: false,
        };

        host.innerHTML = `
            <div class="blk">
                <div class="blk-side">
                    <form class="admin-surface blk-form" novalidate>
                        <div class="blk-form__head">
                            <span class="blk-form__icon"><i class="fas ${kind.icon}"></i></span>
                            <div>
                                <h3>${kind.title}</h3>
                                <p>${kind.subtitle}</p>
                            </div>
                        </div>
                        <label class="blk-field">
                            <span>${kind.itemLabel}</span>
                            <select name="target" required><option value="">Chargement…</option></select>
                        </label>
                        <div class="blk-seg" role="tablist">
                            <button type="button" data-range="0" class="is-active"><i class="fas fa-calendar-day"></i>Un jour</button>
                            <button type="button" data-range="1"><i class="fas fa-calendar-week"></i>Une période</button>
                        </div>
                        <div class="blk-dates">
                            <label class="blk-field">
                                <span class="blk-start-label">Date</span>
                                <input type="date" name="start" required>
                            </label>
                            <label class="blk-field blk-end" hidden>
                                <span>Jusqu'au (inclus)</span>
                                <input type="date" name="end">
                            </label>
                        </div>
                        <label class="blk-field">
                            <span>Motif <em>(optionnel)</em></span>
                            <input type="text" name="reason" maxlength="120" placeholder="Complet, météo, maintenance…">
                        </label>
                        <button type="submit" class="blk-submit"><i class="fas fa-ban"></i><span>Bloquer</span></button>
                        <p class="blk-status" aria-live="polite"></p>
                    </form>
                    <div class="admin-surface blk-stats">
                        <div><strong data-stat="days">0</strong><span>jours bloqués à venir</span></div>
                        <div><strong data-stat="items">0</strong><span>${kind.itemLabel.toLowerCase()}(s) concerné(s)</span></div>
                    </div>
                </div>
                <div class="blk-main">
                    <div class="admin-surface blk-cal">
                        <div class="blk-cal__head">
                            <div class="blk-cal__nav">
                                <button type="button" data-month="-1" aria-label="Mois précédent"><i class="fas fa-chevron-left"></i></button>
                                <h3 class="blk-cal__title">—</h3>
                                <button type="button" data-month="1" aria-label="Mois suivant"><i class="fas fa-chevron-right"></i></button>
                                <button type="button" class="blk-cal__today" data-month="0">Aujourd'hui</button>
                            </div>
                            <select class="blk-filter" aria-label="Filtrer"><option value="">${kind.allLabel}</option></select>
                        </div>
                        <div class="blk-cal__grid"></div>
                        <p class="blk-cal__hint"><i class="fas fa-hand-pointer"></i>Cliquez sur un jour libre pour le pré-remplir, ou sur un jour bloqué pour le débloquer.</p>
                    </div>
                    <div class="admin-surface blk-list">
                        <div class="blk-list__head">
                            <h3>Dates bloquées à venir</h3>
                            <button type="button" class="resa-refresh" title="Actualiser"><i class="fas fa-rotate"></i></button>
                        </div>
                        <div class="blk-list__body"></div>
                    </div>
                </div>
            </div>`;

        const form = host.querySelector(".blk-form");
        const itemSelect = form.elements.target;
        const startInput = form.elements.start;
        const endInput = form.elements.end;
        const endWrap = host.querySelector(".blk-end");
        const startLabel = host.querySelector(".blk-start-label");
        const statusEl = host.querySelector(".blk-status");
        const filterSelect = host.querySelector(".blk-filter");
        const grid = host.querySelector(".blk-cal__grid");
        const listBody = host.querySelector(".blk-list__body");

        startInput.min = todayIso();
        endInput.min = todayIso();

        function setStatus(msg, type = "") {
            statusEl.textContent = msg;
            statusEl.className = `blk-status${type ? " is-" + type : ""}`;
        }

        function setRange(on) {
            state.range = on;
            host.querySelectorAll(".blk-seg button").forEach((b) => b.classList.toggle("is-active", (b.dataset.range === "1") === on));
            endWrap.hidden = !on;
            endInput.required = on;
            startLabel.textContent = on ? "Du" : "Date";
        }

        host.querySelectorAll(".blk-seg button").forEach((b) => b.addEventListener("click", () => setRange(b.dataset.range === "1")));
        startInput.addEventListener("change", () => {
            endInput.min = startInput.value || todayIso();
            if (endInput.value && endInput.value < startInput.value) endInput.value = startInput.value;
        });

        itemSelect.addEventListener("change", () => {
            if (itemSelect.value && filterSelect.value !== itemSelect.value) {
                filterSelect.value = itemSelect.value;
                state.filter = itemSelect.value;
                render();
            }
        });
        filterSelect.addEventListener("change", () => {
            state.filter = filterSelect.value;
            if (state.filter) itemSelect.value = state.filter;
            render();
        });

        host.querySelectorAll("[data-month]").forEach((b) =>
            b.addEventListener("click", () => {
                const step = Number(b.dataset.month);
                state.month = step === 0
                    ? new Date(now.getFullYear(), now.getMonth(), 1)
                    : new Date(state.month.getFullYear(), state.month.getMonth() + step, 1);
                renderCalendar();
            })
        );
        host.querySelector(".blk-list .resa-refresh").addEventListener("click", load);

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const item = state.items.find((i) => i.key === itemSelect.value);
            const start = startInput.value;
            const end = state.range ? endInput.value : "";
            if (!item) return setStatus(`Choisissez ${kind.page === "bloquer" ? "une activité" : "un hébergement"}.`, "error");
            if (!start) return setStatus("Choisissez une date.", "error");
            if (state.range && !end) return setStatus("Choisissez la date de fin.", "error");
            if (state.range && end < start) return setStatus("La date de fin doit être après la date de début.", "error");

            const btn = form.querySelector(".blk-submit");
            btn.disabled = true;
            setStatus("Enregistrement…");
            try {
                const reason = form.elements.reason.value.trim() || undefined;
                const post = (date, extra = {}) =>
                    window.AdminAPI.fetch("/api/availability/block", {
                        method: "POST",
                        body: JSON.stringify({ ...kind.payload(item), date, reason, ...extra }),
                    });
                const isDuplicate = (err) => /déjà bloqu/i.test(err.message);

                let created = 0;
                let skipped = 0;
                let res = null;
                try {
                    res = await post(start, end && end !== start ? { date_end: end } : {});
                } catch (err) {
                    if (!isDuplicate(err)) throw err;
                    skipped = 1;
                }
                if (res && typeof res.created === "number") {
                    created = res.created;
                    skipped = res.skipped || 0;
                } else {
                    if (res) created = 1;
                    // Serveur sans blocage par période : on bloque les jours suivants un par un.
                    for (let d = start; end && d < end; ) {
                        d = nextDay(d);
                        try {
                            await post(d);
                            created++;
                        } catch (err) {
                            if (!isDuplicate(err)) throw err;
                            skipped++;
                        }
                    }
                }
                setStatus(
                    created
                        ? `${created} jour${created > 1 ? "s" : ""} bloqué${created > 1 ? "s" : ""} pour ${item.label}${skipped ? ` (${skipped} déjà bloqué${skipped > 1 ? "s" : ""})` : ""}.`
                        : "Ces dates étaient déjà bloquées.",
                    "ok"
                );
                form.elements.reason.value = "";
                state.month = new Date(parse(start).getFullYear(), parse(start).getMonth(), 1);
                await load();
            } catch (err) {
                setStatus(err.message, "error");
            } finally {
                btn.disabled = false;
            }
        });

        async function unblock(blocks, label) {
            if (!blocks.length) return;
            if (!confirm(`Débloquer ${label} ?`)) return;
            try {
                await Promise.all(blocks.map((b) => window.AdminAPI.fetch(kind.deletePath(b), { method: "DELETE" })));
                setStatus(`${label} débloqué.`, "ok");
            } catch (err) {
                setStatus(err.message, "error");
            }
            await load();
        }

        grid.addEventListener("click", (e) => {
            const cell = e.target.closest("[data-date]");
            if (!cell || cell.classList.contains("is-past")) return;
            const date = cell.dataset.date;
            const dayBlocks = visibleBlocks().filter((b) => b.date === date);
            if (dayBlocks.length) {
                const names = [...new Set(dayBlocks.map((b) => itemLabel(kind.keyOf(b))))];
                unblock(dayBlocks, `le ${fmtDay(date)} (${names.join(", ")})`);
                return;
            }
            startInput.value = date;
            endInput.min = date;
            if (state.range && (!endInput.value || endInput.value < date)) endInput.value = date;
            if (state.filter) itemSelect.value = state.filter;
            setStatus(`Date choisie : ${fmtDay(date)}. Cliquez sur « Bloquer » pour confirmer.`);
            form.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });

        listBody.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-unblock]");
            if (!btn) return;
            const group = state.groups[Number(btn.dataset.unblock)];
            if (group) unblock(group.blocks, btn.dataset.label);
        });

        function itemLabel(key) {
            return state.items.find((i) => i.key === key)?.label || key || "—";
        }

        function visibleBlocks() {
            return state.filter ? state.blocks.filter((b) => kind.keyOf(b) === state.filter) : state.blocks;
        }

        function fillSelects() {
            const opts = state.items.map((i) => `<option value="${esc(i.key)}">${esc(i.label)}${i.meta ? ` — ${esc(i.meta)}` : ""}</option>`).join("");
            const keep = itemSelect.value;
            itemSelect.innerHTML = `<option value="">— Choisir —</option>${opts}`;
            itemSelect.value = state.items.some((i) => i.key === keep) ? keep : state.filter;
            filterSelect.innerHTML = `<option value="">${kind.allLabel}</option>${state.items.map((i) => `<option value="${esc(i.key)}">${esc(i.label)}</option>`).join("")}`;
            filterSelect.value = state.filter;
        }

        function renderCalendar() {
            const y = state.month.getFullYear();
            const m = state.month.getMonth();
            host.querySelector(".blk-cal__title").textContent = `${MONTHS[m]} ${y}`;
            const byDate = {};
            for (const b of visibleBlocks()) (byDate[b.date] ||= []).push(b);

            const first = new Date(y, m, 1);
            const offset = (first.getDay() + 6) % 7;
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            const today = todayIso();
            let html = DAYS.map((d) => `<div class="blk-cal__dow">${d}</div>`).join("");
            for (let i = 0; i < offset; i++) html += '<div class="blk-day is-out"></div>';
            for (let d = 1; d <= daysInMonth; d++) {
                const date = `${y}-${pad(m + 1)}-${pad(d)}`;
                const list = byDate[date] || [];
                const cls = ["blk-day"];
                if (date < today) cls.push("is-past");
                if (date === today) cls.push("is-today");
                if (list.length) cls.push("is-blocked");
                const tip = list.length
                    ? list.map((b) => `${itemLabel(kind.keyOf(b))}${b.reason ? " — " + b.reason : ""}`).join("\n")
                    : "Libre";
                html += `<button type="button" class="${cls.join(" ")}" data-date="${date}" title="${esc(tip)}">
                    <span class="blk-day__n">${d}</span>
                    ${list.length ? `<span class="blk-day__tag">${state.filter ? '<i class="fas fa-ban"></i>' : list.length}</span>` : ""}
                </button>`;
            }
            grid.innerHTML = html;
        }

        function groupRanges(blocks) {
            const byItem = {};
            for (const b of blocks) (byItem[kind.keyOf(b)] ||= []).push(b);
            const groups = [];
            for (const [key, list] of Object.entries(byItem)) {
                list.sort((a, b) => a.date.localeCompare(b.date));
                let cur = null;
                for (const b of list) {
                    if (cur && nextDay(cur.end) === b.date && (cur.reason || "") === (b.reason || "")) {
                        cur.end = b.date;
                        cur.blocks.push(b);
                    } else {
                        cur = { key, start: b.date, end: b.date, reason: b.reason, blocks: [b] };
                        groups.push(cur);
                    }
                }
            }
            return groups.sort((a, b) => a.start.localeCompare(b.start));
        }

        function renderList() {
            const today = todayIso();
            const upcoming = visibleBlocks().filter((b) => b.date >= today);
            const allUpcoming = state.blocks.filter((b) => b.date >= today);
            host.querySelector('[data-stat="days"]').textContent = allUpcoming.length;
            host.querySelector('[data-stat="items"]').textContent = new Set(allUpcoming.map(kind.keyOf)).size;

            if (!upcoming.length) {
                listBody.innerHTML = `<div class="admin-empty"><i class="fas fa-calendar-check"></i><strong>Aucune date bloquée</strong><p>${state.filter ? "Cet élément est disponible sur toutes les dates à venir." : "Tout est disponible à la réservation."}</p></div>`;
                return;
            }
            const items = Object.fromEntries(state.items.map((i) => [i.key, i]));
            state.groups = groupRanges(upcoming);
            listBody.innerHTML = state.groups
                .map((g, gi) => {
                    const item = items[g.key];
                    const days = g.blocks.length;
                    const when = g.start === g.end ? fmtDay(g.start) : `${fmtShort(g.start)} → ${fmtDay(g.end)}`;
                    const label = `${item?.label || g.key} — ${g.start === g.end ? fmtDay(g.start) : `du ${fmtShort(g.start)} au ${fmtShort(g.end)}`}`;
                    return `<div class="blk-row">
                        <span class="blk-row__thumb">${item?.img ? `<img src="${esc(imgSrc(item.img))}" alt="" loading="lazy" onerror="this.remove()">` : ""}<i class="fas ${kind.icon}"></i></span>
                        <div class="blk-row__body">
                            <strong>${esc(item?.label || g.key)}</strong>
                            <span><i class="fas fa-calendar-xmark"></i>${esc(when)}${days > 1 ? ` <em>${days} jours</em>` : ""}</span>
                            ${g.reason ? `<small>${esc(g.reason)}</small>` : ""}
                        </div>
                        <button type="button" class="resa-btn blk-row__btn" data-unblock="${gi}" data-label="${esc(label)}"><i class="fas fa-unlock"></i>Débloquer</button>
                    </div>`;
                })
                .join("");
        }

        function render() {
            renderCalendar();
            renderList();
        }

        async function fetchBlocks() {
            try {
                const res = await window.AdminAPI.fetch(`/api/availability?type=${host.dataset.blockKind}`);
                return Array.isArray(res) ? res : res.data || [];
            } catch {
                const perItem = await Promise.all(
                    state.items.map((item) =>
                        window.AdminAPI.fetch(kind.perItemPath(item))
                            .then((rows) => (Array.isArray(rows) ? rows : []).map((b) => ({ ...b, ...kind.fromItem(item) })))
                            .catch(() => [])
                    )
                );
                return perItem.flat();
            }
        }

        async function load() {
            if (state.loading) return;
            state.loading = true;
            host.classList.add("is-loading");
            if (!state.loaded) listBody.innerHTML = '<div class="resa-card resa-card--skeleton" style="min-height:120px"></div>';
            try {
                if (!state.items.length) {
                    const raw = await window.AdminAPI.fetch(kind.source);
                    const list = Array.isArray(raw) ? raw : raw.data || [];
                    state.items = list.map(kind.toItem).sort((a, b) => a.label.localeCompare(b.label, "fr"));
                    fillSelects();
                }
                state.blocks = (await fetchBlocks()).map((b) => ({ ...b, date: String(b.date).slice(0, 10) }));
                state.loaded = true;
                render();
            } catch (err) {
                listBody.innerHTML = `<div class="admin-empty"><i class="fas fa-triangle-exclamation"></i><strong>Chargement impossible</strong><p>${esc(err.message)}</p></div>`;
            } finally {
                state.loading = false;
                host.classList.remove("is-loading");
            }
        }

        renderCalendar();
        return { page: kind.page, load, isLoaded: () => state.loaded };
    }

    const modules = [...document.querySelectorAll(".block-module")].map(createModule);

    function onPage(page) {
        modules.forEach((m) => {
            if (m.page === page && !m.isLoaded()) m.load();
        });
    }

    window.addEventListener("admin:navigate", (e) => onPage(e.detail?.page));
    onPage((location.hash || "").slice(1));
})();
