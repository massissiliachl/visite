// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const dropdowns = document.querySelectorAll('.dropdown');

  // Toggle menu mobile
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }

  // Toggle dropdown mobile
  dropdowns.forEach(drop => {
    drop.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        drop.classList.toggle('active');

        // Empêche le lien parent de naviguer
        if (e.target.tagName === 'A' && e.target.classList.contains('dropbtn')) {
          e.preventDefault();
        }
      }
    });
  });

  // ============= SMOOTH SCROLL ET ANIMATIONS AU SCROLL =============

  // Scroll smooth pour tous les ancres
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Fermer le menu mobile si c'est ouvert
        navMenu.classList.remove('show');
      }
    });
  });

  // Intersection Observer pour animations plus fluides au scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observer tous les éléments animés
  document.querySelectorAll('.must-see-card, .blog-card, .about-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
  });

  // ============= ASSISTANTE VOCALE =============
  const voiceButton = document.getElementById('voiceBtn');
  
  if (voiceButton) {
    voiceButton.addEventListener('click', () => {
      speak('Bonjour, c\'est Visite Béjaïa. Bienvenue sur notre plateforme de voyage.');
    });
    console.log('Assistante vocale initialisée');
  }
});

// Fonction pour démarrer la synthèse vocale
let isSpeaking = false;

function speak(text) {
  // Arrêter si déjà en train de parler
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) voiceBtn.classList.remove('speaking');
    return;
  }

  isSpeaking = true;
  const voiceBtn = document.getElementById('voiceBtn');
  if (voiceBtn) voiceBtn.classList.add('speaking');

  // Créer une instance de SpeechSynthesisUtterance
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR'; // Français
  utterance.rate = 1; // Vitesse normale
  utterance.pitch = 1; // Ton normal
  utterance.volume = 1; // Volume maximum

  // Événement : fin de la parole
  utterance.onend = () => {
    isSpeaking = false;
    if (voiceBtn) voiceBtn.classList.remove('speaking');
  };

  // Événement : erreur
  utterance.onerror = () => {
    isSpeaking = false;
    if (voiceBtn) voiceBtn.classList.remove('speaking');
    console.error('Erreur de synthèse vocale');
  };

  // Démarrer la synthèse
  window.speechSynthesis.speak(utterance);
}

// Optionnel : salutation automatique au chargement de la page
window.addEventListener('load', () => {
  // Décommenter la ligne suivante pour salutation automatique
  // speak('Bonjour, c\'est Visite Béjaïa. Bienvenue sur notre plateforme de voyage.');

  // ============= SLIDER POUR LA SECTION À PROPOS =============
  const slides = document.querySelectorAll('.slider .slide');
  if (slides.length > 0) {
    let currentIndex = 0;
    const slideInterval = 4000; // 4 secondes entre chaque image

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) slide.classList.add('active');
      });
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      showSlide(currentIndex);
    }

    // Démarrage du slider
    showSlide(currentIndex);
    setInterval(nextSlide, slideInterval);
  }
});

// ============= RÉSERVATIONS DESTINATIONS =============
let currentDestination = '';
let currentDestinationPrice = 0;
const MAX_RESERVATIONS_PER_EMAIL = 5; // Protection contre les abus

// Valider format email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Valider téléphone
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone.trim());
}

// Vérifier si l'email a trop de réservations
function checkEmailLimit(email) {
  let allReservations = JSON.parse(localStorage.getItem('allReservations')) || [];
  const emailCount = allReservations.filter(r => r.email.toLowerCase() === email.toLowerCase()).length;
  return emailCount < MAX_RESERVATIONS_PER_EMAIL;
}

// Nettoyer les données (XSS protection)
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Ouvrir le modal de réservation destination
function openDestinationReservation(destId, destName, price) {
  currentDestination = destId;
  currentDestinationPrice = price;
  document.getElementById('destinationModalTitle').textContent = `Réserver: ${destName}`;
  document.getElementById('destinationReservationModal').classList.add('active');
  document.getElementById('destParticipants').value = 1;
  updateDestinationTotalPrice();
}

// Fermer le modal de réservation destination
function closeDestinationReservation() {
  document.getElementById('destinationReservationModal').classList.remove('active');
  document.getElementById('destinationReservationForm').reset();
  document.getElementById('destFormMessage').className = 'form-message';
}

// Mettre à jour le prix total destination
function updateDestinationTotalPrice() {
  const participants = parseInt(document.getElementById('destParticipants').value) || 1;
  const total = participants * currentDestinationPrice;
  document.getElementById('destTotalPrice').textContent = total.toLocaleString('fr-DZ') + ' DZD';
}

// Ajouter l'event listener pour les participants
document.addEventListener('DOMContentLoaded', () => {
  const destParticipantsInput = document.getElementById('destParticipants');
  if (destParticipantsInput) {
    destParticipantsInput.addEventListener('change', updateDestinationTotalPrice);
  }
});

// Soumettre la réservation destination
async function submitDestinationReservation(event) {
  event.preventDefault();

  // Récupérer les données
  const fullName = document.getElementById('destFullName').value.trim();
  const email = document.getElementById('destEmail').value.trim().toLowerCase();
  const phone = document.getElementById('destPhone').value.trim();
  const date = document.getElementById('destDate').value;
  const participants = document.getElementById('destParticipants').value;
  
  const messageEl = document.getElementById('destFormMessage');

  // Validation 1: Email format
  if (!isValidEmail(email)) {
    messageEl.className = 'form-message error';
    messageEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Veuillez entrer un email valide';
    return;
  }

  // Validation 2: Téléphone format
  if (!isValidPhone(phone)) {
    messageEl.className = 'form-message error';
    messageEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Téléphone invalide (au moins 10 chiffres)';
    return;
  }

  // Validation 3: Nom complet
  if (fullName.length < 3) {
    messageEl.className = 'form-message error';
    messageEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Le nom doit contenir au moins 3 caractères';
    return;
  }

  // Validation 4: Limite d'email
  if (!checkEmailLimit(email)) {
    messageEl.className = 'form-message error';
    messageEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Maximum ${MAX_RESERVATIONS_PER_EMAIL} réservations par email`;
    return;
  }

  // Validation 5: Date future
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate < today) {
    messageEl.className = 'form-message error';
    messageEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> La date doit être dans le futur';
    return;
  }

  // Données sécurisées
  const formData = {
    type: 'destination',
    destination: sanitizeInput(currentDestination),
    fullName: sanitizeInput(fullName),
    email: email,
    phone: sanitizeInput(phone),
    startDate: date,
    participants: parseInt(participants),
    regimen: document.getElementById('destRegimen').value,
    specialRequests: sanitizeInput(document.getElementById('destRequests').value),
    totalPrice: currentDestinationPrice * parseInt(participants),
    timestamp: new Date().toISOString(),
    status: 'pending',
    verified: false, // Email non vérifié pour l'instant
    ipHash: hashCode(navigator.userAgent) // Identification unique (optionnel)
  };

  // Sauvegarder dans localStorage
  let reservations = JSON.parse(localStorage.getItem('allReservations')) || [];
  reservations.push(formData);
  localStorage.setItem('allReservations', JSON.stringify(reservations));

  // Envoyer au backend pour stockage dans la table Reservation
  try {
    const resp = await fetch('http://localhost:3000/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        startDate: formData.startDate,
        participants: formData.participants,
        destination: formData.destination,
        totalPrice: formData.totalPrice,
        regimen: formData.regimen,
        status: 'pending'
      })
    });

    if (resp.ok) {
      const created = await resp.json();
      console.log('Réservation enregistrée côté serveur:', created);
      // Conserver l'id serveur dans le localStorage si besoin
      reservations = JSON.parse(localStorage.getItem('allReservations')) || [];
      reservations[reservations.length - 1].serverId = created.id;
      localStorage.setItem('allReservations', JSON.stringify(reservations));
    } else {
      console.error('Erreur serveur lors de la sauvegarde de la réservation');
    }
  } catch (err) {
    console.error('Impossible de joindre le serveur:', err);
  }

  // Message de succès
  messageEl.className = 'form-message success';
  messageEl.innerHTML = '<i class="fas fa-check-circle"></i> Réservation confirmée! Vérifiez votre email pour confirmer.';

  // Réinitialiser après 2 secondes
  setTimeout(() => {
    closeDestinationReservation();
  }, 2000);
}

// Hash simple pour identifier l'utilisateur
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}