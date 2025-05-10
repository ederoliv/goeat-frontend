// Função para carregar os detalhes do pedido
async function loadOrderDetails(orderId) {
  try {
    // Tenta buscar do array local primeiro
    const order = ordersData.find(o => o.id == orderId);
    
    if (order) {
      // Mostrar loading
      showLoadingModal();
      
      // Buscamos as informações básicas do pedido
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
      
      // Agora buscamos especificamente os itens do pedido
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
      
      // Adicionamos os itens ao objeto de detalhes
      orderDetails.items = orderItems;
      
      // Esconde o loading
      hideLoadingModal();
      
      // Mostra o modal com os detalhes
      showOrderDetailsModal(orderDetails, order);
    } else {
      throw new Error('Pedido não encontrado nos dados carregados');
    }
  } catch (error) {
    console.error('Falha ao carregar detalhes do pedido:', error);
    // Esconde o loading se houver erro
    hideLoadingModal();
    
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
  } else {
    // Se não tiver data na resposta, usa a data atual
    const now = new Date();
    formattedDate = now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Constrói o HTML dos itens do pedido como lista (UL) em vez de tabela
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

// Função auxiliar para exibir loading modal
function showLoadingModal() {
  Swal.fire({
    title: 'Carregando...',
    html: '<i class="fa fa-spinner fa-pulse fa-3x"></i>',
    showConfirmButton: false,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
}

// Função auxiliar para esconder loading modal
function hideLoadingModal() {
  Swal.close();
}