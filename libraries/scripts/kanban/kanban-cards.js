// Função para criar um card de pedido
function createOrderCard(order) {
  // Primeiro, verifica se já existe um card com esse ID e remove
  const existingCard = document.getElementById(`order-${order.id}`);
  if (existingCard) {
    existingCard.remove();
  }
  
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
  
  // Determina a coluna correta baseada no status
  const columnId = statusToColumnMap[order.orderStatus] || 'em-espera-column';
  const targetColumn = document.getElementById(columnId);
  
  if (!targetColumn) {
    console.error(`Coluna não encontrada: ${columnId}`);
    return null;
  }
  
  targetColumn.appendChild(card);
  
  // Adiciona eventos aos botões - usando uma única vez para evitar duplicação
  setupCardEvents(card, order);
  
  // Carrega os itens do pedido após configurar os eventos
  // Usa um pequeno delay para garantir que o card está no DOM
  setTimeout(() => {
    fetchOrderItems(order.id, card);
  }, 100);
  
  return card;
}

// Função separada para configurar eventos do card
function setupCardEvents(card, order) {
  const orderId = order.id;
  
  // Botão de detalhes
  const detailsButton = card.querySelector('.view-details-button');
  if (detailsButton) {
    detailsButton.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      console.log(`Clicado em detalhes do pedido ${orderId}`);
      loadOrderDetails(orderId);
    });
  }
  
  // Botão de avançar status
  const moveForwardButton = card.querySelector('.move-forward-button');
  if (moveForwardButton) {
    moveForwardButton.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      // Verifica se o botão não está desabilitado
      if (this.disabled || this.classList.contains('disabled-button')) {
        console.log(`Botão de avançar desabilitado para pedido ${orderId}`);
        return;
      }
      
      console.log(`Clicado em avançar pedido ${orderId}`);
      moveOrderForward(orderId, card);
    });
  }
  
  // Botão de voltar status
  const moveBackButton = card.querySelector('.move-back-button');
  if (moveBackButton) {
    moveBackButton.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      
      // Verifica se o botão não está desabilitado
      if (this.disabled || this.classList.contains('disabled-button')) {
        console.log(`Botão de voltar desabilitado para pedido ${orderId}`);
        return;
      }
      
      console.log(`Clicado em voltar pedido ${orderId}`);
      moveOrderBack(orderId, card);
    });
  }
  
  // Configura o estado inicial dos botões
  updateCardButtons(card, order.orderStatus);
}

// Função para carregar os itens do pedido via endpoint específico
async function fetchOrderItems(orderId, cardElement) {
  try {
    console.log(`Carregando itens do pedido ${orderId}`);
    
    // Verifica se o card ainda existe no DOM
    if (!cardElement || !cardElement.parentNode) {
      console.warn(`Card do pedido ${orderId} não existe mais no DOM`);
      return;
    }
    
    // Primeiro tenta buscar pela API específica de itens
    let items = null;
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      if (response.ok) {
        items = await response.json();
      } else {
        console.warn(`API de itens retornou ${response.status}, tentando método alternativo`);
      }
    } catch (apiError) {
      console.warn(`Erro na API de itens: ${apiError.message}, tentando método alternativo`);
    }
    
    // Se não conseguiu pelos itens, tenta buscar pelo endpoint de detalhes do pedido
    if (!items || items.length === 0) {
      try {
        console.log(`Tentando buscar itens via detalhes do pedido ${orderId}`);
        const detailsResponse = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
          }
        });
        
        if (detailsResponse.ok) {
          const orderDetails = await detailsResponse.json();
          if (orderDetails.items && orderDetails.items.length > 0) {
            items = orderDetails.items;
            console.log(`Itens encontrados via detalhes do pedido ${orderId}:`, items);
          }
        }
      } catch (detailsError) {
        console.warn(`Erro ao buscar via detalhes: ${detailsError.message}`);
      }
    }
    
    // Se ainda não tem itens, tenta buscar no array local (ordersData)
    if (!items || items.length === 0) {
      const localOrder = ordersData.find(o => o.id == orderId);
      if (localOrder && localOrder.items && localOrder.items.length > 0) {
        items = localOrder.items;
        console.log(`Itens encontrados nos dados locais para pedido ${orderId}:`, items);
      }
    }
    
    // Atualiza os itens no card
    if (items && items.length > 0) {
      let itemsHtml = `<ul class="order-items-list">`;
      items.forEach(item => {
        // Garante que tem os campos necessários
        const quantity = item.quantity || 1;
        const name = item.name || item.productName || 'Item sem nome';
        itemsHtml += `<li>${quantity}x ${name}</li>`;
      });
      itemsHtml += `</ul>`;
      
      updateItemsContainer(cardElement, itemsHtml);
      console.log(`Itens atualizados com sucesso para pedido ${orderId}`);
    } else {
      console.log(`Nenhum item encontrado para pedido ${orderId} em nenhuma fonte`);
      updateItemsContainer(cardElement, '<p class="no-items-info">Nenhum item encontrado</p>');
    }
  } catch (error) {
    console.error(`Erro geral ao carregar itens do pedido ${orderId}:`, error);
    updateItemsContainer(cardElement, '<p class="no-items-info">Erro ao carregar itens</p>');
  }
}

// Função auxiliar para atualizar o container de itens
function updateItemsContainer(cardElement, itemsHtml) {
  if (!cardElement || !cardElement.parentNode) {
    console.warn('Card não existe mais no DOM');
    return;
  }
  
  const itemsContainer = cardElement.querySelector('.order-items-container');
  if (!itemsContainer) {
    console.error('Container de itens não encontrado no card');
    return;
  }
  
  // Preserva o indicador de tipo de entrega
  const deliveryIndicator = itemsContainer.querySelector('.delivery-type-indicator');
  const deliveryHtml = deliveryIndicator ? deliveryIndicator.outerHTML : '';
  
  // Determina se é pickup baseado no indicador existente
  const isPickup = deliveryIndicator && deliveryIndicator.innerHTML.includes('fa-store');
  
  // Atualiza o conteúdo
  itemsContainer.innerHTML = itemsHtml;
  
  // Adiciona o indicador de tipo de entrega de volta
  if (deliveryHtml) {
    itemsContainer.insertAdjacentHTML('beforeend', deliveryHtml);
  } else {
    // Fallback caso não tenha o indicador
    const pickupHtml = isPickup ? 
      '<div class="delivery-type-indicator"><i class="fa fa-store"></i> Retirada no local</div>' :
      '<div class="delivery-type-indicator"><i class="fa fa-motorcycle"></i> Entrega</div>';
    itemsContainer.insertAdjacentHTML('beforeend', pickupHtml);
  }
}

// Função auxiliar para verificar se um card é retirada no local
function isPickupFromCard(cardElement) {
  // Tenta encontrar o pedido nos dados locais
  const orderId = cardElement.dataset.orderId;
  const order = ordersData.find(o => o.id == orderId);
  return order && order.deliveryAddress === 'RETIRADA NO LOCAL';
}