window.onload = function() {
    if (!isAuthenticatedClient()) {
        // Se o usuário não estiver autenticado, redireciona para a página de login
        window.location.href = "../../loginClient/index.html";
    }
}

// Função para fazer logout
function handleLogout(event) {
    event.preventDefault();
    
    // Chama a função de logout do clientSessionHandler.js
    logoutClient();
    
    // Redireciona para a página inicial de clientes
    window.location.href = `${root}${routes.client}`;
}

// Função para salvar alterações do perfil
function saveProfileChanges() {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const cpfInput = document.getElementById('cpf');
    const birthdateInput = document.getElementById('birthdate');
    
    // Em uma implementação real, aqui você enviaria os dados para a API
    // Por enquanto, vamos apenas mostrar uma mensagem de sucesso
    
    Swal.fire({
        icon: 'success',
        title: 'Alterações salvas com sucesso!',
        showConfirmButton: false,
        timer: 2000
    });
    
    // Atualiza os dados no cabeçalho do perfil
    const userName = document.getElementById('user-name');
    if (userName && nameInput) {
        userName.textContent = nameInput.value;
    }
    
    const userEmail = document.getElementById('user-email');
    if (userEmail && emailInput) {
        userEmail.textContent = emailInput.value;
    }
    
    const userPhone = document.getElementById('user-phone');
    if (userPhone && phoneInput) {
        userPhone.textContent = phoneInput.value;
    }
}

// Função para mostrar formulário de adicionar endereço
function showAddAddressForm() {
    Swal.fire({
        title: 'Adicionar Endereço',
        html: `
            <div class="form-group">
                <label for="address-name">Nome do endereço</label>
                <input id="address-name" class="swal2-input" placeholder="Ex: Casa, Trabalho">
            </div>
            <div class="form-group">
                <label for="address-cep">CEP</label>
                <input id="address-cep" class="swal2-input" placeholder="00000-000">
            </div>
            <div class="form-group">
                <label for="address-street">Rua</label>
                <input id="address-street" class="swal2-input">
            </div>
            <div class="form-group">
                <label for="address-number">Número</label>
                <input id="address-number" class="swal2-input">
            </div>
            <div class="form-group">
                <label for="address-complement">Complemento</label>
                <input id="address-complement" class="swal2-input" placeholder="Opcional">
            </div>
            <div class="form-group">
                <label for="address-neighborhood">Bairro</label>
                <input id="address-neighborhood" class="swal2-input">
            </div>
            <div class="form-group">
                <label for="address-city">Cidade</label>
                <input id="address-city" class="swal2-input">
            </div>
            <div class="form-group">
                <label for="address-state">Estado</label>
                <input id="address-state" class="swal2-input">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            // Em uma implementação real, aqui você enviaria os dados para a API
            // Por enquanto, vamos apenas mostrar uma mensagem de sucesso
            return true;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Endereço adicionado com sucesso!',
                showConfirmButton: false,
                timer: 2000
            });
            
            // Em uma implementação real, aqui você atualizaria a lista de endereços
            // Por enquanto, vamos apenas recarregar a página
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    });
}

// Função para editar endereço
function editAddress(addressCard) {
    const addressName = addressCard.querySelector('h4').textContent;
    const addressText = addressCard.querySelectorAll('p');
    
    Swal.fire({
        title: 'Editar Endereço',
        html: `
            <div class="form-group">
                <label for="address-name">Nome do endereço</label>
                <input id="address-name" class="swal2-input" value="${addressName}">
            </div>
            <div class="form-group">
                <label for="address-cep">CEP</label>
                <input id="address-cep" class="swal2-input" value="${addressText[2] ? addressText[2].textContent.split(': ')[1] : ''}">
            </div>
            <div class="form-group">
                <label for="address-street">Endereço completo</label>
                <input id="address-street" class="swal2-input" value="${addressText[0] ? addressText[0].textContent : ''}">
            </div>
            <div class="form-group">
                <label for="address-city-state">Cidade/Estado</label>
                <input id="address-city-state" class="swal2-input" value="${addressText[1] ? addressText[1].textContent : ''}">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            // Em uma implementação real, aqui você enviaria os dados para a API
            // Por enquanto, vamos apenas mostrar uma mensagem de sucesso
            return true;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Endereço atualizado com sucesso!',
                showConfirmButton: false,
                timer: 2000
            });
        }
    });
}

// Função para excluir endereço
function deleteAddress(addressCard) {
    Swal.fire({
        title: 'Tem certeza?',
        text: "Esta ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Em uma implementação real, aqui você enviaria a requisição para a API
            // Por enquanto, vamos apenas remover o elemento da página
            addressCard.remove();
            
            Swal.fire({
                icon: 'success',
                title: 'Excluído!',
                text: 'Seu endereço foi excluído com sucesso.',
                showConfirmButton: false,
                timer: 2000
            });
        }
    });
}

// Função para mostrar formulário de alterar senha
function showChangePasswordForm() {
    Swal.fire({
        title: 'Alterar Senha',
        html: `
            <div class="form-group">
                <label for="current-password">Senha atual</label>
                <input id="current-password" type="password" class="swal2-input">
            </div>
            <div class="form-group">
                <label for="new-password">Nova senha</label>
                <input id="new-password" type="password" class="swal2-input">
            </div>
            <div class="form-group">
                <label for="confirm-password">Confirme a nova senha</label>
                <input id="confirm-password" type="password" class="swal2-input">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                Swal.showValidationMessage('As senhas não coincidem!');
                return false;
            }
            
            // Em uma implementação real, aqui você enviaria os dados para a API
            // Por enquanto, vamos apenas retornar true
            return true;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Senha alterada com sucesso!',
                showConfirmButton: false,
                timer: 2000
            });
        }
    });
}

// Função para confirmar exclusão da conta
function confirmDeleteAccount() {
    Swal.fire({
        title: 'Tem certeza?',
        text: "Esta ação não pode ser desfeita! Todos os seus dados serão removidos permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir minha conta!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Em uma implementação real, aqui você enviaria a requisição para a API
            // Por enquanto, vamos apenas fazer logout e redirecionar
            handleLogout({ preventDefault: () => {} });
            
            Swal.fire({
                icon: 'success',
                title: 'Conta excluída!',
                text: 'Sua conta foi excluída com sucesso.',
                showConfirmButton: false,
                timer: 2000
            });
        }
    });
}

// Função para mostrar detalhes do pedido
function showOrderDetails(orderId) {
    // Em uma implementação real, aqui você buscaria os detalhes do pedido na API
    // Por enquanto, vamos mostrar dados mocados
    
    Swal.fire({
        title: `Detalhes do Pedido #${orderId}`,
        html: `
            <div class="order-details-container">
                <div class="order-details-header">
                    <p><strong>Data:</strong> 15/04/2025 - 19:30</p>
                    <p><strong>Status:</strong> <span class="order-status-text">Entregue</span></p>
                </div>
                
                <div class="order-details-restaurant">
                    <p><strong>Restaurante:</strong> Restaurante do Zé</p>
                    <p><strong>Endereço:</strong> Rua das Flores, 123 - Centro</p>
                </div>
                
                <div class="order-details-items">
                    <h4>Itens do pedido:</h4>
                    <table class="order-items-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Hambúrguer Artesanal</td>
                                <td>1</td>
                                <td>R$ 35,90</td>
                            </tr>
                            <tr>
                                <td>Batata Frita Grande</td>
                                <td>1</td>
                                <td>R$ 19,90</td>
                            </tr>
                            <tr>
                                <td>Refrigerante 2L</td>
                                <td>1</td>
                                <td>R$ 12,90</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="order-details-payment">
                    <p><strong>Subtotal:</strong> R$ 68,70</p>
                    <p><strong>Taxa de entrega:</strong> R$ 11,20</p>
                    <p><strong>Total:</strong> <span class="order-total-text">R$ 79,90</span></p>
                    <p><strong>Forma de pagamento:</strong> Cartão de crédito</p>
                </div>
                
                <div class="order-details-delivery">
                    <p><strong>Endereço de entrega:</strong></p>
                    <p>Rua das Flores, 123 - Apto 302</p>
                    <p>Jardim Primavera, Caxias do Sul - RS</p>
                    <p>CEP: 95010-000</p>
                </div>
            </div>
        `,
        width: '600px',
        showCloseButton: true,
        showConfirmButton: false
    });
}

// Função para carregar os dados do usuário
function loadUserData() {
    // Em uma implementação real, aqui você buscaria dados da API
    // Por enquanto, vamos utilizar os dados mocados do sessionStorage
    
    const clientData = getAuthenticatedClient();
    
    // Se houver dados do cliente no sessionStorage
    if (clientData && clientData.id) {
        // Atualiza o nome, email, etc. com os dados reais
        // Simulando que o objeto clientData tem outras propriedades além das que já existem
        
        // Nome do usuário no cabeçalho do perfil
        const userName = document.getElementById('user-name');
        if (userName) {
            userName.textContent = clientData.username || 'João da Silva';
        }
        
        // Email no cabeçalho do perfil
        const userEmail = document.getElementById('user-email');
        if (userEmail) {
            userEmail.textContent = clientData.email || 'joao.silva@email.com';
        }
        
        // Telefone no cabeçalho do perfil
        const userPhone = document.getElementById('user-phone');
        if (userPhone) {
            userPhone.textContent = clientData.phone || '(54) 99999-8888';
        }
        
        // Campos do formulário
        const nameInput = document.getElementById('name');
        if (nameInput) {
            nameInput.value = clientData.username || 'João da Silva';
        }
        
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = clientData.email || 'joao.silva@email.com';
        }
        
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.value = clientData.phone || '(54) 99999-8888';
        }
    }
}

// Função para configurar as tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todas as tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adiciona a classe active à tab clicada
            button.classList.add('active');
            
            // Mostra o conteúdo correspondente
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

// Função para configurar os eventos dos botões
function setupButtonEvents() {
    // Botão de sair (logout)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Botão de salvar alterações do perfil
    const saveButton = document.querySelector('.save-button');
    if (saveButton) {
        saveButton.addEventListener('click', saveProfileChanges);
    }
    
    // Botões da aba de endereços
    const addAddressButton = document.querySelector('.add-address-button');
    if (addAddressButton) {
        addAddressButton.addEventListener('click', showAddAddressForm);
    }
    
    const editAddressButtons = document.querySelectorAll('.address-edit-button');
    editAddressButtons.forEach(button => {
        button.addEventListener('click', function() {
            const addressCard = this.closest('.address-card');
            editAddress(addressCard);
        });
    });
    
    const deleteAddressButtons = document.querySelectorAll('.address-delete-button');
    deleteAddressButtons.forEach(button => {
        button.addEventListener('click', function() {
            const addressCard = this.closest('.address-card');
            deleteAddress(addressCard);
        });
    });
    
    // Botões da aba de configurações
    const changePasswordButton = document.querySelector('.change-password-button');
    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', showChangePasswordForm);
    }
    
    const deleteAccountButton = document.querySelector('.delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', confirmDeleteAccount);
    }
    
    // Botões da aba de histórico de pedidos
    const orderDetailsButtons = document.querySelectorAll('.order-details-button');
    orderDetailsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderCard = this.closest('.order-card');
            const orderId = orderCard.querySelector('h4').textContent.split('#')[1];
            showOrderDetails(orderId);
        });
    });
}