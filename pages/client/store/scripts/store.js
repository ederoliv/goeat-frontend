window.onload = function () {

    if(isAuthenticatedClient()){
        // Se o usuário estiver autenticado, atualiza o navbar
        setAuthenticatedNavbar();
    }
    
    // Mostra loading enquanto carrega os dados
    showLoadingModal();
    
    // Obtém o partnerId da URL
    const partnerId = getPartnerId();
    
    // Valida se temos um partnerId válido
    if (!partnerId) {
        hideLoadingModal();
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Restaurante não encontrado!',
            confirmButtonColor: '#06CF90'
        }).then(() => {
            window.location.href = '../index.html';
        });
        return;
    }

    // Carrega os dados do parceiro
    loadPartnerData(partnerId)
        .then(() => {
            // Carrega os produtos do parceiro
            return listPartnerProducts(partnerId);
        })
        .finally(() => {
            // Esconde o loading quando tudo estiver carregado
            hideLoadingModal();
        });
}

// Função para obter o partnerId da URL
function getPartnerId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('partnerId');
}

// REQUISIÇÕES PARA API
async function loadPartnerData(partnerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/partners/${partnerId}/details`);
        
        if (!response.ok) {
            throw new Error('Erro na requisição');
        }

        const data = await response.json();
        
        // Atualiza o título da página e o nome do parceiro
        document.getElementById("partner-name").textContent = data.name;
        document.title = data.name;
        
        // Se houver uma imagem do parceiro, atualiza
        if (data.logo) {
            document.getElementById("partner-logo").src = data.logo;
        }
        
        // Cria a seção detalhada de informações do parceiro
        createDetailedPartnerInfo(data);

    } catch (error) {
        console.error('Erro ao carregar dados do parceiro:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao carregar dados',
            text: 'Não foi possível carregar as informações do restaurante.',
            confirmButtonColor: '#06CF90'
        });
    }
}

// Função para criar a seção detalhada de informações do parceiro
function createDetailedPartnerInfo(partnerData) {
    const storeHeader = document.querySelector('.store-header');
    
    // Remove qualquer informação anterior
    const existingInfo = storeHeader.querySelector('.store-detailed-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Cria container principal das informações detalhadas
    const detailedInfo = document.createElement('div');
    detailedInfo.className = 'store-detailed-info';
    
    // Status de funcionamento (aberto/fechado)
    const statusContainer = createPartnerStatus(partnerData.isOpen, partnerData.operatingHours);
    detailedInfo.appendChild(statusContainer);
    
    // Endereço completo se disponível
    if (partnerData.fullAddress) {
        const addressSection = createAddressSection(partnerData.fullAddress);
        detailedInfo.appendChild(addressSection);
    }
    
    // Horários de funcionamento
    if (partnerData.operatingHours && Array.isArray(partnerData.operatingHours) && partnerData.operatingHours.length > 0) {
        const hoursSection = createOperatingHoursSection(partnerData.operatingHours);
        if (hoursSection) { // Só adiciona se a seção foi criada com sucesso
            detailedInfo.appendChild(hoursSection);
        }
    }
    
    // Adiciona as informações detalhadas após o nome do parceiro
    const partnerName = document.getElementById('partner-name');
    partnerName.parentNode.insertBefore(detailedInfo, partnerName.nextSibling);
}

// Função para criar o status do parceiro (atualizada)
function createPartnerStatus(isOpen, operatingHours) {
    const statusContainer = document.createElement('div');
    statusContainer.className = 'store-status-container';
    
    const storeStatus = document.createElement('div');
    storeStatus.className = isOpen ? 'store-status open' : 'store-status closed';
    
    const statusIcon = document.createElement('i');
    statusIcon.className = isOpen ? 'fa fa-check-circle' : 'fa fa-clock-o';
    
    const statusText = document.createElement('span');
    
    if (isOpen) {
        statusText.textContent = 'Aberto agora';
        
        // Se estiver aberto e tiver horários, mostra quando fecha hoje
        if (operatingHours && Array.isArray(operatingHours)) {
            const todayHours = getTodayOperatingHours(operatingHours);
            if (todayHours && todayHours.isOpen && todayHours.closingTime) {
                try {
                    const currentTime = new Date();
                    const closingTime = parseTime(todayHours.closingTime);
                    
                    if (currentTime < closingTime) {
                        statusText.textContent += ` • Fecha às ${todayHours.closingTime}`;
                    }
                } catch (error) {
                    console.warn('Erro ao processar horário de fechamento:', error);
                }
            }
        }
    } else {
        statusText.textContent = 'Fechado no momento';
        
        // Se estiver fechado e tiver horários, mostra quando abre novamente
        if (operatingHours && Array.isArray(operatingHours)) {
            const nextOpenTime = getNextOpenTime(operatingHours);
            if (nextOpenTime) {
                statusText.textContent += ` • ${nextOpenTime}`;
            }
        }
    }
    
    storeStatus.appendChild(statusIcon);
    storeStatus.appendChild(statusText);
    statusContainer.appendChild(storeStatus);
    
    return statusContainer;
}

// Função para criar seção do endereço
function createAddressSection(fullAddress) {
    const addressSection = document.createElement('div');
    addressSection.className = 'store-address-section';
    
    const addressIcon = document.createElement('i');
    addressIcon.className = 'fa fa-map-marker';
    
    const addressText = document.createElement('span');
    addressText.textContent = fullAddress;
    
    addressSection.appendChild(addressIcon);
    addressSection.appendChild(addressText);
    
    return addressSection;
}

// Função para criar seção de horários de funcionamento
function createOperatingHoursSection(operatingHours) {
    // Validação adicional
    if (!operatingHours || !Array.isArray(operatingHours) || operatingHours.length === 0) {
        return null; // Retorna null se não houver horários válidos
    }

    const hoursSection = document.createElement('div');
    hoursSection.className = 'store-hours-section';
    
    const hoursHeader = document.createElement('div');
    hoursHeader.className = 'store-hours-header';
    
    const hoursIcon = document.createElement('i');
    hoursIcon.className = 'fa fa-clock-o';
    
    const hoursTitle = document.createElement('span');
    hoursTitle.textContent = 'Horários de funcionamento';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'hours-toggle-button';
    toggleButton.innerHTML = '<i class="fa fa-chevron-down"></i>';
    
    hoursHeader.appendChild(hoursIcon);
    hoursHeader.appendChild(hoursTitle);
    hoursHeader.appendChild(toggleButton);
    
    const hoursList = document.createElement('div');
    hoursList.className = 'store-hours-list';
    hoursList.style.display = 'none'; // Inicialmente oculto
    
    // Mapear dias da semana para português
    const daysMap = {
        'MONDAY': 'Segunda-feira',
        'TUESDAY': 'Terça-feira',
        'WEDNESDAY': 'Quarta-feira',
        'THURSDAY': 'Quinta-feira',
        'FRIDAY': 'Sexta-feira',
        'SATURDAY': 'Sábado',
        'SUNDAY': 'Domingo'
    };
    
    // Adiciona cada dia da semana
    operatingHours.forEach(day => {
        const dayItem = document.createElement('div');
        dayItem.className = 'store-hours-day';
        
        const dayName = document.createElement('span');
        dayName.className = 'day-name';
        dayName.textContent = daysMap[day.dayOfWeek] || day.dayOfWeek;
        
        const dayHours = document.createElement('span');
        dayHours.className = 'day-hours';
        
        if (day.isOpen) {
            dayHours.textContent = `${day.openingTime} - ${day.closingTime}`;
            dayHours.classList.add('open');
        } else {
            dayHours.textContent = 'Fechado';
            dayHours.classList.add('closed');
        }
        
        // Destaca o dia atual
        if (isToday(day.dayOfWeek)) {
            dayItem.classList.add('today');
        }
        
        dayItem.appendChild(dayName);
        dayItem.appendChild(dayHours);
        hoursList.appendChild(dayItem);
    });
    
    // Evento para expandir/contrair horários
    hoursHeader.addEventListener('click', () => {
        const isHidden = hoursList.style.display === 'none';
        hoursList.style.display = isHidden ? 'block' : 'none';
        
        const chevron = toggleButton.querySelector('i');
        chevron.className = isHidden ? 'fa fa-chevron-up' : 'fa fa-chevron-down';
    });
    
    hoursSection.appendChild(hoursHeader);
    hoursSection.appendChild(hoursList);
    
    return hoursSection;
}

// Funções auxiliares para trabalhar com horários
function getTodayOperatingHours(operatingHours) {
    // Validação de entrada
    if (!operatingHours || !Array.isArray(operatingHours)) {
        console.warn('operatingHours is not a valid array');
        return null;
    }
    
    const today = new Date().getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayName = dayNames[today];
    
    return operatingHours.find(day => day && day.dayOfWeek === todayName) || null;
}

function getNextOpenTime(operatingHours) {
    // Validação de entrada
    if (!operatingHours || !Array.isArray(operatingHours)) {
        console.warn('operatingHours is not a valid array');
        return null;
    }
    
    const today = new Date().getDay();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    
    // Procura pelo próximo dia aberto
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (today + i) % 7;
        const nextDayName = dayNames[nextDayIndex];
        const nextDay = operatingHours.find(day => day && day.dayOfWeek === nextDayName);
        
        if (nextDay && nextDay.isOpen && nextDay.openingTime) {
            const dayLabel = i === 1 ? 'Amanhã' : 
                            i === 7 ? 'Próximo ' + getDayName(nextDayName) :
                            getDayName(nextDayName);
            return `Abre ${dayLabel} às ${nextDay.openingTime}`;
        }
    }
    
    return null;
}

function parseTime(timeString) {
    if (!timeString || typeof timeString !== 'string') {
        console.warn('Invalid time string:', timeString);
        return new Date(); // Retorna data atual como fallback
    }
    
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            throw new Error('Invalid time format');
        }
        
        const time = new Date();
        time.setHours(hours, minutes, 0, 0);
        return time;
    } catch (error) {
        console.warn('Error parsing time:', timeString, error);
        return new Date(); // Retorna data atual como fallback
    }
}

function isToday(dayOfWeek) {
    if (!dayOfWeek || typeof dayOfWeek !== 'string') {
        return false;
    }
    
    const today = new Date().getDay();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return dayNames[today] === dayOfWeek;
}

function getDayName(dayOfWeek) {
    const daysMap = {
        'MONDAY': 'Segunda-feira',
        'TUESDAY': 'Terça-feira',
        'WEDNESDAY': 'Quarta-feira',
        'THURSDAY': 'Quinta-feira',
        'FRIDAY': 'Sexta-feira',
        'SATURDAY': 'Sábado',
        'SUNDAY': 'Domingo'
    };
    return daysMap[dayOfWeek] || dayOfWeek;
}


// Função para listar as categorias e produtos do parceiro
async function listPartnerProducts(partnerId) {
    const container = document.querySelector('#container-products');

    try {
        // Primeiro, busca as categorias do restaurante
        const categoriesResponse = await fetch(`${API_BASE_URL}/menus/${partnerId}/categories`);
        let categories = [];
        
        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
        }

        // Depois, busca os produtos
        const productsResponse = await fetch(`${API_BASE_URL}/partners/${partnerId}/products`);

        if (!productsResponse.ok) {
            throw new Error('Erro ao carregar produtos');
        }

        const products = await productsResponse.json();
        
        // Se não houver produtos, mostra mensagem
        if (products.length === 0) {
            container.innerHTML = '<p class="error-message">Este restaurante ainda não possui produtos cadastrados.</p>';
            return;
        }

        // Limpa o container
        container.innerHTML = '';
        
        // Se há categorias específicas do restaurante, usa essas; senão, agrupa por categoria dos produtos
        if (categories.length > 0) {
            // Organiza produtos pelas categorias específicas do restaurante
            organizeProductsByRestaurantCategories(products, categories, container);
        } else {
            // Fallback: agrupa produtos por suas próprias categorias
            const productsByCategory = groupProductsByCategory(products);
            displayProductsByCategory(productsByCategory, container);
        }

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    }
}

// Função para organizar produtos pelas categorias específicas do restaurante
function organizeProductsByRestaurantCategories(products, categories, container) {
    // Cria um mapa de produtos por categoria
    const productsMap = new Map();
    
    // Inicializa o mapa com as categorias do restaurante
    categories.forEach(category => {
        productsMap.set(category.id, {
            name: category.name,
            products: []
        });
    });
    
    // Adiciona categoria para produtos sem categoria específica
    productsMap.set(null, {
        name: 'Outros',
        products: []
    });
    
    // Distribui os produtos pelas categorias
    products.forEach(product => {
        const categoryId = product.categoryId;
        
        if (productsMap.has(categoryId)) {
            productsMap.get(categoryId).products.push(product);
        } else {
            // Se o produto tem uma categoria não encontrada nas categorias do restaurante,
            // coloca em "Outros"
            productsMap.get(null).products.push(product);
        }
    });
    
    // Renderiza as categorias e produtos na ordem das categorias do restaurante
    categories.forEach(category => {
        const categoryData = productsMap.get(category.id);
        if (categoryData && categoryData.products.length > 0) {
            renderCategorySection(categoryData.name, categoryData.products, container);
        }
    });
    
    // Renderiza produtos sem categoria no final, se houver
    const othersCategory = productsMap.get(null);
    if (othersCategory && othersCategory.products.length > 0) {
        renderCategorySection(othersCategory.name, othersCategory.products, container);
    }
}

// Função para renderizar uma seção de categoria
function renderCategorySection(categoryName, products, container) {
    // Cria o título da categoria
    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = categoryName;
    container.appendChild(categoryTitle);
    
    // Adiciona os produtos da categoria
    products.forEach(product => {
        createProductCard(product, container);
    });
}

// Função para exibir produtos agrupados por categoria (fallback)
function displayProductsByCategory(productsByCategory, container) {
    Object.keys(productsByCategory).forEach(category => {
        renderCategorySection(category, productsByCategory[category], container);
    });
}

// Função para agrupar produtos por categoria (fallback para quando não há categorias específicas)
function groupProductsByCategory(products) {
    const categories = {};
    
    products.forEach(product => {
        const category = product.category || 'Outros';
        
        if (!categories[category]) {
            categories[category] = [];
        }
        
        categories[category].push(product);
    });
    
    return categories;
}

// Função para criar o card de produto
function createProductCard(product, container) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.productId = product.id;

    const cardDetails = document.createElement('div');
    cardDetails.className = 'card-details';

    // Container da imagem para permitir placeholder
    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image-container';

    // Verifica se tem imageUrl válida
    if (product.imageUrl && product.imageUrl.trim() !== '') {
        // Tem imagem - cria elemento img normal
        const image = document.createElement('img');
        image.className = 'product-image';
        image.src = product.imageUrl;
        image.alt = product.name;
        
        // Adiciona evento de erro para fallback
        image.onerror = function() {
            // Se a imagem falhar ao carregar, mostra o placeholder
            imageContainer.innerHTML = '';
            const placeholder = createImagePlaceholder();
            imageContainer.appendChild(placeholder);
        };
        
        imageContainer.appendChild(image);
    } else {
        // Não tem imagem - cria placeholder
        const placeholder = createImagePlaceholder();
        imageContainer.appendChild(placeholder);
    }

    const divProductDetails = document.createElement('div');
    divProductDetails.className = 'product-details';

    const productName = document.createElement('h2');
    productName.className = 'product-name';
    productName.textContent = product.name;

    const productDescription = document.createElement('p');
    productDescription.className = 'product-description';
    productDescription.textContent = product.description || 'Sem descrição';

    const productPrice = document.createElement('p');
    productPrice.className = 'product-price';
    productPrice.textContent = `R$ ${formatPrice(product.price)}`;

    const divQuantity = document.createElement('div');
    divQuantity.className = 'div-quantity';

    const minusButton = document.createElement('button');
    minusButton.className = 'quantity-button';
    minusButton.textContent = '-';

    const quantityField = document.createElement('input');
    quantityField.type = 'text';
    quantityField.className = 'quantity-field';
    quantityField.value = 0;
    quantityField.readOnly = true;

    const plusButton = document.createElement('button');
    plusButton.className = 'quantity-button';
    plusButton.textContent = '+';

    const addToCartButton = document.createElement('button');
    addToCartButton.className = 'add-to-cart-button';
    addToCartButton.title = 'Adicionar ao carrinho';

    const addToCartButtonIcon = document.createElement('i');
    addToCartButtonIcon.className = 'fa fa-cart-plus add-to-cart-button-icon';

    // Monta a estrutura do card
    addToCartButton.appendChild(addToCartButtonIcon);
    divQuantity.append(minusButton, quantityField, plusButton);
    divProductDetails.append(productName, productDescription, productPrice);
    cardDetails.append(imageContainer, divProductDetails, divQuantity);
    card.append(cardDetails, addToCartButton);
    container.appendChild(card);

    // Eventos
    plusButton.addEventListener('click', () => {
        quantityField.value = parseInt(quantityField.value) + 1;
    });
        
    minusButton.addEventListener('click', () => {
        quantityField.value = Math.max(0, parseInt(quantityField.value) - 1);
    });

    // Adicionar ao carrinho
    addToCartButton.addEventListener('click', () => {
        const quantity = parseInt(quantityField.value);
        
        // Verifica se a quantidade é maior que 0
        if (quantity > 0) {
            // Adiciona o produto ao carrinho (a função addCartItem já vai validar o restaurante)
            addCartItem(
                product.id,
                product.name, 
                product.price, 
                quantity,
                product.imageUrl || null
            );
            
            // Efeito visual de adicionado
            card.classList.add('product-added');
            setTimeout(() => {
                card.classList.remove('product-added');
            }, 500);
            
            // Reseta a quantidade
            quantityField.value = 0;
        } else {
            // Se a quantidade for 0, mostra um tooltip ou hint
            addToCartButton.setAttribute('data-tooltip', 'Selecione a quantidade');
            setTimeout(() => {
                addToCartButton.removeAttribute('data-tooltip');
            }, 2000);
        }
    });
}

// Função para criar placeholder quando não há imagem
function createImagePlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'product-image-placeholder';
    
    const icon = document.createElement('i');
    icon.className = 'fa fa-camera-retro';
    
    const text = document.createElement('span');
    text.textContent = 'Sem foto';
    
    placeholder.appendChild(icon);
    placeholder.appendChild(text);
    
    return placeholder;
}

// Evento para carregar mais produtos quando chegar ao final da página (paginação)
window.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Se chegou a 90% do scroll, carrega mais produtos
    if (scrollTop + clientHeight >= scrollHeight * 0.9) {
        // Aqui você pode implementar o carregamento de mais produtos (paginação)
        // loadMoreProducts();
    }
});