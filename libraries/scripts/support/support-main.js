document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o usuário (parceiro) está autenticado
    const userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        console.error('Parceiro não autenticado.');
        // Idealmente, redirecionar para a página de login do parceiro
        // window.location.href = '../../loginPartner/index.html'; 
        return;
    }

    const userData = JSON.parse(userDataString);
    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080/api/v1'; //Pega da variável global ou usa um default

    loadSupportTickets(userData, API_BASE_URL);
});

async function loadSupportTickets(userData, API_BASE_URL) {
    const ticketsContainer = document.getElementById('tickets-list-container');
    const totalTicketsElement = document.getElementById('total-tickets'); // Elemento para exibir o total de chamados

    if (!ticketsContainer || !totalTicketsElement) {
        console.error('Elementos HTML necessários não encontrados na página.');
        return;
    }

    // Exibe um indicador de carregamento
    ticketsContainer.innerHTML = '<p class="loading-message">Carregando chamados...</p>';
    totalTicketsElement.textContent = 'Carregando...';

    try {
        const response = await fetch(`${API_BASE_URL}/supports`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}` // Envia o token do parceiro
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
            ticketsContainer.innerHTML = '<p class="empty-message">Nenhum chamado encontrado.</p>';
            return;
        }

        // Cria a tabela para exibir os chamados
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-responsive'; // Adicionando wrapper responsivo
        
        const table = document.createElement('table');
        table.className = 'support-tickets-table'; // Adiciona uma classe para estilização

        // Cria o cabeçalho da tabela
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['ID', 'Título', 'Status', 'Criado Em', 'Atualizado Em', 'Ações'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Cria o corpo da tabela
        const tbody = document.createElement('tbody');
        tickets.forEach(ticket => {
            const row = document.createElement('tr');

            // Formata as datas para melhor visualização
            const createdAtFormatted = new Date(ticket.createdAt).toLocaleString('pt-BR');
            const updatedAtFormatted = new Date(ticket.updatedAt).toLocaleString('pt-BR');

            // Colunas do chamado
            const cells = [
                ticket.id.substring(0, 8) + '...', // Mostra apenas parte do ID para economizar espaço
                ticket.title,
                createStatusBadge(ticket.status), // Cria um badge para o status
                createdAtFormatted,
                updatedAtFormatted
            ];

            cells.forEach(cellContent => {
                const td = document.createElement('td');
                if (typeof cellContent === 'string') {
                    td.textContent = cellContent;
                } else {
                    td.appendChild(cellContent); // Para o caso do status badge
                }
                row.appendChild(td);
            });

            // Coluna de Ações (botão para ver detalhes/mensagens)
            const actionsTd = document.createElement('td');
            const viewButton = document.createElement('button');
            viewButton.textContent = 'Ver Mensagens';
            viewButton.className = 'action-button view-messages-button';
            viewButton.onclick = () => {
                // Aqui será implementada a lógica para ver as mensagens do chamado
                console.log(`Visualizar mensagens do chamado: ${ticket.id}`);
                // window.location.href = `messages.html?ticketId=${ticket.id}`; // Exemplo de redirecionamento
            };
            actionsTd.appendChild(viewButton);
            row.appendChild(actionsTd);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        ticketsContainer.appendChild(tableWrapper);

    } catch (error) {
        console.error('Falha ao carregar chamados:', error);
        ticketsContainer.innerHTML = `<p class="error-message">Erro ao carregar chamados: ${error.message}. Tente novamente mais tarde.</p>`;
        totalTicketsElement.textContent = 'Erro';
    }
}

// Função para criar um badge de status visualmente mais agradável
function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    badge.textContent = status;

    switch (status.toUpperCase()) {
        case 'ABERTO':
            badge.classList.add('status-open');
            break;
        case 'EM_ANDAMENTO': // Supondo que possa haver outros status
            badge.classList.add('status-in-progress');
            break;
        case 'RESOLVIDO':
            badge.classList.add('status-resolved');
            break;
        case 'FECHADO':
            badge.classList.add('status-closed');
            break;
        default:
            badge.classList.add('status-default');
    }
    return badge;
}

// Função para redirecionar para a página de criação de chamado
function openNewSupportTicketPage() {
    // Ajuste o caminho conforme a estrutura do seu projeto
    // window.location.href = 'creation.html'; 
    Swal.fire({
        title: 'Funcionalidade em desenvolvimento',
        text: 'A criação de novos chamados será implementada em breve!',
        icon: 'info',
        confirmButtonColor: '#06CF90'
    });
}