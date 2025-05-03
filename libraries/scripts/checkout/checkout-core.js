// Variáveis globais
let orderData = {
    partnerId: null,
    items: [],
    customer: {},
    address: {},
    deliveryType: 'delivery', // 'delivery' ou 'pickup'
    payment: {
        method: 'on-delivery', // 'online' ou 'on-delivery'
        submethod: 'card', // Para on-delivery: 'card', 'cash', 'pix'
        details: {}
    },
    total: 0
};

// Inicializa o checkout quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    // Tenta restaurar o estado do checkout se estiver vindo de um retorno de login
    const stateRestored = restoreCheckoutState();
    
    // Se não conseguiu restaurar o estado, carrega normalmente
    if (!stateRestored) {
        // Verifica se existe carrinho em sessionStorage
        const cartFromStorage = sessionStorage.getItem('cart');
        
        // Se não existir carrinho, redireciona para a página do restaurante
        if (!cartFromStorage || JSON.parse(cartFromStorage).length === 0) {
            Swal.fire({
                title: 'Carrinho vazio',
                text: 'Seu carrinho está vazio! Adicione itens antes de finalizar a compra.',
                icon: 'warning',
                confirmButtonColor: '#06CF90'
            }).then(() => {
                window.location.href = '../index.html';
            });
            return;
        }
        
        // Carrega os dados do carrinho para o orderData
        orderData.items = JSON.parse(cartFromStorage);
        orderData.total = calculateCartTotalPrice(orderData.items);
        
        // Obtém o partnerId da URL
        const urlParams = new URLSearchParams(window.location.search);
        orderData.partnerId = urlParams.get('partnerId');
        
        // Se não tiver partnerId, redireciona para a página principal
        if (!orderData.partnerId) {
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao identificar o restaurante!',
                icon: 'error',
                confirmButtonColor: '#06CF90'
            }).then(() => {
                window.location.href = '../index.html';
            });
            return;
        }
    }
    
    // Verifica se o usuário já está autenticado
    if (isAuthenticatedClient()) {
        // Se estiver logado, pula a etapa de login e vai direto para a etapa de endereço
        const userData = getAuthenticatedClient();
        
        // Preenche os dados do cliente com as informações da sessão
        orderData.customer = {
            name: userData.username,
            email: userData.email,
            phone: userData.phone || ""
        };
        
        // Vai direto para a seção de endereço
        goToSection('address');
    } else {
        // Se não estiver logado, mostra as opções de login ou compra como convidado
        goToSection('login');
    }
    
    // Inicializa os eventos dos botões
    initializeEvents();
    
    // Carrega os itens no resumo do pedido
    loadOrderSummary();
    
    // Define a opção de entrega padrão
    updateDeliveryOption('delivery');
});

// Função para carregar o resumo do pedido na tela de pagamento
function loadOrderSummary() {
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotalValue = document.getElementById('order-total-value');
    
    // Limpa o container de itens
    orderItemsContainer.innerHTML = '';
    
    // Adiciona cada item do pedido
    orderData.items.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        const itemName = document.createElement('span');
        itemName.className = 'order-item-name';
        itemName.textContent = `${item.name} (${item.quantity}x)`;
        
        const itemPrice = document.createElement('span');
        itemPrice.className = 'order-item-price';
        const totalItemPrice = item.price * item.quantity;
        itemPrice.textContent = `R$ ${formatPrice(totalItemPrice)}`;
        
        orderItem.appendChild(itemName);
        orderItem.appendChild(itemPrice);
        
        orderItemsContainer.appendChild(orderItem);
    });
    
    // Atualiza o valor total
    orderTotalValue.textContent = `R$ ${formatPrice(orderData.total)}`;
}

// Função para inicializar todos os eventos
function initializeEvents() {
    // Botões da seção de identificação
    document.getElementById('btn-login').addEventListener('click', handleLoginOption);
    document.getElementById('btn-guest').addEventListener('click', showGuestForm);
    document.getElementById('continue-guest').addEventListener('click', processGuestInfo);
    
    // Botões da seção de endereço
    document.getElementById('search-cep').addEventListener('click', searchCepAddress);
    document.getElementById('back-to-login').addEventListener('click', () => goToSection('login'));
    document.getElementById('continue-to-payment').addEventListener('click', validateAddressAndContinue);
    
    // Eventos para opções de entrega ou retirada
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    deliveryOptions.forEach(option => {
        option.addEventListener('click', function() {
            const input = this.querySelector('input[type="radio"]');
            input.checked = true;
            updateDeliveryOption(input.value);
        });
    });
    
    document.getElementById('delivery').addEventListener('change', () => updateDeliveryOption('delivery'));
    document.getElementById('pickup').addEventListener('change', () => updateDeliveryOption('pickup'));
    
    // Botões da seção de pagamento
    document.getElementById('back-to-address').addEventListener('click', () => goToSection('address'));
    document.getElementById('place-order').addEventListener('click', processOrder);
    
    // Eventos dos métodos de pagamento
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            const input = this.querySelector('input[type="radio"]');
            input.checked = true;
            selectPaymentMethod(method);
        });
    });
    
    document.getElementById('online').addEventListener('change', () => selectPaymentMethod('online'));
    document.getElementById('on-delivery').addEventListener('change', () => selectPaymentMethod('on-delivery'));
    
    // Eventos para os submétodos de pagamento na entrega
    document.getElementById('on-delivery-cash').addEventListener('change', function() {
        document.getElementById('change-form').style.display = 'block';
    });
    
    document.querySelectorAll('input[name="on-delivery-method"]').forEach(input => {
        if (input.id !== 'on-delivery-cash') {
            input.addEventListener('change', function() {
                document.getElementById('change-form').style.display = 'none';
            });
        }
    });
    
    // Botão para voltar à loja após confirmação
    document.getElementById('back-to-store').addEventListener('click', returnToStore);
    
    // Botão para salvar novo endereço
    document.getElementById('save-new-address').addEventListener('click', saveNewAddress);
}

// Função para navegar entre as seções
function goToSection(section) {
    // Esconder todas as seções
    const sections = document.querySelectorAll('.checkout-section');
    sections.forEach(s => {
        s.classList.remove('active');
    });

    // Mostrar a seção selecionada
    document.getElementById(`${section}-section`).classList.add('active');

    // Atualizar os steps
    updateSteps(section);

    // Lógica adicional para cada seção
    if (section === 'address') {
        // Se o cliente estiver autenticado, carrega seus endereços
        if (isAuthenticatedClient()) {
            const clientData = getAuthenticatedClient();
            loadClientAddresses(clientData.id);

            // Mostrar botão para salvar endereço no formulário
            document.getElementById('save-new-address').style.display = 'block';
        } else {
            // Se não estiver autenticado, mostra apenas o formulário normal
            document.getElementById('address-list-container').style.display = 'none';
            document.getElementById('delivery-form').style.display = 'block';
            document.getElementById('save-new-address').style.display = 'none';
        }
    }

    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Função para voltar para a loja
function returnToStore() {
    window.location.href = `index.html?partnerId=${orderData.partnerId}`;
}