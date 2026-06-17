(function () {
    const WA_NUMBER = '213557664089';
    const WA_MESSAGE = 'Bonjour Visit Béjaïa, je souhaite des informations sur vos activités.';

    function ensureStyles() {
        if (document.querySelector('link[href*="whatsapp-float.css"]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/whatsapp-float.css';
        document.head.appendChild(link);
    }

    function initWhatsAppFloat() {
        if (document.querySelector('.whatsapp-float-global')) return;

        ensureStyles();

        const link = document.createElement('a');
        link.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;
        link.className = 'whatsapp-float-global';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Contacter Visit Béjaïa sur WhatsApp');
        link.innerHTML = '<i class="fab fa-whatsapp"></i><span class="wa-tooltip">Besoin d\'aide ?</span>';

        document.body.appendChild(link);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhatsAppFloat);
    } else {
        initWhatsAppFloat();
    }
})();
