// ===== DARK MODE SYSTEM =====

class DarkModeManager {
    constructor() {
        this.storageKey = 'visitBejaia_darkMode';
        this.isDarkMode = this.loadDarkMode();
        this.initDarkMode();
    }

    loadDarkMode() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved !== null) return JSON.parse(saved);
        // Préférence système
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    initDarkMode() {
        if (this.isDarkMode) {
            this.enableDarkMode();
        }
        this.createToggleButton();
    }

    enableDarkMode() {
        document.documentElement.setAttribute('data-theme', 'dark');
        this.isDarkMode = true;
        localStorage.setItem(this.storageKey, JSON.stringify(true));
        this.injectDarkStyles();
    }

    disableDarkMode() {
        document.documentElement.removeAttribute('data-theme');
        this.isDarkMode = false;
        localStorage.setItem(this.storageKey, JSON.stringify(false));
        this.removeDarkStyles();
    }

    toggle() {
        if (this.isDarkMode) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    createToggleButton() {
        const button = document.createElement('button');
        button.id = 'darkModeToggle';
        button.className = 'dark-mode-toggle';
        button.innerHTML = `<i class="fas ${this.isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>`;
        button.setAttribute('aria-label', 'Basculer le mode sombre');
        
        button.addEventListener('click', () => this.toggle());

        document.body.appendChild(button);
    }

    updateToggleIcon() {
        const button = document.getElementById('darkModeToggle');
        if (button) {
            button.innerHTML = `<i class="fas ${this.isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>`;
        }
    }

    injectDarkStyles() {
        const styles = `
            [data-theme="dark"] {
                --bg-primary: #1a1a1a;
                --bg-secondary: #2d2d2d;
                --text-primary: #ffffff;
                --text-secondary: #b0b0b0;
                --border-color: #404040;
            }

            [data-theme="dark"] body {
                background-color: var(--bg-primary);
                color: var(--text-primary);
            }

            [data-theme="dark"] .navbar {
                background: rgba(26, 26, 26, 0.95) !important;
                border-bottom-color: var(--border-color);
            }

            [data-theme="dark"] .section-title {
                color: #ffffff;
            }

            [data-theme="dark"] .card,
            [data-theme="dark"] .destination-card,
            [data-theme="dark"] .cart-items,
            [data-theme="dark"] .cart-summary,
            [data-theme="dark"] .cart-item {
                background: var(--bg-secondary);
                border-color: var(--border-color);
                color: var(--text-primary);
            }

            [data-theme="dark"] .btn,
            [data-theme="dark"] .checkout-btn {
                background: linear-gradient(135deg, #2d5a9f, #ff6b6b) !important;
            }

            [data-theme="dark"] input,
            [data-theme="dark"] textarea,
            [data-theme="dark"] select {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }

            [data-theme="dark"] input::placeholder,
            [data-theme="dark"] textarea::placeholder {
                color: var(--text-secondary);
            }

            [data-theme="dark"] .footer {
                background: linear-gradient(135deg, #0f0f0f, #1a1a1a);
            }

            [data-theme="dark"] .reservation-modal,
            [data-theme="dark"] .modal-content {
                background: var(--bg-secondary);
                color: var(--text-primary);
            }

            [data-theme="dark"] .must-modal-overlay {
                background: rgba(0, 0, 0, 0.8);
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    removeDarkStyles() {
        // Dark styles sont déjà appliquées via [data-theme="dark"] selector
        document.documentElement.removeAttribute('data-theme');
    }
}

// Button styles
const darkModeButtonStyles = `
    .dark-mode-toggle {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #1a3a6b, #d32f2f);
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .dark-mode-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
    }

    .dark-mode-toggle:active {
        transform: scale(0.95);
    }

    @media (max-width: 480px) {
        .dark-mode-toggle {
            bottom: 20px;
            right: 20px;
            width: 45px;
            height: 45px;
            font-size: 1.2rem;
        }
    }
`;

const darkModeStyleSheet = document.createElement('style');
darkModeStyleSheet.textContent = darkModeButtonStyles;
document.head.appendChild(darkModeStyleSheet);

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
});
