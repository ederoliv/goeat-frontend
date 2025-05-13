// Funções principais da página de perfil e inicialização

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe active de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adiciona a classe active ao botão clicado
            button.classList.add('active');
            
            // Mostra o conteúdo da aba correspondente
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');

                // Carrega conteúdo específico da aba, se necessário
                if (tabId === 'orders-history') {
                    loadOrderHistory(); // De profile-history.js
                } else if (tabId === 'addresses') {
                    // Os endereços já são carregados no window.onload,
                    // mas poderia haver uma lógica de recarregar se necessário
                } else if (tabId === 'settings') {
                    setupSettingsTab(); // De profile-config.js
                }
            }
        });
    });
}

function setupProfileButtonEvents() {
    // Botão de adicionar endereço (delegado para profile-addresses.js via onclick no HTML)
    // const addAddressButton = document.querySelector('.add-address-button');
    // if (addAddressButton) {
    //     addAddressButton.addEventListener('click', showAddAddressForm); // De profile-addresses.js
    // }
    
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout); // De profile-config.js
    }
    
    const saveProfileButton = document.querySelector('#profile-info .save-button');
    if (saveProfileButton) {
        saveProfileButton.addEventListener('click', saveProfileChanges); // De profile-details.js
    }
    
    const changePasswordButton = document.querySelector('.change-password-button');
    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', showChangePasswordForm); // De profile-config.js
    }
    
    const deleteAccountButton = document.querySelector('.delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', confirmDeleteAccount); // De profile-config.js
    }
}

// Inicialização da página de perfil
window.onload = function() {
    if (!isAuthenticatedClient()) {
        // Redireciona para a página de login se não estiver autenticado
        // Ajuste o caminho se a estrutura de pastas for diferente
        window.location.href = "../../../loginClient/index.html"; 
    } else {
        // Funções globais/utilitárias como getAuthenticatedClient, API_BASE_URL, show/hideLoadingModal
        // devem estar disponíveis (assumindo que clientSessionHandler.js e utilities.js são carregados antes).

        loadUserProfile();      // De profile-details.js
        loadClientAddresses();  // De profile-addresses.js
        
        setupTabs();
        setupProfileButtonEvents();

        // Garante que a aba de configurações também seja inicializada se for a padrão
        if(document.querySelector('.tab-button[data-tab="settings"].active')) {
            setupSettingsTab();
        }
        if(document.querySelector('.tab-button[data-tab="orders-history"].active')) {
            loadOrderHistory();
        }
    }
};