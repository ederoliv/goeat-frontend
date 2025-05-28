const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;

const statusToColumnMap = {
  'ESPERANDO': 'em-espera-column',
  'PREPARANDO': 'preparando-column',
  'ENCAMINHADOS': 'a-caminho-column',
  'FINALIZADOS': 'finalizado-column'
};

const columnToStatusMap = {
  'em-espera-column': 'ESPERANDO',
  'preparando-column': 'PREPARANDO',
  'a-caminho-column': 'ENCAMINHADOS',
  'finalizado-column': 'FINALIZADOS'
};

let ordersData = [];
const MAX_FINALIZED_CARDS = 10; // Limite de cards finalizados

window.onload = function() {
  if (userDataString) {
    const userData = JSON.parse(userDataString);
    document.getElementById('userName').textContent = userData.name;
    
    loadOrders();
  } else {
    alert('Você precisa estar logado para acessar essa página');
    window.location.href = '../../loginPartner/index.html';
  }
};

async function loadOrders() {
  try {
    showLoading();
    
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar pedidos: ${response.status}`);
    }
    
    const responseText = await response.text();
    const orders = JSON.parse(responseText);
    
    ordersData = orders;
    
    clearKanban();
    renderOrders(orders);
    hideLoading();
    
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    alert('Não foi possível carregar os pedidos. Por favor, tente novamente.');
    hideLoading();
  }
}

// Função para mostrar indicador de carregamento
function showLoading() {
  document.querySelectorAll('.kanban-column').forEach(column => {
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
    column.appendChild(loading);
  });
}

// Função para ocultar indicador de carregamento
function hideLoading() {
  document.querySelectorAll('.loading-indicator').forEach(element => {
    element.remove();
  });
}

// Função para limpar o kanban
function clearKanban() {
  // Remove todos os itens kanban e mensagens, mantendo as categorias
  document.querySelectorAll('.kanban-item, .see-more-message, .empty-orders-message').forEach(item => {
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
  
  // Separa os pedidos por status
  const ordersByStatus = {
    'ESPERANDO': [],
    'PREPARANDO': [],
    'ENCAMINHADOS': [],
    'FINALIZADOS': []
  };
  
  orders.forEach(order => {
    const status = order.orderStatus || 'ESPERANDO';
    if (ordersByStatus[status]) {
      ordersByStatus[status].push(order);
    }
  });
  
  // Ordena os pedidos finalizados por data (mais recentes primeiro) 
  ordersByStatus['FINALIZADOS'].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return b.id - a.id;
  });
  
  // Renderiza pedidos normalmente para todos os status, exceto FINALIZADOS
  ['ESPERANDO', 'PREPARANDO', 'ENCAMINHADOS'].forEach(status => {
    ordersByStatus[status].forEach(order => {
      createOrderCard(order);
    });
  });
  
  // Para FINALIZADOS, limita a 10 cards e adiciona mensagem se necessário
  const finalizedOrders = ordersByStatus['FINALIZADOS'];
  const ordersToShow = finalizedOrders.slice(0, MAX_FINALIZED_CARDS);
  const hiddenCount = finalizedOrders.length - MAX_FINALIZED_CARDS;
  
  // Renderiza os pedidos finalizados (máximo 10)
  ordersToShow.forEach(order => {
    createOrderCard(order);
  });
  
  // Se há mais pedidos finalizados além do limite, mostra mensagem
  if (hiddenCount > 0) {
    createSeeMoreMessage(hiddenCount);
  }
}

// Função para criar a mensagem "Ver mais" no final da coluna de finalizados
function createSeeMoreMessage(hiddenCount) {
  const finalizedColumn = document.getElementById('finalizado-column');
  
  // Remove mensagem anterior se existir
  const existingMessage = finalizedColumn.querySelector('.see-more-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const seeMoreDiv = document.createElement('div');
  seeMoreDiv.className = 'see-more-message';
  
  seeMoreDiv.innerHTML = `
    <div class="see-more-content">
      <i class="fa fa-archive see-more-icon"></i>
      <p class="see-more-text">
        Mais <strong>${hiddenCount}</strong> ${hiddenCount === 1 ? 'pedido finalizado' : 'pedidos finalizados'}
      </p>
      <button class="see-more-button" onclick="goToHistory()">
        <i class="fa fa-history"></i> Ver no Histórico
      </button>
      <small class="see-more-hint">
        Os pedidos mais antigos estão no histórico completo
      </small>
    </div>
  `;
  
  finalizedColumn.appendChild(seeMoreDiv);
}

// Função para navegar para o histórico
function goToHistory() {
  window.location.href = '../history/index.html';
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

// Função para atualizar a renderização após mover um pedido
function refreshOrdersDisplay() {
  clearKanban();
  renderOrders(ordersData);
}