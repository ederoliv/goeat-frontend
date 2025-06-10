// Funções relacionadas aos detalhes do perfil do usuário

// Variável global para armazenar o CID da imagem atual
let currentProfileImageCid = null;

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

        // Carregar foto do perfil se existir
        if (profileData.profileImageUrl) {
            updateProfileAvatar(profileData.profileImageUrl);
            // Extrair o CID da URL se necessário (caso a API retorne URL completa)
            // Se a API retornar apenas o CID, use diretamente
            currentProfileImageCid = extractCidFromUrl(profileData.profileImageUrl) || profileData.profileImageUrl;
        }

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

// Função para extrair CID de uma URL (caso necessário)
function extractCidFromUrl(url) {
    if (!url) return null;
    
    // Se já for um CID (começar com "baf"), retorna como está
    if (url.startsWith('baf')) {
        return url;
    }
    
    // Se for uma URL, tenta extrair o CID
    const cidMatch = url.match(/baf[a-z0-9]+/);
    return cidMatch ? cidMatch[0] : null;
}

// Função para atualizar o avatar do perfil
function updateProfileAvatar(imageUrl) {
    const avatarImage = document.getElementById('profile-avatar-image');
    const avatarIcon = document.getElementById('profile-avatar-icon');
    
    if (imageUrl) {
        avatarImage.src = imageUrl;
        avatarImage.style.display = 'block';
        avatarIcon.style.display = 'none';
    } else {
        avatarImage.style.display = 'none';
        avatarIcon.style.display = 'block';
    }
}

// Função para fazer upload da imagem de perfil
async function uploadProfileImage(file) {
    try {
        showLoadingModal();
        
        // Validar tipo de arquivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            throw new Error('Formato de arquivo não suportado. Use: JPG, JPEG, PNG, WEBP, GIF ou BMP.');
        }

        // Validar tamanho do arquivo (máximo 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error('Arquivo muito grande. O tamanho máximo é 5MB.');
        }

        // Criar FormData
        const formData = new FormData();
        formData.append('file', file);

        // Fazer upload para a API
        const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${clientData.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Falha ao fazer upload da imagem.' }));
            throw new Error(errorData.message || 'Falha ao fazer upload da imagem.');
        }

        const uploadResult = await response.json();
        
        if (!uploadResult.cid) {
            throw new Error('Resposta inválida do servidor.');
        }

        // Armazenar o CID para uso posterior
        currentProfileImageCid = uploadResult.cid;

        // Atualizar a imagem temporariamente com uma URL local (preview)
        const fileUrl = URL.createObjectURL(file);
        updateProfileAvatar(fileUrl);

        Swal.fire({
            icon: 'success',
            title: 'Imagem carregada!',
            text: 'Sua foto foi carregada. Clique em "Salvar alterações" para confirmar.',
            confirmButtonColor: '#06CF90'
        });

        return uploadResult.cid;

    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro no upload',
            text: error.message || 'Não foi possível fazer upload da imagem.',
            confirmButtonColor: '#06CF90'
        });
        throw error;
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
            birthDate, // O formato YYYY-MM-DD do input type="date" é geralmente aceito por LocalDate no backend
            profileImage: currentProfileImageCid // Adicionar o CID da imagem se houver
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

// Configurar eventos de upload de imagem
function setupProfileImageUpload() {
    const avatarContainer = document.getElementById('profile-avatar-container');
    const imageInput = document.getElementById('profile-image-input');

    // Evento de clique no container do avatar
    avatarContainer.addEventListener('click', () => {
        imageInput.click();
    });

    // Evento de mudança no input de arquivo
    imageInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                await uploadProfileImage(file);
            } catch (error) {
                // Erro já tratado na função uploadProfileImage
            }
        }
        // Limpar o input para permitir selecionar o mesmo arquivo novamente
        event.target.value = '';
    });

    // Permitir drag and drop
    avatarContainer.addEventListener('dragover', (event) => {
        event.preventDefault();
        avatarContainer.classList.add('dragover');
    });

    avatarContainer.addEventListener('dragleave', () => {
        avatarContainer.classList.remove('dragover');
    });

    avatarContainer.addEventListener('drop', async (event) => {
        event.preventDefault();
        avatarContainer.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            try {
                await uploadProfileImage(files[0]);
            } catch (error) {
                // Erro já tratado na função uploadProfileImage
            }
        }
    });
}