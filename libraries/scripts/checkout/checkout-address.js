// Funções relacionadas à etapa de endereço do checkout

// Função para atualizar opção de entrega/retirada
function updateDeliveryOption(option) {
    if (option === 'delivery') {
        document.getElementById('delivery-form').style.display = 'block';
        document.getElementById('pickup-info').style.display = 'none';
        document.getElementById('option-delivery').classList.add('selected');
        document.getElementById('option-pickup').classList.remove('selected');
        orderData.deliveryType = 'delivery';

        // Se o cliente estiver autenticado, mostrar endereços salvos
        if (isAuthenticatedClient()) {
            document.getElementById('address-list-container').style.display = 'block';
        }
    } else {
        document.getElementById('delivery-form').style.display = 'none';
        document.getElementById('address-list-container').style.display = 'none';
        document.getElementById('pickup-info').style.display = 'block';
        document.getElementById('option-pickup').classList.add('selected');
        document.getElementById('option-delivery').classList.remove('selected');
        orderData.deliveryType = 'pickup';
    }
}

// Função para carregar os endereços do cliente
async function loadClientAddresses(clientId) {
    try {
        showLoadingModal();
        
        // Obter dados do cliente, incluindo o token
        const clientData = getAuthenticatedClient();
        
        if (!clientData || !clientData.token) {
            throw new Error('Cliente não autenticado ou token inválido');
        }
        
        const response = await fetch(`${API_BASE_URL}/addresses/clients/${clientId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Falha ao carregar endereços');
        }
        
        const addresses = await response.json();
        displayClientAddresses(addresses);
    } catch (error) {
        console.error('Erro ao carregar endereços:', error);
        // Em caso de erro, mostra o formulário de endereço padrão
        document.getElementById('address-list-container').style.display = 'none';
        document.getElementById('delivery-form').style.display = 'block';
    } finally {
        hideLoadingModal();
    }
}

// Função para exibir os endereços do cliente
function displayClientAddresses(addresses) {
    const addressListContainer = document.getElementById('address-list-container');
    const addressList = document.getElementById('address-list');
    
    // Limpa a lista atual
    addressList.innerHTML = '';
    
    if (addresses.length === 0) {
        // Se não houver endereços, mostra o formulário normal
        addressListContainer.style.display = 'none';
        document.getElementById('delivery-form').style.display = 'block';
        return;
    }
    
    // Exibe o container de lista de endereços
    addressListContainer.style.display = 'block';
    document.getElementById('delivery-form').style.display = 'none';
    
    // Adiciona cada endereço à lista
    addresses.forEach(address => {
        const addressCard = document.createElement('div');
        addressCard.className = 'address-card';
        addressCard.dataset.addressId = address.id;
        
        // Cria o conteúdo do card
        addressCard.innerHTML = `
            <div class="address-info">
                <h4>${address.street}, ${address.number}</h4>
                <p>${address.neighborhood}, ${address.city} - ${address.state}</p>
                <p>CEP: ${address.zipCode}</p>
                ${address.complement ? `<p>Complemento: ${address.complement}</p>` : ''}
                ${address.reference ? `<p>Referência: ${address.reference}</p>` : ''}
            </div>
            <div class="address-select">
                <input type="radio" name="selected-address" id="address-${address.id}" value="${address.id}">
                <label for="address-${address.id}">Selecionar</label>
            </div>
        `;
        
        addressList.appendChild(addressCard);
        
        // Adiciona evento para selecionar o endereço ao clicar no card
        addressCard.addEventListener('click', () => {
            document.getElementById(`address-${address.id}`).checked = true;
            
            // Atualiza os dados do pedido com o endereço selecionado
            orderData.address = {
                id: address.id,
                street: address.street,
                number: address.number,
                complement: address.complement || '',
                neighborhood: address.neighborhood,
                city: address.city,
                state: address.state,
                zipCode: address.zipCode,
                reference: address.reference || ''
            };
        });
    });
    
    // Adiciona um botão para adicionar novo endereço
    const addNewAddressButton = document.createElement('button');
    addNewAddressButton.className = 'add-address-button';
    addNewAddressButton.innerHTML = '<i class="fa fa-plus"></i> Adicionar novo endereço';
    addNewAddressButton.addEventListener('click', showAddressForm);
    
    addressList.appendChild(addNewAddressButton);
}

// Função para mostrar o formulário de novo endereço
function showAddressForm() {
    document.getElementById('address-list-container').style.display = 'none';
    document.getElementById('delivery-form').style.display = 'block';
    document.getElementById('address-form-title').textContent = 'Adicionar Novo Endereço';
    document.getElementById('save-new-address').style.display = 'block';
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

    // Se o cliente estiver logado, verifica se um endereço foi selecionado
    if (isAuthenticatedClient()) {
        const selectedAddressRadio = document.querySelector('input[name="selected-address"]:checked');

        if (selectedAddressRadio) {
            // Se um endereço foi selecionado, já está no orderData, podemos prosseguir
            goToSection('payment');
            return;
        } else if (document.getElementById('address-list-container').style.display === 'block') {
            // Se a lista está sendo mostrada, mas nenhum endereço foi selecionado
            Swal.fire({
                title: 'Selecione um endereço',
                text: 'Por favor, selecione um endereço de entrega ou adicione um novo.',
                icon: 'warning',
                confirmButtonColor: '#06CF90'
            });
            return;
        }
        // Se o formulário estiver visível, valida normalmente
    }

    // Validação do formulário de endereço
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
        zipCode: cep,
        reference: document.getElementById('reference').value
    };

    // Ir para a próxima etapa
    goToSection('payment');
}

// Função para salvar um novo endereço
async function saveNewAddress() {
    // Obter os dados do formulário
    const street = document.getElementById('street').value;
    const number = document.getElementById('number').value;
    const complement = document.getElementById('complement').value;
    const neighborhood = document.getElementById('neighborhood').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zipCode = document.getElementById('cep').value;
    const reference = document.getElementById('reference').value;
    
    // Validação básica
    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
        Swal.fire({
            title: 'Dados incompletos',
            text: 'Por favor, preencha todos os campos obrigatórios do endereço!',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
        return;
    }
    
    // Obter o ID do cliente autenticado
    const clientData = getAuthenticatedClient();
    
    if (!clientData || !clientData.id) {
        console.error('Cliente não autenticado');
        return;
    }
    
    // Criar objeto de endereço
    const addressData = {
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        reference,
        clientId: clientData.id,
        partnerId: null
    };
    
    try {
        showLoadingModal();
        
        // Fazer requisição para salvar o endereço
        const response = await fetch(`${API_BASE_URL}/addresses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            },
            body: JSON.stringify(addressData)
        });
        
        if (!response.ok) {
            throw new Error('Falha ao salvar endereço');
        }
        
        const savedAddress = await response.json();
        
        // Mostrar mensagem de sucesso
        Swal.fire({
            title: 'Endereço salvo!',
            text: 'Seu endereço foi salvo com sucesso.',
            icon: 'success',
            confirmButtonColor: '#06CF90'
        });
        
        // Recarregar a lista de endereços
        loadClientAddresses(clientData.id);
        
    } catch (error) {
        console.error('Erro ao salvar endereço:', error);
        Swal.fire({
            title: 'Erro',
            text: 'Ocorreu um erro ao salvar o endereço. Tente novamente.',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
    } finally {
        hideLoadingModal();
    }
}