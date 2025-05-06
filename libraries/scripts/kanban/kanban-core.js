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