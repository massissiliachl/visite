window.ActivityCards = {
    categoryLabels: {
        mer: 'Mer & Eau',
        terre: 'Aventure',
        culture: 'Culture'
    },

    formatPrice(act) {
        if (act.id === 'bateau') return 'À partir de 16 000 DA';
        return `${Number(act.basePrice).toLocaleString('fr-DZ')} DA`;
    },

    buildHTML(act, idx) {
        const category = this.categoryLabels[act.category] || act.category;
        return `<article class="activity-card glass-card" style="--i:${idx}">
            <div class="card-shine" aria-hidden="true"></div>
            <div class="card-media">
                <img src="${act.image}" alt="${act.name}" loading="lazy" onerror="this.src='assets/images/all.jpg'">
                <div class="card-media-overlay"></div>
                <span class="card-category">${category}</span>
                <span class="price-badge">${this.formatPrice(act)}</span>
            </div>
            <div class="card-glass">
                <div class="card-glass-inner">
                    <div class="card-top">
                        <div class="icon-circle"><i class="fas ${act.icon}"></i></div>
                        <h3 class="card-title">${act.name}</h3>
                    </div>
                    <p class="card-desc">${act.desc}</p>
                    <button type="button" class="btn-book" data-id="${act.id}" data-name="${act.name}" data-price="${act.basePrice}">
                        <span>Réserver</span><i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </article>`;
    },

    initTilt() {
        const canTilt = window.matchMedia('(hover: hover) and (min-width: 769px)').matches;
        document.querySelectorAll('.activity-card.glass-card').forEach((card, i) => {
            card.style.setProperty('--i', i);
            if (!canTilt) return;

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg) translateY(-12px) scale(1.02)`;
                card.style.boxShadow = '0 40px 80px -20px rgba(26, 58, 107, 0.35), 0 0 0 1px rgba(255,255,255,0.15) inset';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
            });
        });
    },

    initScrollDots() {
        const grid = document.getElementById('activitiesGrid');
        const dotsWrap = document.getElementById('activitiesDots');
        if (!grid || !dotsWrap) return;

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const cards = grid.querySelectorAll('.activity-card');
        dotsWrap.innerHTML = '';

        if (!isMobile || cards.length <= 1) return;

        cards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Activité ${i + 1}`);
            dot.addEventListener('click', () => {
                cards[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            });
            dotsWrap.appendChild(dot);
        });

        const dots = dotsWrap.querySelectorAll('.dot');
        let scrollTimer;
        grid.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const gridRect = grid.getBoundingClientRect();
                const center = gridRect.left + gridRect.width / 2;
                let activeIdx = 0;
                let minDist = Infinity;
                cards.forEach((card, i) => {
                    const r = card.getBoundingClientRect();
                    const cardCenter = r.left + r.width / 2;
                    const dist = Math.abs(center - cardCenter);
                    if (dist < minDist) {
                        minDist = dist;
                        activeIdx = i;
                    }
                });
                dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
            }, 60);
        }, { passive: true });
    },

    bindBookButtons(onBookClick) {
        document.querySelectorAll('.btn-book').forEach((btn) => {
            btn.addEventListener('click', () => onBookClick(btn));
        });
    },

    afterRender(onBookClick) {
        this.initTilt();
        this.initScrollDots();
        this.bindBookButtons(onBookClick);
    }
};
