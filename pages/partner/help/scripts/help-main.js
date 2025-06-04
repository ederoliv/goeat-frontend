// Arquivo: pages/partner/help/scripts/help-main.js
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o usuário (parceiro) está autenticado
    const userDataString = sessionStorage.getItem('userData');
    if (!userDataString) {
        console.error('Parceiro não autenticado.');
        window.location.href = '../../loginPartner/index.html'; 
        return;
    }

    const userData = JSON.parse(userDataString);
    
    // Preenche o nome do usuário
    document.getElementById('userName').textContent = userData.name || 'Usuário';

    // Carrega os vídeos tutoriais
    loadHelpVideos();

    // Configura evento de Enter para a busca
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchVideos();
            }
        });
    }
});

/**
 * Dados dos vídeos tutoriais
 */
const helpVideos = [
    {
        id: 1,
        title: 'Acompanhar Pedidos e Histórico',
        description: 'Aprenda a gerenciar pedidos em tempo real usando o sistema kanban, visualizar histórico completo de pedidos e entender os diferentes status de pedidos.',
        url: 'https://youtu.be/H5oVtJs0qPk',
        duration: '3:45',
        category: 'Gestão de Pedidos',
        categoryIcon: 'fa-shopping-cart',
        featured: true,
        keywords: ['pedidos', 'acompanhar', 'kanban', 'histórico', 'status']
    },
    {
        id: 2,
        title: 'Financeiro - Relatórios e Análises',
        description: 'Entenda como acessar seus dados financeiros, gerar relatórios por período personalizado e acompanhar o faturamento diário, semanal e mensal.',
        url: 'https://youtu.be/beHqD9mHy4M',
        duration: '2:30',
        category: 'Financeiro',
        categoryIcon: 'fa-money',
        featured: false,
        keywords: ['financeiro', 'relatórios', 'faturamento', 'vendas', 'período']
    },
    {
        id: 3,
        title: 'Análises e Relatórios Avançados',
        description: 'Descubra como usar os gráficos de vendas, produtos mais vendidos, tipos de entrega e outras métricas importantes para seu negócio.',
        url: 'https://youtu.be/xpW8Z9yerxs',
        duration: '4:15',
        category: 'Análises',
        categoryIcon: 'fa-pie-chart',
        featured: false,
        keywords: ['análises', 'gráficos', 'métricas', 'vendas', 'produtos', 'entrega']
    },
    {
        id: 4,
        title: 'Sistema de Suporte',
        description: 'Saiba como abrir chamados de suporte, acompanhar conversas, enviar mensagens e copiar ID de chamados para referência.',
        url: 'https://youtu.be/XaJzshBNv_E',
        duration: '2:50',
        category: 'Suporte',
        categoryIcon: 'fa-comments',
        featured: false,
        keywords: ['suporte', 'chamados', 'mensagens', 'ajuda', 'contato']
    },
    {
        id: 5,
        title: 'Gerenciamento de Produtos',
        description: 'Aprenda a cadastrar novos produtos, criar e gerenciar categorias, editar informações de produtos e organizar seu cardápio digital.',
        url: 'https://youtu.be/ON_EkrVX4Tg',
        duration: '3:20',
        category: 'Produtos',
        categoryIcon: 'fa-archive',
        featured: false,
        keywords: ['produtos', 'categorias', 'cardápio', 'cadastrar', 'editar', 'gerenciar']
    }
];

/**
 * Carrega e renderiza todos os vídeos tutoriais
 */
function loadHelpVideos() {
    const videosContainer = document.getElementById('videos-list-container');

    if (!videosContainer) {
        console.error('Container de vídeos não encontrado na página.');
        return;
    }

    // Exibe um indicador de carregamento
    videosContainer.innerHTML = `
        <div class="loading-videos">
            <i class="fa fa-spinner fa-pulse"></i>
            <p>Carregando tutoriais...</p>
        </div>
    `;

    // Simula um pequeno delay para mostrar o loading
    setTimeout(() => {
        try {
            // Limpa o container
            videosContainer.innerHTML = '';

            if (helpVideos.length === 0) {
                videosContainer.innerHTML = `
                    <div class="empty-videos">
                        <i class="fa fa-video-camera"></i>
                        <h3>Nenhum tutorial disponível</h3>
                        <p>Os tutoriais estarão disponíveis em breve.</p>
                    </div>
                `;
                return;
            }

            // Renderiza cada vídeo
            helpVideos.forEach(video => {
                renderVideoCard(video, videosContainer);
            });

            // Adiciona seção de dicas rápidas
            addQuickTips(videosContainer);

        } catch (error) {
            console.error('Erro ao carregar vídeos:', error);
            videosContainer.innerHTML = `
                <div class="error-message">
                    <i class="fa fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar tutoriais</h3>
                    <p>Não foi possível carregar os vídeos. Tente novamente.</p>
                    <button class="retry-button" onclick="loadHelpVideos()">
                        <i class="fa fa-refresh"></i> Tentar Novamente
                    </button>
                </div>
            `;
        }
    }, 800);
}

/**
 * Adiciona seção de dicas rápidas ao final
 */
function addQuickTips(container) {
    const quickTips = document.createElement('div');
    quickTips.className = 'quick-tips';
    quickTips.innerHTML = `
        <h3><i class="fa fa-lightbulb-o"></i> Dica Rápida</h3>
        <p>Você pode acessar esses tutoriais a qualquer momento através do menu lateral. 
        Se tiver dúvidas específicas, use nosso sistema de suporte para falar diretamente com nossa equipe!</p>
    `;
    container.appendChild(quickTips);
}

/**
 * Função para pesquisar vídeos
 */
function searchVideos() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    // Se o termo de busca estiver vazio, recarregar todos os vídeos
    if (searchTerm === '') {
        loadHelpVideos();
        return;
    }
    
    // Filtra os vídeos baseado no termo de busca
    const filteredVideos = helpVideos.filter(video => {
        const titleMatch = video.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = video.description.toLowerCase().includes(searchTerm);
        const categoryMatch = video.category.toLowerCase().includes(searchTerm);
        const keywordsMatch = video.keywords.some(keyword => 
            keyword.toLowerCase().includes(searchTerm)
        );
        
        return titleMatch || descriptionMatch || categoryMatch || keywordsMatch;
    });
    
    const videosContainer = document.getElementById('videos-list-container');
    videosContainer.innerHTML = '';
    
    if (filteredVideos.length === 0) {
        videosContainer.innerHTML = `
            <div class="empty-videos">
                <i class="fa fa-search"></i>
                <h3>Nenhum tutorial encontrado</h3>
                <p>Não encontramos tutoriais para "${searchTerm}". Tente outros termos.</p>
                <button class="retry-button" onclick="clearSearch()">
                    <i class="fa fa-list"></i> Ver Todos os Tutoriais
                </button>
            </div>
        `;
        return;
    }
    
    // Renderiza os vídeos filtrados
    filteredVideos.forEach(video => {
        renderVideoCard(video, videosContainer);
    });
}

/**
 * Limpa a busca e mostra todos os vídeos
 */
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    loadHelpVideos();
}

/**
 * Função para atualizar a página
 */
function refreshHelpPage() {
    loadHelpVideos();
    goeatAlert('success', 'Página atualizada com sucesso!');
}

/**
 * Abre um vídeo no YouTube em uma nova aba
 */
function openVideo(url, title) {
    // Confirma se o usuário quer abrir o link
    if (confirm(`Abrir o tutorial "${title}" no YouTube?`)) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

/**
 * Função utilitária para obter a thumbnail do YouTube
 */
function getYouTubeThumbnail(url) {
    try {
        // Extrai o ID do vídeo da URL do YouTube
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        
        if (match && match[2].length === 11) {
            const videoId = match[2];
            return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
    } catch (error) {
        console.error('Erro ao extrair thumbnail do YouTube:', error);
    }
    
    return null;
}

/**
 * Função para extrair ID do vídeo do YouTube
 */
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}