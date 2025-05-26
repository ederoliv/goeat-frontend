// Arquivo: pages/partner/support/scripts/support-card.js
/**
 * Renderiza um card de chamado
 * @param {Object} ticket - O objeto contendo dados do chamado
 * @param {HTMLElement} container - O elemento container onde o card será inserido
 */
function renderTicketCard(ticket, container) {
    // Formata as datas para melhor visualização
    const createdAtFormatted = new Date(ticket.createdAt).toLocaleString('pt-BR');
    const updatedAtFormatted = new Date(ticket.updatedAt).toLocaleString('pt-BR');
    
    // Trata o status para exibição
    let statusText = ticket.status || 'PENDENTE';
    if (statusText === 'EM_ANDAMENTO') {
        statusText = 'EM ANDAMENTO';
    }

    // Prepara a descrição com limite de caracteres
    let description = ticket.description || '';
    if (description.length > 120) {
        description = description.substring(0, 120) + '...';
    }

    // Cria o elemento do card
    const card = document.createElement('div');
    card.className = 'ticket-card';
    card.dataset.ticketId = ticket.id;
    
    // Preenche o conteúdo do card - sem ID visível, com botão para copiar ID e título em destaque
    card.innerHTML = `
        <div class="ticket-header">
            <div class="title-with-copy">
                <h3 class="ticket-title">${ticket.title}</h3>
                <button class="copy-id-mini-button" onclick="copyTicketId('${ticket.id}')" title="Copiar ID do chamado">
                    <i class="fa fa-copy"></i>
                </button>
            </div>
            <span class="status-badge status-${ticket.status.toLowerCase()}">${statusText}</span>
        </div>
        <p class="ticket-description">${description}</p>
        <div class="ticket-details">
            <div class="ticket-dates">
                <span><i class="fa fa-calendar-plus-o"></i> Criado: ${createdAtFormatted}</span>
                <span><i class="fa fa-calendar-check-o"></i> Atualizado: ${updatedAtFormatted}</span>
            </div>
        </div>
        <div class="ticket-footer">
            <button class="view-button" onclick="openChatModal('${ticket.id}')">
                <i class="fa fa-comments-o"></i> Ver Mensagens
            </button>
        </div>
    `;
    
    // Adiciona o card ao container
    container.appendChild(card);
}

/**
 * Função para ver os detalhes de um chamado específico
 * @param {string} ticketId - O ID do chamado a ser visualizado
 */
function viewTicketDetails(ticketId) {
    // Redireciona para a função de abrir chat
    openChatModal(ticketId);
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
 * Filtra os cards de tickets com base em um termo de busca
 * @param {string} searchTerm - O termo de busca
 */
function filterTicketCards(searchTerm) {
    // Obtém todos os cards de chamados
    const ticketCards = document.querySelectorAll('.ticket-card');
    let hasResults = false;
    
    ticketCards.forEach(card => {
        const title = card.querySelector('.ticket-title').textContent.toLowerCase();
        const description = card.querySelector('.ticket-description').textContent.toLowerCase();
        
        // Verifica se o título ou descrição contém o termo de busca
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    return hasResults;
}