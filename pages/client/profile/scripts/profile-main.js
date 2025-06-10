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

                // Carrega conteúdo específico da aba quando necessário
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
    // Botão de logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout); // De profile-config.js
    }
    
    // Botão de salvar perfil
    const saveProfileButton = document.querySelector('#profile-info .save-button');
    if (saveProfileButton) {
        saveProfileButton.addEventListener('click', saveProfileChanges); // De profile-details.js
    }
    
    // Botão de alterar senha
    const changePasswordButton = document.querySelector('.change-password-button');
    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', showChangePasswordForm); // De profile-config.js
    }
    
    // Botão de excluir conta
    const deleteAccountButton = document.querySelector('.delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', confirmDeleteAccount); // De profile-config.js
    }
}

// Inicialização da página de perfil
window.onload = function() {
    if (!isAuthenticatedClient()) {
        // Redireciona para a página de login se não estiver autenticado
        window.location.href = "../../../loginClient/index.html"; 
    } else {
        // Carrega os dados iniciais necessários
        loadUserProfile();      // De profile-details.js
        loadClientAddresses();  // De profile-addresses.js
        
        // Configura os eventos e navegação
        setupTabs();
        setupProfileButtonEvents();
        setupProfileImageUpload(); // De profile-details.js

        // Configura abas específicas se forem a padrão ativa
        if(document.querySelector('.tab-button[data-tab="settings"].active')) {
            setupSettingsTab(); // De profile-config.js
        }
        
        // Não carrega o histórico automaticamente para melhorar performance
        // Será carregado apenas quando o usuário clicar na aba
    }
};