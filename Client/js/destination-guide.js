/**
 * Destinations — maquette interactions
 */
(function () {
    document.body.classList.add('guide-page');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const blocs = Array.from(document.querySelectorAll('.desti-bloc'));

    let bar = document.querySelector('.guide-progress');
    if (!bar) {
        bar = document.createElement('div');
        bar.className = 'guide-progress';
        document.body.prepend(bar);
    }

    function onScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = `${max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0}%`;

        const media = document.querySelector('.hero-bg-image');
        if (media && !reduce) {
            const y = Math.min(window.scrollY, window.innerHeight);
            media.style.transform = `scale(1.05) translateY(${y * 0.18}px)`;
        }
    }

    blocs.forEach((bloc, i) => {
        const n = String(i + 1).padStart(2, '0');
        if (!bloc.id) bloc.id = `chapter-${n}`;

        const img = bloc.querySelector('.desti-image');
        if (img && !img.closest('.desti-media')) {
            const media = document.createElement('div');
            media.className = 'desti-media';
            img.parentNode.insertBefore(media, img);
            media.appendChild(img);

            const idx = document.createElement('div');
            idx.className = 'chapter-index';
            idx.textContent = n;
            media.appendChild(idx);
        }

        const text = bloc.querySelector('.desti-text');
        if (!text) return;

        text.querySelectorAll('.desti-kicker, .chapter-badge').forEach((el) => el.remove());

        // Keep activity offers visible; only collapse plain paragraphs
        const paras = Array.from(text.querySelectorAll(':scope > p')).filter(
            (p) => !p.classList.contains('ferme-offers-title')
        );
        if (paras.length > 2 && !text.querySelector('.desti-more') && !text.querySelector('.ferme-offers')) {
            const more = document.createElement('div');
            more.className = 'desti-more';
            paras.slice(1).forEach((p) => more.appendChild(p));
            paras[0].after(more);

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'desti-more-btn';
            toggle.textContent = 'Lire la suite';
            more.after(toggle);
            toggle.addEventListener('click', () => {
                const open = more.classList.toggle('is-open');
                toggle.textContent = open ? 'Réduire' : 'Lire la suite';
            });
        }

        // Group actions
        if (!text.querySelector('.desti-actions')) {
            const actions = document.createElement('div');
            actions.className = 'desti-actions';
            const moreBtn = text.querySelector('.desti-more-btn');
            const mapLink = text.querySelector('.map-link');
            const map = text.querySelector('.map-container');

            if (moreBtn) actions.appendChild(moreBtn);
            if (mapLink) actions.appendChild(mapLink);

            if (map && !text.querySelector('.map-toggle')) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'map-toggle';
                const startOpen = bloc.id === 'port-tala-ilef' || map.classList.contains('is-open');
                if (startOpen) map.classList.add('is-open');
                btn.innerHTML = startOpen
                    ? '<i class="fas fa-map"></i> Fermer'
                    : '<i class="fas fa-map"></i> Carte';
                actions.appendChild(btn);
                btn.addEventListener('click', () => {
                    const open = map.classList.toggle('is-open');
                    btn.innerHTML = open
                        ? '<i class="fas fa-map"></i> Fermer'
                        : '<i class="fas fa-map"></i> Carte';
                });
            }

            const insertBefore = map || null;
            if (insertBefore) text.insertBefore(actions, insertBefore);
            else text.appendChild(actions);
        }
    });

    // Stagger discover cards
    document.querySelectorAll('.discover-card').forEach((card, i) => {
        card.style.animation = reduce ? 'none' : `rise 0.7s cubic-bezier(0.22,1,0.36,1) ${0.08 + i * 0.06}s both`;
    });

    document.querySelectorAll('.highlight-card').forEach((card, i) => {
        card.style.animation = reduce ? 'none' : `rise 0.7s cubic-bezier(0.22,1,0.36,1) ${0.12 + i * 0.07}s both`;
    });

    if (reduce) {
        blocs.forEach((b) => b.classList.add('is-in'));
    } else if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
        blocs.forEach((b) => io.observe(b));
    } else {
        blocs.forEach((b) => b.classList.add('is-in'));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();
