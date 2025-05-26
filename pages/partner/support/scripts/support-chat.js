// Arquivo: pages/partner/support/scripts/support-chat.js
/**
 * Arquivo para gerenciamento do chat de suporte
 * Implementa funcionalidades de visualização e envio de mensagens
 */

/**
 * Abre o modal de chat para um chamado específico
 * @param {string} ticketId - O ID do chamado
 */
async function openChatModal(ticketId) {
    try {
        showLoadingModal();
        
        // Busca as mensagens do chamado
        const messages = await fetchTicketMessages(ticketId);
        
        hideLoadingModal();
        
        // Cria e exibe o modal de chat
        createChatModal(ticketId, messages);
        
    } catch (error) {
        hideLoadingModal();
        console.error('Erro ao abrir chat:', error);
        goeatAlert('error', 'Não foi possível carregar as mensagens do chamado.');
    }
}

/**
 * Busca as mensagens de um chamado específico
 * @param {string} ticketId - O ID do chamado
 * @returns {Promise<Array>} - Array com as mensagens
 */
async function fetchTicketMessages(ticketId) {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    if (!userData || !userData.token) {
        throw new Error('Sessão inválida. Faça login novamente.');
    }
    
    const response = await fetch(`${API_BASE_URL}/supports/${ticketId}/messages`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erro ao buscar mensagens: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Cria e exibe o modal de chat
 * @param {string} ticketId - O ID do chamado
 * @param {Array} messages - Array com as mensagens
 */
function createChatModal(ticketId, messages) {
    // Remove modal existente se houver
    const existingModal = document.getElementById('chat-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Cria o modal
    const modal = document.createElement('div');
    modal.id = 'chat-modal';
    modal.className = 'chat-modal-overlay';
    
    modal.innerHTML = `
        <div class="chat-modal-container">
            <div class="chat-modal-header">
                <div class="chat-title">
                    <h3>Conversa do Chamado</h3>
                    <div class="ticket-id-section">
                        <span class="ticket-id-text" id="ticket-id-display">${ticketId}</span>
                        <button class="copy-id-button" onclick="copyTicketId('${ticketId}')" title="Copiar ID do chamado">
                            <i class="fa fa-copy"></i>
                        </button>
                    </div>
                </div>
                <button class="chat-close-button" onclick="closeChatModal()">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            
            <div class="chat-messages-container" id="chat-messages">
                <!-- Mensagens serão inseridas aqui -->
            </div>
            
            <div class="chat-input-container">
                <div class="chat-input-wrapper">
                    <textarea 
                        id="chat-message-input" 
                        placeholder="Digite sua mensagem..."
                        rows="1"
                        maxlength="500"
                    ></textarea>
                    <button class="chat-send-button" onclick="sendMessage('${ticketId}')">
                        <i class="fa fa-paper-plane"></i>
                    </button>
                </div>
                <div class="char-counter">
                    <span id="char-count">0</span>/500
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Renderiza as mensagens
    renderMessages(messages);
    
    // Configura eventos
    setupChatEvents();
    
    // Foca no input de mensagem
    document.getElementById('chat-message-input').focus();
}

/**
 * Renderiza as mensagens no chat
 * @param {Array} messages - Array com as mensagens
 */
function renderMessages(messages) {
    const messagesContainer = document.getElementById('chat-messages');
    
    if (!messagesContainer) return;
    
    // Limpa o container
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="no-messages">
                <i class="fa fa-comment-o"></i>
                <p>Nenhuma mensagem ainda.</p>
                <p>Inicie a conversa enviando uma mensagem!</p>
            </div>
        `;
        return;
    }
    
    // Ordena mensagens por data de criação
    const sortedMessages = messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Renderiza cada mensagem
    sortedMessages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });
    
    // Scroll para a última mensagem
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Cria o elemento HTML de uma mensagem
 * @param {Object} message - Dados da mensagem
 * @returns {HTMLElement} - Elemento da mensagem
 */
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    const isFromSupport = message.fromSupport;
    
    messageDiv.className = `chat-message ${isFromSupport ? 'support-message' : 'user-message'}`;
    
    // Formata a data
    const messageDate = new Date(message.createdAt);
    const formattedTime = messageDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(message.content)}</div>
            <div class="message-info">
                <span class="message-sender">${isFromSupport ? 'Suporte' : 'Você'}</span>
                <span class="message-time">${formattedTime}</span>
            </div>
        </div>
    `;
    
    return messageDiv;
}

/**
 * Configura os eventos do chat
 */
function setupChatEvents() {
    const messageInput = document.getElementById('chat-message-input');
    const charCountElement = document.getElementById('char-count');
    
    if (messageInput && charCountElement) {
        // Evento para contagem de caracteres
        messageInput.addEventListener('input', function() {
            const currentLength = this.value.length;
            charCountElement.textContent = currentLength;
            
            // Auto-resize do textarea
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        // Evento para enviar mensagem com Enter (Shift+Enter para quebra de linha)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const ticketId = extractTicketIdFromModal();
                if (ticketId) {
                    sendMessage(ticketId);
                }
            }
        });
    }
    
    // Fecha modal ao clicar fora
    const modal = document.getElementById('chat-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeChatModal();
            }
        });
    }
}

/**
 * Envia uma nova mensagem
 * @param {string} ticketId - O ID do chamado
 */
async function sendMessage(ticketId) {
    const messageInput = document.getElementById('chat-message-input');
    
    if (!messageInput) return;
    
    const messageContent = messageInput.value.trim();
    
    if (!messageContent) {
        goeatAlert('warning', 'Digite uma mensagem antes de enviar.');
        return;
    }
    
    try {
        // Desabilita o botão de envio
        const sendButton = document.querySelector('.chat-send-button');
        if (sendButton) {
            sendButton.disabled = true;
            sendButton.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
        }
        
        // Envia a mensagem para a API
        await sendMessageToAPI(ticketId, messageContent);
        
        // Limpa o input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        document.getElementById('char-count').textContent = '0';
        
        // Recarrega as mensagens
        const messages = await fetchTicketMessages(ticketId);
        renderMessages(messages);
        
        goeatAlert('success', 'Mensagem enviada com sucesso!');
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        goeatAlert('error', 'Não foi possível enviar a mensagem. Tente novamente.');
    } finally {
        // Reabilita o botão de envio
        const sendButton = document.querySelector('.chat-send-button');
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fa fa-paper-plane"></i>';
        }
    }
}

/**
 * Envia mensagem para a API
 * @param {string} ticketId - O ID do chamado
 * @param {string} content - Conteúdo da mensagem
 */
async function sendMessageToAPI(ticketId, content) {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    if (!userData || !userData.token) {
        throw new Error('Sessão inválida. Faça login novamente.');
    }
    
    const response = await fetch(`${API_BASE_URL}/supports/${ticketId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({ content })
    });
    
    if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Copia o ID do chamado para a área de transferência
 * @param {string} ticketId - O ID do chamado
 */
function copyTicketId(ticketId) {
    const textToCopy = `O ID do seu chamado é: ${ticketId}`;
    
    // Tenta usar a API moderna de clipboard
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            goeatAlert('success', 'ID do chamado copiado!');
        }).catch(() => {
            fallbackCopyTextToClipboard(textToCopy);
        });
    } else {
        // Fallback para navegadores mais antigos
        fallbackCopyTextToClipboard(textToCopy);
    }
}

/**
 * Método alternativo para copiar texto (navegadores antigos)
 * @param {string} text - Texto a ser copiado
 */
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        goeatAlert('success', 'ID do chamado copiado!');
    } catch (err) {
        goeatAlert('error', 'Não foi possível copiar o ID. Copie manualmente: ' + text);
    }
    
    document.body.removeChild(textArea);
}

/**
 * Fecha o modal de chat
 */
function closeChatModal() {
    const modal = document.getElementById('chat-modal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Extrai o ID do chamado do modal atual
 * @returns {string|null} - O ID do chamado ou null
 */
function extractTicketIdFromModal() {
    const ticketIdElement = document.getElementById('ticket-id-display');
    return ticketIdElement ? ticketIdElement.textContent : null;
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}