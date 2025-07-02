document.addEventListener('DOMContentLoaded', function() {
    // Mostra loading enquanto carrega os dados
    showLoadingModal();
    
    if(isAuthenticatedClient()){
        // Se o usuário estiver autenticado, atualiza o navbar
        setAuthenticatedNavbar();
    }
    
    // Inicializa o campo de busca
    setupSearch();
    
    // Primeiro carregamos todas as categorias disponíveis da API
    loadAllCategories()
        .then(() => {
            // Depois carregamos os parceiros
            return loadPartners();
        })
        .finally(() => {
            // Esconde o loading quando tudo estiver carregado
            hideLoadingModal();
        });
});

// Função para carregar todas as categorias de restaurante da API
async function loadAllCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/restaurant-categories`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar categorias de restaurantes');
        }
        
        const categories = await response.json();
        
        // Configura as categorias na interface
        setupCategoriesFromAPI(categories);
        
        // Armazena as categorias para uso posterior
        window.allRestaurantCategories = categories;
        
        return categories;
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Em caso de erro, use as categorias estáticas fallback
        setupCategoryFilters();
        return [];
    }
}

// Função para extrair categorias únicas dos parceiros
function extractUniqueCategories(partners) {
    const categoriesMap = new Map(); // Usamos Map para evitar duplicatas
    
    // Percorre todos os parceiros
    partners.forEach(partner => {
        // Verifica se o parceiro tem categorias
        if (partner.categories && Array.isArray(partner.categories) && partner.categories.length > 0) {
            // Adiciona cada categoria ao Map
            partner.categories.forEach(category => {
                // Usamos o ID como chave para garantir unicidade
                categoriesMap.set(category.id, category);
            });
        }
    });
    
    // Converte o Map para um array de categorias
    return Array.from(categoriesMap.values());
}

// Não precisamos mais fazer uma requisição separada para categorias
// já que elas estão incluídas na resposta dos parceiros

// Função para configurar as categorias a partir da API
function setupCategoriesFromAPI(apiCategories) {
    // Cria os filtros de categoria se não existirem
    const container = document.getElementById('container');
    const searchContainer = container.querySelector('.search-container');
    
    // Verifica se os filtros já existem
    if (container.querySelector('.categories')) {
        container.querySelector('.categories').remove();
    }
    
    // Cria os filtros
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'categories';
    
    // Adiciona a categoria "Todos" primeiro
    const allPill = document.createElement('span');
    allPill.className = 'category-pill active';
    allPill.textContent = 'Todos';
    allPill.dataset.category = 'Todos';
    
    allPill.addEventListener('click', () => {
        // Remove a classe active de todos os pills
        document.querySelectorAll('.category-pill').forEach(p => {
            p.classList.remove('active');
        });
        
        // Adiciona a classe active ao pill clicado
        allPill.classList.add('active');
        
        // Mostra todos os parceiros
        filterByCategory('Todos');
    });
    
    categoriesContainer.appendChild(allPill);
    
    // Adiciona as categorias da API
    apiCategories.forEach(category => {
        const pill = document.createElement('span');
        pill.className = 'category-pill';
        pill.textContent = category.name;
        pill.dataset.category = category.name;
        pill.dataset.categoryId = category.id;
        
        pill.addEventListener('click', () => {
            // Remove a classe active de todos os pills
            document.querySelectorAll('.category-pill').forEach(p => {
                p.classList.remove('active');
            });
            
            // Adiciona a classe active ao pill clicado
            pill.classList.add('active');
            
            // Filtra os parceiros pela categoria
            filterByCategory(category.name);
        });
        
        categoriesContainer.appendChild(pill);
    });
    
    // Insere após o campo de busca
    if (searchContainer) {
        searchContainer.parentNode.insertBefore(categoriesContainer, searchContainer.nextSibling);
    } else {
        const h1 = container.querySelector('h1');
        h1.parentNode.insertBefore(categoriesContainer, h1.nextSibling);
    }
}

// Função para carregar os parceiros
async function loadPartners() {
    try {
        const response = await fetch(`${API_BASE_URL}/partners`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar parceiros');
        }
        
        const data = await response.json();
        
        // Se não houver parceiros, mostra mensagem
        if (data.length === 0) {
            showNoPartnersMessage();
            return;
        }
        
        // Renderiza os parceiros
        renderPartners(data);
        
    } catch (error) {
        console.error('Erro ao carregar parceiros:', error);
        showErrorMessage();
        
        // Em caso de erro, pelo menos tentar configurar os filtros de categoria padrão
        setupCategoryFilters();
    }
}

// Função para renderizar os parceiros
function renderPartners(partners) {
    const container = document.getElementById('partners-grid');
    container.innerHTML = '';
    
    // Se não houver parceiros, mostra mensagem
    if (partners.length === 0) {
        showNoResultsMessage();
        return;
    }
    
    // Adiciona cada parceiro
    partners.forEach(partner => {
        createPartnerCard(partner, container);
    });
}

// Função para criar o card de parceiro - MODIFICADA para trabalhar com o novo formato
function createPartnerCard(partner, container) {
    // Primeiro, remova qualquer card existente com o mesmo ID para evitar duplicação
    const existingCard = document.querySelector(`.partner-card[data-partner-id="${partner.id}"]`);
    if (existingCard) {
        existingCard.remove();
    }
    
    // Cria o elemento do card
    const card = document.createElement('div');
    card.className = 'partner-card';
    card.dataset.partnerId = partner.id;
    
    // Armazena as categorias como atributos data para facilitar a filtragem
    if (partner.categories && Array.isArray(partner.categories) && partner.categories.length > 0) {
        // Armazena os IDs de categoria como uma lista separada por vírgulas
        const categoryIds = partner.categories.map(cat => cat.id).join(',');
        card.dataset.categoryIds = categoryIds;
        
        // Armazena os nomes de categoria para exibição e filtragem por texto
        const categoryNames = partner.categories.map(cat => cat.name).join(',');
        card.dataset.categoryNames = categoryNames;
        
        // Para compatibilidade com código existente
        card.dataset.category = partner.categories[0]?.name || '';
    } else {
        card.dataset.categoryIds = '';
        card.dataset.categoryNames = '';
        card.dataset.category = '';
    }
    
    // Usa a imagem do parceiro ou fallback para partner.png
    const partnerImage = partner.imageUrl || partner.logo || `${root}${routes.assets}partner.png`;
    
    // Obter a primeira categoria para exibição (se existir)
    const displayCategory = partner.categories && partner.categories.length > 0 
        ? partner.categories[0].name 
        : 'Restaurante';
    
    // Estrutura HTML do card
    card.innerHTML = `
        <img class="partner-logo" src="${partnerImage}" alt="${partner.name} logo">
        <div class="partner-card-content">
            <div class="partner-card-header">
                <div>
                    <h3 class="partner-card-title">${partner.name}</h3>
                    <p class="partner-card-category">${displayCategory}</p>
                </div>
            </div>
            <div class="partner-card-info">
                <span class="partner-status ${partner.isOpen ? 'open' : 'closed'}">
                    ${partner.isOpen ? 'Aberto' : 'Fechado'}
                </span>
            </div>
        </div>
    `;
    
    // Adiciona o card ao container
    container.appendChild(card);
    
    // Adiciona evento de clique para ir para a página do parceiro
    card.addEventListener('click', () => {
        window.location.href = `${routes.store}?partnerId=${partner.id}`;
    });
    
    return card;
}

// Função auxiliar para formatar preço
function formatPrice(price) {
    if (typeof window.formatPrice === 'function') {
        return window.formatPrice(price);
    }
    return (price / 100).toFixed(2).replace('.', ',');
}

// Função para mostrar mensagem de nenhum parceiro encontrado
function showNoPartnersMessage() {
    const container = document.getElementById('partners-grid');
    
    const message = document.createElement('div');
    message.className = 'no-results';
    
    const icon = document.createElement('i');
    icon.className = 'fa fa-store-slash';
    
    const title = document.createElement('h3');
    title.textContent = 'Nenhum restaurante disponível';
    
    const text = document.createElement('p');
    text.textContent = 'No momento não há restaurantes cadastrados. Volte mais tarde!';
    
    message.append(icon, title, text);
    container.innerHTML = '';
    container.appendChild(message);
}

// Função para mostrar mensagem de nenhum resultado encontrado
function showNoResultsMessage() {
    const container = document.getElementById('partners-grid');
    
    const message = document.createElement('div');
    message.className = 'no-results';
    
    const icon = document.createElement('i');
    icon.className = 'fa fa-search';
    
    const title = document.createElement('h3');
    title.textContent = 'Nenhum resultado encontrado';
    
    const text = document.createElement('p');
    text.textContent = 'Tente outros termos ou filtros para encontrar o que procura.';
    
    message.append(icon, title, text);
    container.innerHTML = '';
    container.appendChild(message);
}

// Função para mostrar mensagem de erro
function showErrorMessage() {
    const container = document.getElementById('partners-grid');
    
    const message = document.createElement('div');
    message.className = 'no-results';
    
    const icon = document.createElement('i');
    icon.className = 'fa fa-exclamation-triangle';
    
    const title = document.createElement('h3');
    title.textContent = 'Erro ao carregar restaurantes';
    
    const text = document.createElement('p');
    text.textContent = 'Ocorreu um erro ao carregar os restaurantes. Tente novamente mais tarde.';
    
    const button = document.createElement('button');
    button.className = 'action-button';
    button.textContent = 'Tentar novamente';
    button.addEventListener('click', () => {
        showLoadingModal();
        loadPartners().finally(() => hideLoadingModal());
    });
    
    message.append(icon, title, text, button);
    container.innerHTML = '';
    container.appendChild(message);
}

// Função para configurar o campo de busca
function setupSearch() {
    // Cria o campo de busca se não existir
    const container = document.getElementById('container');
    const h1 = container.querySelector('h1');
    
    // Verifica se o campo de busca já existe
    if (container.querySelector('.search-container')) return;
    
    // Cria o campo de busca
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Buscar restaurantes...';
    
    const searchButton = document.createElement('button');
    searchButton.className = 'search-button';
    
    const searchIcon = document.createElement('i');
    searchIcon.className = 'fa fa-search';
    
    searchButton.appendChild(searchIcon);
    searchContainer.append(searchInput, searchButton);
    
    // Insere após o título
    h1.parentNode.insertBefore(searchContainer, h1.nextSibling);
    
    // Adiciona evento de busca
    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
}

// Função para realizar a busca
function performSearch(query) {
    query = query.trim().toLowerCase();
    
    // Se a query estiver vazia, mostra todos os parceiros
    if (query === '') {
        document.querySelectorAll('.partner-card').forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    // Filtra os parceiros pelo nome ou categoria
    const partnerCards = document.querySelectorAll('.partner-card');
    let hasResults = false;
    
    partnerCards.forEach(card => {
        const name = card.querySelector('.partner-card-title').textContent.toLowerCase();
        const categories = card.dataset.categoryNames?.toLowerCase() || '';
        
        if (name.includes(query) || categories.includes(query)) {
            card.style.display = 'block';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Se não houver resultados, mostra mensagem
    if (!hasResults) {
        showNoResultsMessage();
    }
}

// Função para configurar os filtros de categoria (versão original como fallback)
function setupCategoryFilters() {
    // Cria os filtros de categoria se não existirem
    const container = document.getElementById('container');
    const searchContainer = container.querySelector('.search-container');
    
    // Verifica se os filtros já existem
    if (container.querySelector('.categories')) return;
    
    // Categorias disponíveis
    const availableCategories = [
        'Todos', 'Lanches', 'Pizzas', 'Brasileira', 'Japonesa', 
        'Chinesa', 'Italiana', 'Vegetariana', 'Doces', 'Bebidas'
    ];
    
    // Cria os filtros
    const categoriesContainer = document.createElement('div');
    categoriesContainer.className = 'categories';
    
    availableCategories.forEach(category => {
        const pill = document.createElement('span');
        pill.className = category === 'Todos' ? 'category-pill active' : 'category-pill';
        pill.textContent = category;
        pill.dataset.category = category;
        
        pill.addEventListener('click', () => {
            // Remove a classe active de todos os pills
            document.querySelectorAll('.category-pill').forEach(p => {
                p.classList.remove('active');
            });
            
            // Adiciona a classe active ao pill clicado
            pill.classList.add('active');
            
            // Filtra os parceiros pela categoria
            filterByCategory(category);
        });
        
        categoriesContainer.appendChild(pill);
    });
    
    // Insere após o campo de busca
    if (searchContainer) {
        searchContainer.parentNode.insertBefore(categoriesContainer, searchContainer.nextSibling);
    } else {
        const h1 = container.querySelector('h1');
        h1.parentNode.insertBefore(categoriesContainer, h1.nextSibling);
    }
}

// Função para filtrar por categoria
function filterByCategory(category) {
    // Se a categoria for 'Todos', mostra todos os parceiros
    if (category === 'Todos') {
        document.querySelectorAll('.partner-card').forEach(card => {
            card.style.display = 'block';
        });
        return;
    }
    
    // Filtra os parceiros pela categoria
    const partnerCards = document.querySelectorAll('.partner-card');
    let hasResults = false;
    
    partnerCards.forEach(card => {
        // Verifica se o card tem as categorias no dataset
        const categoryNames = card.dataset.categoryNames || '';
        
        // Se o restaurante não tem categoria ou a categoria é vazia, 
        // NÃO mostraremos ele nas pesquisas filtradas por categoria específica
        if (!categoryNames || categoryNames === '') {
            card.style.display = 'none';
            return;
        }
        
        // Verifica se a categoria selecionada está na lista de categorias do restaurante
        if (categoryNames.toLowerCase().includes(category.toLowerCase())) {
            card.style.display = 'block';
            hasResults = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Se não houver resultados, mostra mensagem
    if (!hasResults) {
        showNoResultsMessage();
    }
}