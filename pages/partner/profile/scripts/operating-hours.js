/**
 * Funções para gerenciar os horários de funcionamento do restaurante
 */

// Função para carregar os horários de funcionamento do parceiro
async function loadOperatingHours() {
    try {
        showLoadingModal();
        
        // Obter o token do parceiro autenticado
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        if (!userData || !userData.token) {
            throw new Error('Parceiro não autenticado');
        }
        
        // Fazer requisição para a API
        const response = await fetch(`${API_BASE_URL}/operating-hours`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao carregar horários: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Atualizar a interface com os horários
        updateOperatingHoursUI(data);
        
        // Atualizar o status do restaurante
        updateRestaurantStatusUI(data.isOpenNow, data.manuallyOpen);
    } catch (error) {
        console.error('Erro ao carregar horários de funcionamento:', error);
        goeatAlert('error', 'Não foi possível carregar os horários de funcionamento.');
    } finally {
        hideLoadingModal();
    }
}

// Função para atualizar a interface com os horários carregados
function updateOperatingHoursUI(data) {
    const daysSchedule = document.querySelectorAll('.day-schedule');
    
    // Mapear os horários por dia da semana para facilitar o acesso
    const schedulesByDay = {};
    data.schedules.forEach(schedule => {
        schedulesByDay[schedule.dayOfWeek] = schedule;
    });
    
    // Atualizar cada dia na interface
    daysSchedule.forEach(dayElement => {
        // Obter o dia da semana do elemento
        const dayName = dayElement.querySelector('.day-name').textContent.trim();
        const dayOfWeek = getDayOfWeekFromName(dayName);
        
        if (dayOfWeek && schedulesByDay[dayOfWeek]) {
            const schedule = schedulesByDay[dayOfWeek];
            
            // Atualizar checkbox
            const checkbox = dayElement.querySelector('input[type="checkbox"]');
            checkbox.checked = schedule.isOpen;
            
            // Atualizar horários
            const timeInputs = dayElement.querySelectorAll('.time-input');
            if (timeInputs.length >= 2) {
                timeInputs[0].value = schedule.openingTime || '08:00';
                timeInputs[1].value = schedule.closingTime || '22:00';
            }
            
            // Atualizar estado ativo/inativo dos inputs
            const timeInputsContainer = dayElement.querySelector('.time-inputs');
            if (schedule.isOpen) {
                timeInputsContainer.classList.remove('disabled');
                timeInputs.forEach(input => input.disabled = false);
            } else {
                timeInputsContainer.classList.add('disabled');
                timeInputs.forEach(input => input.disabled = true);
            }
        }
    });
}

// Função para atualizar o status visual do restaurante na interface
function updateRestaurantStatusUI(isOpenNow, manuallyOpen) {
    const statusIndicator = document.getElementById('restaurant-status-indicator');
    const statusText = document.getElementById('restaurant-status-text');
    const statusDescription = document.getElementById('restaurant-status-description');
    const toggleButton = document.getElementById('toggle-status-button');
    
    if (manuallyOpen) {
        // O restaurante está configurado como aberto manualmente
        if (isOpenNow) {
            // Está dentro do horário de funcionamento
            statusIndicator.className = 'status-indicator open';
            statusText.textContent = 'Restaurante Aberto';
            statusDescription.textContent = 'Funcionando normalmente';
            toggleButton.className = 'toggle-status-button open';
            toggleButton.innerHTML = '<i class="fa fa-power-off"></i>Fechar Temporariamente';
        } else {
            // Está fora do horário de funcionamento
            statusIndicator.className = 'status-indicator closed';
            statusText.textContent = 'Restaurante Fechado';
            statusDescription.textContent = 'Fora do horário de funcionamento';
            toggleButton.className = 'toggle-status-button closed';
            toggleButton.innerHTML = '<i class="fa fa-power-off"></i>Abrir Excepcionalmente';
        }
    } else {
        // O restaurante está fechado manualmente
        statusIndicator.className = 'status-indicator closed';
        statusText.textContent = 'Restaurante Fechado';
        statusDescription.textContent = 'Fechado temporariamente pelo proprietário';
        toggleButton.className = 'toggle-status-button closed';
        toggleButton.innerHTML = '<i class="fa fa-power-off"></i>Reabrir Restaurante';
    }
}

// Função para alternar o status do restaurante
async function toggleRestaurantStatus() {
    try {
        showLoadingModal();
        
        // Obter o token do parceiro autenticado
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        if (!userData || !userData.token) {
            throw new Error('Parceiro não autenticado');
        }
        
        // Determinar o novo status (o contrário do atual)
        const currentButton = document.getElementById('toggle-status-button');
        const newStatus = currentButton.classList.contains('open') ? false : true;
        
        // Fazer requisição para a API
        const response = await fetch(`${API_BASE_URL}/operating-hours/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify({ isOpen: newStatus })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao atualizar status: ${response.status}`);
        }
        
        // Recarregar os horários para atualizar a interface
        await loadOperatingHours();
        
        // Exibir mensagem de sucesso
        const message = newStatus ? 'Restaurante reaberto com sucesso!' : 'Restaurante fechado temporariamente!';
        goeatAlert('success', message);
    } catch (error) {
        console.error('Erro ao alternar status do restaurante:', error);
        goeatAlert('error', 'Não foi possível atualizar o status do restaurante.');
    } finally {
        hideLoadingModal();
    }
}

// Função para salvar os horários de funcionamento
async function saveOperatingHours() {
    try {
        showLoadingModal();
        
        // Obter o token do parceiro autenticado
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        if (!userData || !userData.token) {
            throw new Error('Parceiro não autenticado');
        }
        
        // Coletar os dados de todos os dias
        const schedules = [];
        const daysSchedule = document.querySelectorAll('.day-schedule');
        
        daysSchedule.forEach(dayElement => {
            const dayName = dayElement.querySelector('.day-name').textContent.trim();
            const dayOfWeek = getDayOfWeekFromName(dayName);
            
            if (dayOfWeek) {
                const isOpen = dayElement.querySelector('input[type="checkbox"]').checked;
                const timeInputs = dayElement.querySelectorAll('.time-input');
                
                let openingTime = null;
                let closingTime = null;
                
                if (timeInputs.length >= 2) {
                    openingTime = timeInputs[0].value;
                    closingTime = timeInputs[1].value;
                }
                
                schedules.push({
                    dayOfWeek,
                    isOpen,
                    openingTime,
                    closingTime
                });
            }
        });
        
        // Preparar o payload
        const payload = {
            schedules
        };
        
        // Fazer requisição para a API
        const response = await fetch(`${API_BASE_URL}/operating-hours`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao salvar horários: ${response.status}`);
        }
        
        // Recarregar os horários para atualizar a interface
        const data = await response.json();
        updateOperatingHoursUI(data);
        updateRestaurantStatusUI(data.isOpenNow, data.manuallyOpen);
        
        // Exibir mensagem de sucesso
        goeatAlert('success', 'Horários de funcionamento atualizados com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar horários de funcionamento:', error);
        goeatAlert('error', 'Não foi possível salvar os horários de funcionamento.');
    } finally {
        hideLoadingModal();
    }
}

// Função para copiar os horários de um dia para todos os outros
function copyTodayToAll() {
    const daysSchedule = document.querySelectorAll('.day-schedule');
    let sourceSchedule = null;
    
    // Encontrar o primeiro dia ativo para usar como referência
    for (let schedule of daysSchedule) {
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
    
    // Obter os horários do dia de referência
    const sourceTimeInputs = sourceSchedule.querySelectorAll('.time-input');
    const openTime = sourceTimeInputs[0].value;
    const closeTime = sourceTimeInputs[1].value;
    
    if (!openTime || !closeTime) {
        goeatAlert('warning', 'Defina os horários de abertura e fechamento primeiro');
        return;
    }
    
    // Aplicar os horários para todos os dias ativos
    daysSchedule.forEach(schedule => {
        const checkbox = schedule.querySelector('.day-toggle input[type="checkbox"]');
        if (checkbox.checked) {
            const timeInputs = schedule.querySelectorAll('.time-input');
            timeInputs[0].value = openTime;
            timeInputs[1].value = closeTime;
        }
    });
    
    goeatAlert('success', 'Horários copiados para todos os dias ativos!');
}

// Função auxiliar para converter o nome do dia para o formato DayOfWeek do backend
function getDayOfWeekFromName(dayName) {
    const daysMap = {
        'Segunda-feira': 'MONDAY',
        'Terça-feira': 'TUESDAY',
        'Quarta-feira': 'WEDNESDAY',
        'Quinta-feira': 'THURSDAY',
        'Sexta-feira': 'FRIDAY',
        'Sábado': 'SATURDAY',
        'Domingo': 'SUNDAY'
    };
    
    return daysMap[dayName];
}

// Função para inicializar eventos dos horários de funcionamento
function initializeOperatingHoursEvents() {
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
    
    // Botão para alternar status do restaurante
    document.getElementById('toggle-status-button').addEventListener('click', toggleRestaurantStatus);
    
    // Botão para copiar horários
    document.querySelector('.copy-schedule-button').addEventListener('click', copyTodayToAll);
    
    // Adicionar evento para salvar horários quando o usuário clicar em "Salvar Alterações"
    document.querySelector('.save-button').addEventListener('click', function(event) {
        event.preventDefault();
        saveOperatingHours();
    });
}

// Carregar os horários quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initializeOperatingHoursEvents();
    loadOperatingHours();
});