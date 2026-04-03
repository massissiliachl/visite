/**
 * Script pour les animations déclenchées au scroll
 * Utilise Intersection Observer pour une meilleure performance
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configuration de l'Intersection Observer
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Ajouter la classe 'visible' pour déclencher l'animation
                entry.target.classList.add('visible');
                
                // Optionnel: arrêter d'observer après animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Sélectionner tous les éléments avec classes d'animation
    const animatedElements = document.querySelectorAll(
        '.fade-in, .fade-in-left, .fade-in-right, .scale-in'
    );

    animatedElements.forEach(element => {
        observer.observe(element);
    });

    // Animation spéciale pour les cartes
    const cards = document.querySelectorAll('[class*="card"]');
    cards.forEach((card, index) => {
        card.classList.add('fade-in');
        card.style.transitionDelay = (index * 0.1) + 's';
    });
});

/**
 * Fonction pour déclencher manuellement une animation
 * Utile pour ajouter dynamiquement des éléments
 */
function animateElement(element, animationType = 'fade-in') {
    element.classList.add(animationType);
    
    // Petit délai pour que la transition soit bien appliquée
    setTimeout(() => {
        element.classList.add('visible');
    }, 10);
}

// Exporter pour utilisation externe
window.animateElement = animateElement;

// Animation du logo au chargement
window.addEventListener('load', function() {
    const logo = document.querySelector('.logo h1, .logo h2');
    if (logo) {
        logo.style.animation = 'none';
        setTimeout(() => {
            logo.style.animation = 'fadeInDown 0.8s ease';
        }, 100);
    }
});

// Smooth scroll pour les ancres
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Parallax effect pour les images héros (optionnel)
const heroElements = document.querySelectorAll('[class*="hero"]');
window.addEventListener('scroll', function() {
    heroElements.forEach(element => {
        const scrollPosition = window.pageYOffset;
        const distance = scrollPosition * 0.5;
        
        if (element.style.backgroundImage) {
            element.style.backgroundPosition = `center ${distance}px`;
        }
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/**
 * Lazy load pour les images
 * Compatible avec les navigateurs modernes
 */
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.remove('skeleton');
                imageObserver.unobserve(img);
            }
        });
    });

    // Observer toutes les images avec data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
} else {
    // Fallback pour anciens navigateurs
    document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
    });
}

console.log('✨ Animations scroll chargées avec succès');
