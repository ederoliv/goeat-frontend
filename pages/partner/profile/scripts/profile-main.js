/**
 * Script principal para a página de perfil do restaurante
 * Gerencia tabs, horários, status do restaurante e dados do perfil
 */

// Variáveis globais
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;
let restaurantIsOpen = true; // Status inicial do restaurante

// Inicialização da página
window.onload = function() {
  // Verifica se o usuário (parceiro) está autenticado
  if (!userDataString) {
    console.error('Parceiro não autenticado.');
    window.location.href = '../../loginPartner/index.html'; 
    return;
  }

  // Preenche o nome do usuário na interface
  document.getElementById('userName').textContent = userData.name || 'Usuário';

  // Inicializa os componentes da página
  initializeTabs();
  initializeScheduleEvents();
  loadProfileData();
  
  console.log('Página de perfil do restaurante carregada');
};

/**
 * Inicializa o sistema de tabs
 */
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove a classe active de todos os botões e conteúdos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Adiciona a classe active ao botão clicado
      button.classList.add('active');
      
      // Mostra o conteúdo da tab correspondente
      const tabId = button.getAttribute('data-tab');
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.add('active');
      }
    });
  });
}

/**
 * Inicializa os eventos relacionados aos horários
 */
function initializeScheduleEvents() {
  // Eventos para os checkboxes dos dias da semana
  const dayCheckboxes = document.querySelectorAll('.day-toggle input[type="checkbox"]');
  
  dayCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const daySchedule = this.closest('.day-schedule');
      const timeInputs = daySchedule.querySelector('.time-inputs');
      const timeInputElements = timeInputs.querySelectorAll('.time-input');
      
      if (this.checked) {
        timeInputs.classList.remove('disabled');
        timeInputElements.forEach(input => input.disabled = false);
      } else {
        timeInputs.classList.add('disabled');
        timeInputElements.forEach(input => input.disabled = true);
      }
    });
  });
}

/**
 * Alterna o status do restaurante (aberto/fechado)
 */
function toggleRestaurantStatus() {
  const statusIndicator = document.getElementById('restaurant-status-indicator');
  const statusText = document.getElementById('restaurant-status-text');
  const statusDescription = document.getElementById('restaurant-status-description');
  const toggleButton = document.getElementById('toggle-status-button');
  
  restaurantIsOpen = !restaurantIsOpen;
  
  if (restaurantIsOpen) {
    // Restaurante aberto
    statusIndicator.className = 'status-indicator open';
    statusText.textContent = 'Restaurante Aberto';
    statusDescription.textContent = 'Funcionando normalmente';
    toggleButton.className = 'toggle-status-button open';
    toggleButton.innerHTML = '<i class="fa fa-power-off"></i>Fechar Temporariamente';
    
    goeatAlert('success', 'Restaurante reaberto com sucesso!');
  } else {
    // Restaurante fechado
    statusIndicator.className = 'status-indicator closed';
    statusText.textContent = 'Restaurante Fechado';
    statusDescription.textContent = 'Fechado temporariamente pelo proprietário';
    toggleButton.className = 'toggle-status-button closed';
    toggleButton.innerHTML = '<i class="fa fa-power-off"></i>Reabrir Restaurante';
    
    goeatAlert('info', 'Restaurante fechado temporariamente');
  }
}

/**
 * Copia o horário do primeiro dia ativo para todos os outros dias
 */
function copyTodayToAll() {
  const daySchedules = document.querySelectorAll('.day-schedule');
  let sourceSchedule = null;
  
  // Encontra o primeiro dia ativo para usar como referência
  for (let schedule of daySchedules) {
    const checkbox = schedule.querySelector('.day-toggle input[type="checkbox"]');
    if (checkbox.checked) {
      sourceSchedule = schedule;
      break;
    }
  }
  
  if (!sourceSchedule) {
    goeatAlert('warning', 'Nenhum dia está ativo para copiar os horários');
    return;
  }
  
  // Obtém os horários do dia de referência
  const sourceTimeInputs = sourceSchedule.querySelectorAll('.time-input');
  const openTime = sourceTimeInputs[0].value;
  const closeTime = sourceTimeInputs[1].value;
  
  if (!openTime || !closeTime) {
    goeatAlert('warning', 'Defina os horários de abertura e fechamento primeiro');
    return;
  }
  
  // Aplica os horários para todos os dias ativos
  daySchedules.forEach(schedule => {
    const checkbox = schedule.querySelector('.day-toggle input[type="checkbox"]');
    if (checkbox.checked) {
      const timeInputs = schedule.querySelectorAll('.time-input');
      timeInputs[0].value = openTime;
      timeInputs[1].value = closeTime;
    }
  });
  
  goeatAlert('success', 'Horários copiados para todos os dias ativos!');
}

/**
 * Busca CEP usando a API do ViaCEP
 */
function searchCep() {
  const cepInput = document.getElementById('cep');
  const cep = cepInput.value.replace(/\D/g, '');
  
  if (cep.length !== 8) {
    goeatAlert('error', 'CEP deve ter 8 dígitos');
    return;
  }
  
  // Mostra loading
  const searchButton = document.querySelector('.search-cep-button');
  const originalContent = searchButton.innerHTML;
  searchButton.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
  searchButton.disabled = true;
  
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
    .then(response => response.json())
    .then(data => {
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }
      
      // Preenche os campos
      document.getElementById('street').value = data.logradouro || '';
      document.getElementById('neighborhood').value = data.bairro || '';
      document.getElementById('city').value = data.localidade || '';
      
      goeatAlert('success', 'CEP encontrado!');
    })
    .catch(error => {
      console.error('Erro ao buscar CEP:', error);
      goeatAlert('error', 'Erro ao buscar CEP. Verifique e tente novamente.');
    })
    .finally(() => {
      // Restaura o botão
      searchButton.innerHTML = originalContent;
      searchButton.disabled = false;
    });
}

/**
 * Carrega os dados do perfil do restaurante
 */
function loadProfileData() {
  // Aqui você faria a chamada para a API para carregar os dados reais
  // Por enquanto, usando dados estáticos conforme solicitado
  
  console.log('Dados do perfil carregados (estático)');
  
  // Exemplo de como seria a chamada para a API:
  /*
  fetch(`${API_BASE_URL}/partners/${userData.id}/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userData.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    // Preencher os campos com os dados da API
    populateFormFields(data);
  })
  .catch(error => {
    console.error('Erro ao carregar dados do perfil:', error);
    goeatAlert('error', 'Erro ao carregar dados do perfil');
  });
  */
}

/**
 * Salva as alterações do perfil
 */
function saveProfile() {
  // Coleta todos os dados do formulário
  const profileData = collectFormData();
  
  if (!validateProfileData(profileData)) {
    return;
  }
  
  // Mostra loading
  showLoadingModal();
  
  // Simula salvamento (em produção seria uma chamada para a API)
  setTimeout(() => {
    hideLoadingModal();
    goeatAlert('success', 'Perfil atualizado com sucesso!');
    console.log('Dados salvos:', profileData);
  }, 1500);
  
  // Exemplo de como seria a chamada para a API:
  /*
  fetch(`${API_BASE_URL}/partners/${userData.id}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userData.token}`
    },
    body: JSON.stringify(profileData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao salvar perfil');
    }
    return response.json();
  })
  .then(data => {
    hideLoadingModal();
    goeatAlert('success', 'Perfil atualizado com sucesso!');
  })
  .catch(error => {
    hideLoadingModal();
    console.error('Erro ao salvar perfil:', error);
    goeatAlert('error', 'Erro ao salvar perfil. Tente novamente.');
  });
  */
}

/**
 * Coleta todos os dados do formulário
 */
function collectFormData() {
  // Dados básicos do restaurante
  const basicData = {
    name: document.getElementById('restaurant-name').value,
    category: document.getElementById('restaurant-category').value,
    phone: document.getElementById('restaurant-phone').value,
    email: document.getElementById('restaurant-email').value
  };
  
  // Dados de endereço
  const addressData = {
    zipCode: document.getElementById('cep').value,
    street: document.getElementById('street').value,
    number: document.getElementById('number').value,
    complement: document.getElementById('complement').value,
    neighborhood: document.getElementById('neighborhood').value,
    city: document.getElementById('city').value
  };
  
  // Configurações de entrega
  const deliveryData = {
    deliveryFee: parseFloat(document.getElementById('delivery-fee').value) || 0,
    deliveryTime: document.getElementById('delivery-time').value,
    minimumOrder: parseFloat(document.getElementById('minimum-order').value) || 0,
    deliveryRadius: parseFloat(document.getElementById('delivery-radius').value) || 0
  };
  
  // Horários de funcionamento
  const scheduleData = collectScheduleData();
  
  // Tags do cardápio
  const menuTags = collectMenuTags();
  
  return {
    ...basicData,
    address: addressData,
    delivery: deliveryData,
    schedule: scheduleData,
    menuTags: menuTags,
    isOpen: restaurantIsOpen
  };
}

/**
 * Coleta os dados de horários de funcionamento
 */
function collectScheduleData() {
  const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const scheduleData = {};
  
  document.querySelectorAll('.day-schedule').forEach((dayElement, index) => {
    const checkbox = dayElement.querySelector('.day-toggle input[type="checkbox"]');
    const timeInputs = dayElement.querySelectorAll('.time-input');
    
    const dayName = days[index];
    scheduleData[dayName] = {
      isActive: checkbox.checked,
      openTime: timeInputs[0].value,
      closeTime: timeInputs[1].value
    };
  });
  
  return scheduleData;
}

/**
 * Coleta as tags do cardápio selecionadas
 */
function collectMenuTags() {
  const selectedTags = [];
  
  document.querySelectorAll('.tag-option input[type="checkbox"]:checked').forEach(checkbox => {
    const tagLabel = checkbox.nextElementSibling.textContent.trim();
    selectedTags.push(tagLabel);
  });
  
  return selectedTags;
}

/**
 * Valida os dados do perfil
 */
function validateProfileData(data) {
  if (!data.name.trim()) {
    goeatAlert('error', 'Nome do restaurante é obrigatório');
    return false;
  }
  
  if (!data.phone.trim()) {
    goeatAlert('error', 'Telefone é obrigatório');
    return false;
  }
  
  if (!data.email.trim()) {
    goeatAlert('error', 'E-mail é obrigatório');
    return false;
  }
  
  if (!data.address.street.trim() || !data.address.number.trim()) {
    goeatAlert('error', 'Endereço completo é obrigatório');
    return false;
  }
  
  // Verifica se pelo menos um dia da semana está ativo
  const hasActiveDay = Object.values(data.schedule).some(day => day.isActive);
  if (!hasActiveDay) {
    goeatAlert('error', 'Pelo menos um dia da semana deve estar ativo');
    return false;
  }
  
  // Verifica se os dias ativos têm horários definidos
  for (const [dayName, dayData] of Object.entries(data.schedule)) {
    if (dayData.isActive && (!dayData.openTime || !dayData.closeTime)) {
      goeatAlert('error', `Defina os horários para ${dayName}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Cancela as alterações e recarrega os dados originais
 */
function cancelChanges() {
  Swal.fire({
    title: 'Cancelar alterações?',
    text: 'Todas as alterações não salvas serão perdidas.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sim, cancelar',
    cancelButtonText: 'Continuar editando'
  }).then((result) => {
    if (result.isConfirmed) {
      loadProfileData();
      goeatAlert('info', 'Alterações canceladas');
    }
  });
}