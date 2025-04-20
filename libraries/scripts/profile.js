// Variáveis globais
let clientAddresses = [];

// Função para carregar os endereços do cliente
async function loadClientAddresses() {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.id || !clientData.token) {
            console.error('Cliente não autenticado ou dados inválidos');
            return;
        }

        showLoadingModal();
        
        const response = await fetch(`${API_BASE_URL}/addresses/clients/${clientData.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar endereços');
        }
        
        clientAddresses = await response.json();
        displayClientAddresses(clientAddresses);
    } catch (error) {
        console.error('Erro ao carregar endereços:', error);
        
        // Mostrar mensagem de erro na interface
        const addressesList = document.querySelector('.addresses-list');
        if (addressesList) {
            addressesList.innerHTML = `
                <div class="error-message">
                    <i class="fa fa-exclamation-circle"></i>
                    <p>Não foi possível carregar seus endereços. Tente novamente mais tarde.</p>
                </div>
            `;
        }
    } finally {
        hideLoadingModal();
    }
}

// Função para exibir os endereços na interface
function displayClientAddresses(addresses) {
    const addressesList = document.querySelector('.addresses-list');
    if (!addressesList) return;
    
    // Limpa a lista atual
    addressesList.innerHTML = '';
    
    if (addresses.length === 0) {
        // Mensagem quando não há endereços
        addressesList.innerHTML = `
            <div class="empty-addresses">
                <i class="fa fa-map-marker"></i>
                <p>Você ainda não possui endereços cadastrados.</p>
            </div>
        `;
    } else {
        // Adiciona cada endereço à lista
        addresses.forEach(address => {
            const addressCard = document.createElement('div');
            addressCard.className = 'address-card';
            addressCard.dataset.addressId = address.id;
            
            addressCard.innerHTML = `
                <div class="address-content">
                    <h4>${address.street}, ${address.number}</h4>
                    <p>${address.neighborhood}, ${address.city} - ${address.state}</p>
                    <p>CEP: ${address.zipCode}</p>
                    ${address.complement ? `<p>Complemento: ${address.complement}</p>` : ''}
                    ${address.reference ? `<p>Referência: ${address.reference}</p>` : ''}
                </div>
                <div class="address-actions">
                    <button class="address-edit-button" onclick="editAddress('${address.id}')">
                        <i class="fa fa-pencil"></i>
                    </button>
                    <button class="address-delete-button" onclick="deleteAddress('${address.id}')">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            `;
            
            addressesList.appendChild(addressCard);
        });
    }
}

// Função para mostrar o formulário de adição de endereço
function showAddAddressForm() {
    Swal.fire({
        title: 'Adicionar Endereço',
        html: `
            <div class="form-group">
                <label for="address-cep">CEP</label>
                <input id="address-cep" class="swal2-input" placeholder="00000-000">
                <button id="search-cep-btn" class="swal2-confirm swal2-styled" type="button" style="margin-top: 5px; background-color: #53BDEB; display: block;">Buscar CEP</button>
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
            <div class="form-group">
                <label for="address-reference">Ponto de referência</label>
                <input id="address-reference" class="swal2-input" placeholder="Opcional">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            // Configurar evento para o botão de busca CEP
            document.getElementById('search-cep-btn').addEventListener('click', searchCepForAddress);
        },
        preConfirm: () => {
            // Validação dos campos
            const street = document.getElementById('address-street').value;
            const number = document.getElementById('address-number').value;
            const neighborhood = document.getElementById('address-neighborhood').value;
            const city = document.getElementById('address-city').value;
            const state = document.getElementById('address-state').value;
            const zipCode = document.getElementById('address-cep').value;
            
            if (!street || !number || !neighborhood || !city || !state || !zipCode) {
                Swal.showValidationMessage('Por favor, preencha todos os campos obrigatórios!');
                return false;
            }
            
            return {
                street,
                number,
                complement: document.getElementById('address-complement').value,
                neighborhood,
                city,
                state,
                zipCode,
                reference: document.getElementById('address-reference').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            saveNewAddress(result.value);
        }
    });
}

// Função para buscar endereço pelo CEP no formulário do SweetAlert
function searchCepForAddress() {
    const cepInput = document.getElementById('address-cep');
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        Swal.showValidationMessage('Por favor, informe um CEP válido com 8 dígitos');
        return;
    }
    
    // Mostrar indicador de carregamento
    const searchButton = document.getElementById('search-cep-btn');
    const originalText = searchButton.textContent;
    searchButton.textContent = 'Buscando...';
    searchButton.disabled = true;
    
    // Fazer requisição para o ViaCEP
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
        // Restaurar botão
        searchButton.textContent = originalText;
        searchButton.disabled = false;
        
        if (data.erro) {
            Swal.showValidationMessage('CEP não encontrado. Verifique e tente novamente');
            return;
        }
        
        // Preencher os campos do formulário
        document.getElementById('address-street').value = data.logradouro;
        document.getElementById('address-neighborhood').value = data.bairro;
        document.getElementById('address-city').value = data.localidade;
        document.getElementById('address-state').value = data.uf;
        
        // Focar no campo número
        document.getElementById('address-number').focus();
    })
    .catch(error => {
        console.error('Erro ao buscar CEP:', error);
        searchButton.textContent = originalText;
        searchButton.disabled = false;
        Swal.showValidationMessage('Erro ao buscar CEP. Tente novamente ou preencha manualmente');
    });
}

// Função para salvar um novo endereço
async function saveNewAddress(addressData) {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.id || !clientData.token) {
            throw new Error('Cliente não autenticado');
        }
        
        showLoadingModal();
        
        // Prepara o objeto para a API
        const apiData = {
            ...addressData,
            clientId: clientData.id,
            partnerId: null
        };
        
        const response = await fetch(`${API_BASE_URL}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            },
            body: JSON.stringify(apiData)
        });
        
        if (!response.ok) {
            throw new Error('Falha ao salvar endereço');
        }
        
        const savedAddress = await response.json();
        
        // Atualiza a lista de endereços
        await loadClientAddresses();
        
        Swal.fire({
            icon: 'success',
            title: 'Endereço adicionado!',
            text: 'Seu endereço foi salvo com sucesso.',
            confirmButtonColor: '#06CF90'
        });
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao salvar endereço',
            text: 'Ocorreu um erro ao tentar salvar seu endereço. Tente novamente mais tarde.',
            confirmButtonColor: '#06CF90'
        });
    } finally {
        hideLoadingModal();
    }
}

// Função para editar um endereço existente
async function editAddress(addressId) {
    // Encontrar o endereço nos dados carregados
    const address = clientAddresses.find(addr => addr.id === addressId);
    if (!address) {
        console.error('Endereço não encontrado:', addressId);
        return;
    }
    
    Swal.fire({
        title: 'Editar Endereço',
        html: `
            <div class="form-group">
                <label for="address-cep">CEP</label>
                <input id="address-cep" class="swal2-input" value="${address.zipCode}" placeholder="00000-000">
                <button id="search-cep-btn" class="swal2-confirm swal2-styled" type="button" style="margin-top: 5px; background-color: #53BDEB; display: block;">Buscar CEP</button>
            </div>
            <div class="form-group">
                <label for="address-street">Rua</label>
                <input id="address-street" class="swal2-input" value="${address.street}">
            </div>
            <div class="form-group">
                <label for="address-number">Número</label>
                <input id="address-number" class="swal2-input" value="${address.number}">
            </div>
            <div class="form-group">
                <label for="address-complement">Complemento</label>
                <input id="address-complement" class="swal2-input" value="${address.complement || ''}" placeholder="Opcional">
            </div>
            <div class="form-group">
                <label for="address-neighborhood">Bairro</label>
                <input id="address-neighborhood" class="swal2-input" value="${address.neighborhood}">
            </div>
            <div class="form-group">
                <label for="address-city">Cidade</label>
                <input id="address-city" class="swal2-input" value="${address.city}">
            </div>
            <div class="form-group">
                <label for="address-state">Estado</label>
                <input id="address-state" class="swal2-input" value="${address.state}">
            </div>
            <div class="form-group">
                <label for="address-reference">Ponto de referência</label>
                <input id="address-reference" class="swal2-input" value="${address.reference || ''}" placeholder="Opcional">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            // Configurar evento para o botão de busca CEP
            document.getElementById('search-cep-btn').addEventListener('click', searchCepForAddress);
        },
        preConfirm: () => {
            // Validação dos campos
            const street = document.getElementById('address-street').value;
            const number = document.getElementById('address-number').value;
            const neighborhood = document.getElementById('address-neighborhood').value;
            const city = document.getElementById('address-city').value;
            const state = document.getElementById('address-state').value;
            const zipCode = document.getElementById('address-cep').value;
            
            if (!street || !number || !neighborhood || !city || !state || !zipCode) {
                Swal.showValidationMessage('Por favor, preencha todos os campos obrigatórios!');
                return false;
            }
            
            return {
                id: address.id, // Mantém o mesmo ID
                street,
                number,
                complement: document.getElementById('address-complement').value,
                neighborhood,
                city,
                state,
                zipCode,
                reference: document.getElementById('address-reference').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            updateAddress(addressId, result.value);
        }
    });
}

// Função para atualizar um endereço existente
async function updateAddress(addressId, addressData) {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.id || !clientData.token) {
            throw new Error('Cliente não autenticado');
        }
        
        showLoadingModal();
        
        // Prepara o objeto para a API
        const apiData = {
            ...addressData,
            clientId: clientData.id,
            partnerId: null
        };
        
        const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            },
            body: JSON.stringify(apiData)
        });
        
        if (!response.ok) {
            throw new Error('Falha ao atualizar endereço');
        }
        
        // Atualiza a lista de endereços
        await loadClientAddresses();
        
        Swal.fire({
            icon: 'success',
            title: 'Endereço atualizado!',
            text: 'Seu endereço foi atualizado com sucesso.',
            confirmButtonColor: '#06CF90'
        });
    } catch (error) {
        console.error('Erro ao atualizar endereço:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao atualizar endereço',
            text: 'Ocorreu um erro ao tentar atualizar seu endereço. Tente novamente mais tarde.',
            confirmButtonColor: '#06CF90'
        });
    } finally {
        hideLoadingModal();
    }
}

// Função para excluir um endereço
async function deleteAddress(addressId) {
    // Confirmação de exclusão
    const confirmResult = await Swal.fire({
        title: 'Tem certeza?',
        text: "Esta ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });
    
    if (!confirmResult.isConfirmed) return;
    
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.id || !clientData.token) {
            throw new Error('Cliente não autenticado');
        }
        
        showLoadingModal();
        
        const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao excluir endereço');
        }
        
        // Atualiza a lista de endereços
        await loadClientAddresses();
        
        Swal.fire({
            icon: 'success',
            title: 'Endereço excluído!',
            text: 'Seu endereço foi excluído com sucesso.',
            confirmButtonColor: '#06CF90'
        });
    } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao excluir endereço',
            text: 'Ocorreu um erro ao tentar excluir seu endereço. Tente novamente mais tarde.',
            confirmButtonColor: '#06CF90'
        });
    } finally {
        hideLoadingModal();
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
    // Botão de adicionar endereço
    const addAddressButton = document.querySelector('.add-address-button');
    if (addAddressButton) {
        addAddressButton.addEventListener('click', showAddAddressForm);
    }
    
    // Botão de logout (sair)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
    
    // Botão de salvar alterações do perfil
    const saveButton = document.querySelector('.save-button');
    if (saveButton) {
        saveButton.addEventListener('click', saveProfileChanges);
    }
    
    // Botão para alterar senha
    const changePasswordButton = document.querySelector('.change-password-button');
    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', showChangePasswordForm);
    }
    
    // Botão para excluir conta
    const deleteAccountButton = document.querySelector('.delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', confirmDeleteAccount);
    }
}

// Função para salvar alterações do perfil
function saveProfileChanges() {
    // Essa função já deve estar no seu código original
    // Se não estiver, você pode adicionar a implementação ou deixar em branco
    Swal.fire({
        icon: 'success',
        title: 'Alterações salvas',
        text: 'Seu perfil foi atualizado com sucesso!',
        confirmButtonColor: '#06CF90'
    });
}

// Função para fazer logout
function handleLogout(event) {
    if (event) event.preventDefault();
    
    // Chama a função de logout do clientSessionHandler.js
    logoutClient();
    
    // Redireciona para a página inicial de clientes
    window.location.href = `${root}${routes.client}`;
}

// Função para mostrar formulário de alterar senha
function showChangePasswordForm() {
    // Essa função já deve estar no seu código original
    // Se não estiver, você pode adicionar a implementação ou deixar em branco
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
        cancelButtonText: 'Cancelar'
    });
}

// Função para confirmar exclusão da conta
function confirmDeleteAccount() {
    // Essa função já deve estar no seu código original
    // Se não estiver, você pode adicionar a implementação ou deixar em branco
    Swal.fire({
        title: 'Tem certeza?',
        text: "Esta ação não pode ser desfeita! Todos os seus dados serão removidos permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir minha conta!',
        cancelButtonText: 'Cancelar'
    });
}

// Atualização da função existente
window.onload = function() {
    if (!isAuthenticatedClient()) {
        // Se o usuário não estiver autenticado, redireciona para a página de login
        window.location.href = "../../loginClient/index.html";
    } else {
        // Carrega os dados do usuário
        // Exibe os dados do usuário que já estão salvos no sessionStorage
const clientData = getAuthenticatedClient();
if (clientData) {
    // Nome do usuário no cabeçalho do perfil
    const userName = document.getElementById('user-name');
    if (userName) {
        userName.textContent = clientData.username || 'Nome não disponível';
    }
    
    // Email no cabeçalho do perfil
    const userEmail = document.getElementById('user-email');
    if (userEmail) {
        userEmail.textContent = clientData.email || 'Email não disponível';
    }
}
        
        // Carrega os endereços do cliente
        loadClientAddresses();
        
        // Configura as tabs
        setupTabs();
        
        // Configura os eventos dos botões
        setupButtonEvents();
    }
}