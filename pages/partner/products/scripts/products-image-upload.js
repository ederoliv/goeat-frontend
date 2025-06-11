/**
 * Arquivo responsável pelo upload de imagens de produtos
 * Funcionalidade similar ao upload de avatar do perfil do cliente
 */

// Variável global para armazenar o CID da imagem atual do produto
let currentProductImageCid = null;

/**
 * Função para configurar o upload de imagem no modal de produtos
 */
function setupProductImageUpload() {
    const imageContainer = document.getElementById('product-image-container');
    const imageInput = document.getElementById('product-image-input');
    const imagePreview = document.getElementById('product-image-preview');
    const imageUploadOverlay = document.getElementById('product-image-upload-overlay');
    const removeImageButton = document.getElementById('remove-image-button');

    if (!imageContainer || !imageInput) return;

    // Evento de clique no container da imagem
    imageContainer.addEventListener('click', () => {
        imageInput.click();
    });

    // Evento de mudança no input de arquivo
    imageInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                await uploadProductImage(file);
            } catch (error) {
                // Erro já tratado na função uploadProductImage
            }
        }
        // Limpar o input para permitir selecionar o mesmo arquivo novamente
        event.target.value = '';
    });

    // Permitir drag and drop
    imageContainer.addEventListener('dragover', (event) => {
        event.preventDefault();
        imageContainer.classList.add('dragover');
    });

    imageContainer.addEventListener('dragleave', () => {
        imageContainer.classList.remove('dragover');
    });

    imageContainer.addEventListener('drop', async (event) => {
        event.preventDefault();
        imageContainer.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            try {
                await uploadProductImage(files[0]);
            } catch (error) {
                // Erro já tratado na função uploadProductImage
            }
        }
    });

    // Evento para remover imagem
    if (removeImageButton) {
        removeImageButton.addEventListener('click', (event) => {
            event.stopPropagation();
            removeProductImage();
        });
    }
}

/**
 * Função para fazer upload da imagem do produto
 */
async function uploadProductImage(file) {
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
                'Authorization': `Bearer ${userData.token}`
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
        currentProductImageCid = uploadResult.cid;

        // Atualizar o campo imageUrl com o CID
        const imageUrlInput = document.getElementById('imageUrlInput');
        if (imageUrlInput) {
            imageUrlInput.value = uploadResult.cid;
        }

        // Atualizar a preview da imagem
        const fileUrl = URL.createObjectURL(file);
        updateProductImagePreview(fileUrl);

        goeatAlert('success', 'Imagem carregada com sucesso!');

        return uploadResult.cid;

    } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        goeatAlert('error', error.message || 'Não foi possível fazer upload da imagem.');
        throw error;
    } finally {
        hideLoadingModal();
    }
}

/**
 * Função para atualizar a preview da imagem do produto
 */
function updateProductImagePreview(imageUrl) {
    const imagePreview = document.getElementById('product-image-preview');
    const imageIcon = document.getElementById('product-image-icon');
    const imageUploadOverlay = document.getElementById('product-image-upload-overlay');
    const removeImageButton = document.getElementById('remove-image-button');
    
    if (imageUrl) {
        if (imagePreview) {
            imagePreview.src = imageUrl;
            imagePreview.style.display = 'block';
        }
        if (imageIcon) {
            imageIcon.style.display = 'none';
        }
        if (imageUploadOverlay) {
            imageUploadOverlay.style.display = 'none';
        }
        if (removeImageButton) {
            removeImageButton.style.display = 'block';
        }
    } else {
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
        if (imageIcon) {
            imageIcon.style.display = 'block';
        }
        if (imageUploadOverlay) {
            imageUploadOverlay.style.display = 'flex';
        }
        if (removeImageButton) {
            removeImageButton.style.display = 'none';
        }
    }
}

/**
 * Função para remover a imagem do produto
 */
function removeProductImage() {
    currentProductImageCid = null;
    
    // Limpar o campo imageUrl
    const imageUrlInput = document.getElementById('imageUrlInput');
    if (imageUrlInput) {
        imageUrlInput.value = '';
    }
    
    // Atualizar a preview
    updateProductImagePreview(null);
    
    goeatAlert('info', 'Imagem removida.');
}

/**
 * Função para carregar uma imagem existente do produto (para edição)
 */
function loadExistingProductImage(imageUrl) {
    if (!imageUrl) {
        updateProductImagePreview(null);
        return;
    }

    // Se for um CID, construir a URL completa
    let fullImageUrl = imageUrl;
    if (imageUrl.startsWith('baf')) {
        // Assumindo que a API serve as imagens em /images/{cid}
        fullImageUrl = `${API_BASE_URL}/images/${imageUrl}`;
    }

    currentProductImageCid = extractCidFromUrl(imageUrl) || imageUrl;
    updateProductImagePreview(fullImageUrl);
}

/**
 * Função para extrair CID de uma URL (caso necessário)
 */
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

/**
 * Função para obter o CID da imagem atual
 */
function getCurrentProductImageCid() {
    return currentProductImageCid;
}

/**
 * Função para resetar o estado da imagem
 */
function resetProductImageState() {
    currentProductImageCid = null;
    updateProductImagePreview(null);
}