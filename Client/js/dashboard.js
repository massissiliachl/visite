// ===== USER DASHBOARD SYSTEM =====

class UserDashboard {
    constructor() {
        this.storageKey = 'visitBejaia_userProfile';
        this.reservationsKey = 'visitBejaia_reservations';
        this.user = this.loadUserProfile();
        this.reservations = this.loadReservations();
        
        this.initDashboard();
    }

    loadUserProfile() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {
            id: 'user_' + Date.now(),
            fullName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            postalCode: '',
            country: 'Algérie',
            memberSince: new Date().toLocaleDateString('fr-FR'),
            profileImage: 'https://via.placeholder.com/150',
            preferences: {
                newsletter: true,
                notifications: true,
                language: 'fr'
            }
        };
    }

    loadReservations() {
        const saved = localStorage.getItem(this.reservationsKey);
        return saved ? JSON.parse(saved) : [];
    }

    saveUserProfile() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.user));
    }

    saveReservations() {
        localStorage.setItem(this.reservationsKey, JSON.stringify(this.reservations));
    }

    initDashboard() {
        this.createDashboardUI();
        this.attachEventListeners();
    }

    createDashboardUI() {
        const dashboardHTML = `
            <div class="dashboard-container">
                <div class="dashboard-sidebar">
                    <div class="user-card">
                        <img src="${this.user.profileImage}" alt="Profile" class="profile-avatar" />
                        <h3>${this.user.fullName || 'Visiteur'}</h3>
                        <p class="member-since">Membre depuis ${this.user.memberSince}</p>
                        <button class="btn-primary" onclick="window.userDashboard.toggleEditProfile()">
                            <i class="fas fa-edit"></i> Modifier Profil
                        </button>
                    </div>

                    <nav class="dashboard-nav">
                        <button class="nav-btn active" onclick="window.userDashboard.switchTab('overview')">
                            <i class="fas fa-chart-line"></i> Aperçu
                        </button>
                        <button class="nav-btn" onclick="window.userDashboard.switchTab('reservations')">
                            <i class="fas fa-calendar"></i> Mes Réservations
                        </button>
                        <button class="nav-btn" onclick="window.userDashboard.switchTab('profile')">
                            <i class="fas fa-user"></i> Mon Profil
                        </button>
                        <button class="nav-btn" onclick="window.userDashboard.switchTab('preferences')">
                            <i class="fas fa-cog"></i> Préférences
                        </button>
                        <button class="nav-btn logout-btn" onclick="window.userDashboard.logout()">
                            <i class="fas fa-sign-out-alt"></i> Déconnexion
                        </button>
                    </nav>
                </div>

                <div class="dashboard-content">
                    <!-- Overview Tab -->
                    <div id="overview" class="tab-content active">
                        <h2>Aperçu de votre compte</h2>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <i class="fas fa-bookmark"></i>
                                <h4>Réservations</h4>
                                <p class="stat-number">${this.reservations.length}</p>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-star"></i>
                                <h4>Avis postés</h4>
                                <p class="stat-number" id="reviewCount">0</p>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-heart"></i>
                                <h4>Favoris</h4>
                                <p class="stat-number">-</p>
                            </div>
                            <div class="stat-card">
                                <i class="fas fa-flag"></i>
                                <h4>Points Fidélité</h4>
                                <p class="stat-number">${Math.floor(this.reservations.length * 100)}</p>
                            </div>
                        </div>

                        <div class="recent-activity">
                            <h3>Activité Récente</h3>
                            <div id="activityList" class="activity-list"></div>
                        </div>
                    </div>

                    <!-- Reservations Tab -->
                    <div id="reservations" class="tab-content">
                        <h2>Mes Réservations</h2>
                        <div id="reservationsList" class="reservations-list"></div>
                        ${this.reservations.length === 0 ? '<p class="empty-message">Aucune réservation pour le moment</p>' : ''}
                    </div>

                    <!-- Profile Tab -->
                    <div id="profile" class="tab-content">
                        <h2>Informations Personnelles</h2>
                        <form id="profileForm" class="profile-form">
                            <div class="form-group">
                                <label>Nom Complet</label>
                                <input type="text" name="fullName" value="${this.user.fullName}" placeholder="Votre nom complet" />
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value="${this.user.email}" placeholder="votre@email.com" />
                            </div>
                            <div class="form-group">
                                <label>Téléphone</label>
                                <input type="tel" name="phone" value="${this.user.phone}" placeholder="+213..." />
                            </div>
                            <div class="form-group">
                                <label>Adresse</label>
                                <input type="text" name="address" value="${this.user.address}" placeholder="Numéro et rue" />
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Ville</label>
                                    <input type="text" name="city" value="${this.user.city}" placeholder="Ville" />
                                </div>
                                <div class="form-group">
                                    <label>Code Postal</label>
                                    <input type="text" name="postalCode" value="${this.user.postalCode}" placeholder="Code postal" />
                                </div>
                            </div>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Enregistrer les modifications
                            </button>
                        </form>
                    </div>

                    <!-- Preferences Tab -->
                    <div id="preferences" class="tab-content">
                        <h2>Préférences</h2>
                        <div class="preferences-list">
                            <div class="pref-item">
                                <div class="pref-info">
                                    <h4>Newsletter</h4>
                                    <p>Recevez nos offres exclusives et actualités</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="newsCheck" ${this.user.preferences.newsletter ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="pref-item">
                                <div class="pref-info">
                                    <h4>Notifications</h4>
                                    <p>Notifications pour vos réservations et offres</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="notificationsCheck" ${this.user.preferences.notifications ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                            <div class="pref-item">
                                <div class="pref-info">
                                    <h4>Langue</h4>
                                    <p>Choisissez votre langue préférée</p>
                                </div>
                                <select id="languageSelect">
                                    <option value="fr" ${this.user.preferences.language === 'fr' ? 'selected' : ''}>Français</option>
                                    <option value="en" ${this.user.preferences.language === 'en' ? 'selected' : ''}>English</option>
                                    <option value="ar" ${this.user.preferences.language === 'ar' ? 'selected' : ''}>العربية</option>
                                </select>
                            </div>
                        </div>
                        <button class="btn-primary" onclick="window.userDashboard.savePreferences()">
                            <i class="fas fa-save"></i> Enregistrer les préférences
                        </button>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.id = 'dashboardContainer';
        container.innerHTML = dashboardHTML;
        document.body.appendChild(container);

        this.addReservationsList();
        this.addActivityList();
        this.injectDashboardStyles();
    }

    addReservationsList() {
        const list = document.getElementById('reservationsList');
        if (!list) return;

        if (this.reservations.length === 0) {
            list.innerHTML = '<p class="empty-message">Aucune réservation pour le moment</p>';
            return;
        }

        list.innerHTML = this.reservations.map((res, idx) => `
            <div class="reservation-card">
                <div class="res-header">
                    <h4>${res.activity}</h4>
                    <span class="status ${res.status}">${res.status === 'confirmed' ? '✓ Confirmée' : 'En attente'}</span>
                </div>
                <div class="res-details">
                    <p><i class="fas fa-calendar"></i> ${res.date}</p>
                    <p><i class="fas fa-users"></i> ${res.participants} participant(s)</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${res.location}</p>
                    <p><strong>Total: ${res.price} DZD</strong></p>
                </div>
                <div class="res-actions">
                    <button class="btn-secondary" onclick="window.userDashboard.viewReservationDetails(${idx})">
                        Détails
                    </button>
                    <button class="btn-secondary" onclick="window.userDashboard.cancelReservation(${idx})">
                        Annuler
                    </button>
                </div>
            </div>
        `).join('');
    }

    addActivityList() {
        const list = document.getElementById('activityList');
        if (!list) return;

        const recent = this.reservations.slice(-3).reverse();
        if (recent.length === 0) {
            list.innerHTML = '<p class="empty-message">Aucune activité récente</p>';
            return;
        }

        list.innerHTML = recent.map(res => `
            <div class="activity-item">
                <i class="fas fa-check-circle"></i>
                <div class="activity-info">
                    <p><strong>Réservation:</strong> ${res.activity}</p>
                    <p class="activity-date">${res.date}</p>
                </div>
            </div>
        `).join('');
    }

    attachEventListeners() {
        const form = document.getElementById('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        document.getElementById('newsCheck')?.addEventListener('change', () => this.savePreferences());
        document.getElementById('notificationsCheck')?.addEventListener('change', () => this.savePreferences());
        document.getElementById('languageSelect')?.addEventListener('change', () => this.savePreferences());
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        document.getElementById(tabName)?.classList.add('active');
        event.target.classList.add('active');
    }

    saveProfile() {
        const form = document.getElementById('profileForm');
        const formData = new FormData(form);
        
        this.user.fullName = formData.get('fullName');
        this.user.email = formData.get('email');
        this.user.phone = formData.get('phone');
        this.user.address = formData.get('address');
        this.user.city = formData.get('city');
        this.user.postalCode = formData.get('postalCode');
        
        this.saveUserProfile();
        this.showNotification('✓ Profil mise à jour avec succès!', 'success');
    }

    savePreferences() {
        this.user.preferences = {
            newsletter: document.getElementById('newsCheck')?.checked || false,
            notifications: document.getElementById('notificationsCheck')?.checked || false,
            language: document.getElementById('languageSelect')?.value || 'fr'
        };
        
        this.saveUserProfile();
        this.showNotification('✓ Préférences sauvegardées!', 'success');
    }

    toggleEditProfile() {
        document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' });
        this.switchTab('profile');
    }

    viewReservationDetails(index) {
        const res = this.reservations[index];
        alert(`Réservation: ${res.activity}\nDate: ${res.date}\nParticipants: ${res.participants}\nPrix: ${res.price} DZD`);
    }

    cancelReservation(index) {
        if (confirm('Êtes-vous sûr de vouloir annuler cette réservation?')) {
            this.reservations.splice(index, 1);
            this.saveReservations();
            this.addReservationsList();
            this.addActivityList();
            this.showNotification('✓ Réservation annulée', 'success');
        }
    }

    addReservation(activity, date, participants, location, price) {
        const reservation = {
            id: 'res_' + Date.now(),
            activity,
            date,
            participants,
            location,
            price,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        this.reservations.push(reservation);
        this.saveReservations();
        this.addReservationsList();
        this.showNotification(`✓ Réservation de "${activity}" confirmée!`, 'success');
    }

    logout() {
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
            window.location.href = 'index.html';
        }
    }

    showNotification(message, type = 'info') {
        const notif = document.createElement('div');
        notif.className = `notification notification-${type}`;
        notif.textContent = message;
        
        const style = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#4caf50' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        notif.style.cssText = style;
        document.body.appendChild(notif);

        setTimeout(() => notif.remove(), 3000);
    }

    injectDashboardStyles() {
        const styles = `
            #dashboardContainer {
                display: flex;
                gap: 2rem;
                max-width: 1400px;
                margin: 2rem auto;
                padding: 0 1rem;
                font-family: 'Montserrat', sans-serif;
                min-height: 80vh;
            }

            .dashboard-sidebar {
                width: 280px;
                flex-shrink: 0;
            }

            .user-card {
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                padding: 2rem;
                border-radius: 15px;
                text-align: center;
                margin-bottom: 2rem;
            }

            .profile-avatar {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                margin: 0 auto 1rem;
                border: 3px solid white;
                object-fit: cover;
            }

            .user-card h3 {
                margin: 0.5rem 0;
                font-size: 1.3rem;
            }

            .member-since {
                font-size: 0.85rem;
                opacity: 0.9;
                margin-bottom: 1rem;
            }

            .dashboard-nav {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .nav-btn {
                background: white;
                border: 2px solid #f0f0f0;
                padding: 0.8rem 1rem;
                border-radius: 10px;
                cursor: pointer;
                text-align: left;
                color: #666;
                transition: all 0.3s ease;
                font-weight: 500;
            }

            .nav-btn:hover, .nav-btn.active {
                background: #1a3a6b;
                color: white;
                border-color: #1a3a6b;
            }

            .nav-btn i {
                margin-right: 0.5rem;
            }

            .logout-btn {
                margin-top: auto;
                color: #d32f2f;
                border-color: #d32f2f;
            }

            .logout-btn:hover {
                background: #d32f2f;
                color: white;
            }

            .dashboard-content {
                flex: 1;
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            }

            .dashboard-content h2 {
                color: #1a3a6b;
                margin-top: 0;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
                animation: fadeIn 0.3s ease;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.5rem;
                margin: 2rem 0;
            }

            .stat-card {
                background: linear-gradient(135deg, #f9f9f9, #f0f0f0);
                padding: 1.5rem;
                border-radius: 12px;
                border-left: 4px solid #d32f2f;
                text-align: center;
            }

            .stat-card i {
                font-size: 2rem;
                color: #d32f2f;
                margin-bottom: 0.5rem;
            }

            .stat-card h4 {
                margin: 0.5rem 0;
                color: #666;
                font-size: 0.9rem;
            }

            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #1a3a6b;
                margin: 0;
            }

            .recent-activity {
                margin-top: 2rem;
            }

            .activity-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .activity-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: #f9f9f9;
                border-radius: 10px;
                border-left: 3px solid #4caf50;
            }

            .activity-item i {
                font-size: 1.5rem;
                color: #4caf50;
            }

            .activity-info p {
                margin: 0;
                color: #666;
            }

            .activity-date {
                font-size: 0.85rem;
                color: #999;
                margin-top: 0.3rem !important;
            }

            .reservations-list {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }

            .reservation-card {
                background: #f9f9f9;
                border-left: 4px solid #2196F3;
                padding: 1.5rem;
                border-radius: 12px;
            }

            .res-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .res-header h4 {
                margin: 0;
                color: #1a3a6b;
            }

            .status {
                padding: 0.3rem 0.8rem;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 600;
            }

            .status.confirmed {
                background: #4caf50;
                color: white;
            }

            .status.pending {
                background: #ff9800;
                color: white;
            }

            .res-details p {
                margin: 0.5rem 0;
                color: #666;
            }

            .res-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }

            .profile-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                max-width: 600px;
            }

            .form-group {
                display: flex;
                flex-direction: column;
            }

            .form-group label {
                margin-bottom: 0.5rem;
                color: #1a3a6b;
                font-weight: 600;
            }

            .form-group input,
            .form-group select {
                padding: 0.8rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 0.95rem;
                font-family: inherit;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .preferences-list {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .pref-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                background: #f9f9f9;
                border-radius: 12px;
            }

            .pref-info h4 {
                margin: 0 0 0.3rem 0;
                color: #1a3a6b;
            }

            .pref-info p {
                margin: 0;
                color: #999;
                font-size: 0.9rem;
            }

            .switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }

            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }

            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 24px;
            }

            .slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }

            input:checked + .slider {
                background-color: #4caf50;
            }

            input:checked + .slider:before {
                transform: translateX(26px);
            }

            .btn-primary, .btn-secondary {
                padding: 0.8rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .btn-primary {
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                width: 100%;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(211, 47, 47, 0.3);
            }

            .btn-secondary {
                background: #f0f0f0;
                color: #1a3a6b;
                flex: 1;
            }

            .btn-secondary:hover {
                background: #e0e0e0;
            }

            .empty-message {
                text-align: center;
                color: #999;
                padding: 2rem;
                font-style: italic;
            }

            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @media (max-width: 1024px) {
                #dashboardContainer {
                    flex-direction: column;
                    gap: 1rem;
                }

                .dashboard-sidebar {
                    width: 100%;
                }

                .dashboard-nav {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                }

                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .pref-item {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: flex-start;
                }
            }

            @media (max-width: 768px) {
                .dashboard-nav {
                    grid-template-columns: repeat(2, 1fr);
                }

                .stats-grid {
                    grid-template-columns: 1fr;
                }

                .profile-avatar {
                    width: 80px;
                    height: 80px;
                }

                .res-actions {
                    flex-direction: column;
                }

                .res-actions button {
                    width: 100%;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if on dashboard page
    if (document.getElementById('dashboardContainer') === null) {
        window.userDashboard = new UserDashboard();
    }
});
