# Guide d'Utilisation du Système de Validation

## 📋 Qu'est-ce qu'on vient de créer?

Vous avez maintenant un système complet de **validation de données client** avec:

### Fichiers créés:
1. **validation.js** - Système de validation réutilisable
2. **reservation.html** - Formulaire d'exemple avec validation intégrée

---

## 🎯 Cas d'utilisation

### 1️⃣ VALIDER UN FORMULAIRE SIMPLE

**Code HTML:**
```html
<form id="bookingForm">
    <input type="text" name="fullName" placeholder="Nom complet" required>
    <input type="email" name="email" placeholder="Email" required>
    <input type="tel" name="phone" placeholder="Téléphone" required>
    <input type="number" name="participants" min="1" value="1" required>
    <button type="submit">Réserver</button>
</form>

<script src="validation.js"></script>
<script>
    const form = document.getElementById('bookingForm');
    const validator = new FormValidator(form);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        validator.submit((cleanData) => {
            saveReservation(cleanData);
            console.log('Réservation sauvegardée:', cleanData);
        });
    });
</script>
```

---

### 2️⃣ VALIDER JUSTE UN EMAIL

```javascript
// Vérifier si un email est valide
if (Validator.isValidEmail("user@example.com")) {
    console.log("Email valide ✓");
} else {
    console.log("Email invalide ✗");
}
```

---

### 3️⃣ VALIDER UN TÉLÉPHONE

```javascript
// Format algérien: +213... ou 0...
const phone = "+213698765432";

if (Validator.isValidPhone(phone)) {
    console.log("Téléphone valide ✓");
} else {
    console.log("Téléphone invalide ✗");
    // Formats acceptés:
    // ✓ +213698765432
    // ✓ 0698765432
    // ✓ +213 6 98 76 54 32 (avec espaces)
}
```

---

### 4️⃣ VALIDER UN OBJET COMPLET

```javascript
const reservation = {
    fullName: "Ali Benali",
    email: "ali@example.com",
    phone: "+213698765432",
    participants: 4,
    specialRequests: "Régime végétarien",
    type: "destination",
    status: "pending"
};

const validation = Validator.validateReservation(reservation);

if (validation.isValid) {
    console.log("✓ Réservation valide");
    console.log("Avertissements:", validation.warnings);
    saveReservation(reservation);
} else {
    console.log("✗ Erreurs:", validation.errors);
    // Résultat:
    // {
    //     fullName: "Erreur sur le nom...",
    //     email: "Erreur sur l'email...",
    //     ...
    // }
}
```

---

### 5️⃣ NETTOYER LES DONNÉES

```javascript
const donneesBrutes = {
    fullName: "  ali benali  ",
    email: "ALI@EXAMPLE.COM  ",
    phone: "0698765432",
    participants: "4"
};

const donneesPropres = Validator.sanitizeData(donneesBrutes);
// Résultat:
// {
//     fullName: "ali benali",
//     email: "ali@example.com",
//     phone: "+213698765432",
//     participants: 4,
//     ...
// }
```

---

## 🔍 Validations Disponibles

### Emails
```javascript
Validator.isValidEmail("contact@example.com") // true
Validator.isValidEmail("invalid.email")       // false
```

### Téléphones (Algérie)
```javascript
Validator.isValidPhone("+213698765432")  // ✓ true
Validator.isValidPhone("0698765432")     // ✓ true
Validator.isValidPhone("0698")           // ✗ false (trop court)
```

### Noms
```javascript
Validator.isValidName("Ali Benali")      // ✓ true (3+ caractères)
Validator.isValidName("33Ali")           // ✗ false (commence par chiffre)
Validator.isValidName("Al")              // ✗ false (trop court)
```

### Participants
```javascript
Validator.isValidParticipants(1)         // ✓ true
Validator.isValidParticipants(50)        // ✓ true
Validator.isValidParticipants(51)        // ✗ false (max 50)
Validator.isValidParticipants(0)         // ✗ false (min 1)
```

### Prix
```javascript
Validator.isValidPrice("9500")           // ✓ true
Validator.isValidPrice("0")              // ✗ false
Validator.isValidPrice("-100")           // ✗ false
```

---

## 🛠️ Intégration dans vos pages

### Dans hebergement.html

Remplacez le bouton "Réserver maintenant" par:

```html
<a href="reservation.html" class="modal-btn">Réserver maintenant</a>
```

### Dans activites.html

Appliquez la même modification (link vers reservation.html).

### Dans un formulaire existant

```javascript
<script src="validation.js"></script>
<script>
    document.getElementById('myForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const form = e.target;
        const validator = new FormValidator(form);
        
        validator.submit((cleanData) => {
            // Les données sont nettoyées et valides
            // Sauvegarder dans localStorage
            saveReservation(cleanData);
        });
    });
</script>
```

---

## 📊 Admin Dashboard - Affichage des données validées

Votre admin.html utilise déjà les données stockées correctement. Les données validées apparaissent automatiquement!

```javascript
// Dans admin.html - les réservations sont filtrées et affichées
function loadReservations() {
    const allReservations = JSON.parse(localStorage.getItem('allReservations') || '[]');
    
    // Seules les réservations valides sont ici
    const validReservations = allReservations.filter(r => {
        const validation = Validator.validateReservation(r);
        return validation.isValid;
    });
    
    // Affichier les réservations
    renderReservations(validReservations);
}
```

---

## ✨ Fonctionnalités du validateur

### ✅ Avant validation
- Affiche les avertissements
- Détecte les doublons (même email dans l'heure)
- Nettoie les espaces inutiles

### ✅ Pendant validation
- Valide tous les champs obligatoires
- Vérifie les formats (email, téléphone)
- Controlees les longueurs
- Vérifie les limites (1-50 participants)

### ✅ Après validation
- Affiche les messages d'erreur au-dessus du formulaire
- Highlight les champs en erreur (bordure rouge)
- Affiche un message de succès après soumission

---

## 🎨 Personnaliser les messages d'erreur

Modifiez `validation.js` dans la fonction `getValidationErrors()`:

```javascript
if (!formData.fullName?.trim()) {
    errors.fullName = "Le nom complet est requis";  // ← Votre message
} else if (formData.fullName.trim().length < 3) {
    errors.fullName = "Le nom doit contenir au moins 3 caractères";  // ← Votre message
}
```

---

## 🚀 Prochaines étapes

1. **Testez** le formulaire de reservation.html
2. **Intégrez** le lien dans hebergement.html et activites.html
3. **Vérifiez** dans admin.html que les réservations apparaissent
4. **Personnalisez** les messages d'erreur si nécessaire

---

## 📞 Support

Pour tester rapidement, ouvrez reservation.html et:
- Essayez de soumettre avec des champs vides
- Entrez un email invalide
- Entrez un téléphone invalide
- Testez avec des données valides

Tous les messages d'erreur s'affichent directement dans le formulaire!

---

**Créé pour VisitBejaia** ✨

<script>
    console.log(Validator);  // Devrait afficher l'objet Validator
    console.log(SecurityValidator);  // Devrait afficher SecurityValidator
</script>
