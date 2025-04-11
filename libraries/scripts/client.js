document.addEventListener('DOMContentLoaded', function() {
    // Mostra loading enquanto carrega os dados
    showLoadingModal();
    
    // Carrega os parceiros
    loadPartners()
        .finally(() => {
            // Esconde o loading quando tudo estiver carregado
            hideLoadingModal();
        });
    
    // Inicializa o campo de busca
    setupSearch();
    
    // Inicializa os filtros de categoria
    setupCategoryFilters();
});

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

// Função para criar o card de parceiro
// Função corrigida para criar o card de parceiro
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
    card.dataset.category = partner.category || '';
    
    // Estrutura HTML do card
    card.innerHTML = `
        <img class="partner-card-image" src="${partner.coverImage || `${root}${routes.assets}foods.png`}" alt="${partner.name}">
        <img class="partner-logo" src="${partner.logo || `${root}${routes.assets}partner.png`}" alt="${partner.name} logo">
        <div class="partner-card-content">
            <div class="partner-card-header">
                <div>
                    <h3 class="partner-card-title">${partner.name}</h3>
                    <p class="partner-card-category">${partner.category || 'Restaurante'}</p>
                </div>
                <div class="partner-card-rating">
                    <i class="fa fa-star"></i>
                    <span>${partner.rating || '4.5'}</span>
                </div>
            </div>
            <div class="partner-card-info">
                <div class="partner-card-delivery">
                    <span class="delivery-time">${partner.deliveryTime || '30-45 min'}</span>
                    <span class="delivery-fee" ${partner.deliveryFee === 0 ? 'style="color: var(--goeat-green);"' : ''}>
                        ${partner.deliveryFee === 0 ? 'Entrega grátis' : `Entrega: R$ ${formatPrice(partner.deliveryFee || 500)}`}
                    </span>
                </div>
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
        showLoadingModal();
        loadPartners().finally(() => hideLoadingModal());
        return;
    }
    
    // Filtra os parceiros pelo nome ou categoria
    const partnerCards = document.querySelectorAll('.partner-card');
    let hasResults = false;
    
    partnerCards.forEach(card => {
        const name = card.querySelector('.partner-card-title').textContent.toLowerCase();
        const category = card.querySelector('.partner-card-category').textContent.toLowerCase();
        
        if (name.includes(query) || category.includes(query)) {
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

// Função para configurar os filtros de categoria
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
        const cardCategory = card.dataset.category.toLowerCase();
        
        if (cardCategory === category.toLowerCase()) {
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

// Função para formatar preço (se não estiver definida em utilities.js)
function formatPrice(price) {
    return (price / 100).toFixed(2).replace('.', ',');
}