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
            <button class="order-details-button" onclick="showOrderDetails('${order.id}')">
                Ver detalhes
            </button>
        </div>
    `;
    
    return orderCard;
}

// Função para obter informações de status do pedido
function getOrderStatusInfo(status) {
    const statusMap = {
        'PENDENTE': { text: 'Pendente', class: 'pending' },
        'PREPARANDO': { text: 'Preparando', class: 'processing' },
        'SAIU_PARA_ENTREGA': { text: 'Saiu para entrega', class: 'processing' },
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
async function showOrderDetails(orderId) {
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
        
        // Busca detalhes específicos do pedido
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar detalhes do pedido');
        }
        
        const orderDetails = await response.json();
        displayOrderDetailsModal(orderDetails);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes do pedido:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Não foi possível carregar os detalhes do pedido.',
            confirmButtonColor: '#06CF90'
        });
    } finally {
        hideLoadingModal();
    }
}

// Função para exibir modal com detalhes do pedido
function displayOrderDetailsModal(order) {
    const statusInfo = getOrderStatusInfo(order.orderStatus);
    const createdDate = formatOrderDate(order.createdAt);
    
    let detailsHtml = `
        <div class="order-details-container">
            <div class="order-details-header">
                <h4>Pedido #${order.id}</h4>
                <p>Realizado em: ${createdDate}</p>
                <p class="order-status-text">Status: ${statusInfo.text}</p>
            </div>
            
            <div class="order-details-customer">
                <h4>Informações do Cliente</h4>
                <p><strong>Nome:</strong> ${order.name}</p>
                <p><strong>Endereço:</strong> ${order.deliveryAddress}</p>
            </div>
    `;
    
    // Se houver itens do pedido (se a API retornar essa informação)
    if (order.items && order.items.length > 0) {
        detailsHtml += `
            <div class="order-details-items">
                <h4>Itens do Pedido</h4>
                <table class="order-items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qtd</th>
                            <th>Preço</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        order.items.forEach(item => {
            detailsHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>R$ ${formatPrice(item.price * item.quantity)}</td>
                </tr>
            `;
        });
        
        detailsHtml += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    detailsHtml += `
            <div class="order-details-payment">
                <div class="order-total-text">
                    <strong>Total: R$ ${formatPrice(order.totalPrice)}</strong>
                </div>
            </div>
    `;
    
    // Adiciona informações de finalização/cancelamento se existirem
    if (order.finishedAt) {
        detailsHtml += `
            <div class="order-details-delivery">
                <p><strong>Finalizado em:</strong> ${formatOrderDate(order.finishedAt)}</p>
            </div>
        `;
    }
    
    if (order.canceledAt) {
        detailsHtml += `
            <div class="order-details-delivery">
                <p><strong>Cancelado em:</strong> ${formatOrderDate(order.canceledAt)}</p>
            </div>
        `;
    }
    
    detailsHtml += `</div>`;
    
    Swal.fire({
        title: 'Detalhes do Pedido',
        html: detailsHtml,
        width: '600px',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'order-details-modal'
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