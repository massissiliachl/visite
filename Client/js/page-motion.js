/**
 * Animations globales Visit Béjaïa
 * - Reveal au scroll
 * - Parallax hero léger
 */
(function initPageMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const targets = document.querySelectorAll(
        '[data-animate], .hebergement-teaser, .destination-simple-section, .why-choose-us, .instagram-section, .contact, .activities-header, .activities-page-header, .hero-search'
    );

    targets.forEach((el) => el.classList.add('motion-ready'));

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('motion-in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        targets.forEach((el) => io.observe(el));
    } else {
        targets.forEach((el) => el.classList.add('motion-in'));
    }

    const search = document.querySelector('.hero-search');
    if (search) {
        setTimeout(() => search.classList.add('motion-in'), 400);
    }
})();
