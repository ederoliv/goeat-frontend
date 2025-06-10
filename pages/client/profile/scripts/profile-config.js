// Funções relacionadas às configurações da conta

function handleLogout(event) {
    if (event) event.preventDefault(); // Previne o comportamento padrão do link/botão
    
    logoutClient(); // Função de clientSessionHandler.js
    
    // Redireciona para a página de login ou inicial, conforme sua estrutura
    // (Assumindo que 'root' e 'routes.main' ou 'routes.loginClient' estão definidos em routes.js)
    window.location.href = root + (routes.loginClient || '/pages/loginClient/index.html');
}


function showChangePasswordForm() {
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
        confirmButtonText: 'Salvar Nova Senha',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#06CF90',
        preConfirm: async () => {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                Swal.showValidationMessage('Por favor, preencha todos os campos.');
                return false;
            }
            if (newPassword !== confirmPassword) {
                Swal.showValidationMessage('A nova senha e a confirmação não coincidem.');
                return false;
            }
            if (newPassword.length < 6) { // Exemplo de validação de tamanho mínimo
                Swal.showValidationMessage('A nova senha deve ter pelo menos 6 caracteres.');
                return false;
            }

            try {
                const clientData = getAuthenticatedClient();
                if (!clientData || !clientData.token) {
                    Swal.showValidationMessage('Sessão inválida. Faça login novamente.');
                    return false;
                }
                showLoadingModal();
                // Adapte o endpoint e o corpo da requisição conforme sua API
                const response = await fetch(`${API_BASE_URL}/clients/change-password`, { 
                    method: 'POST', // ou PUT/PATCH
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${clientData.token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                hideLoadingModal();
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro ao alterar senha. Verifique sua senha atual.' }));
                    Swal.showValidationMessage(errorData.message);
                    return false;
                }
                return true; 
            } catch (error) {
                hideLoadingModal();
                Swal.showValidationMessage(`Erro: ${error.message}`);
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) { // Verifica se preConfirm retornou true
            Swal.fire({
                icon: 'success',
                title: 'Senha alterada!',
                text: 'Sua senha foi alterada com sucesso.',
                confirmButtonColor: '#06CF90'
            });
        }
    });
}

function confirmDeleteAccount() {
    Swal.fire({
        title: 'Tem certeza?',
        html: "Esta ação não pode ser desfeita! Todos os seus dados serão removidos permanentemente.<br><br><strong>Digite sua senha para confirmar:</strong><input type='password' id='delete-confirm-password' class='swal2-input' placeholder='Sua senha'>",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir minha conta!',
        cancelButtonText: 'Cancelar',
        preConfirm: async () => {
            const password = document.getElementById('delete-confirm-password').value;
            if (!password) {
                Swal.showValidationMessage('Por favor, digite sua senha para confirmar a exclusão.');
                return false;
            }
            try {
                const clientData = getAuthenticatedClient();
                if (!clientData || !clientData.token) {
                    Swal.showValidationMessage('Sessão inválida. Faça login novamente.');
                    return false;
                }
                showLoadingModal();
                // Adapte o endpoint e o corpo da requisição conforme sua API
                const response = await fetch(`${API_BASE_URL}/clients/delete-account`, { 
                    method: 'POST', // ou DELETE, mas POST pode levar senha no corpo
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${clientData.token}`
                    },
                    body: JSON.stringify({ password }) // Enviar senha para confirmação no backend
                });
                hideLoadingModal();
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Erro ao excluir conta. Verifique sua senha.' }));
                    Swal.showValidationMessage(errorData.message);
                    return false;
                }
                return true; 
            } catch (error) {
                hideLoadingModal();
                Swal.showValidationMessage(`Erro: ${error.message}`);
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) { // Verifica se preConfirm retornou true
            logoutClient(); 
            Swal.fire(
                'Conta excluída!',
                'Sua conta foi removida com sucesso.',
                'success'
            ).then(() => {
                window.location.href = root + (routes.main || "/index.html"); 
            });
        }
    });
}

// Configurações da aba de "Configurações" (toggles, etc.)
function setupSettingsTab() {
    // Lógica para os toggles de notificação, etc.
    // Por enquanto, apenas um log, já que não há funcionalidade de API para eles.
    const notificationToggles = document.querySelectorAll('#settings .switch input[type="checkbox"]');
    notificationToggles.forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            console.log(`Configuração de notificação alterada: ${event.target.closest('.settings-option').querySelector('p').textContent} - Novo estado: ${event.target.checked}`);
            // Aqui você chamaria a API para salvar essa preferência
        });
    });
}