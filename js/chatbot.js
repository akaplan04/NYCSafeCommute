class CrimeSafetyChatbot {
    constructor() {
        this.chatContainer = document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-message');
        this.toggleButton = document.getElementById('toggle-chat');
        
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleUserInput());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });
        this.toggleButton.addEventListener('click', () => this.toggleChat());
    }

    toggleChat() {
        this.chatContainer.classList.toggle('minimized');
    }

    addWelcomeMessage() {
        const welcomeMessage = "Hello! I'm your NYC Safety Assistant. I can help you understand crime patterns and provide safety recommendations. What would you like to know?";
        this.addMessage(welcomeMessage, 'bot');
    }

    async handleUserInput() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Disable input while processing
        this.userInput.disabled = true;
        this.sendButton.disabled = true;

        this.addMessage(message, 'user');
        this.userInput.value = '';

        try {
            const response = await this.getBotResponse(message);
            this.addMessage(response, 'bot');
        } catch (error) {
            console.error('Error getting bot response:', error);
            this.addMessage('I apologize, but I encountered an error. Please try again.', 'bot');
        } finally {
            // Re-enable input after processing
            this.userInput.disabled = false;
            this.sendButton.disabled = false;
            this.userInput.focus();
        }
    }

    async getBotResponse(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();
            
            if (!data.response) {
                throw new Error('Invalid response format from server');
            }

            return data.response;
        } catch (error) {
            console.error('Chat API Error:', error);
            throw error;
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Handle HTML line breaks in the message
        messageDiv.innerHTML = text;
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the chatbot when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CrimeSafetyChatbot();
}); 