// ===== FLOATING CHAT WIDGET =====

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.initChat();
    }

    initChat() {
        this.createChatHTML();
        this.attachEventListeners();
    }

    createChatHTML() {
        const chatHTML = `
            <div class="chat-widget">
                <div class="chat-header">
                    <h4>Besoin d'aide?</h4>
                    <button class="chat-close" onclick="window.chatWidget.toggleChat()">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
                
                <div class="chat-messages">
                    <div class="message bot">
                        <p>Bonjour! 👋 Comment puis-je vous aider?</p>
                    </div>
                </div>
                
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Votre message..." />
                    <button onclick="window.chatWidget.sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
            
            <button class="chat-button" onclick="window.chatWidget.toggleChat()">
                <i class="fas fa-comments"></i>
                <span class="chat-badge">1</span>
            </button>
        `;

        const container = document.createElement('div');
        container.id = 'chatWidgetContainer';
        container.innerHTML = chatHTML;
        document.body.appendChild(container);

        this.injectChatStyles();
    }

    attachEventListeners() {
        const input = document.getElementById('chatInput');
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const widget = document.querySelector('.chat-widget');
        const button = document.querySelector('.chat-button');
        
        if (this.isOpen) {
            widget.style.display = 'flex';
            button.style.display = 'none';
            document.getElementById('chatInput')?.focus();
        } else {
            widget.style.display = 'none';
            button.style.display = 'flex';
        }
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Simulate bot response
        setTimeout(() => {
            const response = this.getBotResponse(message);
            this.addMessage(response, 'bot');
        }, 500);
    }

    addMessage(text, sender) {
        const messagesContainer = document.querySelector('.chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    getBotResponse(message) {
        message = message.toLowerCase();

        // Basic bot responses
        if (message.includes('prix') || message.includes('tarif')) {
            return '💰 Nos tarifs varient de 3 500 DZD à 8 500 DZD selon l\'activité. Consultez la page des activités pour plus de détails!';
        }
        if (message.includes('réservation') || message.includes('comment réserver')) {
            return '📅 Vous pouvez réserver directement sur notre site. Ajoutez une activité à votre panier et procédez au paiement!';
        }
        if (message.includes('groupe') || message.includes('groupe')) {
            return '👥 Nous accueillons les groupes! Pour les tarifs de groupe, contactez-nous via le formulaire de contact.';
        }
        if (message.includes('contact') || message.includes('téléphone')) {
            return '📞 Téléphone: +213 555 123 456 | Email: visitbejaia@gmail.com | Adresse: 123 Avenue de la Mer, Bejaia';
        }
        if (message.includes('merci')) {
            return '😊 De rien! Avez-vous d\'autres questions?';
        }
        if (message.includes('oui')) {
            return '👍 Dites-moi comment je peux vous aider!';
        }
        if (message.includes('non')) {
            return '✨ D\'accord! Bon séjour à Béjaïa!';
        }

        return '👍 Intéressant! Vous pouvez en savoir plus sur notre page <a href="activites.html" style="color: #d32f2f;">Activités</a> ou nous contacter directement.';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    injectChatStyles() {
        const styles = `
            #chatWidgetContainer {
                font-family: 'Montserrat', sans-serif;
            }

            .chat-button {
                position: fixed;
                bottom: 30px;
                right: 100px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                z-index: 9998;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chat-button:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 30px rgba(0,0,0,0.5);
            }

            .chat-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff6b6b;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                font-weight: 700;
            }

            .chat-widget {
                position: fixed;
                bottom: 30px;
                right: 100px;
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: none;
                flex-direction: column;
                z-index: 9999;
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from {
                    transform: translateY(20px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .chat-header {
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                padding: 1rem;
                border-radius: 15px 15px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .chat-header h4 {
                margin: 0;
                font-size: 1rem;
            }

            .chat-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                transition: transform 0.3s ease;
            }

            .chat-close:hover {
                transform: rotate(180deg);
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
                background: #f9f9f9;
            }

            .message {
                margin-bottom: 1rem;
                display: flex;
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .message p {
                margin: 0;
                padding: 0.75rem 1rem;
                border-radius: 10px;
                max-width: 85%;
                word-wrap: break-word;
                font-size: 0.9rem;
            }

            .message.user {
                justify-content: flex-end;
            }

            .message.user p {
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                border-bottom-right-radius: 0;
            }

            .message.bot {
                justify-content: flex-start;
            }

            .message.bot p {
                background: white;
                color: #666;
                border: 1px solid #ddd;
                border-bottom-left-radius: 0;
            }

            .message.bot a {
                color: #d32f2f;
                text-decoration: none;
                font-weight: 600;
            }

            .chat-input-area {
                padding: 1rem;
                border-top: 1px solid #ddd;
                display: flex;
                gap: 0.5rem;
            }

            #chatInput {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 0.5rem 1rem;
                font-size: 0.9rem;
                transition: border-color 0.3s ease;
            }

            #chatInput:focus {
                outline: none;
                border-color: #d32f2f;
            }

            .chat-input-area button {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .chat-input-area button:hover {
                transform: scale(1.1);
            }

            @media (max-width: 768px) {
                .chat-widget {
                    width: calc(100% - 2rem);
                    height: 400px;
                    right: 1rem;
                }

                .chat-button {
                    right: 1rem;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize chat widget
document.addEventListener('DOMContentLoaded', () => {
    window.chatWidget = new ChatWidget();
});
