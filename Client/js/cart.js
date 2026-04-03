// ===== SHOPPING CART SYSTEM =====

class ShoppingCart {
    constructor() {
        this.storageKey = 'visitBejaia_cart';
        this.cart = this.loadCart();
    }

    // Load cart from localStorage
    loadCart() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
        this.updateCartUI();
    }

    // Add item to cart
    addItem(item) {
        const { id, name, price, category, image, date, participants } = item;
        
        const existingItem = this.cart.find(
            cartItem => cartItem.id === id && cartItem.date === date && cartItem.participants === participants
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                id,
                name,
                price,
                category,
                image,
                date,
                participants,
                quantity: 1,
                totalPrice: price * (participants || 1),
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.showNotification(`✅ ${name} ajouté au panier!`);
    }

    // Remove item from cart
    removeItem(index) {
        this.cart.splice(index, 1);
        this.saveCart();
    }

    // Update quantity
    updateQuantity(index, quantity) {
        if (quantity <= 0) {
            this.removeItem(index);
        } else {
            this.cart[index].quantity = quantity;
            this.saveCart();
        }
    }

    // Get total items count
    getItemCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Get total price
    getTotalPrice() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity * item.participants), 0);
    }

    // Clear cart
    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    // Update cart UI (badge count)
    updateCartUI() {
        const badge = document.getElementById('cartBadge');
        const count = this.getItemCount();
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
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
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        notification.style.cssText = styles;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    // Get cart items
    getItems() {
        return this.cart;
    }

    // Check if item exists
    hasItem(id) {
        return this.cart.some(item => item.id === id);
    }
}

// Initialize cart
const shoppingCart = new ShoppingCart();

// Add styles for cart system
const cartStyles = `
    #cartBadge {
        position: absolute;
        top: -10px;
        right: -10px;
        background: linear-gradient(135deg, #d32f2f, #ff6b6b);
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 700;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(400px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }

    .cart-icon-wrapper {
        position: relative;
        cursor: pointer;
    }

    .btn-add-to-cart {
        background: linear-gradient(135deg, #1a3a6b, #d32f2f);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 30px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
    }

    .btn-add-to-cart:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(211, 47, 47, 0.4);
    }

    .btn-add-to-cart:active {
        transform: translateY(-1px);
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = cartStyles;
document.head.appendChild(styleSheet);

// Update cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
    shoppingCart.updateCartUI();
});
