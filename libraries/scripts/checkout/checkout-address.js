// Funções auxiliares para horários (reutilizadas do store.js com validações)
function getTodayOperatingHours(operatingHours) {
    if (!operatingHours || !Array.isArray(operatingHours)) {
        console.warn('operatingHours is not a valid array');
        return null;
    }
    
    const today = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[today];
    
    return operatingHours.find(day => day && day.dayOfWeek === todayName) || null;
}

function getNextOpenTime(operatingHours) {
    if (!operatingHours || !Array.isArray(operatingHours)) {
        console.warn('operatingHours is not a valid array');
        return null;
    }
    
    const today = new Date().getDay();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const daysMapPt = {
        'MONDAY': 'Segunda-feira',
        'TUESDAY': 'Terça-feira',
        'WEDNESDAY': 'Quarta-feira',
        'THURSDAY': 'Quinta-feira',
        'FRIDAY': 'Sexta-feira',
        'SATURDAY': 'Sábado',
        'SUNDAY': 'Domingo'
    };
    
    // Procura pelo próximo dia aberto
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (today + i) % 7;
        const nextDayName = dayNames[nextDayIndex];
        const nextDay = operatingHours.find(day => day && day.dayOfWeek === nextDayName);
        
        if (nextDay && nextDay.isOpen && nextDay.openingTime) {
            const dayLabel = i === 1 ? 'Amanhã' : 
                            i === 7 ? 'Próximo ' + daysMapPt[nextDayName] :
                            daysMapPt[nextDayName];
            return `Abre ${dayLabel} às ${nextDay.openingTime}`;
        }
    }
    
    return null;
}// Funções relacionadas à etapa de endereço do checkout

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
        
        // Buscar o endereço real do restaurante
        fetchPartnerAddress(orderData.partnerId);
    }
}

// Função atualizada para buscar o endereço do restaurante
function fetchPartnerAddress(partnerId) {
    // Mostrar loading enquanto busca o endereço
    const pickupAddress = document.getElementById('pickup-address');
    pickupAddress.innerHTML = '<i class="fa fa-spinner fa-pulse"></i> Carregando endereço...';
    
    // Fazer requisição para a API para buscar os dados completos do parceiro
    fetch(`${API_BASE_URL}/partners/${partnerId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao buscar dados do restaurante');
            }
            return response.json();
        })
        .then(partnerData => {
            // Usa o campo fullAddress do novo formato de dados
            const address = partnerData.fullAddress || 'Endereço não disponível';
            pickupAddress.textContent = address;
            
            // Atualiza também as informações de horário se disponível
            updatePickupInfo(partnerData);
        })
        .catch(error => {
            console.error('Erro ao buscar dados do restaurante:', error);
            pickupAddress.textContent = 'Não foi possível carregar o endereço. Entre em contato com o restaurante.';
        });
}

// Nova função para atualizar as informações de retirada com horários
function updatePickupInfo(partnerData) {
    const pickupInfoContainer = document.getElementById('pickup-info');
    
    // Remove informações de horário anteriores se existirem
    const existingHours = pickupInfoContainer.querySelector('.pickup-hours');
    if (existingHours) {
        existingHours.remove();
    }
    
    // Se houver dados de horários de funcionamento, adiciona essa informação
    if (partnerData.operatingHours && Array.isArray(partnerData.operatingHours) && partnerData.operatingHours.length > 0) {
        const hoursContainer = document.createElement('div');
        hoursContainer.className = 'pickup-hours';
        
        const hoursTitle = document.createElement('p');
        hoursTitle.innerHTML = '<i class="fa fa-clock-o"></i> <strong>Horários de funcionamento:</strong>';
        hoursContainer.appendChild(hoursTitle);
        
        // Mapear dias da semana para português
        const daysMap = {
            'MONDAY': 'Segunda-feira',
            'TUESDAY': 'Terça-feira',
            'WEDNESDAY': 'Quarta-feira',
            'THURSDAY': 'Quinta-feira',
            'FRIDAY': 'Sexta-feira',
            'SATURDAY': 'Sábado',
            'SUNDAY': 'Domingo'
        };
        
        // Criar lista resumida dos horários (só dias úteis e fim de semana)
        const weekdayHours = partnerData.operatingHours.filter(day => 
            day && ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day.dayOfWeek) && day.isOpen
        );
        
        const weekendHours = partnerData.operatingHours.filter(day => 
            day && ['SATURDAY', 'SUNDAY'].includes(day.dayOfWeek) && day.isOpen
        );
        
        // Mostrar horários de segunda a sexta se forem consistentes
        if (weekdayHours.length > 0) {
            const firstWeekdayHour = weekdayHours[0];
            const allWeekdaysSame = weekdayHours.every(day => 
                day.openingTime === firstWeekdayHour.openingTime && 
                day.closingTime === firstWeekdayHour.closingTime
            );
            
            if (allWeekdaysSame && weekdayHours.length === 5) {
                const weekdayInfo = document.createElement('p');
                weekdayInfo.textContent = `Segunda a Sexta: ${firstWeekdayHour.openingTime} às ${firstWeekdayHour.closingTime}`;
                hoursContainer.appendChild(weekdayInfo);
            } else {
                // Se não forem iguais, mostra cada dia
                weekdayHours.forEach(day => {
                    const dayInfo = document.createElement('p');
                    dayInfo.textContent = `${daysMap[day.dayOfWeek]}: ${day.openingTime} às ${day.closingTime}`;
                    hoursContainer.appendChild(dayInfo);
                });
            }
        }
        
        // Mostrar horários de fim de semana
        weekendHours.forEach(day => {
            const dayInfo = document.createElement('p');
            dayInfo.textContent = `${daysMap[day.dayOfWeek]}: ${day.openingTime} às ${day.closingTime}`;
            hoursContainer.appendChild(dayInfo);
        });
        
        // Mostrar dias fechados se houver
        const closedDays = partnerData.operatingHours.filter(day => day && !day.isOpen);
        if (closedDays.length > 0) {
            const closedInfo = document.createElement('p');
            closedInfo.className = 'pickup-closed-days';
            const closedDayNames = closedDays.map(day => daysMap[day.dayOfWeek]).join(', ');
            closedInfo.innerHTML = `<span style="color: var(--goeat-red);">Fechado: ${closedDayNames}</span>`;
            hoursContainer.appendChild(closedInfo);
        }
        
        // Inserir as informações de horário após o endereço
        const pickupDetails = pickupInfoContainer.querySelector('.pickup-details');
        pickupDetails.appendChild(hoursContainer);
    }
    
    // Atualizar status atual do restaurante
    updatePickupStatus(partnerData);
}

// Nova função para mostrar o status atual do restaurante na seção de retirada
function updatePickupStatus(partnerData) {
    const pickupDetails = document.querySelector('.pickup-details');
    
    // Remove status anterior se existir
    const existingStatus = pickupDetails.querySelector('.pickup-status');
    if (existingStatus) {
        existingStatus.remove();
    }
    
    // Criar elemento de status
    const statusElement = document.createElement('div');
    statusElement.className = 'pickup-status';
    
    if (partnerData.isOpen) {
        statusElement.innerHTML = `
            <p style="color: var(--goeat-green); font-weight: 600;">
                <i class="fa fa-check-circle"></i> Restaurante aberto agora
            </p>
        `;
        
        // Tentar mostrar quando fecha hoje se tiver horários
        if (partnerData.operatingHours && Array.isArray(partnerData.operatingHours)) {
            const todayHours = getTodayOperatingHours(partnerData.operatingHours);
            if (todayHours && todayHours.isOpen && todayHours.closingTime) {
                const closingTime = document.createElement('p');
                closingTime.innerHTML = `<small style="color: #666;">Fecha às ${todayHours.closingTime}</small>`;
                statusElement.appendChild(closingTime);
            }
        }
    } else {
        statusElement.innerHTML = `
            <p style="color: var(--goeat-red); font-weight: 600;">
                <i class="fa fa-clock-o"></i> Restaurante fechado no momento
            </p>
        `;
        
        // Mostrar quando abre novamente
        if (partnerData.operatingHours && Array.isArray(partnerData.operatingHours)) {
            const nextOpenTime = getNextOpenTime(partnerData.operatingHours);
            if (nextOpenTime) {
                const reopenInfo = document.createElement('p');
                reopenInfo.innerHTML = `<small style="color: #666;">${nextOpenTime}</small>`;
                statusElement.appendChild(reopenInfo);
            }
        }
    }
    
    // Inserir no início dos detalhes de retirada
    pickupDetails.insertBefore(statusElement, pickupDetails.firstChild);
}

// Funções auxiliares para horários (reutilizadas do store.js)
function getTodayOperatingHours(operatingHours) {
    if (!operatingHours) return null;
    
    const today = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[today];
    
    return operatingHours.find(day => day.dayOfWeek === todayName);
}

function getNextOpenTime(operatingHours) {
    if (!operatingHours) return null;
    
    const today = new Date().getDay();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const daysMapPt = {
        'MONDAY': 'Segunda-feira',
        'TUESDAY': 'Terça-feira',
        'WEDNESDAY': 'Quarta-feira',
        'THURSDAY': 'Quinta-feira',
        'FRIDAY': 'Sexta-feira',
        'SATURDAY': 'Sábado',
        'SUNDAY': 'Domingo'
    };
    
    // Procura pelo próximo dia aberto
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (today + i) % 7;
        const nextDayName = dayNames[nextDayIndex];
        const nextDay = operatingHours.find(day => day.dayOfWeek === nextDayName);
        
        if (nextDay && nextDay.isOpen) {
            const dayLabel = i === 1 ? 'Amanhã' : 
                            i === 7 ? 'Próximo ' + daysMapPt[nextDayName] :
                            daysMapPt[nextDayName];
            return `Abre ${dayLabel} às ${nextDay.openingTime}`;
        }
    }
    
    return null;
}

// === RESTO DO CÓDIGO PERMANECE IGUAL ===

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