window.onload = function () {
    // Mostra loading enquanto carrega os dados
    showLoadingModal();
    
    // Obtém o partnerId da URL
    const partnerId = getPartnerId();

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
        const response = await fetch(`${API_BASE_URL}/partners/${partnerId}`);
        
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
        
        // Cria a seção de status do parceiro (Aberto/Fechado)
        createPartnerStatus(data.isOpen, data.openingHours);

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

// Função para criar a seção de status do parceiro
function createPartnerStatus(isOpen, openingHours) {
    const storeHeader = document.createElement('div');
    storeHeader.className = 'store-header';
    
    const storeStatus = document.createElement('div');
    storeStatus.className = isOpen ? 'store-status open' : 'store-status closed';
    
    const statusIcon = document.createElement('i');
    statusIcon.className = isOpen ? 'fa fa-check-circle' : 'fa fa-clock-o';
    
    const statusText = document.createElement('span');
    statusText.textContent = isOpen ? 'Aberto' : 'Fechado no momento';
    
    // Adiciona horário de funcionamento se estiver fechado
    if (!isOpen && openingHours) {
        statusText.textContent += ` • Abre ${openingHours}`;
    }
    
    storeStatus.appendChild(statusIcon);
    storeStatus.appendChild(statusText);
    
    // Insere após o logo e nome do parceiro
    const partnerName = document.getElementById('partner-name');
    partnerName.parentNode.insertBefore(storeStatus, partnerName.nextSibling);
}

// Função para listar os produtos do parceiro
async function listPartnerProducts(partnerId) {
    const container = document.querySelector('#container-products');

    try {
        const response = await fetch(`${API_BASE_URL}/partners/${partnerId}/products`);

        if (!response.ok) {
            throw new Error('Erro ao carregar produtos');
        }

        const data = await response.json();
        
        // Se não houver produtos, mostra mensagem
        if (data.length === 0) {
            container.innerHTML = '<p class="error-message">Este restaurante ainda não possui produtos cadastrados.</p>';
            return;
        }

        // Agrupa os produtos por categoria
        const productsByCategory = groupProductsByCategory(data);
        
        // Limpa o container
        container.innerHTML = '';
        
        // Adiciona cada categoria e seus produtos
        Object.keys(productsByCategory).forEach(category => {
            // Cria o título da categoria
            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category;
            container.appendChild(categoryTitle);
            
            // Adiciona os produtos da categoria
            productsByCategory[category].forEach(product => {
                createProductCard(product, container);
            });
        });

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        container.innerHTML = '<p class="error-message">Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    }
}

// Função para agrupar produtos por categoria
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

    const image = document.createElement('img');
    image.className = 'product-image';
    image.src = product.image || `${root}${routes.assets}foods.png`;
    image.alt = product.name;

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
    cardDetails.append(image, divProductDetails, divQuantity);
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
            // Adiciona o produto ao carrinho
            addCartItem(
                product.id,
                product.name, 
                product.price, 
                quantity,
                product.image || null
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

// Evento para carregar mais produtos quando chegar ao final da página (paginação)
window.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Se chegou a 90% do scroll, carrega mais produtos
    if (scrollTop + clientHeight >= scrollHeight * 0.9) {
        // Aqui você pode implementar o carregamento de mais produtos (paginação)
        // loadMoreProducts();
    }
});