// Função para criar um card de pedido
function createOrderCard(order) {
  // Criar o elemento do card
  const card = document.createElement('div');
  card.className = 'kanban-item';
  card.id = `order-${order.id}`;
  card.setAttribute('draggable', 'true');
  card.dataset.orderId = order.id;
  
  const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';
  

  card.innerHTML = `
    <div class="kanban-item-title">
      <span>#${order.id}</span> ${order.name}
    </div>
    <div class="order-items-container">
      <p class="no-items-info">Carregando itens...</p>
      <div class="delivery-type-indicator">
        ${isPickup ? '<i class="fa fa-store"></i> Retirada no local' : '<i class="fa fa-motorcycle"></i> Entrega'}
      </div>
    </div>
    <div class="card-buttons">
      <button class="view-details-button" data-order-id="${order.id}">
        <i class="fa fa-info-circle"></i> Detalhes
      </button>
      <div class="status-buttons">
        <button class="move-back-button" data-order-id="${order.id}" title="Voltar status">
          <i class="fa fa-arrow-left"></i>
        </button>
        <button class="move-forward-button" data-order-id="${order.id}" title="Avançar status">
          <i class="fa fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `;
  
  const columnId = statusToColumnMap[order.orderStatus] || 'em-espera-column';
  document.getElementById(columnId).appendChild(card);
  
  // Adiciona evento de clique ao botão de detalhes
  const detailsButton = card.querySelector('.view-details-button');
  detailsButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Impede que o evento de drag seja acionado
    const orderId = this.dataset.orderId;
    loadOrderDetails(orderId);
  });
  
  // Adiciona evento de clique ao botão de avançar status
  const moveForwardButton = card.querySelector('.move-forward-button');
  moveForwardButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Impede que o evento de drag seja acionado
    const orderId = this.dataset.orderId;
    moveOrderForward(orderId, card);
  });
  
  // Adiciona evento de clique ao botão de voltar status
  const moveBackButton = card.querySelector('.move-back-button');
  moveBackButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Impede que o evento de drag seja acionado
    const orderId = this.dataset.orderId;
    moveOrderBack(orderId, card);
  });
  
  // Desabilita botões conforme a posição no fluxo
  if (order.orderStatus === 'ESPERANDO') {
    moveBackButton.disabled = true;
    moveBackButton.classList.add('disabled-button');
  } else if (order.orderStatus === 'FINALIZADOS') {
    moveForwardButton.disabled = true;
    moveForwardButton.classList.add('disabled-button');
  }
  
  // Carrega os itens do pedido logo após criar o card
  fetchOrderItems(order.id, card);
  
  return card;
}

// Função para carregar os itens do pedido via endpoint específico
async function fetchOrderItems(orderId, cardElement) {
  try {
    // Faz a requisição para a API específica de itens do pedido
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar itens do pedido: ${response.status}`);
    }
    
    const items = await response.json();
    
    // Atualiza os itens no card
    if (items && items.length > 0) {
      const itemsContainer = cardElement.querySelector('.order-items-container');
      
      let itemsHtml = `<ul class="order-items-list">`;
      items.forEach(item => {
        itemsHtml += `<li>${item.quantity}x ${item.name}</li>`;
      });
      itemsHtml += `</ul>`;
      
      if (isPickupFromCard(cardElement)) {
        itemsHtml += `<div class="delivery-type-indicator"><i class="fa fa-store"></i> Retirada no local</div>`;
      } else {
        itemsHtml += `<div class="delivery-type-indicator"><i class="fa fa-motorcycle"></i> Entrega</div>`;
      }
      
      // Atualiza o HTML dos itens
      itemsContainer.innerHTML = itemsHtml;
    }
  } catch (error) {
    console.error('Erro ao carregar itens do pedido:', error);
  }
}

// Função auxiliar para verificar se um card é retirada no local
function isPickupFromCard(cardElement) {
  // Tenta encontrar o pedido nos dados locais
  const orderId = cardElement.dataset.orderId;
  const order = ordersData.find(o => o.id == orderId);
  return order && order.deliveryAddress === 'RETIRADA NO LOCAL';
}