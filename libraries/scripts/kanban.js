// Obtém os dados do usuário (restaurante) do sessionStorage
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;

// Mapeamento de statusType para IDs das colunas
const statusToColumnMap = {
  'ESPERANDO': 'em-espera-column',
  'PREPARANDO': 'preparando-column',
  'ENCAMINHADOS': 'a-caminho-column',
  'FINALIZADOS': 'finalizado-column'
};

// Mapeamento reverso: coluna para status
const columnToStatusMap = {
  'em-espera-column': 'ESPERANDO',
  'preparando-column': 'PREPARANDO',
  'a-caminho-column': 'ENCAMINHADOS',
  'finalizado-column': 'FINALIZADOS'
};

// Armazena os dados dos pedidos para uso nos detalhes
let ordersData = [];

// Carrega os pedidos do restaurante quando a página é carregada
window.onload = function() {
  // Exibe os dados do usuário
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    document.getElementById('userName').textContent = userData.name;
    
    // Busca os pedidos do restaurante
    loadOrders();
  } else {
    // Redireciona para o login se não estiver autenticado
    alert('Você precisa estar logado para acessar essa página');
    window.location.href = '../../loginPartner/index.html';
  }
};

// Função para carregar os pedidos da API
async function loadOrders() {
  try {
    // Exibir loading ou mensagem de carregamento
    showLoading();
    
    // Faz a requisição para a API
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar pedidos: ${response.status}`);
    }
    
    const orders = await response.json();
    
    // Armazena os dados para uso posterior
    ordersData = orders;
    
    // Limpa o kanban atual
    clearKanban();
    
    // Renderiza os pedidos no kanban
    renderOrders(orders);
    
    // Oculta loading
    hideLoading();
    
  } catch (error) {
    console.error('Falha ao carregar pedidos:', error);
    alert('Não foi possível carregar os pedidos. Por favor, tente novamente.');
    hideLoading();
  }
}

// Função para carregar os detalhes do pedido
async function loadOrderDetails(orderId) {
  try {
    // Tenta buscar do array local primeiro
    const order = ordersData.find(o => o.id == orderId);
    
    if (order) {
      // Se já temos os dados básicos, vamos pedir os detalhes completos
      const response = await fetch(`${API_BASE_URL}partners/${userData.id}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar detalhes do pedido: ${response.status}`);
      }
      
      const orderDetails = await response.json();
      
      // Mostra o modal com os detalhes
      showOrderDetailsModal(orderDetails, order);
    } else {
      throw new Error('Pedido não encontrado nos dados carregados');
    }
  } catch (error) {
    console.error('Falha ao carregar detalhes do pedido:', error);
    Swal.fire({
      icon: 'error',
      title: 'Erro ao carregar detalhes',
      text: 'Não foi possível obter os detalhes deste pedido. Tente novamente.',
      confirmButtonColor: '#06CF90'
    });
  }
}

// Função para mostrar o modal de detalhes do pedido
function showOrderDetailsModal(orderDetails, order) {
  // Formata o preço total
  const formattedTotalPrice = (order.totalPrice / 100).toFixed(2).replace('.', ',');
  
  // Determina se é entrega ou retirada
  const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';
  
  // Formata a data do pedido (se disponível)
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
  
  // Constrói o HTML dos itens do pedido
  let itemsHtml = '';
  
  if (orderDetails.items && orderDetails.items.length > 0) {
    itemsHtml = '<table class="details-items-table">';
    itemsHtml += '<thead><tr><th>Produto</th><th>Qtde</th><th>Preço Unit.</th><th>Total</th></tr></thead><tbody>';
    
    orderDetails.items.forEach(item => {
      const unitPrice = (item.price / 100).toFixed(2).replace('.', ',');
      const totalPrice = ((item.price * item.quantity) / 100).toFixed(2).replace('.', ',');
      
      itemsHtml += `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>R$ ${unitPrice}</td>
          <td>R$ ${totalPrice}</td>
        </tr>
      `;
    });
    
    itemsHtml += '</tbody></table>';
  } else {
    itemsHtml = '<p class="no-items">Detalhes dos itens não disponíveis</p>';
  }
  
  // Define a cor do status
  let statusColor = '#888';
  switch(order.orderStatus) {
    case 'ESPERANDO':
      statusColor = '#FF5555'; // vermelho
      break;
    case 'PREPARANDO':
      statusColor = '#53BDEB'; // azul
      break;
    case 'ENCAMINHADOS':
      statusColor = '#FCCC48'; // amarelo
      break;
    case 'FINALIZADOS':
      statusColor = '#06CF90'; // verde
      break;
  }
  
  // Mostra o modal usando SweetAlert2
  Swal.fire({
    title: `Pedido #${order.id}`,
    html: `
      <div class="order-details-container">
        <div class="details-section">
          <h3>Informações do Pedido</h3>
          <div class="details-row">
            <div class="details-label">Status:</div>
            <div class="details-value"><span class="order-status-badge" style="background-color: ${statusColor};">${getStatusName(order.orderStatus)}</span></div>
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
          ${order.clientId ? `
          <div class="details-row">
            <div class="details-label">Cliente ID:</div>
            <div class="details-value">${order.clientId}</div>
          </div>` : ''}
        </div>
        
        ${!isPickup ? `
        <div class="details-section">
          <h3>Endereço de Entrega</h3>
          <div class="details-address">${order.deliveryAddress}</div>
        </div>` : ''}
        
        <div class="details-section">
          <h3>Itens do Pedido</h3>
          ${itemsHtml}
        </div>
        
        ${orderDetails.notes ? `
        <div class="details-section">
          <h3>Observações</h3>
          <div class="details-notes">${orderDetails.notes}</div>
        </div>` : ''}
      </div>
    `,
    width: '800px',
    confirmButtonColor: '#06CF90',
    confirmButtonText: 'Fechar',
    customClass: {
      container: 'order-details-modal-container',
      popup: 'order-details-modal',
      content: 'order-details-content'
    }
  });
}

// Função para mostrar indicador de carregamento
function showLoading() {
  // Adiciona um elemento de loading em cada coluna
  document.querySelectorAll('.kanban-column').forEach(column => {
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
    column.appendChild(loading);
  });
}

// Função para ocultar indicador de carregamento
function hideLoading() {
  // Remove todos os elementos de loading
  document.querySelectorAll('.loading-indicator').forEach(element => {
    element.remove();
  });
}

// Função para limpar o kanban
function clearKanban() {
  // Remove todos os itens kanban, mantendo as categorias
  document.querySelectorAll('.kanban-item').forEach(item => {
    item.remove();
  });
}

// Função para renderizar os pedidos no kanban
function renderOrders(orders) {
  if (orders.length === 0) {
    // Se não houver pedidos, exibe mensagem
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-orders-message';
    emptyMessage.innerHTML = '<p>Nenhum pedido encontrado</p>';
    document.querySelector('#em-espera-column').appendChild(emptyMessage);
    return;
  }
  
  // Itera sobre os pedidos e cria os cards
  orders.forEach(order => {
    createOrderCard(order);
  });
  
  // Após criar todos os cards, inicializa o arrastar e soltar
  initDragAndDrop();
}

// Função para criar um card de pedido
function createOrderCard(order) {
  // Criar o elemento do card
  const card = document.createElement('div');
  card.className = 'kanban-item';
  card.id = `order-${order.id}`;
  card.setAttribute('draggable', 'true');
  card.dataset.orderId = order.id;
  
  // Formata o preço
  const formattedPrice = (order.totalPrice / 100).toFixed(2).replace('.', ',');
  
  // Determina se é entrega ou retirada
  const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';
  
  // Cria o conteúdo do card
  card.innerHTML = `
    <div class="kanban-item-title">
      <span>#${order.id}</span> ${order.name}
    </div>
    <ul>
      <li>Total: R$ ${formattedPrice}</li>
      <li>${isPickup ? '<i class="fa fa-store"></i> Retirada no local' : '<i class="fa fa-motorcycle"></i> Entrega'}</li>
      ${!isPickup ? `<li class="address-info">${order.deliveryAddress}</li>` : ''}
    </ul>
    <button class="view-details-button" data-order-id="${order.id}">
      <i class="fa fa-info-circle"></i> Detalhes
    </button>
  `;
  
  // Adiciona o card na coluna correspondente ao status
  const columnId = statusToColumnMap[order.orderStatus] || 'em-espera-column';
  document.getElementById(columnId).appendChild(card);
  
  // Adiciona evento de clique ao botão de detalhes
  const detailsButton = card.querySelector('.view-details-button');
  detailsButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Impede que o evento de drag seja acionado
    const orderId = this.dataset.orderId;
    loadOrderDetails(orderId);
  });
}

// Inicializa eventos de arrastar e soltar
function initDragAndDrop() {
  const kanbanItems = document.querySelectorAll('.kanban-item');
  const kanbanColumns = document.querySelectorAll('.kanban-column');

  // Adiciona evento de arrastar aos cards
  kanbanItems.forEach(item => {
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
  });

  kanbanColumns.forEach(column => {
    column.addEventListener('dragover', dragOver);
    column.addEventListener('dragleave', dragLeave);
    column.addEventListener('drop', drop);
  });
}

function dragStart(event) {
  event.dataTransfer.setData('text/plain', event.target.id);
  this.classList.add('dragging');
}

function dragEnd(event) {
  this.classList.remove('dragging');
}

function dragOver(event) {
  event.preventDefault();
  this.classList.add('dragover');
}

function dragLeave(event) {
  this.classList.remove('dragover');
}

async function drop(event) {
  event.preventDefault();
  this.classList.remove('dragover');
  
  const id = event.dataTransfer.getData('text/plain');
  const draggable = document.getElementById(id);
  
  // Obtém a coluna de origem
  const sourceColumn = draggable.parentNode;
  
  // Obtém a coluna de destino
  const targetColumn = this;
  
  // Se for a mesma coluna, apenas reordena
  if (sourceColumn === targetColumn) {
    targetColumn.appendChild(draggable);
    return;
  }
  
  // Obtém o ID do pedido e o novo status
  const orderId = draggable.dataset.orderId;
  const newStatus = columnToStatusMap[targetColumn.id];
  
  // Tenta atualizar o status no backend
  try {
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        id: parseInt(orderId),
        status: newStatus
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao atualizar status: ${response.status}`);
    }
    
    // Se atualizado com sucesso, move o card
    targetColumn.appendChild(draggable);
    
    // Atualiza o status no array local
    const orderIndex = ordersData.findIndex(o => o.id == orderId);
    if (orderIndex >= 0) {
      ordersData[orderIndex].orderStatus = newStatus;
    }
    

    goeatAlert('success', `Pedido #${orderId} movido para ${getStatusName(newStatus)}`);
    
  } catch (error) {
    
    
    goeatAlert('error', `Erro ao atualizar status do pedido #${orderId}. Tente novamente.`);
    
  
    sourceColumn.appendChild(draggable);
  }
}

// Função auxiliar para obter nome amigável do status
function getStatusName(status) {
  const statusNames = {
    'ESPERANDO': 'Em Espera',
    'PREPARANDO': 'Preparando',
    'ENCAMINHADOS': 'A Caminho',
    'FINALIZADOS': 'Finalizado'
  };
  
  return statusNames[status] || status;
}

// Adiciona botão de atualização manual
function addRefreshButton() {
  const navbar = document.querySelector('.navbar__right');
  
  if (navbar) {
    const refreshButton = document.createElement('a');
    refreshButton.href = '#';
    refreshButton.innerHTML = '<i class="fa fa-refresh" aria-hidden="true"></i>';
    refreshButton.title = 'Atualizar pedidos';
    refreshButton.addEventListener('click', function(e) {
      e.preventDefault();
      loadOrders();
    });
    
    navbar.prepend(refreshButton);
  }
}

// Adiciona o botão de atualização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
  addRefreshButton();
});