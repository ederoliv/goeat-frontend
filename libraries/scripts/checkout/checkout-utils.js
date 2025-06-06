// Funções utilitárias para o checkout

// Função para formatar preço
function formatPrice(price) {
    return (price / 100).toFixed(2).replace('.', ',');
}

// Função para mostrar loading
function showLoadingModal() {
    // Criar o elemento do modal
    const modalContainer = document.createElement('div');
    modalContainer.id = 'loading-modal';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--goeat-primary);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    // Criar o conteúdo do modal
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: rgba(0, 0, 0, 0);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
    `;

    // Adicionar a logo
    const logo = document.createElement('img');
    logo.src = `${root}${routes.assets}goeat-logo.svg`;
    logo.style.cssText = `
        height: 120px;
        margin-bottom: 15px;
        animation: spin 2s linear infinite;
    `;

    // Adicionar o texto de loading
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Carregando...';
    loadingText.style.cssText = `
        margin: 0;
        color: var(--goeat-primary);
        font-family: Arial, sans-serif;
    `;

    // Montar a estrutura do modal
    modalContent.appendChild(logo);
    modalContent.appendChild(loadingText);
    modalContainer.appendChild(modalContent);
    document.body.appendChild(modalContainer);

    // Adicionar a animação de rotação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Função para ocultar o modal de loading
function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    if (modal) {
        modal.remove();
    }
}

// Função para calcular o preço total do carrinho
function calculateCartTotalPrice(items) {
    let totalPrice = 0;
    
    for (let i = 0; i < items.length; i++) {
        totalPrice += items[i].price * items[i].quantity;
    }
    
    return totalPrice;
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

// Função para restaurar o estado do checkout
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