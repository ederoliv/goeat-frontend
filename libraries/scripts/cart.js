var cart = [];

// FUNÇÕES DO CARRINHO
function addCartItem(productId, productName, productPrice, productQuantity, productImage = null) {
    // Se não houver itens no carrinho, cria a barra do carrinho
    if(cart.length === 0) createCartNavbar();

    // Se a quantidade for 0, não adiciona ao carrinho
    if (productQuantity <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Quantidade inválida',
            text: 'Por favor, selecione pelo menos 1 item para adicionar ao carrinho.',
            confirmButtonColor: '#06CF90'
        });
        return;
    }

    // Adiciona ou atualiza o item no carrinho
    updateCart(productId, productName, productPrice, productQuantity, productImage);
    
    // Atualiza a barra do carrinho
    updateCartNavbar();

    // Mostra um feedback ao usuário
    showAddToCartFeedback(productName);
}

function showAddToCartFeedback(productName) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
      
    Toast.fire({
        icon: 'success',
        title: `${productName} adicionado ao carrinho!`
    });
}

function removeCartItem(itemIndex){
    cart.splice(itemIndex, 1);
    
    // Se o carrinho estiver vazio, remove a navbar do carrinho
    if(cart.length === 0) {
        const cartNavbar = document.getElementById('cart-navbar');
        if (cartNavbar) cartNavbar.remove();
        
        // Fecha o modal do carrinho se estiver aberto
        const existingOverlay = document.querySelector('.overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    } else {
        // Atualiza a barra do carrinho
        updateCartNavbar();
    }
    
    // Salva o carrinho atualizado
    saveCartToStorage();
}

function updateCart(productId, productName, productPrice, productQuantity, productImage){
    let productIsOnCart = false;
    let cartProductIndex = 0;

    // Verifica se o produto já está no carrinho
    for(i = 0; i < cart.length; i++){
        if(productId == cart[i].id){
            productIsOnCart = true;
            cartProductIndex = i;
        }
    }

    // Se o produto já estiver no carrinho, atualiza a quantidade
    if(productIsOnCart === true){
        cart[cartProductIndex].quantity = productQuantity;
    } else {
        // Se não, adiciona o produto ao carrinho
        cart.push({ 
            id: productId, 
            name: productName, 
            price: productPrice, 
            quantity: productQuantity,
            image: productImage || `${root}${routes.assets}foods.png`
        });
    }

    // Salva o carrinho atualizado
    saveCartToStorage();
}

function calculateCartTotalPrice(clientCart) {
    let totalPrice = 0;
    
    for (let i = 0; i < clientCart.length; i++) {
        totalPrice += clientCart[i].price * clientCart[i].quantity;
    }

    return totalPrice;
}

function calculateCartTotalItems(clientCart) {
    let totalItems = 0;
    
    for (let i = 0; i < clientCart.length; i++) {
        totalItems += clientCart[i].quantity;
    }

    return totalItems;
}

function updateCartNavbar() {
    const cartInfo = document.getElementById('cart-info');
    
    let totalPrice = calculateCartTotalPrice(cart);
    let totalItems = calculateCartTotalItems(cart);
    
    if (totalItems === 1) {
        cartInfo.innerHTML = `<span>${totalItems} item</span> | <span>R$ ${formatPrice(totalPrice)}</span>`;
    } else {
        cartInfo.innerHTML = `<span>${totalItems} itens</span> | <span>R$ ${formatPrice(totalPrice)}</span>`;
    }
}

function createCartNavbar() {
    // Remove qualquer navbar existente para evitar duplicação
    const existingNavbar = document.getElementById('cart-navbar');
    if (existingNavbar) existingNavbar.remove();
    
    // Cria a navbar do carrinho
    const cartNavbar = document.createElement('div');
    cartNavbar.id = 'cart-navbar';

    const cartInfo = document.createElement('div');
    cartInfo.id = 'cart-info';
    
    cartNavbar.appendChild(cartInfo);
    document.body.appendChild(cartNavbar);

    // Adiciona evento de clique para abrir o carrinho
    cartNavbar.addEventListener('click', () => {
        loadCart();
    });
}

function loadCart() {
    // Remove qualquer overlay existente para evitar duplicação
    const existingOverlay = document.querySelector('.overlay');
    if (existingOverlay) existingOverlay.remove();

    // Cria os elementos do modal
    const container = document.getElementById('container');

    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";

    const cartTitle = document.createElement("h2");
    
    const closeButton = document.createElement("button");
    closeButton.className = "close-button fa fa-times";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";

    const totalPedido = document.createElement("button");
    totalPedido.className = "cancel-button";

    const saveButton = document.createElement("button");
    saveButton.className = "save-button";

    // Atribui valores e textos aos elementos
    cartTitle.innerText = "Seu carrinho";

    const totalPrice = calculateCartTotalPrice(cart);
    totalPedido.innerText = `Total: R$ ${formatPrice(totalPrice)}`;

    saveButton.innerText = "Fazer Pedido";

    // Verifica se o carrinho está vazio
    if (cart.length === 0) {
        // Mostra mensagem de carrinho vazio
        const emptyCartMessage = document.createElement('div');
        emptyCartMessage.className = 'empty-cart-message';
        
        const emptyIcon = document.createElement('i');
        emptyIcon.className = 'fa fa-shopping-cart';
        
        const emptyText = document.createElement('p');
        emptyText.textContent = 'Seu carrinho está vazio!';
        
        const continueButton = document.createElement('button');
        continueButton.textContent = 'Continuar comprando';
        continueButton.addEventListener('click', () => {
            overlay.remove();
        });
        
        emptyCartMessage.appendChild(emptyIcon);
        emptyCartMessage.appendChild(emptyText);
        emptyCartMessage.appendChild(continueButton);
        
        modalContent.appendChild(emptyCartMessage);
        
        saveButton.disabled = true;
        saveButton.style.opacity = '0.5';
        saveButton.style.cursor = 'not-allowed';
    } else {
        // Carrega item por item do carrinho
        cart.forEach((item, index) => {
            const cartItemCard = document.createElement('div');
            cartItemCard.className = 'cart-item-card';
        
            const cardDetails = document.createElement('div');
            cardDetails.className = 'cart-card-details';
        
            const image = document.createElement('img');
            image.className = 'cart-card-product-image';
        
            const divProductDetails = document.createElement('div');
            divProductDetails.className = 'cart-card-product-details';
        
            const productName = document.createElement('h2');
            productName.className = 'cart-card-product-name';
        
            const productPrice = document.createElement('p');
            productPrice.className = 'cart-card-product-price';
        
            const divQuantity = document.createElement('div');
            divQuantity.className = 'cart-card-div-quantity';
        
            const minusButton = document.createElement('button');
            minusButton.className = 'cart-card-quantity-button';
        
            const quantityField = document.createElement('input');
            quantityField.type = 'text';
            quantityField.className = 'cart-card-quantity-field';
        
            const plusButton = document.createElement('button');
            plusButton.className = 'cart-card-quantity-button';
        
            const removeItemButton = document.createElement('button');
            removeItemButton.className = 'remove-to-cart-button';
        
            const removeToCartButtonIcon = document.createElement('i');
            removeToCartButtonIcon.className = 'fa fa-trash remove-to-cart-button-icon';
                
            // Define os valores dos elementos
            image.src = item.image || `${root}${routes.assets}foods.png`;
            productName.innerText = item.name;
            productPrice.innerText = `R$ ${formatPrice(item.price)}`;
        
            minusButton.innerText = '-';
            quantityField.value = item.quantity;
            plusButton.innerText = '+';
                        
            // Monta a estrutura do card
            removeItemButton.appendChild(removeToCartButtonIcon);
            
            divQuantity.append(minusButton, quantityField, plusButton);
            
            divProductDetails.append(productName, productPrice);
            
            cardDetails.append(image, divProductDetails, divQuantity);
            
            cartItemCard.append(cardDetails, removeItemButton);
            
            modalContent.appendChild(cartItemCard);

            // Eventos
            plusButton.addEventListener('click', () => {
                quantityField.value = parseInt(quantityField.value) + 1;
                item.quantity = parseInt(quantityField.value);
                
                // Atualiza os totais
                updateCartTotals(modalFooter, totalPedido);
                
                // Salva o carrinho atualizado
                saveCartToStorage();
            });
                    
            minusButton.addEventListener('click', () => {
                const newQuantity = Math.max(0, parseInt(quantityField.value) - 1);
                quantityField.value = newQuantity;
                
                if (newQuantity === 0) {
                    // Remove o item do carrinho
                    removeCartItem(index);
                    cartItemCard.remove();
                    
                    // Se o carrinho ficar vazio, fecha o modal
                    if(cart.length === 0) {
                        overlay.remove();
                    } else {
                        // Atualiza os totais
                        updateCartTotals(modalFooter, totalPedido);
                    }
                } else {
                    item.quantity = newQuantity;
                    
                    // Atualiza os totais
                    updateCartTotals(modalFooter, totalPedido);
                    
                    // Salva o carrinho atualizado
                    saveCartToStorage();
                }
            });
            
            removeItemButton.addEventListener('click', () => {
                // Remove o item do carrinho
                removeCartItem(index);
                cartItemCard.remove();
                
                // Se o carrinho ficar vazio, fecha o modal
                if(cart.length === 0) {
                    overlay.remove();
                } else {
                    // Atualiza os totais
                    updateCartTotals(modalFooter, totalPedido);
                }
            });
        });

        // Adiciona resumo do pedido com subtotal, taxa de entrega e total
        const cartSummary = document.createElement('div');
        cartSummary.className = 'cart-summary';
        
        const subtotalRow = document.createElement('div');
        subtotalRow.className = 'cart-summary-row';
        
        const subtotalLabel = document.createElement('span');
        subtotalLabel.textContent = 'Subtotal';
        
        const subtotalValue = document.createElement('span');
        subtotalValue.textContent = `R$ ${formatPrice(totalPrice)}`;
        
        subtotalRow.appendChild(subtotalLabel);
        subtotalRow.appendChild(subtotalValue);
        
        const deliveryRow = document.createElement('div');
        deliveryRow.className = 'cart-summary-row';
        
        const deliveryLabel = document.createElement('span');
        deliveryLabel.textContent = 'Taxa de entrega';
        
        const deliveryValue = document.createElement('span');
        deliveryValue.textContent = 'Grátis';
        deliveryValue.style.color = 'var(--goeat-green)';
        
        deliveryRow.appendChild(deliveryLabel);
        deliveryRow.appendChild(deliveryValue);
        
        const totalRow = document.createElement('div');
        totalRow.className = 'cart-summary-row total';
        
        const totalLabel = document.createElement('span');
        totalLabel.textContent = 'Total';
        
        const totalValue = document.createElement('span');
        totalValue.className = 'cart-total-value';
        totalValue.textContent = `R$ ${formatPrice(totalPrice)}`;
        
        totalRow.appendChild(totalLabel);
        totalRow.appendChild(totalValue);
        
        cartSummary.appendChild(subtotalRow);
        cartSummary.appendChild(deliveryRow);
        cartSummary.appendChild(totalRow);
        
        modalContent.appendChild(cartSummary);
    }

    // Monta a estrutura do modal
    modalFooter.append(totalPedido, saveButton);

    modalHeader.append(cartTitle, closeButton);

    modal.append(modalHeader, modalContent, modalFooter);

    overlay.appendChild(modal);

    container.appendChild(overlay);

    // Eventos
    closeButton.addEventListener('click', () => {
        overlay.remove();
    });

    // Evento para o botão "Fazer Pedido"
    saveButton.addEventListener('click', () => {
        // Se o carrinho estiver vazio, não faz nada
        if (cart.length === 0) return;
        
        // Pega o partnerId da URL
        const params = new URLSearchParams(window.location.search);
        const partnerId = params.get('partnerId');
        
        // Salva o carrinho antes de redirecionar
        saveCartToStorage();
        
        // Redireciona para a página de checkout
        window.location.href = `checkout.html?partnerId=${partnerId}`;
    });
}

// Função para atualizar os totais do carrinho
function updateCartTotals(modalFooter, totalPedidoButton) {
    const totalPrice = calculateCartTotalPrice(cart);
    totalPedidoButton.innerText = `Total: R$ ${formatPrice(totalPrice)}`;
    
    // Atualiza também a navbar do carrinho
    updateCartNavbar();
    
    // Atualiza o valor do resumo do pedido se existir
    const cartTotalValue = document.querySelector('.cart-total-value');
    if (cartTotalValue) {
        cartTotalValue.textContent = `R$ ${formatPrice(totalPrice)}`;
    }
    
    const subtotalValue = document.querySelector('.cart-summary-row:first-child span:last-child');
    if (subtotalValue) {
        subtotalValue.textContent = `R$ ${formatPrice(totalPrice)}`;
    }
}

// Função para salvar o carrinho na sessionStorage
function saveCartToStorage() {
    sessionStorage.setItem('cart', JSON.stringify(cart));
}

// Função para carregar o carrinho da sessionStorage
function loadCartFromStorage() {
    const savedCart = sessionStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        
        // Se o carrinho não estiver vazio, crie a navbar
        if (cart.length > 0) {
            createCartNavbar();
            updateCartNavbar();
        }
    }
}

// Carrega o carrinho ao iniciar a página
window.addEventListener('DOMContentLoaded', loadCartFromStorage);