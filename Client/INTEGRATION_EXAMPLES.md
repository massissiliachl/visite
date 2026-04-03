# 🔧 INTEGRATION EXAMPLES - Code Snippets

This file contains concrete, copy-paste-ready code examples for integrating each feature.

---

## Step 0: Add Scripts to index.html

**Location:** `Client/index.html` (before `</body>` closing tag)

### Add these script tags:

```html
    <!-- ============ CORE FEATURES - ADD THESE SCRIPTS ============ -->
    <!-- Shopping Cart System -->
    <script src="js/cart.js"></script>
    
    <!-- Dark Mode Toggle -->
    <script src="js/dark-mode.js"></script>
    
    <!-- Reviews & Testimonials -->
    <script src="js/reviews.js"></script>
    
    <!-- Chat Widget -->
    <script src="js/chat.js"></script>
    
    <!-- Advanced Filters -->
    <script src="js/filters.js"></script>
    
    <!-- Interactive Maps -->
    <script src="js/maps.js"></script>
    
    <!-- User Dashboard -->
    <script src="js/dashboard.js"></script>
    <!-- ============================================================ -->

</body>
</html>
```

---

## FEATURE 1: Shopping Cart

### 1.1 Add to Navbar (navbar.html)

**Add this link in navbar, near search bar:**

```html
<!-- Cart Icon with Badge -->
<a href="cart.html" class="navbar-cart-link" title="Panier">
    <i class="fas fa-shopping-cart"></i>
    <span class="cart-badge" id="cartCount">0</span>
</a>
```

### 1.2 Navbar CSS (css/style.css)

```css
/* Cart Badge */
.navbar-cart-link {
    position: relative;
    display: inline-flex;
    align-items: center;
    margin: 0 1rem;
    cursor: pointer;
    transition: color 0.3s ease;
}

.navbar-cart-link:hover {
    color: #d32f2f;
}

.cart-badge {
    position: absolute;
    top: -8px;
    right: -12px;
    background: #d32f2f;
    color: white;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}
```

### 1.3 Add to Cart Button on Activities (activites.html)

**Example for each activity card:**

```html
<div class="activity-card">
    <img src="assets/images/bateau.jpg" alt="Sortie en Bateau">
    <h3>Sortie en Bateau</h3>
    <p>Explorez les côtes magnifiques de Béjaïa en bateau</p>
    <p class="activity-price">5000 DZD</p>
    
    <!-- ADD THIS BUTTON -->
    <button class="btn-add-to-cart" onclick="addActivityToCart()">
        <i class="fas fa-shopping-cart"></i> Ajouter au Panier
    </button>
</div>

<script>
function addActivityToCart() {
    window.shoppingCart.addItem({
        id: 'bateau-sortie',
        name: 'Sortie en Bateau',
        price: 5000,
        category: 'mer',
        image: 'assets/images/bateau.jpg',
        date: new Date().toISOString().split('T')[0],
        participants: 1
    });
}
</script>
```

### 1.4 Button Styling (css/style.css)

```css
.btn-add-to-cart {
    background: linear-gradient(135deg, #1a3a6b, #d32f2f);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    margin-top: 1rem;
}

.btn-add-to-cart:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(211, 47, 47, 0.3);
}

.btn-add-to-cart:active {
    transform: translateY(-1px);
}
```

### 1.5 Link Cart Page (navbar.html or index.html)

**If you want a checkout button in header:**

```html
<a href="cart.html" class="btn-checkout">
    <i class="fas fa-bag-shopping"></i> Voir le Panier
</a>
```

---

## FEATURE 2: Dark Mode

**No implementation needed!** It auto-initializes.

### Optional: Add Manual Toggle Button

If you want to add a custom toggle elsewhere:

```html
<!-- Manual toggle button -->
<button id="customDarkToggle" onclick="window.darkModeManager?.toggle()">
    <i class="fas fa-moon"></i> Dark Mode
</button>
```

### Optional: CSS Variable Support

Add to your style.css for dark mode compatibility:

```css
:root {
    --bg-primary: white;
    --bg-secondary: #f9f9f9;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --border-color: #ddd;
}

html[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-primary: white;
    --text-secondary: #b0b0b0;
    --border-color: #404040;
}

body {
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: background 0.3s, color 0.3s;
}

/* All your elements will inherit these variables */
```

---

## FEATURE 3: Reviews & Testimonials

### 3.1 Add Reviews Section (activite11.html)

**Add this div where you want reviews to appear:**

```html
<!-- Reviews Section -->
<section id="reviews-section">
    <div id="reviews-container"></div>
</section>
```

### 3.2 Add Styling (css/style.css)

```css
#reviews-section {
    margin: 3rem 0;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 15px;
}

#reviews-section h2 {
    color: #1a3a6b;
    margin-top: 0;
}
```

### 3.3 Initialize Reviews (in script or before </body>)

```html
<script>
document.addEventListener('DOMContentLoaded', () => {
    // Initialize reviews manager and render to container
    if (document.getElementById('reviews-container')) {
        window.reviewsManager.renderReviewsSection('reviews-container');
    }
});
</script>
```

### 3.4 Add Reviews to Multiple Pages

**For each activity/attraction page, add:**

```html
<!-- Near bottom of page HTML -->
<div id="reviews-container"></div>

<script>
document.addEventListener('DOMContentLoaded', () => {
    window.reviewsManager.renderReviewsSection('reviews-container');
});
</script>
```

---

## FEATURE 4: Chat Widget

**No implementation needed!** It auto-initializes and appears bottom-right.

### Optional: Customize Bot Responses

Edit `Client/js/chat.js` and find the `getBotResponse()` method:

```javascript
// In chat.js, modify these responses:
getBotResponse(userMessage) {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('prix') || lower.includes('coût')) {
        return "Nos tarifs varient de 3500 à 8500 DZD selon l'activité.";
    }
    if (lower.includes('réservation') || lower.includes('booking')) {
        return "Vous pouvez réserver directement ici ou nous appeler.";
    }
    // Add your custom responses here
    
    return "Merci de votre question! Contactez-nous au +213...";
}
```

### Optional: Position the Button

Edit `Client/js/chat.js` and find the CSS injection. Change:

```javascript
injectChatStyles() {
    const styles = `
        #chatWidget {
            position: fixed;
            bottom: 30px;      // Change these values
            right: 100px;      // to position differently
            z-index: 9998;
        }
    `;
}
```

---

## FEATURE 5: Advanced Filters

### 5.1 Add Filter Panel to activites.html

**Add this before your activity cards display:**

```html
<div class="activities-page">
    <!-- Filters Panel will appear here automatically -->
    <!-- (filters.js creates it) -->
    
    <div id="activitiesDisplay">
        <!-- Your activity cards go here -->
        <div class="activity-card">
            <!-- ... activity content ... -->
        </div>
    </div>
</div>
```

### 5.2 Listen to Filter Events (activites.html)

**Add this JavaScript to filter your activity display:**

```html
<script>
// Listen for filter changes
window.addEventListener('filtersChanged', (event) => {
    const filteredActivities = event.detail.activities;
    const count = event.detail.count;
    
    // Hide all cards
    document.querySelectorAll('.activity-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Show matching cards
    filteredActivities.forEach(activity => {
        const card = document.getElementById(`activity-${activity.id}`);
        if (card) card.style.display = 'block';
    });
    
    // Update counter
    const counter = document.querySelector('.activities-count');
    if (counter) counter.textContent = `${count} activité(s) trouvée(s)`;
});
</script>
```

### 5.3 Add Activity Cards HTML

**Your activity cards should have data attributes:**

```html
<div class="ACTIVITIES-SECTION">
    <div class="activities-count">Affichage: X activité(s)</div>
    <div class="activities-grid">
        <!-- Card 1 -->
        <div class="activity-card" id="activity-1">
            <img src="assets/images/bateau.jpg">
            <h3>Sortie en Bateau</h3>
            <p>Desc...</p>
            <p class="price">5000 DZD</p>
            <span class="difficulty">Facile</span>
            <span class="cat">Mer</span>
            <button>Réserver</button>
        </div>

        <!-- Card 2 -->
        <div class="activity-card" id="activity-2">
            <!-- ... more cards ... -->
        </div>
    </div>
</div>
```

---

## FEATURE 6: Interactive Maps

### 6.1 Add Main Map to index.html

**Add after hero section:**

```html
<!-- Interactive Map Section -->
<section id="map-section" style="padding: 3rem 0;">
    <h2 style="text-align: center; color: #1a3a6b;">Découvrez Béjaïa sur Carte</h2>
    <div id="mainMap" style="width: 100%; height: 500px;"></div>
</section>
```

### 6.2 Add Maps to destination.html

**For each destination page:**

```html
<div class="destination-map">
    <h3>Localisation</h3>
    <div id="gouraya-map" data-map-destination="gouraya" 
         style="width: 100%; height: 400px;"></div>
</div>
```

### 6.3 Add CSS for Maps (css/style.css)

```css
#mainMap {
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    margin: 2rem 0;
}

.destination-map {
    margin: 3rem 0;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 15px;
}

.leaflet-container {
    border-radius: 10px;
}
```

### 6.4 Create destination.html (if needed)

**New page linking from navbar:**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Destinations - VisitBejaia</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body>
    <!-- Include navbar -->
    <div id="navbar"></div>
    
    <main>
        <h1>Destination: Gouraya</h1>
        <div id="gouraya-map" data-map-destination="gouraya" 
             style="width: 100%; height: 500px; margin: 2rem 0;"></div>
        <p>Description de Gouraya...</p>

        <h2>Destination: Cap Carbon</h2>
        <div id="capcarbon-map" data-map-destination="capcarbon"
             style="width: 100%; height: 500px; margin: 2rem 0;"></div>
        <p>Description de Cap Carbon...</p>
    </main>

    <!-- Include footer -->
    <div id="footer"></div>

    <!-- Scripts -->
    <script src="js/maps.js"></script>
</body>
</html>
```

---

## FEATURE 7: User Dashboard

### 7.1 Create dashboard.html

**New file: `Client/dashboard.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon Tableau de Bord - VisitBejaia</title>
    
    <!-- Fonts & Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Cormorant+Garamond:wght@700&display=swap" rel="stylesheet">
    
    <!-- Base Styles -->
    <link rel="stylesheet" href="css/style.css">
    
    <style>
        body {
            font-family: 'Montserrat', sans-serif;
            background: #f5f5f5;
        }
    </style>
</head>
<body>
    <!-- Navigation (optional, include if you have navbar.js) -->
    <!-- <div id="navbar"></div> -->

    <!-- Dashboard will be inserted here by dashboard.js -->
    
    <!-- Scripts -->
    <script src="js/dashboard.js"></script>
</body>
</html>
```

### 7.2 Add Link to Dashboard in Navbar (navbar.html)

**Add this to your navbar:**

```html
<!-- User Account Link -->
<a href="dashboard.html" class="navbar-user-link" title="Mon Compte">
    <i class="fas fa-user-circle"></i>
    <span>Mon Compte</span>
</a>
```

### 7.3 Navbar CSS for Dashboard Link (css/style.css)

```css
.navbar-user-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.navbar-user-link:hover {
    background: #f0f0f0;
    color: #d32f2f;
}
```

### 7.4 Add a Reservation from Cart (cart.html)

**After checkout, add reservation to dashboard:**

```javascript
// In cart checkout button onclick:
function proceedToCheckout() {
    // Get cart items
    const items = window.shoppingCart.getItems();
    const total = window.shoppingCart.getTotalPrice();
    
    // Add to dashboard reservations
    if (window.userDashboard && items.length > 0) {
        window.userDashboard.addReservation(
            items[0].name,           // Activity name
            items[0].date,           // Date
            items[0].participants,   // Participants
            'Béjaïa',               // Location
            total                    // Price
        );
    }
    
    // Clear cart and redirect
    window.shoppingCart.clearCart();
    window.location.href = 'dashboard.html';
}
```

---

## Complete Integration Summary

### Files to Modify
1. **index.html** - Add scripts, mainMap div
2. **navbar.html** - Add cart/user links
3. **activites.html** - Add filter listeners, add-to-cart buttons
4. **style.css** - Add CSS variables, component styles

### Files to Create
1. **dashboard.html** - User dashboard page
2. **destination.html** - Maps display page (optional)

### Files Already Created
1. ✅ cart.js
2. ✅ dark-mode.js
3. ✅ reviews.js
4. ✅ chat.js
5. ✅ filters.js
6. ✅ maps.js
7. ✅ dashboard.js
8. ✅ cart.html

### Total Implementation Time
- **Quick start:**  15 minutes (add scripts)
- **Cart system:** 10 minutes (buttons + badge)
- **Reviews:** 10 minutes (add container + init)
- **Filters:** 15 minutes (add listeners)
- **Maps:** 10 minutes (add divs)
- **Dashboard:** 20 minutes (create page + link)
- **Polish:** 20 minutes (styling + testing)

**Total: ~100 minutes for full integration**

---

## Testing Each Feature

### Test Cart
1. Click "Ajouter au Panier" button
2. See badge update with count
3. Click cart icon → see items
4. Modify quantities
5. Refresh page → items still there (localStorage)

### Test Dark Mode
1. Look bottom-right corner
2. Click moon icon
3. See page invert colors
4. Refresh page → dark mode persists

### Test Reviews
1. Go to activity page
2. See reviews section
3. Click "Ajouter un avis"
4. Submit review
5. See it appear in list with rating

### Test Filters
1. Go to activites.html
2. Move price slider
3. See activity list update
4. Check difficulty boxes
5. Count updates below filters

### Test Maps
1. Go to index.html with map
2. See Béjaïa region map
3. Click markers
4. See popups with info
5. Zoom in/out works

### Test Chat
1. Look bottom-right corner
2. Click chat icon
3. Type question about "prix"
4. Get bot response
5. Messages persist in session

### Test Dashboard
1. Click "Mon Compte" link
2. See user profile form
3. Fill and save profile
4. Check Mes Réservations tab
5. See saved data persist

---

**All systems ready for implementation! 🚀**

Copy these code snippets into your HTML files and test locally.

