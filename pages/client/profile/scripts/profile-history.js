// Funções relacionadas ao histórico de pedidos

// Função principal para carregar o histórico de pedidos
async function loadOrderHistory() {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.token) {
            console.error('Cliente não autenticado ou token inválido para carregar histórico.');
            displayEmptyOrderHistory('Faça login para ver seu histórico de pedidos.');
            return;
        }

        showLoadingOrderHistory();
        
        const response = await fetch(`${API_BASE_URL}/orders/client`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                getInvalidClientToken(401);
                return;
            }
            throw new Error(`Erro ${response.status}: Falha ao carregar histórico de pedidos`);
        }
        
        const orders = await response.json();
        displayOrderHistory(orders);
        
    } catch (error) {
        console.error('Erro ao carregar histórico de pedidos:', error);
        displayErrorOrderHistory('Não foi possível carregar seu histórico de pedidos. Tente novamente mais tarde.');
    }
}

// Função para exibir o histórico de pedidos
function displayOrderHistory(orders) {
    const ordersList = document.querySelector('#orders-history .orders-list');
    if (!ordersList) return;
    
    ordersList.innerHTML = ''; // Limpa a lista atual
    
    if (!orders || orders.length === 0) {
        displayEmptyOrderHistory('Você ainda não fez nenhum pedido.');
        return;
    }
    
    // Ordena os pedidos por data de criação (mais recentes primeiro)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}

// Função para criar um card de pedido
function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.dataset.orderId = order.id;
    
    // Formatar as datas
    const createdDate = formatOrderDate(order.createdAt);
    const finishedDate = order.finishedAt ? formatOrderDate(order.finishedAt) : null;
    const canceledDate = order.canceledAt ? formatOrderDate(order.canceledAt) : null;
    
    // Determinar o status e sua classe CSS
    const statusInfo = getOrderStatusInfo(order.orderStatus);
    
    // Determinar qual data mostrar baseado no status
    let displayDate = createdDate;
    let dateLabel = 'Pedido realizado';
    
    if (order.orderStatus === 'FINALIZADOS' && finishedDate) {
        displayDate = finishedDate;
        dateLabel = 'Finalizado';
    } else if (order.orderStatus === 'CANCELADOS' && canceledDate) {
        displayDate = canceledDate;
        dateLabel = 'Cancelado';
    }
    
    // Armazenar o partnerId para uso posterior
    const partnerId = order.partnerId || '';
    
    orderCard.innerHTML = `
        <div class="order-header">
            <div class="order-info">
                <h4>Pedido #${order.id}</h4>
                <p class="order-date">${dateLabel} em ${displayDate}</p>
            </div>
            <div class="order-status ${statusInfo.class}">
                ${statusInfo.text}
            </div>
        </div>
        
        <div class="order-details-preview">
            <div class="order-customer">
                <p><strong>Cliente:</strong> ${order.name}</p>
            </div>
            
            <div class="order-delivery">
                <p><strong>Endereço:</strong> ${order.deliveryAddress}</p>
            </div>
        </div>
        
        <div class="order-footer">
            <div class="order-total">
                Total: R$ ${formatPrice(order.totalPrice)}
            </div>
            <button class="order-details-button" data-order-id="${order.id}" data-partner-id="${partnerId}">
                Ver detalhes
            </button>
        </div>
    `;
    
    // Adicionar evento ao botão de detalhes
    const detailsButton = orderCard.querySelector('.order-details-button');
    if (detailsButton) {
        detailsButton.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            const partnerId = this.getAttribute('data-partner-id');
            showOrderDetails(orderId, partnerId);
        });
    }
    
    return orderCard;
}

// Função para obter informações de status do pedido
function getOrderStatusInfo(status) {
    const statusMap = {
        'ESPERANDO': { text: 'Pendente', class: 'pending' },
        'PREPARANDO': { text: 'Preparando', class: 'processing' },
        'ENCAMINHADOS': { text: 'Saiu para entrega', class: 'processing' },
        'FINALIZADOS': { text: 'Finalizado', class: 'delivered' },
        'CANCELADOS': { text: 'Cancelado', class: 'cancelled' }
    };
    
    return statusMap[status] || { text: status, class: 'pending' };
}

// Função para formatar datas
function formatOrderDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função para mostrar detalhes de um pedido específico
async function showOrderDetails(orderId, partnerId) {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.token) {
            Swal.fire({
                icon: 'error',
                title: 'Erro de autenticação',
                text: 'Faça login novamente para ver os detalhes do pedido.',
                confirmButtonColor: '#06CF90'
            });
            return;
        }

        showLoadingModal();
        
        // Inicializar variável para detalhes do pedido
        let orderDetails = null;
        
        // Primeiro, tentar buscar via endpoint de detalhes para clientes
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${clientData.token}`
                }
            });
            
            if (response.ok) {
                orderDetails = await response.json();
                console.log('Detalhes do pedido obtidos via endpoint do cliente:', orderDetails);
            } else {
                console.warn(`Erro ao buscar detalhes via endpoint do cliente: ${response.status}`);
            }
        } catch (clientEndpointError) {
            console.warn('Erro ao buscar via endpoint do cliente:', clientEndpointError);
        }
        
        // Se não conseguiu pelos detalhes do cliente, tentar pelo endpoint do parceiro se tivermos o partnerId
        if (!orderDetails && partnerId) {
            try {
                console.log(`Tentando buscar detalhes do pedido ${orderId} pelo parceiro ${partnerId}`);
                const response = await fetch(`${API_BASE_URL}/partners/${partnerId}/orders/${orderId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${clientData.token}`
                    }
                });
                
                if (response.ok) {
                    orderDetails = await response.json();
                    console.log('Detalhes do pedido obtidos via endpoint do parceiro:', orderDetails);
                } else {
                    console.warn(`Erro ao buscar detalhes via endpoint do parceiro: ${response.status}`);
                }
            } catch (partnerEndpointError) {
                console.warn('Erro ao buscar via endpoint do parceiro:', partnerEndpointError);
            }
        }
        
        // Agora, tentar buscar os itens do pedido
        let orderItems = [];
        
        try {
            const itemsResponse = await fetch(`${API_BASE_URL}/orders/${orderId}/items`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${clientData.token}`
                }
            });
            
            if (itemsResponse.ok) {
                orderItems = await itemsResponse.json();
                console.log('Itens do pedido obtidos:', orderItems);
                
                // Adiciona os itens ao objeto de detalhes
                if (orderDetails) {
                    orderDetails.items = orderItems;
                }
            }
        } catch (itemsError) {
            console.warn('Erro ao buscar itens do pedido:', itemsError);
        }
        
        hideLoadingModal();
        
        // Se não conseguiu obter detalhes completos, mostrar erro
        if (!orderDetails) {
            Swal.fire({
                icon: 'error',
                title: 'Erro ao carregar detalhes',
                text: 'Não foi possível obter os detalhes deste pedido. Tente novamente mais tarde.',
                confirmButtonColor: '#06CF90'
            });
            return;
        }
        
        // Mostrar modal com detalhes do pedido
        displayOrderDetailsModal(orderDetails);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
        hideLoadingModal();
        
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar os detalhes do pedido.',
            confirmButtonColor: '#06CF90'
        });
    }
}

// Função para exibir modal com detalhes do pedido
function displayOrderDetailsModal(order) {
    // Determinar o status e sua cor
    const statusInfo = getOrderStatusInfo(order.orderStatus);
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
        case 'CANCELADOS':
            statusColor = '#dc3545'; // vermelho escuro
            break;
    }
    
    // Formatar datas
    const createdDate = order.createdAt ? formatOrderDate(order.createdAt) : 'Data não disponível';
    const finishedDate = order.finishedAt ? formatOrderDate(order.finishedAt) : null;
    const canceledDate = order.canceledAt ? formatOrderDate(order.canceledAt) : null;
    
    // Determinar se é retirada ou entrega
    const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';
    
    // Construir HTML dos itens
    let itemsHtml = '';
    
    if (order.items && order.items.length > 0) {
        itemsHtml = '<ul class="details-items-list">';
        
        order.items.forEach(item => {
            const quantity = item.quantity || 1;
            const name = item.name || item.productName || 'Item sem nome';
            
            itemsHtml += `<li>${quantity}x ${name}</li>`;
        });
        
        itemsHtml += '</ul>';
    } else {
        itemsHtml = '<p class="no-items">Detalhes dos itens não disponíveis</p>';
    }
    
    // Formatar o preço total
    const totalPrice = order.totalPrice || 0;
    const formattedTotalPrice = formatPrice(totalPrice);
    
    // Mostrar o modal usando SweetAlert2
    Swal.fire({
        title: `Pedido #${order.id}`,
        html: `
            <div class="order-details-container">
                <div class="details-section">
                    <h3>Informações do Pedido</h3>
                    <div class="details-row">
                        <div class="details-label">Status:</div>
                        <div class="details-value"><span class="order-status-badge" style="background-color: ${statusColor};">${statusInfo.text}</span></div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Data/Hora:</div>
                        <div class="details-value">${createdDate}</div>
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
                    <h3>Itens do Pedido</h3>
                    ${itemsHtml}
                </div>
                
                ${!isPickup ? `
                <div class="details-section">
                    <h3>Endereço de Entrega</h3>
                    <div class="details-address">${order.deliveryAddress}</div>
                </div>` : ''}
                
                ${order.orderStatus === 'CANCELADOS' ? `
                <div class="details-section">
                    <h3>Informações de Cancelamento</h3>
                    <div class="details-row">
                        <div class="details-label">Data:</div>
                        <div class="details-value">${canceledDate || 'Não disponível'}</div>
                    </div>
                </div>` : ''}
                
                ${order.orderStatus === 'FINALIZADOS' ? `
                <div class="details-section">
                    <h3>Informações de Entrega</h3>
                    <div class="details-row">
                        <div class="details-label">Finalizado em:</div>
                        <div class="details-value">${finishedDate || 'Não disponível'}</div>
                    </div>
                </div>` : ''}
            </div>
        `,
        width: '600px',
        confirmButtonText: 'Fechar',
        confirmButtonColor: '#06CF90',
        customClass: {
            container: 'order-details-modal-container',
            popup: 'order-details-modal',
            content: 'order-details-content'
        }
    });
}

// Função para mostrar loading na seção de histórico
function showLoadingOrderHistory() {
    const ordersList = document.querySelector('#orders-history .orders-list');
    if (ordersList) {
        ordersList.innerHTML = `
            <div class="loading-orders">
                <i class="fa fa-spinner fa-pulse"></i>
                <p>Carregando seu histórico de pedidos...</p>
            </div>
        `;
    }
}

// Função para mostrar estado vazio
function displayEmptyOrderHistory(message = 'Você ainda não fez nenhum pedido.') {
    const ordersList = document.querySelector('#orders-history .orders-list');
    if (ordersList) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fa fa-shopping-bag"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Função para mostrar erro
function displayErrorOrderHistory(message) {
    const ordersList = document.querySelector('#orders-history .orders-list');
    if (ordersList) {
        ordersList.innerHTML = `
            <div class="error-message">
                <i class="fa fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="action-button" onclick="loadOrderHistory()">
                    Tentar novamente
                </button>
            </div>
        `;
    }
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