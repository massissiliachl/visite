// small helper that loads footer.html into elements bearing data-include="footer"

document.addEventListener('DOMContentLoaded', function() {
    const placeholders = document.querySelectorAll('[data-include="footer"]');
    if (placeholders.length === 0) return;

    fetch('footer.html')
        .then(response => response.text())
        .then(html => {
            placeholders.forEach(ph => {
                ph.innerHTML = html;
            });
        })
        .catch(err => console.error('Échec chargement du footer :', err));
});

