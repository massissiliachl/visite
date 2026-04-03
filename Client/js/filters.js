// ===== ADVANCED FILTERS SYSTEM =====

class AdvancedFilters {
    constructor() {
        this.activities = [
            {
                id: 1,
                name: 'Sortie en bateau',
                price: 5000,
                difficulty: 'facile',
                duration: '4-6 heures',
                groupSize: '4-20',
                category: 'mer',
                rating: 4.8,
                reviews: 2345
            },
            {
                id: 2,
                name: 'Quad',
                price: 6500,
                difficulty: 'moyen',
                duration: '3-5 heures',
                groupSize: '2-10',
                category: 'aventure',
                rating: 4.6,
                reviews: 1890
            },
            {
                id: 3,
                name: 'Randonnée à Cheval',
                price: 4500,
                difficulty: 'facile',
                duration: '3 heures',
                groupSize: '2-15',
                category: 'nature',
                rating: 4.9,
                reviews: 3102
            },
            {
                id: 4,
                name: 'Plongée Sous-Marine',
                price: 7500,
                difficulty: 'difficile',
                duration: '5-7 heures',
                groupSize: '2-8',
                category: 'mer',
                rating: 4.7,
                reviews: 1567
            },
            {
                id: 5,
                name: 'Paddle',
                price: 3500,
                difficulty: 'facile',
                duration: '2-3 heures',
                groupSize: '1-10',
                category: 'mer',
                rating: 4.5,
                reviews: 890
            },
            {
                id: 6,
                name: 'Jet Ski',
                price: 8500,
                difficulty: 'moyen',
                duration: '2-4 heures',
                groupSize: '1-4',
                category: 'mer',
                rating: 4.4,
                reviews: 765
            }
        ];

        this.filters = {
            price: [0, 10000],
            difficulty: [],
            category: [],
            rating: 0
        };

        this.initFilters();
    }

    initFilters() {
        this.createFilterPanel();
        this.attachFilterListeners();
    }

    createFilterPanel() {
        const filterHTML = `
            <div class="filters-widget">
                <div class="filter-header">
                    <h3>Filtrer les Activités</h3>
                    <button class="reset-filters" onclick="window.advancedFilters.resetFilters()">
                        <i class="fas fa-redo"></i> Réinitialiser
                    </button>
                </div>

                <div class="filter-section">
                    <h4>💰 Prix</h4>
                    <div class="price-range">
                        <input type="range" id="minPrice" min="0" max="10000" value="0" class="price-slider" />
                        <input type="range" id="maxPrice" min="0" max="10000" value="10000" class="price-slider" />
                    </div>
                    <div class="price-display">
                        <span><span id="minPriceDisplay">0</span> - <span id="maxPriceDisplay">10000</span> DZD</span>
                    </div>
                </div>

                <div class="filter-section">
                    <h4>🎯 Difficulté</h4>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" name="difficulty" value="facile" /> Facile
                        </label>
                        <label>
                            <input type="checkbox" name="difficulty" value="moyen" /> Moyen
                        </label>
                        <label>
                            <input type="checkbox" name="difficulty" value="difficile" /> Difficile
                        </label>
                    </div>
                </div>

                <div class="filter-section">
                    <h4>🏷️ Catégorie</h4>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" name="category" value="mer" /> Mer
                        </label>
                        <label>
                            <input type="checkbox" name="category" value="nature" /> Nature
                        </label>
                        <label>
                            <input type="checkbox" name="category" value="aventure" /> Aventure
                        </label>
                    </div>
                </div>

                <div class="filter-section">
                    <h4>⭐ Notes minimales</h4>
                    <div class="rating-filter">
                        <select id="ratingFilter">
                            <option value="0">Toutes les notes</option>
                            <option value="4">4+ étoiles</option>
                            <option value="4.5">4.5+ étoiles</option>
                            <option value="4.8">4.8+ étoiles</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.id = 'filtersWidgetContainer';
        container.innerHTML = filterHTML;
        document.body.appendChild(container);

        this.injectFilterStyles();
    }

    attachFilterListeners() {
        // Price range
        document.getElementById('minPrice')?.addEventListener('change', () => this.filterResults());
        document.getElementById('maxPrice')?.addEventListener('change', () => this.filterResults());

        // Difficulty checkboxes
        document.querySelectorAll('input[name="difficulty"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.filterResults());
        });

        // Category checkboxes
        document.querySelectorAll('input[name="category"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.filterResults());
        });

        // Rating select
        document.getElementById('ratingFilter')?.addEventListener('change', () => this.filterResults());
    }

    getFiltersObject() {
        return {
            price: [
                parseInt(document.getElementById('minPrice')?.value || 0),
                parseInt(document.getElementById('maxPrice')?.value || 10000)
            ],
            difficulty: Array.from(document.querySelectorAll('input[name="difficulty"]:checked')).map(el => el.value),
            category: Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value),
            rating: parseFloat(document.getElementById('ratingFilter')?.value || 0)
        };
    }

    filterResults() {
        const filters = this.getFiltersObject();

        // Update price display
        document.getElementById('minPriceDisplay').textContent = filters.price[0];
        document.getElementById('maxPriceDisplay').textContent = filters.price[1];

        const filtered = this.activities.filter(activity => {
            // Price filter
            if (activity.price < filters.price[0] || activity.price > filters.price[1]) return false;

            // Difficulty filter
            if (filters.difficulty.length > 0 && !filters.difficulty.includes(activity.difficulty)) return false;

            // Category filter
            if (filters.category.length > 0 && !filters.category.includes(activity.category)) return false;

            // Rating filter
            if (filters.rating > 0 && activity.rating < filters.rating) return false;

            return true;
        });

        // Dispatch custom event with filtered results
        window.dispatchEvent(new CustomEvent('filtersChanged', { detail: { activities: filtered, count: filtered.length } }));

        // Update results display
        this.updateResultsDisplay(filtered);
    }

    updateResultsDisplay(filtered) {
        const resultText = `Résultats: ${filtered.length} activité(s) trouvée(s)`;
        const existingResult = document.querySelector('.filters-results');
        
        if (existingResult) {
            existingResult.textContent = resultText;
        } else {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'filters-results';
            resultDiv.textContent = resultText;
            document.getElementById('filtersWidgetContainer')?.appendChild(resultDiv);
        }
    }

    resetFilters() {
        document.getElementById('minPrice').value = 0;
        document.getElementById('maxPrice').value = 10000;
        document.getElementById('ratingFilter').value = 0;
        document.querySelectorAll('input[name="difficulty"], input[name="category"]').forEach(el => el.checked = false);
        
        this.filterResults();
    }

    injectFilterStyles() {
        const styles = `
            #filtersWidgetContainer {
                position: sticky;
                top: 100px;
                width: 100%;
                max-width: 280px;
                margin-right: 2rem;
                font-family: 'Montserrat', sans-serif;
            }

            .filters-widget {
                background: white;
                border-radius: 15px;
                padding: 1.5rem;
                box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            }

            .filter-header {
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #f0f0f0;
            }

            .filter-header h3 {
                margin: 0 0 0.5rem 0;
                color: #1a3a6b;
                font-size: 1.1rem;
            }

            .reset-filters {
                background: transparent;
                border: 1px solid #d32f2f;
                color: #d32f2f;
                padding: 5px 10px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.3s ease;
            }

            .reset-filters:hover {
                background: #d32f2f;
                color: white;
            }

            .filter-section {
                margin-bottom: 1.5rem;
            }

            .filter-section h4 {
                margin: 0 0 0.8rem 0;
                color: #1a3a6b;
                font-size: 0.95rem;
            }

            .price-slider {
                width: 100%;
                margin-bottom: 0.5rem;
            }

            .price-display {
                text-align: center;
                color: #d32f2f;
                font-weight: 600;
                padding: 0.5rem;
                background: #f9f9f9;
                border-radius: 8px;
            }

            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .checkbox-group label {
                display: flex;
                align-items: center;
                cursor: pointer;
                color: #666;
                font-size: 0.9rem;
                transition: color 0.3s ease;
            }

            .checkbox-group label:hover {
                color: #1a3a6b;
            }

            .checkbox-group input[type="checkbox"] {
                margin-right: 0.5rem;
                cursor: pointer;
                accent-color: #d32f2f;
            }

            .rating-filter select {
                width: 100%;
                padding: 0.6rem;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: white;
                color: #666;
                font-size: 0.9rem;
                cursor: pointer;
            }

            .filters-results {
                margin-top: 1.5rem;
                padding: 1rem;
                background: linear-gradient(135deg, rgba(26, 58, 107, 0.1), rgba(211, 47, 47, 0.1));
                border-radius: 8px;
                color: #1a3a6b;
                font-weight: 600;
                text-align: center;
                font-size: 0.9rem;
            }

            @media (max-width: 1024px) {
                #filtersWidgetContainer {
                    max-width: 100%;
                    margin-right: 0;
                    margin-bottom: 2rem;
                }

                .filters-widget {
                    padding: 1rem;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize filters
document.addEventListener('DOMContentLoaded', () => {
    window.advancedFilters = new AdvancedFilters();
    window.advancedFilters.filterResults();
});
