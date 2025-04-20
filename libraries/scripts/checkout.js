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

// Função para calcular o preço total do carrinho
function calculateCartTotalPrice(items) {
    let totalPrice = 0;
    
    for (let i = 0; i < items.length; i++) {
        totalPrice += items[i].price * items[i].quantity;
    }
    
    return totalPrice;
}

// Função para formatar o preço
function formatPrice(price) {
    return (price / 100).toFixed(2).replace('.', ',');
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
}

// Função para redirecionar para o login
function handleLoginOption() {
    // Salva o estado atual do checkout e os dados do carrinho no sessionStorage
    saveCheckoutState();
    
    // Redireciona para a página de login, incluindo um parâmetro para retornar ao checkout
    window.location.href = `../../loginClient/index.html?returnTo=checkout&partnerId=${orderData.partnerId}`;
}

// Função para salvar o estado do checkout
function saveCheckoutState() {
    const checkoutState = {
        partnerId: orderData.partnerId,
        // Salva também os items do carrinho no caso deles mudarem
        items: orderData.items,
        total: orderData.total,
        // Se houver dados parciais já preenchidos no formulário de convidado, também poderia salvá-los
        customer: orderData.customer
    };
    
    sessionStorage.setItem('checkoutState', JSON.stringify(checkoutState));
}

// Função para recuperar o estado do checkout
function restoreCheckoutState() {
    const checkoutStateStr = sessionStorage.getItem('checkoutState');
    
    if (checkoutStateStr) {
        try {
            const checkoutState = JSON.parse(checkoutStateStr);
            
            // Restaura os dados relevantes
            if (checkoutState.partnerId) {
                orderData.partnerId = checkoutState.partnerId;
            }
            
            if (checkoutState.items) {
                orderData.items = checkoutState.items;
            }
            
            if (checkoutState.total) {
                orderData.total = checkoutState.total;
            }
            
            if (checkoutState.customer) {
                orderData.customer = checkoutState.customer;
            }
            
            // Limpa o estado salvo após restaurá-lo
            sessionStorage.removeItem('checkoutState');
            
            return true;
        } catch (error) {
            console.error('Erro ao restaurar estado do checkout:', error);
            return false;
        }
    }
    
    return false;
}

function showGuestForm() {
    document.getElementById('guest-form').style.display = 'block';
}

// Função para esconder todos os formulários
function hideAllForms() {
    document.getElementById('guest-form').style.display = 'none';
}

// Função para processar informações de compra como convidado
function processGuestInfo() {
    const name = document.getElementById('guest-name').value;
    const email = document.getElementById('guest-email').value;
    const phone = document.getElementById('guest-phone').value;
    
    // Validação básica
    if (!name || !email || !phone) {
        Swal.fire({
            title: 'Dados incompletos',
            text: 'Por favor, preencha todos os campos!',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
        return;
    }
    
    // Preencher dados do cliente
    orderData.customer = {
        name,
        email,
        phone
    };
    
    // Ir para a próxima etapa
    goToSection('address');
}

// Função para atualizar opção de entrega/retirada
function updateDeliveryOption(option) {
    if (option === 'delivery') {
        document.getElementById('delivery-form').style.display = 'block';
        document.getElementById('pickup-info').style.display = 'none';
        document.getElementById('option-delivery').classList.add('selected');
        document.getElementById('option-pickup').classList.remove('selected');
        orderData.deliveryType = 'delivery';
    } else {
        document.getElementById('delivery-form').style.display = 'none';
        document.getElementById('pickup-info').style.display = 'block';
        document.getElementById('option-pickup').classList.add('selected');
        document.getElementById('option-delivery').classList.remove('selected');
        orderData.deliveryType = 'pickup';
    }
}

// Função para buscar endereço pelo CEP
function searchCepAddress() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        Swal.fire({
            title: 'CEP inválido',
            text: 'Por favor, informe um CEP válido com 8 dígitos',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
        return;
    }
    
    // Mostrar loading
    showLoadingModal();
    
    // Fazer requisição para o ViaCEP
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        
        if (data.erro) {
            Swal.fire({
                title: 'CEP não encontrado',
                text: 'Verifique o CEP e tente novamente',
                icon: 'error',
                confirmButtonColor: '#06CF90'
            });
            return;
        }
        
        // Preencher os campos do formulário
        document.getElementById('street').value = data.logradouro;
        document.getElementById('neighborhood').value = data.bairro;
        document.getElementById('city').value = data.localidade;
        document.getElementById('state').value = data.uf;
        
        // Focar no campo número
        document.getElementById('number').focus();
    })
    .catch(error => {
        hideLoadingModal();
        Swal.fire({
            title: 'Erro ao buscar CEP',
            text: 'Tente novamente ou preencha os dados manualmente',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
    });
}

// Função para validar o endereço e continuar para pagamento
function validateAddressAndContinue() {

      // Se for retirada no local, não precisa validar endereço
      if (orderData.deliveryType === 'pickup') {
        goToSection('payment');
        return;
    }

    if(isAuthenticatedClient()) {
        //carregar endereços cadastrados do cliente logado
        
    }

  
    
    const street = document.getElementById('street').value;
    const number = document.getElementById('number').value;
    const neighborhood = document.getElementById('neighborhood').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const cep = document.getElementById('cep').value;
    
    // Validação básica
    if (!street || !number || !neighborhood || !city || !state || !cep) {
        Swal.fire({
            title: 'Dados incompletos',
            text: 'Por favor, preencha todos os campos obrigatórios do endereço!',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
        return;
    }
    
    // Preencher dados do endereço
    orderData.address = {
        street,
        number,
        complement: document.getElementById('complement').value,
        neighborhood,
        city,
        state,
        cep,
        reference: document.getElementById('reference').value
    };
    
    // Ir para a próxima etapa
    goToSection('payment');
}

// Função para selecionar método de pagamento
function selectPaymentMethod(method) {
    // Atualizar interface
    const options = document.querySelectorAll('.payment-option');
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`.payment-option[data-method="${method}"]`).classList.add('selected');
    
    // Se for pagamento online, mostrar aviso
    if (method === 'online') {
        Swal.fire({
            title: 'Pagamento online',
            text: 'O pagamento online ainda não está implementado. Por favor, use a opção "Pagar na entrega/retirada".',
            icon: 'info',
            confirmButtonColor: '#06CF90'
        }).then(() => {
            // Voltar para opção "Pagar na entrega/retirada"
            document.getElementById('on-delivery').checked = true;
            document.querySelector('.payment-option[data-method="on-delivery"]').classList.add('selected');
            document.querySelector('.payment-option[data-method="online"]').classList.remove('selected');
            method = 'on-delivery';
        });
    }
    
    // Atualizar método no orderData
    orderData.payment.method = method;
}

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
    
    // Simular envio para a API (aqui seria a requisição real)
    setTimeout(() => {
        hideLoadingModal();
        
        // Gerar um ID de pedido simulado
        const orderId = Math.floor(100000 + Math.random() * 900000);
        
        // Limpar carrinho
        sessionStorage.removeItem('cart');
        
        // Mostrar confirmação
        orderSuccess(orderId);
    }, 1500);
}

// Função para mostrar sucesso no pedido
function orderSuccess(orderId) {
    // Preencher número do pedido
    document.getElementById('order-number').textContent = orderId;
    
    // Ir para a etapa de confirmação
    goToSection('confirmation');
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
    
    // Scroll para o topo
    window.scrollTo(0, 0);
}

// Função para atualizar os passos visuais
function updateSteps(currentStep) {
    const steps = ['login', 'address', 'payment', 'confirmation'];
    const stepIndex = steps.indexOf(currentStep);
    
    steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${step}`);
        
        // Remover todas as classes
        stepElement.classList.remove('active', 'completed');
        
        // Adicionar classes apropriadas
        if (index === stepIndex) {
            stepElement.classList.add('active');
        } else if (index < stepIndex) {
            stepElement.classList.add('completed');
        }
    });
}

// Função para voltar para a loja
function returnToStore() {
    window.location.href = `index.html?partnerId=${orderData.partnerId}`;
}