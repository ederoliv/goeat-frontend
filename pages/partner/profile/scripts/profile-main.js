/**
 * Script principal para a página de perfil do restaurante
 * Gerencia tabs, horários, status do restaurante e dados do perfil
 */

// Variáveis globais
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;
let restaurantIsOpen = true; // Status inicial do restaurante
let allCategories = []; // Lista de todas as categorias disponíveis
let restaurantCategories = []; // Lista das categorias do restaurante

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
  
  // Carrega todas as categorias disponíveis
  loadAllCategories();
  
  // Carrega os dados do perfil do backend
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
      document.getElementById('state').value = data.uf || '';
      
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
 * Carrega todas as categorias disponíveis no sistema
 */
async function loadAllCategories() {
  try {
    showLoadingModal();
    
    // Faz a requisição para a API para buscar todas as categorias disponíveis
    // Nota: Essa rota não requer autenticação por token
    const response = await fetch(`${API_BASE_URL}/restaurant-categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar categorias: ${response.status}`);
    }
    
    // Processa a resposta
    const categories = await response.json();
    allCategories = categories; // Salva na variável global
    
    // Após carregar todas as categorias, atualizamos o grid de categorias
    updateCategoriesGrid();
    
    console.log('Categorias carregadas com sucesso:', categories);
    
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    goeatAlert('error', 'Não foi possível carregar as categorias do restaurante.');
  } finally {
    hideLoadingModal();
  }
}

/**
 * Atualiza o grid de categorias na interface
 */
function updateCategoriesGrid() {
  const tagsGrid = document.querySelector('.tags-grid');
  
  // Limpa o grid existente
  tagsGrid.innerHTML = '';
  
  // Verifica se as categorias estão carregadas
  if (!allCategories || allCategories.length === 0) {
    // Se não tiver categorias, exibe uma mensagem
    tagsGrid.innerHTML = '<p>Carregando categorias...</p>';
    return;
  }
  
  // Adiciona cada categoria ao grid
  allCategories.forEach(category => {
    // Verifica se a categoria está nas categorias do restaurante
    const isSelected = restaurantCategories.some(rc => rc.id === category.id);
    
    // Cria o elemento da categoria
    const tagOption = document.createElement('label');
    tagOption.className = 'tag-option';
    tagOption.innerHTML = `
      <input type="checkbox" ${isSelected ? 'checked' : ''} value="${category.id}">
      <span class="tag-label">
        <i class="fa fa-tag"></i>
        ${category.name}
      </span>
    `;
    
    tagsGrid.appendChild(tagOption);
  });
}

/**
 * Carrega os dados do perfil do restaurante
 */
async function loadProfileData() {
  try {
    showLoadingModal();
    
    // Obtém as credenciais do usuário
    const token = userData.token;
    
    // Faz a requisição para a API para buscar os dados do perfil
    const response = await fetch(`${API_BASE_URL}/partners/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar perfil: ${response.status}`);
    }
    
    // Processa a resposta
    const profileData = await response.json();
    
    // Preenche os campos com os dados recebidos
    populateFormFields(profileData);
    
    // Salva as categorias do restaurante na variável global
    restaurantCategories = profileData.categories || [];
    
    console.log('Perfil carregado com sucesso:', profileData);
    console.log('Categorias do restaurante:', restaurantCategories);
    
    // Se já carregamos as categorias, atualizamos o grid
    if (allCategories.length > 0) {
      updateCategoriesGrid();
    }
    
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    goeatAlert('error', 'Não foi possível carregar os dados do perfil.');
  } finally {
    hideLoadingModal();
  }
}

/**
 * Preenche os campos do formulário com os dados do perfil
 */
function populateFormFields(profileData) {
  // Informações básicas
  document.getElementById('restaurant-name').value = profileData.name || '';
  document.getElementById('restaurant-phone').value = profileData.phone || '';
  
  // Obtém o email do usuário do sessionStorage
  const userData = JSON.parse(sessionStorage.getItem('userData'));
  if (userData && userData.username) {
    document.getElementById('restaurant-email').value = userData.username;
  }
  
  // Processa o endereço (que vem como string formatada)
  const addressParts = parseAddress(profileData.address);
  
  // Preenche os campos de endereço
  if (addressParts) {
    document.getElementById('street').value = addressParts.street || '';
    document.getElementById('number').value = addressParts.number || '';
    document.getElementById('complement').value = addressParts.complement || '';
    document.getElementById('neighborhood').value = addressParts.neighborhood || '';
    document.getElementById('city').value = addressParts.city || '';
    document.getElementById('state').value = addressParts.state || '';
    document.getElementById('cep').value = addressParts.zipCode || '';
    document.getElementById('reference').value = addressParts.reference || '';
  }
  
  // Atualiza o grid de categorias
  if (allCategories.length > 0) {
    updateCategoriesGrid();
  }
}

/**
 * Analisa a string de endereço e extrai os componentes
 */
function parseAddress(addressString) {
  if (!addressString) return null;
  
  // Exemplo: "Avenida Júlio de Castilhos, 1234, Sala 401, Centro, Caxias do Sul - RS"
  // Tentativa de extrair as partes do endereço
  const parts = {};
  
  // Tentativa de extração do número
  const numberMatch = addressString.match(/,\s*(\d+)/);
  if (numberMatch) {
    parts.number = numberMatch[1];
    // Remove o número da string para facilitar o processamento
    addressString = addressString.replace(`, ${parts.number}`, '');
  }
  
  // Divide pelas vírgulas restantes
  const segments = addressString.split(',').map(s => s.trim());
  
  // O primeiro segmento geralmente é a rua
  parts.street = segments[0] || '';
  
  // Se tiver mais de 3 segmentos, o segundo pode ser um complemento
  if (segments.length > 3) {
    parts.complement = segments[1] || '';
  }
  
  // Geralmente o bairro é o penúltimo ou antepenúltimo segmento
  const potentialNeighborhood = segments[segments.length - 2] || '';
  if (potentialNeighborhood && !potentialNeighborhood.includes('-')) {
    parts.neighborhood = potentialNeighborhood;
  } else {
    // Se não identificou o bairro, pode estar junto com a cidade
    parts.neighborhood = '';
  }
  
  // O último segmento geralmente contém cidade e estado
  const lastSegment = segments[segments.length - 1] || '';
  const cityState = lastSegment.split('-').map(s => s.trim());
  
  parts.city = cityState[0] || '';
  parts.state = cityState.length > 1 ? cityState[1] : '';
  
  // CEP não está na string de endereço formatada, então deixamos vazio
  parts.zipCode = '';
  
  // Referência não está na string de endereço formatada, então deixamos vazio
  parts.reference = '';
  
  return parts;
}

/**
 * Coleta todos os dados do formulário
 */
function collectFormData() {
  // Informações básicas
  const name = document.getElementById('restaurant-name').value;
  const phone = document.getElementById('restaurant-phone').value;
  const email = document.getElementById('restaurant-email').value;
  
  // Endereço
  const street = document.getElementById('street').value;
  const number = document.getElementById('number').value;
  const complement = document.getElementById('complement').value;
  const neighborhood = document.getElementById('neighborhood').value;
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const zipCode = document.getElementById('cep').value;
  const reference = document.getElementById('reference')?.value || '';
  
  // Categorias selecionadas - apenas os IDs
  const categoryCheckboxes = document.querySelectorAll('.tags-grid input[type="checkbox"]:checked');
  const selectedCategoryIds = Array.from(categoryCheckboxes).map(cb => parseInt(cb.value));
  
  // Cria o objeto de endereço no formato esperado pela API
  const addressObj = {
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    zipCode,
    reference,
    partnerId: userData.partnerId || userData.id // Usa partnerId se disponível, caso contrário usa id
  };
  
  // Estrutura o objeto conforme esperado pela API para o PUT
  return {
    name,
    phone,
    email,
    address: addressObj,
    categoryIds: selectedCategoryIds // Usa categoryIds em vez de categories
  };
}

/**
 * Valida os dados do formulário
 */
function validateFormData(data) {
  if (!data.name || data.name.trim() === '') {
    goeatAlert('error', 'O nome do restaurante é obrigatório');
    return false;
  }
  
  if (!data.phone || data.phone.trim() === '') {
    goeatAlert('error', 'O telefone do restaurante é obrigatório');
    return false;
  }
  
  if (!data.email || data.email.trim() === '') {
    goeatAlert('error', 'O email do restaurante é obrigatório');
    return false;
  }
  
  // Validação básica de endereço
  const address = data.address;
  if (!address || !address.street || !address.number || !address.city || !address.state) {
    goeatAlert('error', 'Preencha os campos obrigatórios do endereço');
    return false;
  }
  
  return true;
}

/**
 * Salva as alterações do perfil
 */
async function saveProfile() {
  // Coleta os dados do formulário
  const profileData = collectFormData();
  
  if (!validateFormData(profileData)) {
    return;
  }
  
  try {
    // Mostra loading
    showLoadingModal();
    
    // Obtém as credenciais do usuário
    const token = userData.token;
    
    console.log('Enviando dados para API:', JSON.stringify(profileData, null, 2));
    
    // Envia os dados para a API
    const response = await fetch(`${API_BASE_URL}/partners/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      let errorMessage = 'Erro desconhecido';
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch (e) {
        const errorText = await response.text();
        errorMessage = errorText || `Código de status: ${response.status}`;
      }
      
      throw new Error(`Erro ao salvar perfil: ${errorMessage}`);
    }
    
    // Recarrega os dados do perfil
    await loadProfileData();
    
    goeatAlert('success', 'Perfil atualizado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    goeatAlert('error', `Erro ao salvar perfil: ${error.message}`);
  } finally {
    hideLoadingModal();
  }
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