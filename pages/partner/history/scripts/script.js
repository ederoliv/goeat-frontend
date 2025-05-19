/**
 * Script simples para carregar e exibir o histórico de pedidos em uma tabela
 */

// Variáveis globais
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;

// Inicialização da página
window.onload = function() {
  // Verifica se o usuário (parceiro) está autenticado
  if (!userDataString) {
    console.error('Parceiro não autenticado.');
    window.location.href = '../../loginPartner/index.html'; 
    return;
  }

  // Preenche o nome do usuário na interface
  document.getElementById('userName').textContent = userData.name || 'Usuário';

  // Carrega o histórico de pedidos
  loadOrderHistory();
};

/**
 * Carrega o histórico de pedidos do parceiro e exibe na tabela
 */
async function loadOrderHistory() {
  const orderTableBody = document.getElementById('orderTableBody');
  
  if (!orderTableBody) {
    console.error('Elemento da tabela não encontrado.');
    return;
  }

  // Mostra mensagem de carregamento
  orderTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="loading-message">
        <i class="fa fa-spinner fa-pulse"></i> Carregando histórico de pedidos...
      </td>
    </tr>
  `;

  try {
    // Usa o mesmo endpoint do kanban para obter os pedidos
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar pedidos: ${response.status} ${response.statusText}`);
    }

    const orders = await response.json();
    
    // Verifica se existem pedidos
    if (orders.length === 0) {
      orderTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 20px;">
            Nenhum pedido encontrado.
          </td>
        </tr>
      `;
      return;
    }
    
    // Limpa a tabela
    orderTableBody.innerHTML = '';
    
    // Ordena os pedidos - mais recentes primeiro (assumindo que há uma data de criação ou um ID sequencial)
    orders.sort((a, b) => {
      // Tenta ordenar por data, se disponível
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      // Caso contrário, ordena por ID de forma decrescente (assumindo que IDs mais altos são mais recentes)
      return b.id - a.id;
    });

    // Adiciona cada pedido à tabela
    orders.forEach(order => {
      // Cria uma nova linha
      const row = document.createElement('tr');
      
      // Formata a data para exibição
      const orderDate = new Date(order.createdAt || Date.now());
      const formattedDate = orderDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Formata o valor total
      const formattedTotal = (order.totalPrice / 100).toFixed(2).replace('.', ',');
      
      // Determina a classe CSS para o status
      let statusClass = '';
      if (order.orderStatus === 'FINALIZADOS') {
        statusClass = 'status-finalizados';
      } else if (order.orderStatus === 'CANCELADOS') {
        statusClass = 'status-cancelados';
      } else if (order.orderStatus === 'ENCAMINHADOS') {
        statusClass = 'status-encaminhados';
      } else if (order.orderStatus === 'PREPARANDO') {
        statusClass = 'status-preparando';
      } else if (order.orderStatus === 'ESPERANDO') {
        statusClass = 'status-esperando';
      }
      
      // Monta o conteúdo HTML da linha
      row.innerHTML = `
        <td>#${order.id}</td>
        <td>${formattedDate}</td>
        <td>${order.name || 'Cliente não identificado'}</td>
        <td>${order.items?.length || '-'} itens</td>
        <td>R$ ${formattedTotal}</td>
        <td><span class="status-badge ${statusClass}">${getStatusLabel(order.orderStatus)}</span></td>
        <td>
          <div class="action-buttons">
            <button class="action-button" onclick="viewOrderDetails(${order.id})" title="Ver detalhes">
              <i class="fa fa-eye"></i>
            </button>
          </div>
        </td>
      `;
      
      // Adiciona a linha à tabela
      orderTableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Erro ao carregar histórico de pedidos:', error);
    
    // Exibe mensagem de erro
    orderTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #d9534f;">
          <i class="fa fa-exclamation-triangle"></i>
          Erro ao carregar pedidos: ${error.message || 'Falha na comunicação com o servidor'}
        </td>
      </tr>
    `;
  }
}

/**
 * Obtém o rótulo para exibição do status
 * @param {string} status - Status do pedido
 * @returns {string} Rótulo para exibição
 */
function getStatusLabel(status) {
  const statusMap = {
    'FINALIZADOS': 'Finalizado',
    'CANCELADOS': 'Cancelado',
    'ENCAMINHADOS': 'Enviado',
    'PREPARANDO': 'Em preparo',
    'ESPERANDO': 'Em espera'
  };
  
  return statusMap[status] || status;
}

/**
 * Exibe detalhes de um pedido específico
 * @param {number} orderId - ID do pedido
 */
function viewOrderDetails(orderId) {
  // Versão simples: apenas exibe um alerta com o ID do pedido
  goeatAlert('info', `Detalhes do pedido #${orderId}`);
  
  // Implementação futura exibiria um modal com os detalhes completos do pedido
}