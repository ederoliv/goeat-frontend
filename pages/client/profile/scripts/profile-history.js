async function showOrderDetails(orderId) {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.token) {
            Swal.fire({
                icon: 'error',
                title: 'Erro de autenticação',
                text: 'Sessão expirada. Faça login novamente.',
                confirmButtonColor: '#06CF90'
            });
            return;
        }

        showLoadingModal();

        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                hideLoadingModal();
                getInvalidClientToken(response.status);
                return;
            }
            
            // Tenta extrair mensagem de erro da resposta
            let errorMessage = 'Falha ao carregar detalhes do pedido';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || `Erro HTTP ${response.status}`;
            } catch (jsonError) {
                errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const order = await response.json();
        hideLoadingModal();

        // Formatar data de criação
        const formattedDate = formatBrazilianDate(order.createdAt);

        // Status em português
        const statusInfo = getOrderStatusInfo(order.orderStatus);

        // Determinar data de finalização/cancelamento
        let completionInfo = '';
        if (order.finishedAt) {
            const finishedFormatted = formatBrazilianDate(order.finishedAt);
            completionInfo = `<p><strong>Finalizado em:</strong> ${finishedFormatted}</p>`;
        } else if (order.canceledAt) {
            const canceledFormatted = formatBrazilianDate(order.canceledAt);
            completionInfo = `<p><strong>Cancelado em:</strong> ${canceledFormatted}</p>`;
        }

        // Verificar se é retirada no local
        const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';

        Swal.fire({
            title: `Detalhes do Pedido #${order.id}`,
            html: `
                <div class="order-details-container">
                    <div class="order-details-header">
                        <p><strong>Data do pedido:</strong> ${formattedDate}</p>
                        <p><strong>Status:</strong> <span class="order-status-text">${statusInfo.text}</span></p>
                        ${completionInfo}
                        <p><strong>Cliente:</strong> ${order.name}</p>
                    </div>

                    <div class="order-details-delivery">
                        <h4>${isPickup ? 'Retirada' : 'Entrega'}</h4>
                        <p>${isPickup ? 'Retirada no restaurante' : order.deliveryAddress}</p>
                    </div>

                    <div class="order-details-payment">
                        <p class="order-total-text"><strong>Total: R$ ${formatPrice(order.totalPrice)}</strong></p>
                    </div>

                    <div class="order-note">
                        <p><em>Para ver os itens detalhados do pedido, entre em contato com o restaurante.</em></p>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: '500px',
            customClass: {
                popup: 'order-details-modal'
            }
        });// Funções relacionadas ao histórico de pedidos

// Funções relacionadas ao histórico de pedidos

// Função utilitária para mapear status
function getOrderStatusInfo(orderStatus) {
    const statusMap = {
        'FINALIZADOS': { text: 'Finalizado', class: 'delivered' },
        'CANCELADOS': { text: 'Cancelado', class: 'cancelled' },
        'PENDENTES': { text: 'Pendente', class: 'pending' },
        'EM_PREPARO': { text: 'Em Preparo', class: 'processing' },
        'PREPARANDO': { text: 'Preparando', class: 'processing' },
        'PRONTO': { text: 'Pronto', class: 'processing' },
        'ENTREGUE': { text: 'Entregue', class: 'delivered' }
    };
    
    return statusMap[orderStatus] || { text: orderStatus, class: 'pending' };
}

// Função utilitária para formatar data no padrão brasileiro
function formatBrazilianDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function loadOrderHistory() {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.token) {
            console.error('Cliente não autenticado ou token inválido para carregar histórico.');
            displayOrderHistory([]);
            return;
        }

        showLoadingModal();

        const response = await fetch(`${API_BASE_URL}/orders/client`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                getInvalidClientToken(response.status);
                return;
            }
            
            // Tenta extrair mensagem de erro da resposta
            let errorMessage = 'Erro desconhecido';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || `Erro HTTP ${response.status}`;
            } catch (jsonError) {
                errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const orders = await response.json();
        displayOrderHistory(orders);

    } catch (error) {
        console.error('Erro ao carregar histórico de pedidos:', error);
        const ordersList = document.querySelector('#orders-history .orders-list');
        if (ordersList) {
            // Determina a mensagem de erro baseada no tipo
            let errorDisplayMessage = 'Não foi possível carregar seu histórico de pedidos.';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorDisplayMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
            } else if (error.message.includes('HTTP')) {
                errorDisplayMessage = `Erro do servidor: ${error.message}`;
            }
            
            ordersList.innerHTML = `
                <div class="error-message">
                    <i class="fa fa-exclamation-circle"></i>
                    <p>${errorDisplayMessage}</p>
                    <button class="action-button" onclick="loadOrderHistory()">Tentar novamente</button>
                </div>
            `;
        }
    } finally {
        hideLoadingModal();
    }
}

function displayOrderHistory(orders) {
    const ordersList = document.querySelector('#orders-history .orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = '';

    if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders">
                <i class="fa fa-shopping-bag"></i>
                <p>Você ainda não fez nenhum pedido.</p>
                <a href="../index.html" class="action-button">Explorar restaurantes</a>
            </div>
        `;
        return;
    }

    // Ordena os pedidos por data de criação (mais recente primeiro)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}

function createOrderCard(order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.dataset.orderId = order.id;

    // Formatar data
    const formattedDate = formatBrazilianDate(order.createdAt);

    // Determinar status em português baseado no orderStatus
    const status = getOrderStatusInfo(order.orderStatus);

    // Determinar se foi entrega ou retirada
    const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';
    const deliveryType = isPickup ? 'Retirada no local' : 'Entrega';

    // Determinar a data de finalização
    let completionDate = '';
    if (order.finishedAt) {
        completionDate = formatBrazilianDate(order.finishedAt);
    } else if (order.canceledAt) {
        completionDate = formatBrazilianDate(order.canceledAt);
    }

    orderCard.innerHTML = `
        <div class="order-header">
            <div class="order-info">
                <h4>Pedido #${order.id}</h4>
                <p class="order-date">${formattedDate}</p>
                ${completionDate ? `<p class="order-completion-date">${order.finishedAt ? 'Finalizado' : 'Cancelado'} em: ${completionDate}</p>` : ''}
            </div>
            <span class="order-status ${status.class}">${status.text}</span>
        </div>

        <div class="order-customer-info">
            <p><strong>Cliente:</strong> ${order.name}</p>
            <p><strong>Tipo:</strong> ${deliveryType}</p>
        </div>

        <div class="order-delivery-info">
            <p><i class="fa fa-map-marker"></i> ${isPickup ? 'Retirada no restaurante' : order.deliveryAddress}</p>
        </div>

        <div class="order-footer">
            <span class="order-total">Total: R$ ${formatPrice(order.totalPrice)}</span>
            <button class="order-details-button" onclick="showOrderDetails('${order.id}')">
                Ver detalhes
            </button>
        </div>
    `;

    return orderCard;
}

async function showOrderDetails(orderId) {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.token) {
            Swal.fire({
                icon: 'error',
                title: 'Erro de autenticação',
                text: 'Sessão expirada. Faça login novamente.',
                confirmButtonColor: '#06CF90'
            });
            return;
        }

        showLoadingModal();

        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                hideLoadingModal();
                getInvalidClientToken(response.status);
                return;
            }
            
            // Tenta extrair mensagem de erro da resposta
            let errorMessage = 'Falha ao carregar detalhes do pedido';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || `Erro HTTP ${response.status}`;
            } catch (jsonError) {
                errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const order = await response.json();
        hideLoadingModal();

        // Formatar data de criação
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Status em português
        const statusMap = {
            'FINALIZADOS': 'Finalizado',
            'CANCELADOS': 'Cancelado',
            'PENDENTES': 'Pendente',
            'EM_PREPARO': 'Em Preparo'
        };

        const statusText = statusMap[order.orderStatus] || order.orderStatus;

        // Determinar data de finalização/cancelamento
        let completionInfo = '';
        if (order.finishedAt) {
            const finishedDate = new Date(order.finishedAt);
            const finishedFormatted = finishedDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            completionInfo = `<p><strong>Finalizado em:</strong> ${finishedFormatted}</p>`;
        } else if (order.canceledAt) {
            const canceledDate = new Date(order.canceledAt);
            const canceledFormatted = canceledDate.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            completionInfo = `<p><strong>Cancelado em:</strong> ${canceledFormatted}</p>`;
        }

        // Verificar se é retirada no local
        const isPickup = order.deliveryAddress === 'RETIRADA NO LOCAL';

        Swal.fire({
            title: `Detalhes do Pedido #${order.id}`,
            html: `
                <div class="order-details-container">
                    <div class="order-details-header">
                        <p><strong>Data do pedido:</strong> ${formattedDate}</p>
                        <p><strong>Status:</strong> <span class="order-status-text">${statusText}</span></p>
                        ${completionInfo}
                        <p><strong>Cliente:</strong> ${order.name}</p>
                    </div>

                    <div class="order-details-delivery">
                        <h4>${isPickup ? 'Retirada' : 'Entrega'}</h4>
                        <p>${isPickup ? 'Retirada no restaurante' : order.deliveryAddress}</p>
                    </div>

                    <div class="order-details-payment">
                        <p class="order-total-text"><strong>Total: R$ ${formatPrice(order.totalPrice)}</strong></p>
                    </div>

                    <div class="order-note">
                        <p><em>Para ver os itens detalhados do pedido, entre em contato com o restaurante.</em></p>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: '500px',
            customClass: {
                popup: 'order-details-modal'
            }
        });

    } catch (error) {
        hideLoadingModal();
        console.error('Erro ao carregar detalhes do pedido:', error);
        
        // Determina mensagem de erro mais específica
        let errorDisplayMessage = 'Não foi possível carregar os detalhes do pedido. Tente novamente.';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorDisplayMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('HTTP')) {
            errorDisplayMessage = error.message;
        }
        
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: errorDisplayMessage,
            confirmButtonColor: '#06CF90',
            footer: error.message.includes('HTTP') ? '' : 'Verifique sua conexão com a internet'
        });
    }
}

// Função auxiliar para formatar preço (caso não esteja disponível globalmente)
function formatPrice(priceInCents) {
    if (typeof window.formatPrice === 'function') {
        return window.formatPrice(priceInCents);
    }
    return (priceInCents / 100).toFixed(2).replace('.', ',');
}