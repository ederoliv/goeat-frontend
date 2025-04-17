function registerClient() {
    // Captura os valores dos campos
    const nameInput = document.getElementById('name');
    const cpfInput = document.getElementById('cpf');
    const phoneInput = document.getElementById('number');
    const birthInput = document.getElementById('birth');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Validação básica
    if (!nameInput.value || !cpfInput.value || !phoneInput.value || !birthInput.value || 
        !emailInput.value || !passwordInput.value || !confirmPasswordInput.value) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    // Verifica se as senhas conferem
    if (passwordInput.value !== confirmPasswordInput.value) {
        alert('As senhas não coincidem!');
        return;
    }
    
    // Formata a data para o formato ISO (YYYY-MM-DD) que o backend espera
    const birthDate = birthInput.value; // Já vem no formato correto do input date
    
    // Prepara o objeto de registro conforme esperado pela API
    const registrationData = {
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        cpf: cpfInput.value,
        phone: phoneInput.value,
        birthDate: birthDate
    };
    
    // Debuggando para entender o que está sendo enviado
    console.log('Enviando dados:', registrationData);

    // Faz a requisição para a API - 
    fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
    })
    .then(response => {
        console.log('Status da resposta:', response.status);
        console.log('Headers da resposta:', [...response.headers.entries()]);
        
        // Verifica primeiro se há conteúdo na resposta
        if (response.status === 204) {
            // No content - foi bem sucedido mas não retornou dados
            return { success: true, message: 'Cadastro realizado com sucesso!' };
        }
        
        // Tenta extrair o texto da resposta para debug
        return response.text().then(text => {
            console.log('Texto da resposta:', text);
            
            // Se for uma string vazia ou não for um JSON válido
            if (!text || text.trim() === '') {
                if (response.ok) {
                    return { success: true, message: 'Cadastro realizado com sucesso!' };
                } else {
                    throw new Error(`Erro do servidor: ${response.status}`);
                }
            }
            
            // Tenta converter para JSON
            try {
                const data = JSON.parse(text);
                
                // Se não for OK, lança um erro com a mensagem do servidor
                if (!response.ok) {
                    throw new Error(data.message || 'Falha no cadastro');
                }
                
                return data;
            } catch (e) {
                console.error('Erro ao analisar JSON:', e);
                
                if (response.ok) {
                    return { success: true, message: 'Cadastro realizado com sucesso!' };
                } else {
                    throw new Error(`Resposta inválida do servidor: ${text.substring(0, 100)}`);
                }
            }
        });
    })
    .then(data => {
        // Cadastro bem-sucedido
        console.log('Cadastro realizado com sucesso:', data);
        
        // Mostra um modal bonito com SweetAlert2
        Swal.fire({
            icon: 'success',
            title: 'Cadastro realizado com sucesso!',
            text: 'Você já pode fazer login com suas credenciais.',
            confirmButtonColor: '#06CF90',
            confirmButtonText: 'Ir para o login'
        }).then((result) => {
            if (result.isConfirmed) {
                // Redireciona para a página de login quando clicarem no botão de confirmação
                window.location.href = '../loginClient/index.html';
            } else {
                // Redireciona mesmo se fecharem o modal
                window.location.href = '../loginClient/index.html';
            }
        });
    })
    .catch(error => {
        console.error('Erro no cadastro:', error);
        
        // Exibe modal de erro com SweetAlert2
        Swal.fire({
            icon: 'error',
            title: 'Erro no cadastro',
            text: error.message || 'Ocorreu um erro ao tentar realizar o cadastro. Tente novamente mais tarde.',
            confirmButtonColor: '#FF5555'
        });
    });
}

// Adiciona máscara de formatação para o CPF
function mascaraCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove caracteres não numéricos
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2'); // Coloca ponto após o terceiro dígito
    cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2'); // Coloca ponto após o terceiro dígito novamente (para o segundo bloco)
    cpf = cpf.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Coloca hífen antes dos dois últimos dígitos
    return cpf;
}

// Adiciona máscara de formatação para o telefone
function mascaraTelefone(telefone) {
    telefone = telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
    telefone = telefone.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
    telefone = telefone.replace(/(\d)(\d{4})$/, '$1-$2'); // Coloca hífen antes dos 4 últimos dígitos
    return telefone;
}

// Configura os eventos quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Adiciona o evento para o botão de cadastro
    const registerButton = document.querySelector('.btn');
    if (registerButton) {
        registerButton.addEventListener('click', registerClient);
    }
    
    // Aplica máscara ao CPF enquanto o usuário digita
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function() {
            this.value = mascaraCPF(this.value);
        });
    }
    
    // Aplica máscara ao telefone enquanto o usuário digita
    const phoneInput = document.getElementById('number');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = mascaraTelefone(this.value);
        });
    }
});