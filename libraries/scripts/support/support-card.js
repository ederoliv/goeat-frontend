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
    
    // Preenche o conteúdo do card - sem ID, com título em destaque e descrição limitada
    card.innerHTML = `
        <div class="ticket-header">
            <h3 class="ticket-title">${ticket.title}</h3>
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
            <button class="view-button" onclick="viewTicketDetails('${ticket.id}')">
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
    // Implementação futura: redirecionamento para página de detalhes do chamado
    console.log('Visualizar detalhes do chamado:', ticketId);
    
    // Por enquanto, mostra um alert informativo
    goeatAlert('info', 'Funcionalidade em desenvolvimento! Em breve você poderá visualizar e responder as mensagens.');
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