// Funções relacionadas a pagamento e finalização do pedido

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

        // Limpar carrinho
        sessionStorage.removeItem('cart');

        // Mostrar confirmação
        orderSuccess(orderId);
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

// Função para mostrar sucesso no pedido
function orderSuccess(orderId) {
    // Preencher número do pedido
    document.getElementById('order-number').textContent = orderId;

    // Ir para a etapa de confirmação
    goToSection('confirmation');
}