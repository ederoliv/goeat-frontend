// Arquivo: pages/partner/support/scripts/support-main.js
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o usuário (parceiro) está autenticado
    const userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        console.error('Parceiro não autenticado.');
        window.location.href = '../../loginPartner/index.html'; 
        return;
    }

    const userData = JSON.parse(userDataString);
    
    // Preenche o nome do usuário
    document.getElementById('userName').textContent = userData.name || 'Usuário';

    // Carrega chamados iniciais
    loadSupportTickets();

    // Configura evento de Enter para a busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTickets();
            }
        });
    }
});

/**
 * Carrega todos os chamados de suporte do parceiro
 */
async function loadSupportTickets() {
    const ticketsContainer = document.getElementById('tickets-list-container');
    const totalTicketsElement = document.getElementById('total-tickets');

    if (!ticketsContainer || !totalTicketsElement) {
        console.error('Elementos HTML necessários não encontrados na página.');
        return;
    }

    // Exibe um indicador de carregamento
    ticketsContainer.innerHTML = `
        <div class="loading-tickets">
            <i class="fa fa-spinner fa-pulse"></i>
            <p>Carregando chamados...</p>
        </div>
    `;
    totalTicketsElement.textContent = '...';

    try {
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        if (!userData || !userData.token) {
            throw new Error('Sessão inválida. Faça login novamente.');
        }

        const response = await fetch(`${API_BASE_URL}/supports`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar chamados: ${response.status} ${response.statusText}`);
        }

        const tickets = await response.json();

        // Atualiza o contador de chamados
        totalTicketsElement.textContent = tickets.length;

        // Limpa a mensagem de carregamento
        ticketsContainer.innerHTML = '';

        if (tickets.length === 0) {
            ticketsContainer.innerHTML = `
                <div class="empty-tickets">
                    <i class="fa fa-comments-o"></i>
                    <p>Você ainda não possui chamados registrados.</p>
                    <button class="input" id="productButton" onclick="openNewSupportTicketPage()">
                        <i class="fa fa-plus-circle"></i> Abrir Novo Chamado
                    </button>
                </div>
            `;
            return;
        }

        // Renderiza os chamados
        tickets.forEach(ticket => {
            renderTicketCard(ticket, ticketsContainer);
        });
    } catch (error) {
        console.error('Erro ao carregar chamados:', error);
        ticketsContainer.innerHTML = `
            <div class="error-message">
                <i class="fa fa-exclamation-triangle"></i>
                <p>Erro ao carregar os chamados: ${error.message}</p>
                <button class="input" id="productButton" onclick="loadSupportTickets()">
                    <i class="fa fa-refresh"></i> Tentar Novamente
                </button>
            </div>
        `;
        totalTicketsElement.textContent = '0';
    }
}

/**
 * Abre a página para criar um novo chamado de suporte
 */
async function openNewSupportTicketPage() {
    Swal.fire({
        title: 'Novo Chamado de Suporte',
        html: `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px;">
                    <label for="ticket-title" style="display: block; margin-bottom: 5px; font-weight: bold;">Título:</label>
                    <input id="ticket-title" class="swal2-input" placeholder="Descreva brevemente o problema" maxlength="100">
                </div>
                <div>
                    <label for="ticket-message" style="display: block; margin-bottom: 5px; font-weight: bold;">Mensagem:</label>
                    <textarea id="ticket-message" class="swal2-textarea" placeholder="Detalhe seu problema ou dúvida" style="height: 150px;" maxlength="500"></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Enviar Chamado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#06CF90',
        width: '500px',
        preConfirm: async () => {
            const title = document.getElementById('ticket-title').value.trim();
            const message = document.getElementById('ticket-message').value.trim();
            
            if (!title || !message) {
                Swal.showValidationMessage('Por favor, preencha todos os campos');
                return false;
            }
            
            if (title.length < 5) {
                Swal.showValidationMessage('O título deve ter pelo menos 5 caracteres');
                return false;
            }
            
            if (message.length < 10) {
                Swal.showValidationMessage('A mensagem deve ter pelo menos 10 caracteres');
                return false;
            }
            
            try {
                // Criar o chamado
                await createNewTicket(title, message);
                return true;
            } catch (error) {
                Swal.showValidationMessage(`Erro ao criar chamado: ${error.message}`);
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            goeatAlert('success', 'Chamado criado com sucesso! Você será notificado quando houver uma resposta.');
            // Recarrega a lista de chamados
            loadSupportTickets();
        }
    });
}

/**
 * Cria um novo chamado de suporte
 * @param {string} title - Título do chamado
 * @param {string} message - Primeira mensagem do chamado
 */
async function createNewTicket(title, message) {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    
    if (!userData || !userData.token) {
        throw new Error('Sessão inválida. Faça login novamente.');
    }
    
    const response = await fetch(`${API_BASE_URL}/supports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
            title: title,
            description: message
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: Não foi possível criar o chamado`);
    }
    
    return await response.json();
}

/**
 * Função para pesquisar chamados
 */
function searchTickets() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // Se o termo de busca estiver vazio, recarregar todos os chamados
    if (searchTerm === '') {
        loadSupportTickets();
        return;
    }
    
    // Filtra os cards de tickets
    const hasResults = filterTicketCards(searchTerm);
    
    // Se não houver resultados, mostrar mensagem
    if (!hasResults) {
        const ticketsContainer = document.getElementById('tickets-list-container');
        const totalTicketsElement = document.getElementById('total-tickets');
        
        if (ticketsContainer) {
            ticketsContainer.innerHTML = `
                <div class="empty-tickets">
                    <i class="fa fa-search"></i>
                    <p>Nenhum chamado encontrado para "${searchTerm}"</p>
                    <button class="input" id="productButton" onclick="loadSupportTickets()">
                        <i class="fa fa-list"></i> Ver Todos os Chamados
                    </button>
                </div>
            `;
        }
        
        if (totalTicketsElement) {
            totalTicketsElement.textContent = '0';
        }
    }
}