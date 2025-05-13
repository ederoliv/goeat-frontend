// Funções relacionadas aos detalhes do perfil do usuário

async function loadUserProfile() {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.token) {
            console.error('Cliente não autenticado ou token inválido');
            window.location.href = "../../../loginClient/index.html";
            return;
        }

        showLoadingModal();

        const response = await fetch(`${API_BASE_URL}/clients`, { // Endpoint para buscar o perfil do cliente logado
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                logoutClient();
                window.location.href = "../../../loginClient/index.html";
                return;
            }
            throw new Error(`Falha ao carregar dados do perfil: ${response.status}`);
        }

        const profileData = await response.json();

        // Preencher cabeçalho do perfil
        document.getElementById('user-name-display').textContent = profileData.name || 'Nome não disponível';
        document.getElementById('user-email-display').textContent = profileData.email || 'Email não disponível';
        document.getElementById('user-phone-display').textContent = profileData.phone || 'Telefone não disponível';

        // Preencher campos do formulário
        document.getElementById('name').value = profileData.name || '';
        document.getElementById('phone').value = profileData.phone || '';
        document.getElementById('birthdate').value = profileData.birthDate || '';
        
        // Preencher e desabilitar email e CPF
        const emailInput = document.getElementById('email');
        const cpfInput = document.getElementById('cpf');

        emailInput.value = profileData.email || '';
        emailInput.disabled = true;
        
        cpfInput.value = profileData.cpf || '';
        cpfInput.disabled = true;


    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao carregar perfil',
            text: 'Não foi possível carregar seus dados. Tente novamente mais tarde.',
            confirmButtonColor: '#06CF90'
        });
    } finally {
        hideLoadingModal();
    }
}

async function saveProfileChanges() {
    try {
        const clientData = getAuthenticatedClient();
        if (!clientData || !clientData.token) {
            throw new Error('Cliente não autenticado ou token inválido.');
        }

        // Obter apenas os dados permitidos pelo DTO ClientUpdateDTO
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const birthDate = document.getElementById('birthdate').value;

        // Validação básica dos campos editáveis
        if (!name.trim() || !phone.trim() || !birthDate) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos obrigatórios',
                text: 'Nome, telefone e data de nascimento são obrigatórios para atualização.',
                confirmButtonColor: '#06CF90'
            });
            return;
        }

        // Montar o DTO para a API
        const clientUpdateDTO = {
            name,
            phone,
            birthDate // O formato YYYY-MM-DD do input type="date" é geralmente aceito por LocalDate no backend
        };

        showLoadingModal();

        // Fazer a requisição PUT para o mesmo endpoint /clients
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${clientData.token}`
            },
            body: JSON.stringify(clientUpdateDTO)
        });

        hideLoadingModal();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Falha ao atualizar o perfil.' }));
            throw new Error(errorData.message || 'Não foi possível atualizar os dados do perfil.');
        }

        const updatedProfile = await response.json(); // A API pode retornar o perfil atualizado

        // Atualizar os dados na sessão local (se o nome for parte dos dados da sessão)
        // e os campos na tela para refletir as mudanças.
        // É uma boa prática recarregar os dados do perfil para garantir consistência.
        
        if (clientData.username !== updatedProfile.name) { 
             clientData.username = updatedProfile.name; // Supondo que 'username' na sessão seja o nome
             // Se você armazena telefone ou data de nascimento na sessão, atualize aqui também.
             setAuthenticatedClient(clientData); // Atualiza a sessão
        }
        
        await loadUserProfile(); // Recarrega todos os dados do perfil da API, incluindo os não editáveis,
                                 // para garantir que a tela esteja sincronizada e os campos desabilitados
                                 // mantenham seus valores corretos.

        Swal.fire({
            icon: 'success',
            title: 'Perfil atualizado!',
            text: 'Seus dados foram atualizados com sucesso.',
            confirmButtonColor: '#06CF90'
        });

    } catch (error) {
        hideLoadingModal();
        console.error('Erro ao salvar alterações do perfil:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao salvar',
            text: error.message || 'Não foi possível salvar as alterações. Tente novamente.',
            confirmButtonColor: '#06CF90'
        });
    }
}