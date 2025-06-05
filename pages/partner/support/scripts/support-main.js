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
            <div class="support-modal-content">
                <div class="support-form-group">
                    <label for="ticket-title" class="support-form-label">Título do chamado:</label>
                    <input 
                        id="ticket-title" 
                        class="support-form-input" 
                        placeholder="Descreva brevemente o problema ou dúvida" 
                        maxlength="100"
                        autocomplete="off"
                    >
                    <div class="char-counter-modal">
                        <span id="title-char-count">0</span>/100
                    </div>
                </div>
                <div class="support-form-group">
                    <label for="ticket-message" class="support-form-label">Descrição detalhada:</label>
                    <textarea 
                        id="ticket-message" 
                        class="support-form-textarea" 
                        placeholder="Detalhe seu problema ou dúvida. Inclua informações como: quando o problema ocorreu, o que estava fazendo, mensagens de erro, etc."
                        maxlength="500"
                    ></textarea>
                    <div class="char-counter-modal">
                        <span id="message-char-count">0</span>/500
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa fa-paper-plane"></i> Enviar Chamado',
        cancelButtonText: '<i class="fa fa-times"></i> Cancelar',
        customClass: {
            popup: 'support-modal',
            htmlContainer: 'support-modal-content',
            confirmButton: 'support-confirm-btn',
            cancelButton: 'support-cancel-btn'
        },
        buttonsStyling: false,
        allowOutsideClick: false,
        allowEscapeKey: true,
        didOpen: () => {
            // Configurar contadores de caracteres
            const titleInput = document.getElementById('ticket-title');
            const messageTextarea = document.getElementById('ticket-message');
            const titleCounter = document.getElementById('title-char-count');
            const messageCounter = document.getElementById('message-char-count');
            
            // Contador para o título
            titleInput.addEventListener('input', function() {
                const currentLength = this.value.length;
                titleCounter.textContent = currentLength;
                
                // Muda cor quando próximo do limite
                if (currentLength > 80) {
                    titleCounter.style.color = '#dc3545';
                } else if (currentLength > 60) {
                    titleCounter.style.color = '#ffc107';
                } else {
                    titleCounter.style.color = '#666';
                }
            });
            
            // Contador para a mensagem
            messageTextarea.addEventListener('input', function() {
                const currentLength = this.value.length;
                messageCounter.textContent = currentLength;
                
                // Auto-resize do textarea
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 200) + 'px';
                
                // Muda cor quando próximo do limite
                if (currentLength > 400) {
                    messageCounter.style.color = '#dc3545';
                } else if (currentLength > 300) {
                    messageCounter.style.color = '#ffc107';
                } else {
                    messageCounter.style.color = '#666';
                }
            });
            
            // Foca no campo do título
            titleInput.focus();
            
            // Permite Enter para quebra de linha no textarea
            messageTextarea.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    // Permite Enter normal no textarea (não submete o form)
                    e.stopPropagation();
                }
            });
        },
        preConfirm: async () => {
            const title = document.getElementById('ticket-title').value.trim();
            const message = document.getElementById('ticket-message').value.trim();
            
            // Validações com mensagens mais específicas
            if (!title) {
                Swal.showValidationMessage('Por favor, digite um título para o chamado');
                document.getElementById('ticket-title').focus();
                return false;
            }
            
            if (title.length < 5) {
                Swal.showValidationMessage('O título deve ter pelo menos 5 caracteres');
                document.getElementById('ticket-title').focus();
                return false;
            }
            
            if (!message) {
                Swal.showValidationMessage('Por favor, descreva o problema ou dúvida');
                document.getElementById('ticket-message').focus();
                return false;
            }
            
            if (message.length < 10) {
                Swal.showValidationMessage('A descrição deve ter pelo menos 10 caracteres');
                document.getElementById('ticket-message').focus();
                return false;
            }
            
            try {
                // Mostrar loading no botão
                const confirmButton = Swal.getConfirmButton();
                const originalText = confirmButton.innerHTML;
                confirmButton.innerHTML = '<i class="fa fa-spinner fa-pulse"></i> Enviando...';
                confirmButton.disabled = true;
                
                // Criar o chamado
                await createNewTicket(title, message);
                return true;
            } catch (error) {
                // Restaurar botão em caso de erro
                const confirmButton = Swal.getConfirmButton();
                confirmButton.innerHTML = '<i class="fa fa-paper-plane"></i> Enviar Chamado';
                confirmButton.disabled = false;
                
                Swal.showValidationMessage(`Erro ao criar chamado: ${error.message}`);
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            // Modal de sucesso mais informativo
            Swal.fire({
                icon: 'success',
                title: 'Chamado criado com sucesso!',
                html: `
                    <p>Seu chamado foi registrado e nossa equipe de suporte foi notificada.</p>
                    <p><small>Você receberá uma resposta em breve através desta mesma interface.</small></p>
                `,
                confirmButtonText: 'Entendi',
                customClass: {
                    confirmButton: 'support-confirm-btn'
                },
                buttonsStyling: false
            });
            
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