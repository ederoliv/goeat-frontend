// Arquivo: pages/partner/help/scripts/help-video-card.js
/**
 * Renderiza um card de vídeo tutorial
 * @param {Object} video - O objeto contendo dados do vídeo
 * @param {HTMLElement} container - O elemento container onde o card será inserido
 */
function renderVideoCard(video, container) {
    // Cria o elemento do card
    const card = document.createElement('div');
    card.className = `video-card ${video.featured ? 'featured' : ''}`;
    card.dataset.videoId = video.id;
    
    // Obtém a thumbnail do YouTube
    const thumbnailUrl = getYouTubeThumbnail(video.url);
    
    // Preenche o conteúdo do card
    card.innerHTML = `
        <div class="video-thumbnail ${!thumbnailUrl ? 'no-thumbnail' : ''}" onclick="openVideo('${video.url}', '${video.title}')">
            ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="${video.title}" loading="lazy">` : ''}
        </div>
        
        <div class="video-content">
            <div class="video-header">
                <h3 class="video-title">${video.title}</h3>
                <div class="video-duration">
                    <i class="fa fa-clock-o"></i>
                    ${video.duration}
                </div>
            </div>
            
            <p class="video-description">${video.description}</p>
            
            <div class="video-footer">
                <div class="video-category">
                    <i class="fa ${video.categoryIcon}"></i>
                    ${video.category}
                </div>
                
                <div class="video-actions">
                    <button class="watch-button" onclick="openVideo('${video.url}', '${video.title}')">
                        <i class="fa fa-play"></i>
                        Assistir
                    </button>
                    <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="external-link" title="Abrir no YouTube">
                        <i class="fa fa-external-link"></i>
                        YouTube
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Adiciona o card ao container
    container.appendChild(card);
    
    // Adiciona evento de clique na thumbnail para reproduzir o vídeo
    const thumbnail = card.querySelector('.video-thumbnail');
    if (thumbnail) {
        thumbnail.addEventListener('click', function() {
            playVideoInModal(video);
        });
    }
}

/**
 * Abre o vídeo em um modal interno (opcional)
 * @param {Object} video - Dados do vídeo
 */
function playVideoInModal(video) {
    // Extrai o ID do vídeo do YouTube
    const videoId = getYouTubeVideoId(video.url);
    
    if (!videoId) {
        // Se não conseguir extrair o ID, abre no YouTube
        openVideo(video.url, video.title);
        return;
    }
    
    // Cria modal para reproduzir o vídeo
    const modal = document.createElement('div');
    modal.className = 'video-modal-overlay';
    modal.id = 'video-modal';
    
    modal.innerHTML = `
        <div class="video-modal-container">
            <div class="video-modal-header">
                <h3>${video.title}</h3>
                <button class="video-modal-close" onclick="closeVideoModal()">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div class="video-modal-content">
                <div class="video-embed-container">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
                        title="${video.title}"
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="video-info">
                    <div class="video-meta">
                        <span class="video-category-tag">
                            <i class="fa ${video.categoryIcon}"></i>
                            ${video.category}
                        </span>
                        <span class="video-duration-tag">
                            <i class="fa fa-clock-o"></i>
                            ${video.duration}
                        </span>
                    </div>
                    <p class="video-full-description">${video.description}</p>
                    <div class="video-actions-modal">
                        <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="open-youtube-link">
                            <i class="fa fa-external-link"></i>
                            Abrir no YouTube
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adiciona estilos do modal se não existirem
    if (!document.getElementById('video-modal-styles')) {
        addVideoModalStyles();
    }
    
    document.body.appendChild(modal);
    
    // Previne scroll do body
    document.body.style.overflow = 'hidden';
    
    // Fecha o modal ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeVideoModal();
        }
    });
    
    // Fecha o modal com ESC
    document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Fecha o modal de vídeo
 */
function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    if (modal) {
        modal.remove();
    }
    
    // Restaura o scroll do body
    document.body.style.overflow = '';
    
    // Remove o listener de ESC
    document.removeEventListener('keydown', handleEscapeKey);
}

/**
 * Manipula a tecla ESC para fechar o modal
 */
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeVideoModal();
    }
}

/**
 * Adiciona estilos CSS para o modal de vídeo
 */
function addVideoModalStyles() {
    const style = document.createElement('style');
    style.id = 'video-modal-styles';
    style.textContent = `
        .video-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .video-modal-container {
            background-color: white;
            border-radius: 12px;
            width: 90%;
            max-width: 900px;
            max-height: 90%;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from { 
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to { 
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        .video-modal-header {
            background-color: var(--goeat-primary);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .video-modal-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .video-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
        }
        
        .video-modal-close:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        .video-modal-content {
            padding: 0;
        }
        
        .video-embed-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            background: #000;
        }
        
        .video-embed-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .video-info {
            padding: 20px;
        }
        
        .video-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .video-category-tag,
        .video-duration-tag {
            display: flex;
            align-items: center;
            gap: 5px;
            background-color: #f8f9fa;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            color: #666;
            font-weight: 500;
        }
        
        .video-category-tag i {
            color: var(--goeat-primary);
        }
        
        .video-duration-tag i {
            color: var(--goeat-blue);
        }
        
        .video-full-description {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .video-actions-modal {
            display: flex;
            justify-content: center;
        }
        
        .open-youtube-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: var(--goeat-primary);
            text-decoration: none;
            font-weight: 500;
            padding: 8px 16px;
            border: 1px solid var(--goeat-primary);
            border-radius: 6px;
            transition: all 0.3s;
        }
        
        .open-youtube-link:hover {
            background-color: var(--goeat-primary);
            color: white;
        }
        
        @media (max-width: 768px) {
            .video-modal-overlay {
                padding: 10px;
            }
            
            .video-modal-container {
                width: 100%;
                max-height: 95%;
            }
            
            .video-modal-header {
                padding: 12px 15px;
            }
            
            .video-modal-header h3 {
                font-size: 16px;
            }
            
            .video-info {
                padding: 15px;
            }
            
            .video-meta {
                flex-direction: column;
                gap: 8px;
            }
            
            .video-category-tag,
            .video-duration-tag {
                align-self: flex-start;
            }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * Filtra os cards de vídeo com base em um termo de busca
 * @param {string} searchTerm - O termo de busca
 */
function filterVideoCards(searchTerm) {
    const videoCards = document.querySelectorAll('.video-card');
    let hasResults = false;
    
    videoCards.forEach(card => {
        const title = card.querySelector('.video-title').textContent.toLowerCase();
        const description = card.querySelector('.video-description').textContent.toLowerCase();
        const category = card.querySelector('.video-category').textContent.toLowerCase();
        
        // Verifica se algum dos textos contém o termo de busca
        if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
            card.style.display = 'flex';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    return hasResults;
}