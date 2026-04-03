// ===== REVIEWS & TESTIMONIALS SYSTEM =====

class ReviewsManager {
    constructor() {
        this.storageKey = 'visitBejaia_reviews';
        this.reviews = this.loadReviews();
    }

    loadReviews() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : this.getDefaultReviews();
    }

    saveReviews() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.reviews));
    }

    getDefaultReviews() {
        return [
            {
                id: 1,
                author: "Ahmed Ben Salem",
                rating: 5,
                title: "Expérience magnifique!",
                text: "La sortie en bateau était fantastique. Les paysages étaient incroyables et le guide était très professionnel.",
                activity: "Sortie en bateau",
                date: new Date().toISOString(),
                verified: true,
                helpful: 156
            },
            {
                id: 2,
                author: "Fatima Ouarab",
                rating: 5,
                title: "Randonnée à cheval inoubliable",
                text: "Ma famille a adoré cette expérience. Les chevaux étaient bien traités et les paysages spectaculaires.",
                activity: "Randonnée à Cheval",
                date: new Date().toISOString(),
                verified: true,
                helpful: 203
            },
            {
                id: 3,
                author: "Mohammed Kerim",
                rating: 4,
                title: "Très bon rapport qualité-prix",
                text: "Plongée sous-marine vraiment top. Juste un petit souci avec l'équipement au début mais rapidement résolu.",
                activity: "Plongée Sous-Marine",
                date: new Date().toISOString(),
                verified: true,
                helpful: 87
            }
        ];
    }

    addReview(review) {
        const newReview = {
            id: Math.max(...this.reviews.map(r => r.id), 0) + 1,
            ...review,
            date: new Date().toISOString(),
            verified: false,
            helpful: 0
        };
        this.reviews.unshift(newReview);
        this.saveReviews();
        return newReview;
    }

    getReviewsByActivity(activity) {
        return this.reviews.filter(r => r.activity === activity);
    }

    getAverageRating() {
        if (this.reviews.length === 0) return 0;
        const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / this.reviews.length).toFixed(1);
    }

    getRatingDistribution() {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        this.reviews.forEach(r => {
            distribution[r.rating]++;
        });
        return distribution;
    }

    renderReviewsSection(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const avgRating = this.getAverageRating();
        const distribution = this.getRatingDistribution();
        const totalReviews = this.reviews.length;

        container.innerHTML = `
            <div class="reviews-section">
                <h2>Avis des Clients</h2>
                
                <div class="reviews-summary">
                    <div class="rating-overview">
                        <div class="average-rating">
                            <div class="rating-number">${avgRating}</div>
                            <div class="rating-stars">${this.renderStars(Math.round(avgRating))}</div>
                            <div class="total-reviews">(${totalReviews} avis)</div>
                        </div>
                        
                        <div class="rating-distribution">
                            ${this.renderRatingBars(distribution)}
                        </div>
                    </div>
                    
                    <button class="btn-add-review" onclick="window.reviewsManager.openReviewForm()">
                        <i class="fas fa-star"></i> Laisser un Avis
                    </button>
                </div>
                
                <div class="reviews-list">
                    ${this.reviews.slice(0, 6).map(review => this.renderReview(review)).join('')}
                </div>
                
                ${totalReviews > 6 ? '<button class="btn-see-all" onclick="window.reviewsManager.showAllReviews()">Voir tous les avis</button>' : ''}
            </div>
        `;

        this.initReviewStyles();
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fas fa-star${i <= rating ? '' : '-outline'}" style="color: #ffc107;"></i>`;
        }
        return stars;
    }

    renderRatingBars(distribution) {
        let bars = '';
        for (let i = 5; i >= 1; i--) {
            const count = distribution[i];
            const percentage = this.reviews.length > 0 ? (count / this.reviews.length) * 100 : 0;
            bars += `
                <div class="rating-bar">
                    <span class="rating-label">${i} ${i === 1 ? 'étoile' : 'étoiles'}</span>
                    <div class="bar-container">
                        <div class="bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="rating-count">${count}</span>
                </div>
            `;
        }
        return bars;
    }

    renderReview(review) {
        return `
            <div class="review-card">
                <div class="review-header">
                    <div class="reviewer-info">
                        <h4>${review.author}</h4>
                        <span class="review-date">${new Date(review.date).toLocaleDateString('fr-FR')}</span>
                        ${review.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Achat vérifié</span>' : ''}
                    </div>
                    <div class="review-rating">${this.renderStars(review.rating)}</div>
                </div>
                <h5 class="review-title">${review.title}</h5>
                <p class="review-text">${review.text}</p>
                <div class="review-footer">
                    <span class="review-activity"><i class="fas fa-tag"></i> ${review.activity}</span>
                    <button class="helpful-btn" onclick="window.reviewsManager.markHelpful(${review.id})">
                        <i class="fas fa-thumbs-up"></i> Utile (${review.helpful})
                    </button>
                </div>
            </div>
        `;
    }

    openReviewForm() {
        const modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="review-form">
                <button class="close-form" onclick="this.closest('.review-modal').remove()"><i class="fas fa-times"></i></button>
                <h3>Laisser un Avis</h3>
                
                <form onsubmit="window.reviewsManager.submitReview(event)">
                    <div class="form-group">
                        <label>Votre Nom</label>
                        <input type="text" id="reviewName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Activité</label>
                        <select id="reviewActivity" required>
                            <option>Sortie en bateau</option>
                            <option>Quad</option>
                            <option>Randonnée à Cheval</option>
                            <option>Plongée Sous-Marine</option>
                            <option>Paddle</option>
                            <option>Jet Ski</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Note</label>
                        <div class="star-rating">
                            ${[1, 2, 3, 4, 5].map(i => `
                                <input type="radio" id="star${i}" name="rating" value="${i}">
                                <label for="star${i}"><i class="fas fa-star"></i></label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Titre</label>
                        <input type="text" id="reviewTitle" required placeholder="Résumez votre avis">
                    </div>
                    
                    <div class="form-group">
                        <label>Votre Avis</label>
                        <textarea id="reviewText" required placeholder="Partagez votre expérience..." rows="5"></textarea>
                    </div>
                    
                    <button type="submit" class="btn">Publier l'Avis</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    submitReview(event) {
        event.preventDefault();

        const review = {
            author: document.getElementById('reviewName').value,
            activity: document.getElementById('reviewActivity').value,
            rating: parseInt(document.getElementById('reviewActivity').parentElement.querySelector('[name="rating"]:checked')?.value || 5),
            title: document.getElementById('reviewTitle').value,
            text: document.getElementById('reviewText').value
        };

        this.addReview(review);
        document.querySelector('.review-modal').remove();
        
        // Re-render reviews section
        if (document.getElementById('reviews-container')) {
            this.renderReviewsSection('reviews-container');
        }

        this.showNotification('✅ Merci! Votre avis a été publié.');
    }

    markHelpful(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (review) {
            review.helpful++;
            this.saveReviews();
            event.target.closest('.helpful-btn').disabled = true;
        }
    }

    showAllReviews() {
        // TODO: Créer une page dédiée pour tous les avis
        alert('Tous les avis');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'review-notification';
        notification.textContent = message;
        
        const styles = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #1a3a6b, #d32f2f);
            color: white;
            padding: 15px 25px;
            border-radius: 50px;
            z-index: 5000;
            font-weight: 600;
            animation: slideInRight 0.4s ease;
        `;
        
        notification.style.cssText = styles;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    initReviewStyles() {
        if (document.getElementById('review-styles')) return;

        const styles = `
            .reviews-section {
                padding: 3rem 0;
                max-width: 1200px;
                margin: 0 auto;
            }

            .reviews-section h2 {
                font-size: 2rem;
                text-align: center;
                margin-bottom: 2rem;
                color: #1a3a6b;
            }

            .reviews-summary {
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                margin-bottom: 2rem;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                align-items: center;
            }

            .rating-overview {
                display: flex;
                gap: 3rem;
            }

            .average-rating {
                text-align: center;
                padding-right: 2rem;
                border-right: 1px solid #f0f0f0;
            }

            .rating-number {
                font-size: 3rem;
                font-weight: 700;
                color: #1a3a6b;
            }

            .rating-stars {
                margin: 0.5rem 0;
                font-size: 1.2rem;
            }

            .total-reviews {
                color: #666;
                font-size: 0.9rem;
            }

            .rating-distribution {
                flex: 1;
            }

            .rating-bar {
                display: grid;
                grid-template-columns: 80px 1fr 50px;
                gap: 1rem;
                align-items: center;
                margin-bottom: 1rem;
            }

            .rating-label {
                font-size: 0.9rem;
                color: #666;
            }

            .bar-container {
                height: 8px;
                background: #f0f0f0;
                border-radius: 10px;
                overflow: hidden;
            }

            .bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #ffc107, #ff6b6b);
                transition: width 0.3s ease;
            }

            .rating-count {
                text-align: right;
                color: #666;
                font-size: 0.9rem;
            }

            .btn-add-review {
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 50px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
            }

            .btn-add-review:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(211, 47, 47, 0.4);
            }

            .review-card {
                background: white;
                padding: 1.5rem;
                border-radius: 10px;
                margin-bottom: 1.5rem;
                border-left: 4px solid #d32f2f;
                transition: all 0.3s ease;
            }

            .review-card:hover {
                box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            }

            .review-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
            }

            .reviewer-info h4 {
                font-size: 1.1rem;
                margin-bottom: 0.3rem;
                color: #1a3a6b;
            }

            .review-date {
                color: #999;
                font-size: 0.85rem;
            }

            .verified-badge {
                display: inline-block;
                background: #e8f5e9;
                color: #2e7d32;
                padding: 3px 8px;
                border-radius: 20px;
                font-size: 0.75rem;
                margin-top: 0.3rem;
            }

            .review-title {
                font-size: 1.1rem;
                color: #1a3a6b;
                margin-bottom: 0.5rem;
            }

            .review-text {
                color: #666;
                line-height: 1.6;
                margin-bottom: 1rem;
            }

            .review-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-top: 1rem;
                border-top: 1px solid #f0f0f0;
            }

            .review-activity {
                color: #999;
                font-size: 0.9rem;
            }

            .helpful-btn {
                background: transparent;
                border: 1px solid #d32f2f;
                color: #d32f2f;
                padding: 5px 15px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            }

            .helpful-btn:hover:not(:disabled) {
                background: #d32f2f;
                color: white;
            }

            .helpful-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .review-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }

            .review-form {
                background: white;
                padding: 2rem;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
            }

            .close-form {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
            }

            .star-rating {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }

            .star-rating input {
                display: none;
            }

            .star-rating label {
                font-size: 2rem;
                cursor: pointer;
                color: #ddd;
                transition: color 0.3s ease;
            }

            .star-rating input:checked ~ label,
            .star-rating label:hover,
            .star-rating input:checked + label {
                color: #ffc107;
            }

            .btn-see-all {
                display: block;
                margin: 2rem auto;
                padding: 12px 30px;
                background: transparent;
                border: 2px solid #1a3a6b;
                color: #1a3a6b;
                border-radius: 50px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .btn-see-all:hover {
                background: #1a3a6b;
                color: white;
            }

            @media (max-width: 768px) {
                .reviews-summary {
                    grid-template-columns: 1fr;
                }

                .rating-overview {
                    flex-direction: column;
                }

                .average-rating {
                    border-right: none;
                    border-bottom: 1px solid #f0f0f0;
                    padding-right: 0;
                    padding-bottom: 1.5rem;
                }

                .review-header {
                    flex-direction: column;
                }

                .review-footer {
                    flex-direction: column;
                    gap: 1rem;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.id = 'review-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize reviews manager
const reviewsManager = new ReviewsManager();

document.addEventListener('DOMContentLoaded', () => {
    // Auto-render reviews section if container exists
    if (document.getElementById('reviews-container')) {
        reviewsManager.renderReviewsSection('reviews-container');
    }
});
