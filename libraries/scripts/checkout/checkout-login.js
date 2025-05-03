// Funções relacionadas à etapa de login/identificação do cliente

// Função para redirecionar para o login
function handleLoginOption() {
    // Salva o estado atual do checkout e os dados do carrinho no sessionStorage
    saveCheckoutState();
    
    // Redireciona para a página de login, incluindo um parâmetro para retornar ao checkout
    window.location.href = `../../loginClient/index.html?returnTo=checkout&partnerId=${orderData.partnerId}`;
}

// Função para mostrar o formulário de compra como convidado
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