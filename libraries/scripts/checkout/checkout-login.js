// Funções relacionadas à etapa de login/identificação do cliente

// Função para redirecionar para o login
function handleLoginOption() {
    console.log('Redirecionando para login...');
    
    // Salva o estado atual do checkout e os dados do carrinho no sessionStorage
    saveCheckoutState();
    
    // Redireciona para a página de login, incluindo um parâmetro para retornar ao checkout
    window.location.href = `../../loginClient/index.html?returnTo=checkout&partnerId=${orderData.partnerId}`;
}

// Função para mostrar o formulário de compra como convidado
function showGuestForm() {
    console.log('Mostrando formulário de convidado');
    
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.style.display = 'block';
    } else {
        console.error('Formulário de convidado não encontrado');
    }
}

// Função para esconder todos os formulários
function hideAllForms() {
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.style.display = 'none';
    }
}

// Função para processar informações de compra como convidado
function processGuestInfo() {
    console.log('Processando informações de convidado...');
    
    const nameInput = document.getElementById('guest-name');
    const emailInput = document.getElementById('guest-email');
    const phoneInput = document.getElementById('guest-phone');
    
    if (!nameInput || !emailInput || !phoneInput) {
        console.error('Elementos do formulário de convidado não encontrados');
        Swal.fire({
            title: 'Erro',
            text: 'Erro no formulário. Recarregue a página e tente novamente.',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
        return;
    }
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

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

    // Validação de email básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Swal.fire({
            title: 'Email inválido',
            text: 'Por favor, informe um email válido!',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
        return;
    }

    // Validação de telefone básica (aceita vários formatos)
    const phoneRegex = /^[\d\s\(\)\-\+]{10,}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        Swal.fire({
            title: 'Telefone inválido',
            text: 'Por favor, informe um telefone válido!',
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

    console.log('Dados do cliente salvos:', orderData.customer);

    // Ir para a próxima etapa
    goToSection('address');
}

// Função para selecionar método de pagamento (movida do checkout-core.js para evitar conflitos)
function selectPaymentMethod(method) {
    console.log('Selecionando método de pagamento:', method);
    
    // Atualizar interface - remover seleção de todas as opções
    const options = document.querySelectorAll('.payment-option');
    options.forEach(option => {
        option.classList.remove('selected');
    });

    // Adicionar seleção à opção escolhida
    const selectedOption = document.querySelector(`.payment-option[data-method="${method}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

    // Se for pagamento online, mostrar aviso
    if (method === 'online') {
        Swal.fire({
            title: 'Pagamento online',
            text: 'O pagamento online ainda não está implementado. Por favor, use a opção "Pagar na entrega/retirada".',
            icon: 'info',
            confirmButtonColor: '#06CF90'
        }).then(() => {
            // Voltar para opção "Pagar na entrega/retirada"
            const onDeliveryRadio = document.getElementById('on-delivery');
            const onDeliveryOption = document.querySelector('.payment-option[data-method="on-delivery"]');
            const onlineOption = document.querySelector('.payment-option[data-method="online"]');
            
            if (onDeliveryRadio) {
                onDeliveryRadio.checked = true;
            }
            if (onDeliveryOption) {
                onDeliveryOption.classList.add('selected');
            }
            if (onlineOption) {
                onlineOption.classList.remove('selected');
            }
            
            // Atualizar o orderData
            orderData.payment.method = 'on-delivery';
        });
        return;
    }

    // Atualizar método no orderData
    orderData.payment.method = method;
    
    console.log('Método de pagamento atualizado no orderData:', orderData.payment);
}

// Função auxiliar para validar CPF (opcional)
function isValidCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Função para formatar telefone automaticamente
function formatPhone(phoneInput) {
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        
        if (value.length <= 10) {
            // Formato: (XX) XXXX-XXXX
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
        } else {
            // Formato: (XX) XXXXX-XXXX
            value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
        }
        
        e.target.value = value;
    });
}

// Inicializar formatação de telefone quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('guest-phone');
    if (phoneInput) {
        formatPhone(phoneInput);
    }
});