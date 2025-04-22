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
  `;
  
  // Adiciona o card na coluna correspondente ao status
  const columnId = statusToColumnMap[order.orderStatus] || 'em-espera-column';
  document.getElementById(columnId).appendChild(card);
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
    const response = await fetch(`${API_BASE_URL}/orders/status`, {
      method: 'POST',
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
    
    // Mostra um feedback de sucesso
    showStatusUpdateFeedback(orderId, newStatus, true);
    
  } catch (error) {
    console.error('Falha ao atualizar status:', error);
    
    // Mostra feedback de erro
    showStatusUpdateFeedback(orderId, newStatus, false);
    
    // Não move o card, mantém na coluna original
    sourceColumn.appendChild(draggable);
  }
}

// Função para mostrar feedback de atualização de status
function showStatusUpdateFeedback(orderId, newStatus, success) {
  // Pode usar uma biblioteca como SweetAlert2 ou feedback customizado
  if (typeof Swal !== 'undefined') {
    if (success) {
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: `Pedido #${orderId} movido para ${getStatusName(newStatus)}`,
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      Swal.fire({
        position: 'top-end',
        icon: 'error',
        title: `Erro ao atualizar status do pedido #${orderId}`,
        text: 'Tente novamente em alguns instantes',
        showConfirmButton: true
      });
    }
  } else {
    // Fallback para alert se SweetAlert não estiver disponível
    if (success) {
      alert(`Pedido #${orderId} movido para ${getStatusName(newStatus)}`);
    } else {
      alert(`Erro ao atualizar status do pedido #${orderId}. Tente novamente.`);
    }
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