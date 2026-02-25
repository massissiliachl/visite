// navbar.js
fetch("components/navbar.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("navbar-placeholder").innerHTML = data;
        initializeNavbar();
    })
    .catch(error => {
        console.error("Erreur chargement navbar:", error);
    });

function initializeNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const voiceBtn = document.getElementById('voiceBtn');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    if (!navbar || !hamburger || !navMenu) {
        console.error("Éléments de la navbar non trouvés");
        return;
    }

    // Effet de scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Menu hamburger
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        navMenu.classList.toggle('active');
        
        const spans = this.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            document.body.style.overflow = 'hidden';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            document.body.style.overflow = '';
            dropdowns.forEach(d => d.classList.remove('active'));
        }
    });

    // Gestion des dropdowns en mobile
    dropdowns.forEach(dropdown => {
        const dropbtn = dropdown.querySelector('.dropbtn');
        
        dropbtn.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                dropdowns.forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
                dropdown.classList.toggle('active');
            }
        });
    });

    // GESTION INTELLIGENTE DES LIENS
    const menuLinks = navMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Si c'est un lien vers une ancre (#)
            if (href.startsWith('#')) {
                e.preventDefault();
                
                // Vérifier si on est sur la page d'accueil
                const isHomePage = window.location.pathname.endsWith('index.html') || 
                                  window.location.pathname === '/' || 
                                  window.location.pathname.endsWith('/');
                
                if (isHomePage) {
                    // Si on est sur la page d'accueil, on scrolle vers la section
                    const targetId = href.substring(1); // enlève le #
                    const targetSection = document.getElementById(targetId);
                    
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    // Si on est sur une autre page, on redirige vers index.html avec l'ancre
                    window.location.href = 'index.html' + href;
                }
            }
            
            // Fermer le menu mobile après clic
            if (window.innerWidth <= 992) {
                navMenu.classList.remove('active');
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                document.body.style.overflow = '';
                dropdowns.forEach(d => d.classList.remove('active'));
            }
        });
    });

    // Vérifier si on arrive sur la page avec une ancre dans l'URL
    if (window.location.hash) {
        setTimeout(() => {
            const targetId = window.location.hash.substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100); // Petit délai pour laisser la page charger
    }

    // Fermer en cliquant dehors
    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
            navMenu.classList.remove('active');
            const spans = hamburger.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            document.body.style.overflow = '';
            dropdowns.forEach(d => d.classList.remove('active'));
        }
    });

    // Reset au redimensionnement
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            navMenu.classList.remove('active');
            const spans = hamburger.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            document.body.style.overflow = '';
            dropdowns.forEach(d => d.classList.remove('active'));
        }
    });

    // Bouton vocal
    if (voiceBtn) {
        voiceBtn.addEventListener('click', function() {
            alert('Assistant vocal en cours de développement...');
        });
    }
}