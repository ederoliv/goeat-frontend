// Funções relacionadas ao gerenciamento de endereços
let clientAddresses = []; // Mantém os endereços carregados para evitar múltiplas chamadas

async function loadClientAddresses() {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.id || !clientData.token) {
            console.error('Cliente não autenticado ou dados inválidos para carregar endereços.');
            // Opcional: Limpar a lista de endereços ou mostrar mensagem
            displayClientAddresses([]); // Mostra a mensagem de "sem endereços"
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
        const addressesList = document.querySelector('#addresses .addresses-list');
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

function displayClientAddresses(addresses) {
    const addressesList = document.querySelector('#addresses .addresses-list');
    if (!addressesList) return;
    
    addressesList.innerHTML = ''; // Limpa a lista atual
    
    if (!addresses || addresses.length === 0) {
        addressesList.innerHTML = `
            <div class="empty-addresses">
                <i class="fa fa-map-marker"></i>
                <p>Você ainda não possui endereços cadastrados.</p>
            </div>
        `;
    } else {
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

function showAddAddressForm() {
    Swal.fire({
        title: 'Adicionar Endereço',
        html: `
            <div class="form-group">
                <label for="address-cep">CEP</label>
                <input id="address-cep" class="swal2-input" placeholder="00000-000">
                <button id="search-cep-btn" class="swal2-confirm swal2-styled" type="button" style="margin-top: 5px; background-color: #53BDEB; display: block;">Buscar CEP</button>
            </div>
            <div class="form-group"><label for="address-street">Rua</label><input id="address-street" class="swal2-input"></div>
            <div class="form-group"><label for="address-number">Número</label><input id="address-number" class="swal2-input"></div>
            <div class="form-group"><label for="address-complement">Complemento</label><input id="address-complement" class="swal2-input" placeholder="Opcional"></div>
            <div class="form-group"><label for="address-neighborhood">Bairro</label><input id="address-neighborhood" class="swal2-input"></div>
            <div class="form-group"><label for="address-city">Cidade</label><input id="address-city" class="swal2-input"></div>
            <div class="form-group"><label for="address-state">Estado</label><input id="address-state" class="swal2-input"></div>
            <div class="form-group"><label for="address-reference">Ponto de referência</label><input id="address-reference" class="swal2-input" placeholder="Opcional"></div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        didOpen: () => {
            document.getElementById('search-cep-btn').addEventListener('click', searchCepForAddressModal);
        },
        preConfirm: () => {
            const street = document.getElementById('address-street').value;
            const number = document.getElementById('address-number').value;
            const neighborhood = document.getElementById('address-neighborhood').value;
            const city = document.getElementById('address-city').value;
            const state = document.getElementById('address-state').value;
            const zipCode = document.getElementById('address-cep').value;
            
            if (!street || !number || !neighborhood || !city || !state || !zipCode) {
                Swal.showValidationMessage('Por favor, preencha todos os campos obrigatórios (Rua, Número, Bairro, Cidade, Estado, CEP)!');
                return false;
            }
            return {
                street, number, neighborhood, city, state, zipCode,
                complement: document.getElementById('address-complement').value,
                reference: document.getElementById('address-reference').value
            };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            saveNewAddress(result.value);
        }
    });
}

function searchCepForAddressModal() {
    const cepInput = document.getElementById('address-cep');
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        Swal.showValidationMessage('CEP inválido. Deve conter 8 dígitos.');
        return;
    }
    
    const searchButton = document.getElementById('search-cep-btn');
    const originalText = searchButton.textContent;
    searchButton.textContent = 'Buscando...';
    searchButton.disabled = true;
    
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
        searchButton.textContent = originalText;
        searchButton.disabled = false;
        if (data.erro) {
            Swal.showValidationMessage('CEP não encontrado.');
        } else {
            document.getElementById('address-street').value = data.logradouro || '';
            document.getElementById('address-neighborhood').value = data.bairro || '';
            document.getElementById('address-city').value = data.localidade || '';
            document.getElementById('address-state').value = data.uf || '';
            document.getElementById('address-number').focus();
        }
    })
    .catch(error => {
        searchButton.textContent = originalText;
        searchButton.disabled = false;
        console.error('Erro ao buscar CEP:', error);
        Swal.showValidationMessage('Erro ao buscar CEP. Tente manualmente.');
    });
}

async function saveNewAddress(addressData) {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.id || !clientData.token) throw new Error('Cliente não autenticado');
        
        showLoadingModal();
        const apiData = { ...addressData, clientId: clientData.id, partnerId: null };
        
        const response = await fetch(`${API_BASE_URL}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientData.token}` },
            body: JSON.stringify(apiData)
        });
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({message: "Falha ao salvar endereço."}));
            throw new Error(errorBody.message || 'Falha ao salvar endereço');
        }
        
        await loadClientAddresses(); // Recarrega a lista
        Swal.fire('Sucesso!', 'Endereço adicionado.', 'success');
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        Swal.fire('Erro!', error.message || 'Não foi possível salvar o endereço.', 'error');
    } finally {
        hideLoadingModal();
    }
}

async function editAddress(addressId) {
    const address = clientAddresses.find(addr => addr.id === addressId);
    if (!address) return;

    Swal.fire({
        title: 'Editar Endereço',
        html: `
            <div class="form-group"><label for="address-cep">CEP</label><input id="address-cep" class="swal2-input" value="${address.zipCode}" placeholder="00000-000"><button id="search-cep-btn-edit" class="swal2-confirm swal2-styled" type="button" style="margin-top: 5px; background-color: #53BDEB; display: block;">Buscar CEP</button></div>
            <div class="form-group"><label for="address-street">Rua</label><input id="address-street" class="swal2-input" value="${address.street}"></div>
            <div class="form-group"><label for="address-number">Número</label><input id="address-number" class="swal2-input" value="${address.number}"></div>
            <div class="form-group"><label for="address-complement">Complemento</label><input id="address-complement" class="swal2-input" value="${address.complement || ''}" placeholder="Opcional"></div>
            <div class="form-group"><label for="address-neighborhood">Bairro</label><input id="address-neighborhood" class="swal2-input" value="${address.neighborhood}"></div>
            <div class="form-group"><label for="address-city">Cidade</label><input id="address-city" class="swal2-input" value="${address.city}"></div>
            <div class="form-group"><label for="address-state">Estado</label><input id="address-state" class="swal2-input" value="${address.state}"></div>
            <div class="form-group"><label for="address-reference">Ponto de referência</label><input id="address-reference" class="swal2-input" value="${address.reference || ''}" placeholder="Opcional"></div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Salvar Alterações',
        didOpen: () => {
             // Nota: O ID do botão de busca de CEP é diferente para o modal de edição para evitar conflitos
            document.getElementById('search-cep-btn-edit').addEventListener('click', searchCepForAddressModal);
        },
        preConfirm: () => {
            const street = document.getElementById('address-street').value;
            const number = document.getElementById('address-number').value;
            // ... (demais campos e validação igual ao showAddAddressForm)
            if (!street || !document.getElementById('address-number').value /* ... */) {
                Swal.showValidationMessage('Preencha os campos obrigatórios.');
                return false;
            }
            return { /* ... objeto com os dados ... */
                id: address.id,
                street: document.getElementById('address-street').value,
                number: document.getElementById('address-number').value,
                complement: document.getElementById('address-complement').value,
                neighborhood: document.getElementById('address-neighborhood').value,
                city: document.getElementById('address-city').value,
                state: document.getElementById('address-state').value,
                zipCode: document.getElementById('address-cep').value,
                reference: document.getElementById('address-reference').value
            };
        }
    }).then(result => {
        if (result.isConfirmed) {
            updateAddress(addressId, result.value);
        }
    });
}

async function updateAddress(addressId, addressData) {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.id || !clientData.token) throw new Error('Cliente não autenticado');
        
        showLoadingModal();
        const apiData = { ...addressData, clientId: clientData.id, partnerId: null };

        const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientData.token}` },
            body: JSON.stringify(apiData)
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({message: "Falha ao atualizar endereço."}));
            throw new Error(errorBody.message || 'Falha ao atualizar endereço');
        }
        await loadClientAddresses();
        Swal.fire('Sucesso!', 'Endereço atualizado.', 'success');
    } catch (error) {
        console.error('Erro ao atualizar endereço:', error);
        Swal.fire('Erro!', error.message || 'Não foi possível atualizar o endereço.', 'error');
    } finally {
        hideLoadingModal();
    }
}

async function deleteAddress(addressId) {
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
        if (!clientData || !clientData.id || !clientData.token) throw new Error('Cliente não autenticado');
        
        showLoadingModal();
        const response = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${clientData.token}` }
        });

        if (!response.ok) {
            // Tenta pegar uma mensagem de erro do corpo da resposta
            const errorBody = await response.json().catch(() => ({message: "Falha ao excluir endereço."}));
            throw new Error(errorBody.message || 'Falha ao excluir endereço.');
        }

        await loadClientAddresses(); // Recarrega a lista
        Swal.fire('Excluído!', 'Seu endereço foi removido.', 'success');
    } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        Swal.fire('Erro!', error.message || 'Não foi possível excluir o endereço.', 'error');
    } finally {
        hideLoadingModal();
    }
}