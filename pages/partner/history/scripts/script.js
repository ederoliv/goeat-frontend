/**
 * Script completo para a página de histórico de pedidos
 * Mantendo o padrão dos outros arquivos e usando os endpoints corretos
 */

// Variáveis globais
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;
let allOrders = []; // Armazena todos os pedidos para filtros
let filteredOrders = []; // Armazena os pedidos filtrados

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
 * Carrega o histórico de pedidos do parceiro usando o mesmo endpoint do kanban
 */
async function loadOrderHistory() {
  const orderTableBody = document.getElementById('tbody');
  
  if (!orderTableBody) {
    console.error('Elemento da tabela não encontrado.');
    return;
  }

  // Mostra mensagem de carregamento
  orderTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="loading-message">
        <i class="fa fa-spinner fa-pulse"></i> Carregando histórico de pedidos...
      </td>
    </tr>
  `;

  try {
    // Usa o mesmo endpoint do kanban
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
    
    // Armazena os pedidos globalmente
    allOrders = orders;
    filteredOrders = [...orders]; // Copia inicial
    
    // Verifica se existem pedidos
    if (orders.length === 0) {
      showEmptyState();
      return;
    }
    
    // Renderiza os pedidos
    renderOrders(orders);

  } catch (error) {
    console.error('Erro ao carregar histórico de pedidos:', error);
    showErrorState(error.message);
  }
}

/**
 * Renderiza os pedidos na tabela
 */
function renderOrders(orders) {
  const orderTableBody = document.getElementById('tbody');
  
  // Limpa a tabela
  orderTableBody.innerHTML = '';
  
  if (orders.length === 0) {
    showEmptyState();
    return;
  }
  
  // Ordena os pedidos - mais recentes primeiro
  const sortedOrders = orders.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return b.id - a.id;
  });

  // Adiciona cada pedido à tabela
  sortedOrders.forEach(order => {
    const row = createOrderRow(order);
    orderTableBody.appendChild(row);
  });
}

/**
 * Cria uma linha da tabela para um pedido
 */
function createOrderRow(order) {
  const row = document.createElement('tr');
  
  // Formata a data para exibição
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Formata o valor total
  const formattedTotal = (order.totalPrice / 100).toFixed(2).replace('.', ',');
  
  // Determina se é entrega ou retirada
  const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';
  const deliveryType = isPickup ? 
    '<i class="fa fa-store delivery-pickup"></i> Retirada' : 
    '<i class="fa fa-motorcycle delivery-delivery"></i> Entrega';
  
  // Determina a classe CSS para o status
  const statusInfo = getStatusInfo(order.orderStatus);
  
  // Monta o conteúdo HTML da linha
  row.innerHTML = `
    <td class="order-id">#${order.id}</td>
    <td class="order-date">${formattedDate}</td>
    <td class="order-customer">${order.name || 'Cliente não identificado'}</td>
    <td class="order-items-count">${getItemsCount(order)} itens</td>
    <td class="order-delivery-type">${deliveryType}</td>
    <td class="order-total">R$ ${formattedTotal}</td>
    <td class="order-status">
      <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
    </td>
    <td class="order-actions">
      <div class="action-buttons">
        <button class="action-button view-button" onclick="viewOrderDetails(${order.id})" title="Ver detalhes">
          <i class="fa fa-eye"></i>
        </button>
      </div>
    </td>
  `;
  
  // Adiciona classe especial para pedidos finalizados recentemente (último dia)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  if (orderDate > oneDayAgo && order.orderStatus === 'FINALIZADOS') {
    row.classList.add('recent-order');
  }
  
  return row;
}

/**
 * Obtém informações de estilo e label para o status
 */
function getStatusInfo(status) {
  const statusMap = {
    'ESPERANDO': { class: 'status-esperando', label: 'Em Espera' },
    'PREPARANDO': { class: 'status-preparando', label: 'Preparando' },
    'ENCAMINHADOS': { class: 'status-encaminhados', label: 'A Caminho' },
    'FINALIZADOS': { class: 'status-finalizados', label: 'Finalizado' },
    'CANCELADOS': { class: 'status-cancelados', label: 'Cancelado' }
  };
  
  return statusMap[status] || { class: 'status-default', label: status || 'Indefinido' };
}

/**
 * Obtém a contagem de itens do pedido
 */
function getItemsCount(order) {
  // Se tiver a propriedade items, conta eles
  if (order.items && Array.isArray(order.items)) {
    return order.items.reduce((total, item) => total + (item.quantity || 1), 0);
  }
  
  // Caso contrário, retorna um valor padrão
  return '-';
}

/**
 * Mostra estado vazio quando não há pedidos
 */
function showEmptyState() {
  const orderTableBody = document.getElementById('tbody');
  orderTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="empty-state">
        <div class="empty-state-content">
          <i class="fa fa-calendar-times-o empty-icon"></i>
          <h3>Nenhum pedido encontrado</h3>
          <p>Ainda não há pedidos no histórico ou não há pedidos que correspondam aos filtros aplicados.</p>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Mostra estado de erro
 */
function showErrorState(errorMessage) {
  const orderTableBody = document.getElementById('tbody');
  orderTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="error-state">
        <div class="error-state-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <h3>Erro ao carregar pedidos</h3>
          <p>${errorMessage || 'Não foi possível carregar o histórico de pedidos.'}</p>
          <button class="retry-button" onclick="loadOrderHistory()">
            <i class="fa fa-refresh"></i> Tentar novamente
          </button>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Filtra pedidos por período
 */
function filterByPeriod(period) {
  // Atualiza botões ativos
  document.querySelectorAll('.period-button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-period="${period}"]`).classList.add('active');
  
  let filtered = [...allOrders];
  const now = new Date();
  
  switch(period) {
    case 'today':
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = allOrders.filter(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
        return orderDate >= startOfDay;
      });
      break;
      
    case 'week':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      filtered = allOrders.filter(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
        return orderDate >= startOfWeek;
      });
      break;
      
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = allOrders.filter(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date(0);
        return orderDate >= startOfMonth;
      });
      break;
      
    case 'all':
    default:
      // Mantém todos os pedidos
      break;
  }
  
  filteredOrders = filtered;
  renderOrders(filtered);
}

/**
 * Pesquisa pedidos por texto
 */
function searchOrders() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
  
  if (!searchTerm) {
    // Se não há termo de busca, mostra os pedidos filtrados por período
    renderOrders(filteredOrders);
    return;
  }
  
  // Filtra dentro dos pedidos já filtrados por período
  const searchResults = filteredOrders.filter(order => {
    const orderId = order.id.toString();
    const customerName = (order.name || '').toLowerCase();
    const status = (order.orderStatus || '').toLowerCase();
    
    return orderId.includes(searchTerm) || 
           customerName.includes(searchTerm) || 
           status.includes(searchTerm);
  });
  
  renderOrders(searchResults);
}

/**
 * Exibe detalhes de um pedido específico (reutiliza a função do kanban)
 */
async function viewOrderDetails(orderId) {
  try {
    showLoadingModal();
    
    // Busca os detalhes básicos do pedido
    const basicResponse = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    if (!basicResponse.ok) {
      throw new Error(`Erro ao buscar detalhes do pedido: ${basicResponse.status}`);
    }
    
    const orderDetails = await basicResponse.json();
    
    // Busca os itens do pedido
    const itemsResponse = await fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    if (!itemsResponse.ok) {
      throw new Error(`Erro ao buscar itens do pedido: ${itemsResponse.status}`);
    }
    
    const orderItems = await itemsResponse.json();
    orderDetails.items = orderItems;
    
    hideLoadingModal();
    
    // Encontra o pedido na lista local para dados adicionais
    const order = allOrders.find(o => o.id == orderId);
    showOrderDetailsModal(orderDetails, order);
    
  } catch (error) {
    hideLoadingModal();
    console.error('Erro ao carregar detalhes do pedido:', error);
    goeatAlert('error', 'Não foi possível carregar os detalhes do pedido. Tente novamente.');
  }
}

/**
 * Mostra o modal de detalhes do pedido (adaptado do kanban)
 */
function showOrderDetailsModal(orderDetails, order) {
  const formattedTotalPrice = (order.totalPrice / 100).toFixed(2).replace('.', ',');
  const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';
  
  let formattedDate = 'Data não disponível';
  if (orderDetails.createdAt) {
    const orderDate = new Date(orderDetails.createdAt);
    formattedDate = orderDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  let itemsHtml = '';
  if (orderDetails.items && orderDetails.items.length > 0) {
    itemsHtml = '<ul class="details-items-list">';
    orderDetails.items.forEach(item => {
      itemsHtml += `<li>${item.quantity}x ${item.name}</li>`;
    });
    itemsHtml += '</ul>';
  } else {
    itemsHtml = '<p class="no-items">Detalhes dos itens não disponíveis</p>';
  }
  
  const statusInfo = getStatusInfo(order.orderStatus);
  
  Swal.fire({
    title: `Pedido #${order.id}`,
    html: `
      <div class="order-details-container">
        <div class="details-section">
          <h3>Informações do Pedido</h3>
          <div class="details-row">
            <div class="details-label">Status:</div>
            <div class="details-value">
              <span class="order-status-badge ${statusInfo.class}">${statusInfo.label}</span>
            </div>
          </div>
          <div class="details-row">
            <div class="details-label">Data/Hora:</div>
            <div class="details-value">${formattedDate}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Total:</div>
            <div class="details-value">R$ ${formattedTotalPrice}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Tipo:</div>
            <div class="details-value">${isPickup ? '<i class="fa fa-store"></i> Retirada no local' : '<i class="fa fa-motorcycle"></i> Entrega'}</div>
          </div>
        </div>
        
        <div class="details-section">
          <h3>Cliente</h3>
          <div class="details-row">
            <div class="details-label">Nome:</div>
            <div class="details-value">${order.name}</div>
          </div>
          ${orderDetails.email ? `
          <div class="details-row">
            <div class="details-label">Email:</div>
            <div class="details-value">${orderDetails.email}</div>
          </div>` : ''}
          ${orderDetails.phone ? `
          <div class="details-row">
            <div class="details-label">Telefone:</div>
            <div class="details-value">${orderDetails.phone}</div>
          </div>` : ''}
        </div>
        
        <div class="details-section">
          <h3>Itens do Pedido</h3>
          ${itemsHtml}
        </div>
        
        ${!isPickup ? `
        <div class="details-section">
          <h3>Endereço de Entrega</h3>
          <div class="details-address">${order.deliveryAddress}</div>
        </div>` : ''}
      </div>
    `,
    width: '600px',
    confirmButtonColor: '#06CF90',
    confirmButtonText: 'Fechar',
    customClass: {
      container: 'order-details-modal-container',
      popup: 'order-details-modal',
      content: 'order-details-content'
    }
  });
}

/**
 * Eventos de teclado para pesquisa
 */
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchOrders();
      }
    });
  }
});