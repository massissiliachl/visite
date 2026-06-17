// small helper that loads footer.html into elements bearing data-include="footer"

function loadWhatsAppWidget() {
    if (document.querySelector('script[src*="whatsapp-float.js"]')) return;
    const script = document.createElement('script');
    script.src = 'js/whatsapp-float.js';
    document.body.appendChild(script);
}

document.addEventListener('DOMContentLoaded', function() {
    loadWhatsAppWidget();

    const placeholders = document.querySelectorAll('[data-include="footer"]');
    if (placeholders.length === 0) return;

    fetch('footer.html')
        .then(response => response.text())
        .then(html => {
            placeholders.forEach(ph => {
                ph.outerHTML = html;
            });
        })
        .catch(err => console.error('Echec chargement du footer:', err));
});
