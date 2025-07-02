// Funções utilitárias para o checkout

// Função para formatar preço - MELHORADA
function formatPrice(price) {
    // Verifica se o preço é um número válido
    if (isNaN(price) || price === null || price === undefined) {
        return '0,00';
    }
    
    // Converte para número se for string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Se o preço já estiver em centavos, divide por 100
    // Se estiver em reais, mantém como está
    const priceInReais = numPrice > 1000 ? numPrice / 100 : numPrice;
    
    return priceInReais.toFixed(2).replace('.', ',');
}

// Função para mostrar loading - MELHORADA
function showLoadingModal() {
    // Remove modal existente se houver
    hideLoadingModal();
    
    // Criar o elemento do modal
    const modalContainer = document.createElement('div');
    modalContainer.id = 'loading-modal';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    // Criar o conteúdo do modal
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: rgba(255, 255, 255, 0.95);
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        min-width: 200px;
    `;

    // Adicionar a logo
    const logo = document.createElement('img');
   
    logo.src = '../../../libraries/assets/goeat-pg-logo.svg';
    logo.style.cssText = `
        height: 80px;
        margin-bottom: 20px;
        animation: pulse 1.5s ease-in-out infinite;
    `;
    
    // Se a imagem não carregar, usar um fallback
    logo.onerror = function() {
        this.style.display = 'none';
    };

    // Adicionar o texto de loading
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Carregando...';
    loadingText.style.cssText = `
        margin: 0;
        color: var(--goeat-primary, #623CA7);
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: 500;
    `;

    // Adicionar spinner se a logo não carregar
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--goeat-primary, #623CA7);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px auto;
        display: none;
    `;

    // Montar a estrutura do modal
    modalContent.appendChild(logo);
    modalContent.appendChild(spinner);
    modalContent.appendChild(loadingText);
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    // Adicionar as animações CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { 
                transform: scale(1);
                opacity: 1;
            }
            50% { 
                transform: scale(1.1);
                opacity: 0.7;
            }
            100% { 
                transform: scale(1);
                opacity: 1;
            }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    if (!document.head.querySelector('#loading-animations')) {
        style.id = 'loading-animations';
        document.head.appendChild(style);
    }

    // Mostrar spinner se a logo não carregar em 1 segundo
    setTimeout(() => {
        if (logo.complete && logo.naturalHeight === 0) {
            logo.style.display = 'none';
            spinner.style.display = 'block';
        }
    }, 1000);
}

// Função para ocultar o modal de loading
function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    if (modal) {
        modal.remove();
    }
}

// Função para calcular o preço total do carrinho - MELHORADA
function calculateCartTotalPrice(items) {
    if (!items || !Array.isArray(items)) {
        console.warn('Items inválidos para cálculo do total:', items);
        return 0;
    }
    
    let totalPrice = 0;
    
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && typeof item.price === 'number' && typeof item.quantity === 'number') {
            totalPrice += item.price * item.quantity;
        } else {
            console.warn('Item inválido encontrado:', item);
        }
    }
    
    return totalPrice;
}

// Função para atualizar os passos visuais - MELHORADA
function updateSteps(currentStep) {
    const steps = ['login', 'address', 'payment', 'confirmation'];
    const stepIndex = steps.indexOf(currentStep);
    
    if (stepIndex === -1) {
        console.warn('Passo inválido:', currentStep);
        return;
    }

    steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${step}`);
        
        if (stepElement) {
            // Remover todas as classes
            stepElement.classList.remove('active', 'completed');

            // Adicionar classes apropriadas
            if (index === stepIndex) {
                stepElement.classList.add('active');
            } else if (index < stepIndex) {
                stepElement.classList.add('completed');
            }
        } else {
            console.warn(`Elemento do passo não encontrado: step-${step}`);
        }
    });
}

// Função para salvar o estado do checkout - MELHORADA
function saveCheckoutState() {
    try {
        const checkoutState = {
            partnerId: orderData.partnerId,
            items: orderData.items || [],
            total: orderData.total || 0,
            customer: orderData.customer || {},
            deliveryType: orderData.deliveryType || 'delivery',
            payment: orderData.payment || { method: 'on-delivery', submethod: 'card', details: {} },
            timestamp: new Date().getTime() // Para controle de expiração
        };
        
        sessionStorage.setItem('checkoutState', JSON.stringify(checkoutState));
        console.log('Estado do checkout salvo:', checkoutState);
    } catch (error) {
        console.error('Erro ao salvar estado do checkout:', error);
    }
}

// Função para restaurar o estado do checkout - MELHORADA
function restoreCheckoutState() {
    try {
        const checkoutStateStr = sessionStorage.getItem('checkoutState');
        
        if (!checkoutStateStr) {
            return false;
        }
        
        const checkoutState = JSON.parse(checkoutStateStr);
        
        // Verificar se o estado não expirou (1 hora)
        const oneHour = 60 * 60 * 1000;
        const now = new Date().getTime();
        
        if (checkoutState.timestamp && (now - checkoutState.timestamp) > oneHour) {
            console.log('Estado do checkout expirado, removendo...');
            sessionStorage.removeItem('checkoutState');
            return false;
        }
        
        // Restaurar os dados relevantes
        if (checkoutState.partnerId) {
            orderData.partnerId = checkoutState.partnerId;
        }
        
        if (checkoutState.items && Array.isArray(checkoutState.items)) {
            orderData.items = checkoutState.items;
        }
        
        if (typeof checkoutState.total === 'number') {
            orderData.total = checkoutState.total;
        }
        
        if (checkoutState.customer && typeof checkoutState.customer === 'object') {
            orderData.customer = checkoutState.customer;
        }
        
        if (checkoutState.deliveryType) {
            orderData.deliveryType = checkoutState.deliveryType;
        }
        
        if (checkoutState.payment && typeof checkoutState.payment === 'object') {
            orderData.payment = checkoutState.payment;
        }
        
        // Limpa o estado salvo após restaurá-lo
        sessionStorage.removeItem('checkoutState');
        
        console.log('Estado do checkout restaurado:', orderData);
        return true;
        
    } catch (error) {
        console.error('Erro ao restaurar estado do checkout:', error);
        // Remove estado corrompido
        sessionStorage.removeItem('checkoutState');
        return false;
    }
}

// Função para validar dados do pedido antes do envio
function validateOrderData() {
    const errors = [];
    
    // Validar partnerId
    if (!orderData.partnerId) {
        errors.push('ID do restaurante não informado');
    }
    
    // Validar itens
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        errors.push('Nenhum item no carrinho');
    }
    
    // Validar cliente
    if (!orderData.customer || !orderData.customer.name || !orderData.customer.email) {
        errors.push('Dados do cliente incompletos');
    }
    
    // Validar endereço para entrega
    if (orderData.deliveryType === 'delivery' && (!orderData.address || !orderData.address.street)) {
        errors.push('Endereço de entrega não informado');
    }
    
    // Validar método de pagamento
    if (!orderData.payment || !orderData.payment.method) {
        errors.push('Método de pagamento não selecionado');
    }
    
    return errors;
}

// Função para formatar endereço completo
function formatFullAddress(address) {
    if (!address) return '';
    
    let fullAddress = `${address.street}, ${address.number}`;
    
    if (address.complement) {
        fullAddress += `, ${address.complement}`;
    }
    
    fullAddress += `, ${address.neighborhood}, ${address.city} - ${address.state}`;
    
    if (address.zipCode) {
        fullAddress += `, CEP: ${address.zipCode}`;
    }
    
    if (address.reference) {
        fullAddress += `. Referência: ${address.reference}`;
    }
    
    return fullAddress;
}

// Função para debounce (útil para pesquisas)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Função para validar telefone brasileiro
function isValidBrazilianPhone(phone) {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem entre 10 e 11 dígitos (telefone brasileiro)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

// Função para formatar CEP
function formatCEP(cep) {
    if (!cep) return '';
    
    // Remove tudo que não é número
    const cleanCEP = cep.replace(/\D/g, '');
    
    // Aplica a máscara XXXXX-XXX
    return cleanCEP.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

// Função para mostrar toast de sucesso
function showSuccessToast(message) {
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: 'success',
            title: message
        });
    } else {
        console.log('✅', message);
    }
}

// Função para mostrar toast de erro
function showErrorToast(message) {
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
        
        Toast.fire({
            icon: 'error',
            title: message
        });
    } else {
        console.error('❌', message);
    }
}

// Função para log de debug (só funciona em desenvolvimento)
function debugLog(message, data) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`[CHECKOUT DEBUG] ${message}`, data || '');
    }
}

// Função para reportar erro
function reportError(error, context = '') {
    console.error(`[CHECKOUT ERROR] ${context}:`, error);
    
    // Em produção, poderia enviar para um serviço de monitoramento
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Exemplo: Sentry, LogRocket, etc.
        // Sentry.captureException(error, { extra: { context } });
    }
}