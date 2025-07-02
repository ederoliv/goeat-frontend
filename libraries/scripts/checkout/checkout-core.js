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
    console.log('Checkout carregando...');
    
    // Tenta restaurar o estado do checkout se estiver vindo de um retorno de login
    const stateRestored = restoreCheckoutState();
    
    // Se não conseguiu restaurar o estado, carrega normalmente
    if (!stateRestored) {
        // Verifica se existe carrinho em sessionStorage
        const cartFromStorage = sessionStorage.getItem('cart');
        
        // Se não existir carrinho, redireciona para a página do restaurante
        if (!cartFromStorage) {
            console.log('Carrinho vazio, redirecionando...');
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
        
        // Parse do carrinho para verificar se está no formato correto
        let cartData;
        try {
            cartData = JSON.parse(cartFromStorage);
        } catch (error) {
            console.error('Erro ao fazer parse do carrinho:', error);
            clearCartAndRedirect();
            return;
        }
        
        // Verifica se é o formato novo (objeto com partnerId e items) ou antigo (array direto)
        if (Array.isArray(cartData)) {
            // Formato antigo - verifica se tem itens
            if (cartData.length === 0) {
                clearCartAndRedirect();
                return;
            }
            orderData.items = cartData;
        } else if (cartData && cartData.items) {
            // Formato novo - verifica se tem itens
            if (!cartData.items || cartData.items.length === 0) {
                clearCartAndRedirect();
                return;
            }
            orderData.items = cartData.items;
        } else {
            clearCartAndRedirect();
            return;
        }
        
        // Calcula o total
        orderData.total = calculateCartTotalPrice(orderData.items);
        
        // Obtém o partnerId da URL
        const urlParams = new URLSearchParams(window.location.search);
        orderData.partnerId = urlParams.get('partnerId');
        
        // Se não tiver partnerId, redireciona para a página principal
        if (!orderData.partnerId) {
            console.log('partnerId não encontrado na URL');
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
        console.log('Cliente autenticado detectado');
        // Se estiver logado, pula a etapa de login e vai direto para a etapa de endereço
        const userData = getAuthenticatedClient();
        
        // Preenche os dados do cliente com as informações da sessão
        orderData.customer = {
            name: userData.username || userData.name || '',
            email: userData.email || '',
            phone: userData.phone || ""
        };
        
        // Vai direto para a seção de endereço
        goToSection('address');
    } else {
        console.log('Cliente não autenticado, mostrando opções de login');
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

// Função para limpar carrinho e redirecionar
function clearCartAndRedirect() {
    sessionStorage.removeItem('cart');
    Swal.fire({
        title: 'Carrinho vazio',
        text: 'Seu carrinho está vazio! Adicione itens antes de finalizar a compra.',
        icon: 'warning',
        confirmButtonColor: '#06CF90'
    }).then(() => {
        window.location.href = '../index.html';
    });
}

// Função para carregar o resumo do pedido na tela de pagamento
function loadOrderSummary() {
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotalValue = document.getElementById('order-total-value');
    
    if (!orderItemsContainer || !orderTotalValue) {
        console.warn('Elementos do resumo do pedido não encontrados');
        return;
    }
    
    // Limpa o container de itens
    orderItemsContainer.innerHTML = '';
    
    // Verifica se há itens no pedido
    if (!orderData.items || orderData.items.length === 0) {
        orderItemsContainer.innerHTML = '<p>Nenhum item no carrinho</p>';
        orderTotalValue.textContent = 'R$ 0,00';
        return;
    }
    
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
    console.log('Inicializando eventos do checkout...');
    
    // Botões da seção de identificação
    const btnLogin = document.getElementById('btn-login');
    const btnGuest = document.getElementById('btn-guest');
    const continueGuest = document.getElementById('continue-guest');
    
    if (btnLogin) btnLogin.addEventListener('click', handleLoginOption);
    if (btnGuest) btnGuest.addEventListener('click', showGuestForm);
    if (continueGuest) continueGuest.addEventListener('click', processGuestInfo);
    
    // Botões da seção de endereço
    const searchCep = document.getElementById('search-cep');
    const backToLogin = document.getElementById('back-to-login');
    const continueToPayment = document.getElementById('continue-to-payment');
    
    if (searchCep) searchCep.addEventListener('click', searchCepAddress);
    if (backToLogin) backToLogin.addEventListener('click', () => goToSection('login'));
    if (continueToPayment) continueToPayment.addEventListener('click', validateAddressAndContinue);
    
    // Eventos para opções de entrega ou retirada
    const deliveryRadio = document.getElementById('delivery');
    const pickupRadio = document.getElementById('pickup');
    
    if (deliveryRadio) deliveryRadio.addEventListener('change', () => updateDeliveryOption('delivery'));
    if (pickupRadio) pickupRadio.addEventListener('change', () => updateDeliveryOption('pickup'));
    
    // Eventos para os delivery options (cliques nos containers)
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    deliveryOptions.forEach(option => {
        option.addEventListener('click', function() {
            const input = this.querySelector('input[type="radio"]');
            if (input) {
                input.checked = true;
                updateDeliveryOption(input.value);
            }
        });
    });
    
    // Botões da seção de pagamento
    const backToAddress = document.getElementById('back-to-address');
    const placeOrder = document.getElementById('place-order');
    
    if (backToAddress) backToAddress.addEventListener('click', () => goToSection('address'));
    if (placeOrder) placeOrder.addEventListener('click', processOrder);
    
    // Eventos dos métodos de pagamento
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            const input = this.querySelector('input[type="radio"]');
            if (input) {
                input.checked = true;
                selectPaymentMethod(method);
            }
        });
    });
    
    // Eventos para radio buttons de pagamento
    const onlineRadio = document.getElementById('online');
    const onDeliveryRadio = document.getElementById('on-delivery');
    
    if (onlineRadio) onlineRadio.addEventListener('change', () => selectPaymentMethod('online'));
    if (onDeliveryRadio) onDeliveryRadio.addEventListener('change', () => selectPaymentMethod('on-delivery'));
    
    // Eventos para os submétodos de pagamento na entrega
    const onDeliveryCash = document.getElementById('on-delivery-cash');
    if (onDeliveryCash) {
        onDeliveryCash.addEventListener('change', function() {
            const changeForm = document.getElementById('change-form');
            if (changeForm) {
                changeForm.style.display = 'block';
            }
        });
    }
    
    // Outros submétodos que escondem o formulário de troco
    const otherOnDeliveryMethods = document.querySelectorAll('input[name="on-delivery-method"]');
    otherOnDeliveryMethods.forEach(input => {
        if (input.id !== 'on-delivery-cash') {
            input.addEventListener('change', function() {
                const changeForm = document.getElementById('change-form');
                if (changeForm) {
                    changeForm.style.display = 'none';
                }
            });
        }
    });
    
    // Botão para voltar à loja após confirmação
    const backToStore = document.getElementById('back-to-store');
    if (backToStore) backToStore.addEventListener('click', returnToStore);
    
    // Botão para salvar novo endereço
    const saveNewAddress = document.getElementById('save-new-address');
    if (saveNewAddress) saveNewAddress.addEventListener('click', saveNewAddress);
    
    console.log('Eventos inicializados com sucesso');
}

// Função para navegar entre as seções
function goToSection(section) {
    console.log('Navegando para seção:', section);
    
    // Esconder todas as seções
    const sections = document.querySelectorAll('.checkout-section');
    sections.forEach(s => {
        s.classList.remove('active');
    });

    // Mostrar a seção selecionada
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error('Seção não encontrada:', `${section}-section`);
        return;
    }

    // Atualizar os steps
    updateSteps(section);

    // Lógica adicional para cada seção
    if (section === 'address') {
        // Se o cliente estiver autenticado, carrega seus endereços
        if (isAuthenticatedClient()) {
            const clientData = getAuthenticatedClient();
            if (clientData && clientData.id && typeof loadClientAddresses === 'function') {
                loadClientAddresses(clientData.id);
            }

            // Mostrar botão para salvar endereço no formulário
            const saveNewAddressBtn = document.getElementById('save-new-address');
            if (saveNewAddressBtn) {
                saveNewAddressBtn.style.display = 'block';
            }
        } else {
            // Se não estiver autenticado, mostra apenas o formulário normal
            const addressListContainer = document.getElementById('address-list-container');
            const deliveryForm = document.getElementById('delivery-form');
            const saveNewAddressBtn = document.getElementById('save-new-address');
            
            if (addressListContainer) addressListContainer.style.display = 'none';
            if (deliveryForm) deliveryForm.style.display = 'block';
            if (saveNewAddressBtn) saveNewAddressBtn.style.display = 'none';
        }
    }

    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Função para voltar para a loja
function returnToStore() {
    if (orderData.partnerId) {
        window.location.href = `index.html?partnerId=${orderData.partnerId}`;
    } else {
        window.location.href = 'index.html';
    }
}