
// Função para verificar se um restaurante está aberto
async function checkRestaurantStatus(partnerId) {
    try {
        // Fazer requisição para obter o status do restaurante
        const response = await fetch(`${API_BASE_URL}/partners/${partnerId}/status`);
        
        if (!response.ok) {
            throw new Error(`Erro ao verificar status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            isOpen: data.isOpenNow,
            isScheduleOpen: data.isScheduleOpen,
            isManuallyOpen: data.isManuallyOpen
        };
    } catch (error) {
        console.error('Erro ao verificar status do restaurante:', error);
        // Em caso de erro, assumimos que o restaurante está fechado
        return {
            isOpen: false,
            isScheduleOpen: false,
            isManuallyOpen: false
        };
    }
}

// Função para atualizar a interface com o status do restaurante
async function updateRestaurantStatusDisplay(partnerId, elementId = 'restaurant-status') {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) return;
    
    // Mostrar indicador de carregamento
    statusElement.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Verificando...';
    statusElement.className = 'partner-status loading';
    
    try {
        const status = await checkRestaurantStatus(partnerId);
        
        if (status.isOpen) {
            statusElement.innerHTML = 'Aberto';
            statusElement.className = 'partner-status open';
        } else {
            let message = 'Fechado';
            
            // Se estiver fechado manualmente, indicar isso
            if (!status.isManuallyOpen) {
                message = 'Temporariamente fechado';
            }
            // Se estiver fora do horário de funcionamento
            else if (!status.isScheduleOpen) {
                message = 'Fora do horário';
            }
            
            statusElement.innerHTML = message;
            statusElement.className = 'partner-status closed';
        }
    } catch (error) {
        // Em caso de erro, mostrar como status desconhecido
        statusElement.innerHTML = 'Status desconhecido';
        statusElement.className = 'partner-status unknown';
    }
}

// Função para verificar e atualizar o status de todos os restaurantes na página
function updateAllRestaurantsStatus() {
    const partnerCards = document.querySelectorAll('.partner-card');
    
    partnerCards.forEach(card => {
        const partnerId = card.dataset.partnerId;
        const statusElement = card.querySelector('.partner-status');
        
        if (partnerId && statusElement) {
            // Verificar o status deste restaurante específico
            checkRestaurantStatus(partnerId).then(status => {
                if (status.isOpen) {
                    statusElement.innerHTML = 'Aberto';
                    statusElement.className = 'partner-status open';
                } else {
                    statusElement.innerHTML = 'Fechado';
                    statusElement.className = 'partner-status closed';
                }
            }).catch(error => {
                console.error('Erro ao verificar status:', error);
                statusElement.innerHTML = 'Status desconhecido';
                statusElement.className = 'partner-status unknown';
            });
        }
    });
}

// Inicializar verificação de status quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Se estivermos na página de listagem de restaurantes
    if (document.querySelector('#partners-grid')) {
        // Atualizar o status de todos os restaurantes após o carregamento
        setTimeout(updateAllRestaurantsStatus, 500);
    }
    
    // Se estivermos na página de detalhes de um restaurante
    const restaurantStatus = document.querySelector('.restaurant-status');
    if (restaurantStatus) {
        const urlParams = new URLSearchParams(window.location.search);
        const partnerId = urlParams.get('partnerId');
        
        if (partnerId) {
            updateRestaurantStatusDisplay(partnerId, 'restaurant-status');
        }
    }
});