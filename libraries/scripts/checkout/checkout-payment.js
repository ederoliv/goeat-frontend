// Funções relacionadas a pagamento e finalização do pedido com tracking de status

// Variável global para armazenar o ID do pedido e controlar o polling
let currentOrderId = null;
let statusPollingInterval = null;

// Função para processar o pedido
function processOrder() {
    // Validar método de pagamento
    if (!orderData.payment.method) {
        Swal.fire({
            title: 'Selecione o pagamento',
            text: 'Por favor, selecione um método de pagamento!',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
        return;
    }

    // Verificar se é pagamento na entrega/retirada e obter o submétodo
    if (orderData.payment.method === 'on-delivery') {
        const submethodEls = document.querySelectorAll('input[name="on-delivery-method"]');
        let selectedSubmethod = null;

        submethodEls.forEach(el => {
            if (el.checked) {
                selectedSubmethod = el.value;
            }
        });

        orderData.payment.submethod = selectedSubmethod;

        // Se for dinheiro, verificar troco
        if (selectedSubmethod === 'cash') {
            const changeAmount = document.getElementById('change-amount').value;
            orderData.payment.details = {
                changeAmount: changeAmount || 0
            };
        }
    }

    // Mostrar loading
    showLoadingModal();

    // Preparar os itens do pedido
    const orderItems = orderData.items.map(item => {
        return {
            productId: item.id,
            quantity: item.quantity
        };
    });

    // Construir endereço de entrega como string ou "RETIRADA NO LOCAL"
    let deliveryAddressStr = "RETIRADA NO LOCAL";
    
    if (orderData.deliveryType === 'delivery' && orderData.address) {
        deliveryAddressStr = `${orderData.address.street}, ${orderData.address.number}`;
        
        if (orderData.address.complement) {
            deliveryAddressStr += `, ${orderData.address.complement}`;
        }
        
        deliveryAddressStr += `, ${orderData.address.neighborhood}, ${orderData.address.city} - ${orderData.address.state}`;
        
        if (orderData.address.reference) {
            deliveryAddressStr += `. Referência: ${orderData.address.reference}`;
        }
    }

    // Construir o objeto para enviar à API
    // Usando apenas os campos que o backend espera
    let apiOrderData = {
        clientId: null,
        items: orderItems,
        name: orderData.customer.name,
        email: orderData.customer.email,
        phone: orderData.customer.phone || "(99) 99999-9999",
        deliveryAddress: deliveryAddressStr
    };

    // Se for cliente autenticado, usar ID do cliente
    if (isAuthenticatedClient()) {
        const clientData = getAuthenticatedClient();
        apiOrderData.clientId = clientData.id;
        
        // Garantir que o email seja preenchido
        if (!apiOrderData.email) {
            apiOrderData.email = `${clientData.username}@gmail.com`;
        }
    }

    // Enviar para a API
    fetch(`${API_BASE_URL}/partners/${orderData.partnerId}/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiOrderData)
    })
    .then(response => {
        hideLoadingModal();
        
        if (!response.ok) {
            throw new Error(`Erro ao criar pedido: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Pedido criado com sucesso:', data);
        
        // Gerar um ID de pedido do retorno da API ou simulado
        const orderId = data.id || Math.floor(100000 + Math.random() * 900000);
        
        // Armazena o ID do pedido para tracking
        currentOrderId = orderId;

        // Limpar carrinho
        sessionStorage.removeItem('cart');

        // Mostrar confirmação com tracking de status
        orderSuccessWithTracking(orderId);
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Erro ao processar pedido:', error);
        
        Swal.fire({
            title: 'Erro ao processar pedido',
            text: error.message || 'Ocorreu um erro ao tentar finalizar seu pedido. Tente novamente em alguns instantes.',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
    });
}

// Função para mostrar sucesso no pedido com tracking de status
function orderSuccessWithTracking(orderId) {
    // Preencher número do pedido
    document.getElementById('order-number').textContent = orderId;
    
    // Adicionar elementos de status na seção de confirmação
    updateConfirmationSectionWithTracking();
    
    // Ir para a etapa de confirmação
    goToSection('confirmation');
    
    // Iniciar o tracking do status
    startOrderStatusTracking(orderId);
}

// Função para atualizar a seção de confirmação com elementos de tracking
function updateConfirmationSectionWithTracking() {
    const confirmationContent = document.querySelector('.confirmation-content');
    
    // Localiza os elementos existentes
    const orderDetails = confirmationContent.querySelector('.order-details');
    const backToStoreButton = document.getElementById('back-to-store');
    
    // Cria o elemento de status
    const statusContainer = document.createElement('div');
    statusContainer.className = 'order-status-container';
    statusContainer.innerHTML = `
        <div class="status-section">
            <h3>Status do Pedido</h3>
            <div class="current-status">
                <div class="status-indicator">
                    <i class="fa fa-clock-o status-icon"></i>
                    <span id="current-status-text">Verificando status...</span>
                </div>
                <div class="status-timestamp" id="status-timestamp">
                    Última atualização: <span id="last-update-time">--:--</span>
                </div>
            </div>
            
            <div class="status-progress">
                <div class="progress-step" id="step-esperando">
                    <div class="step-circle">1</div>
                    <span>Aguardando</span>
                </div>
                <div class="progress-line"></div>
                <div class="progress-step" id="step-preparando">
                    <div class="step-circle">2</div>
                    <span>Preparando</span>
                </div>
                <div class="progress-line"></div>
                <div class="progress-step" id="step-encaminhados">
                    <div class="step-circle">3</div>
                    <span>A Caminho</span>
                </div>
                <div class="progress-line"></div>
                <div class="progress-step" id="step-finalizados">
                    <div class="step-circle">4</div>
                    <span>Finalizado</span>
                </div>
            </div>
            
            <div class="status-info">
                <p><i class="fa fa-info-circle"></i> O status é atualizado automaticamente a cada 30 segundos</p>
            </div>
        </div>
    `;
    
    // Insere o container de status entre order-details e o botão
    orderDetails.parentNode.insertBefore(statusContainer, backToStoreButton);
}

// Função para iniciar o tracking do status do pedido
function startOrderStatusTracking(orderId) {
    console.log(`Iniciando tracking do pedido ${orderId}`);
    
    // Fazer a primeira verificação imediatamente
    checkOrderStatus(orderId);
    
    // Configurar verificação a cada 30 segundos
    statusPollingInterval = setInterval(() => {
        checkOrderStatus(orderId);
    }, 30000); // 30 segundos
}

// Função para verificar o status do pedido
async function checkOrderStatus(orderId) {
    try {
        console.log(`Verificando status do pedido ${orderId}`);
        
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao verificar status: ${response.status}`);
        }
        
        const statusData = await response.json();
        console.log('Status recebido:', statusData);
        
        // Atualizar a interface com o novo status
        updateStatusDisplay(statusData.status);
        
        // Se o pedido foi finalizado ou cancelado, parar o polling
        if (statusData.status === 'FINALIZADOS' || statusData.status === 'CANCELADOS') {
            stopOrderStatusTracking();
        }
        
    } catch (error) {
        console.error('Erro ao verificar status do pedido:', error);
        
        // Em caso de erro, mostrar status de erro mas não parar o polling
        updateStatusDisplay('ERROR');
    }
}

// Função para atualizar a exibição do status
function updateStatusDisplay(status) {
    const statusText = document.getElementById('current-status-text');
    const statusIcon = document.querySelector('.status-icon');
    const timestampElement = document.getElementById('last-update-time');
    
    if (!statusText || !statusIcon || !timestampElement) {
        console.error('Elementos de status não encontrados');
        return;
    }
    
    // Mapear status para texto legível e ícone
    const statusMap = {
        'ESPERANDO': {
            text: 'Aguardando confirmação',
            icon: 'fa-clock-o',
            color: '#FF5555',
            step: 'esperando'
        },
        'PREPARANDO': {
            text: 'Preparando seu pedido',
            icon: 'fa-fire',
            color: '#53BDEB',
            step: 'preparando'
        },
        'ENCAMINHADOS': {
            text: 'A caminho',
            icon: 'fa-motorcycle',
            color: '#FCCC48',
            step: 'encaminhados'
        },
        'FINALIZADOS': {
            text: 'Pedido finalizado',
            icon: 'fa-check-circle',
            color: '#06CF90',
            step: 'finalizados'
        },
        'CANCELADOS': {
            text: 'Pedido cancelado',
            icon: 'fa-times-circle',
            color: '#dc3545',
            step: null
        },
        'ERROR': {
            text: 'Erro ao verificar status',
            icon: 'fa-exclamation-triangle',
            color: '#dc3545',
            step: null
        }
    };
    
    const statusInfo = statusMap[status] || statusMap['ERROR'];
    
    // Atualizar texto e ícone
    statusText.textContent = statusInfo.text;
    statusText.style.color = statusInfo.color;
    
    // Atualizar ícone
    statusIcon.className = `fa ${statusInfo.icon} status-icon`;
    statusIcon.style.color = statusInfo.color;
    
    // Atualizar timestamp
    const now = new Date();
    timestampElement.textContent = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Atualizar barra de progresso
    if (statusInfo.step) {
        updateProgressBar(statusInfo.step);
    }
    
    // Se foi cancelado, mostrar mensagem específica
    if (status === 'CANCELADOS') {
        showCancelledOrderMessage();
    }
}

// Função para atualizar a barra de progresso
function updateProgressBar(currentStep) {
    const steps = ['esperando', 'preparando', 'encaminhados', 'finalizados'];
    const currentIndex = steps.indexOf(currentStep);
    
    steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${step}`);
        if (!stepElement) return;
        
        // Remove todas as classes
        stepElement.classList.remove('active', 'completed');
        
        // Adiciona classes apropriadas
        if (index <= currentIndex) {
            if (index === currentIndex) {
                stepElement.classList.add('active');
            } else {
                stepElement.classList.add('completed');
            }
        }
    });
}

// Função para mostrar mensagem de pedido cancelado
function showCancelledOrderMessage() {
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        statusPollingInterval = null;
    }
    
    Swal.fire({
        icon: 'warning',
        title: 'Pedido Cancelado',
        text: 'Seu pedido foi cancelado pelo restaurante. Entre em contato para mais informações.',
        confirmButtonColor: '#06CF90',
        backdrop: false
    });
}

// Função para parar o tracking do status
function stopOrderStatusTracking() {
    console.log('Parando tracking do status do pedido');
    
    if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        statusPollingInterval = null;
    }
}

// Função para voltar para a loja (modificada para limpar o tracking)
function returnToStore() {
    // Para o tracking antes de sair da página
    stopOrderStatusTracking();
    
    window.location.href = `index.html?partnerId=${orderData.partnerId}`;
}

// Limpar o interval quando a página for fechada
window.addEventListener('beforeunload', () => {
    stopOrderStatusTracking();
});

// Função original de sucesso (mantida para compatibilidade)
function orderSuccess(orderId) {
    orderSuccessWithTracking(orderId);
}