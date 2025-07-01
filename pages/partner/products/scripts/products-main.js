/**
 * Arquivo principal para gerenciamento de produtos
 * VERSÃO COMPLETA COM PESQUISA SEM BOTÃO
 */

const userDataString = sessionStorage.getItem("userData")
const userData = JSON.parse(userDataString)
const defaultProductsUrl = `${API_BASE_URL}/products/`

// Variável global para armazenar todos os produtos
let allProducts = [];

// Lista de gateways IPFS alternativos
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.infura.io/ipfs/'
];

// Cache para URLs que funcionam
const workingUrls = new Map();

window.onload = () => {
  if (userDataString) {
    document.getElementById("userName").textContent = userData.name
    listProducts()
  }
}

/**
 * Função para construir URL de imagem com fallbacks
 */
function buildImageUrl(imageUrl, gatewayIndex = 0) {
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('baf')) {
    const cacheKey = `${imageUrl}_${gatewayIndex}`;
    if (workingUrls.has(cacheKey)) {
      return workingUrls.get(cacheKey);
    }
    
    const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
    const fullUrl = `${gateway}${imageUrl}`;
    
    return fullUrl;
  }
  
  return imageUrl;
}

/**
 * Função para testar se uma URL de imagem carrega
 */
function testImageUrl(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      reject(new Error('Timeout'));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      resolve(url);
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Load failed'));
    };
    
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

/**
 * Função para encontrar URL de imagem funcionando
 */
async function findWorkingImageUrl(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('baf')) {
    return imageUrl;
  }
  
  if (workingUrls.has(imageUrl)) {
    return workingUrls.get(imageUrl);
  }
  
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const testUrl = buildImageUrl(imageUrl, i);
      await testImageUrl(testUrl, 3000);
      
      workingUrls.set(imageUrl, testUrl);
      console.log(`Gateway funcionando para ${imageUrl}: ${IPFS_GATEWAYS[i]}`);
      
      return testUrl;
    } catch (error) {
      console.log(`Gateway ${IPFS_GATEWAYS[i]} falhou para ${imageUrl}`);
      continue;
    }
  }
  
  console.warn(`Nenhum gateway IPFS funcionou para: ${imageUrl}`);
  return null;
}

/**
 * Função principal para listar os produtos na tabela
 */
async function listProducts() {
  const table = document.querySelector("table")

  if (!table) {
    console.error("Tabela não encontrada")
    return
  }

  const existingThead = table.querySelector("thead")
  if (existingThead) {
    existingThead.remove()
  }

  const thead = document.createElement("thead")
  const tr = document.createElement("tr")

  const headers = ["Nome", "Descrição", "Preço", "Imagem", "Categoria", "Editar", "Excluir"]
  headers.forEach((headerText) => {
    const th = document.createElement("th")
    th.textContent = headerText
    tr.appendChild(th)
  })

  thead.appendChild(tr)
  table.appendChild(thead)

  const tbody = document.querySelector("#tbody")
  if (!tbody) {
    console.error("Tbody não encontrado")
    return
  }
  
  tbody.innerHTML = ""

  const loadingRow = document.createElement("tr")
  const loadingCell = document.createElement("td")
  loadingCell.colSpan = headers.length
  loadingCell.className = "loading-table"
  loadingCell.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>Carregando produtos...'
  loadingRow.appendChild(loadingCell)
  tbody.appendChild(loadingRow)

  try {
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/products`)
    if (!response.ok) {
      throw new Error("Falha ao carregar produtos")
    }
    const data = await response.json()

    // ARMAZENAR OS PRODUTOS GLOBALMENTE
    allProducts = data;

    tbody.innerHTML = ""

    if (data.length === 0) {
      showNoProductsMessage(tbody, headers.length)
      return
    }

    for (const product of data) {
      await createProductRow(product, tbody);
    }
    
    // CONFIGURAR A PESQUISA APÓS CARREGAR OS PRODUTOS
    setupProductSearch();
    
  } catch (error) {
    console.error("Erro ao listar produtos:", error)
    tbody.innerHTML = ""
    showErrorMessage(tbody, headers.length)
  }
}

/**
 * Função para criar uma linha de produto na tabela
 */
async function createProductRow(product, tbody) {
  const tr = document.createElement("tr")
  
  const nameCell = document.createElement("td")
  nameCell.innerText = product.name
  tr.appendChild(nameCell)
  
  const descriptionCell = document.createElement("td")
  descriptionCell.innerText = product.description
  tr.appendChild(descriptionCell)
  
  const priceCell = document.createElement("td")
  priceCell.className = "price-cell"
  
  if (product.price && product.price > 0) {
    priceCell.innerHTML = `R$ ${formatCentsToReais(product.price)}`;
  } else {
    priceCell.innerHTML = `<span class="price-error">Preço inválido</span>`;
  }
  
  priceCell.style.fontWeight = '600';
  priceCell.style.color = 'var(--goeat-green)';
  priceCell.style.fontSize = '15px';
  priceCell.style.fontFamily = "'Courier New', monospace";
  priceCell.style.textAlign = 'right';
  
  tr.appendChild(priceCell)
  
  const imageCell = document.createElement("td")
  imageCell.className = "image-cell"
  
  if (product.imageUrl) {
    const loadingPlaceholder = document.createElement("div")
    loadingPlaceholder.className = "image-loading"
    loadingPlaceholder.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>'
    imageCell.appendChild(loadingPlaceholder)
    
    tr.appendChild(imageCell)
    
    try {
      const workingUrl = await findWorkingImageUrl(product.imageUrl);
      
      imageCell.removeChild(loadingPlaceholder);
      
      if (workingUrl) {
        const img = document.createElement("img")
        img.src = workingUrl
        img.alt = product.name
        img.className = "product-thumbnail"
        img.loading = "lazy"
        
        img.onerror = function() {
          this.style.display = 'none'
          const fallback = document.createElement("div")
          fallback.className = "image-fallback"
          fallback.innerHTML = '<i class="fa fa-image"></i><span>Erro ao carregar</span>'
          this.parentNode.appendChild(fallback)
        }
        
        img.addEventListener('click', () => {
          showImageModal(workingUrl, product.name)
        })
        
        imageCell.appendChild(img)
      } else {
        const fallback = document.createElement("div")
        fallback.className = "image-fallback"
        fallback.innerHTML = '<i class="fa fa-exclamation-triangle"></i><span>CORS bloqueado</span>'
        imageCell.appendChild(fallback)
      }
    } catch (error) {
      if (imageCell.contains(loadingPlaceholder)) {
        imageCell.removeChild(loadingPlaceholder)
      }
      
      const errorPlaceholder = document.createElement("div")
      errorPlaceholder.className = "image-error"
      errorPlaceholder.innerHTML = '<i class="fa fa-exclamation-triangle"></i><span>Erro</span>'
      imageCell.appendChild(errorPlaceholder)
    }
  } else {
    const placeholder = document.createElement("div")
    placeholder.className = "image-placeholder"
    placeholder.innerHTML = '<i class="fa fa-image"></i><span>Sem imagem</span>'
    imageCell.appendChild(placeholder)
    tr.appendChild(imageCell)
  }
  
  if (!tr.contains(imageCell)) {
    tr.appendChild(imageCell)
  }
  
  const categoryCell = document.createElement("td")
  categoryCell.innerText = product.categoryName || "Sem categoria"
  tr.appendChild(categoryCell)

  const editButton = document.createElement("td")
  editButton.className = "action-cell"
  
  const editBtn = document.createElement("button")
  editBtn.className = "action-btn edit-btn"
  editBtn.innerHTML = '<i class="fa fa-pencil"></i>'
  editBtn.title = "Editar produto"
  editBtn.addEventListener("click", () => editProduct(product))
  
  editButton.appendChild(editBtn)

  const deleteButton = document.createElement("td")
  deleteButton.className = "action-cell"
  
  const deleteBtn = document.createElement("button")
  deleteBtn.className = "action-btn delete-btn"
  deleteBtn.innerHTML = '<i class="fa fa-trash"></i>'
  deleteBtn.title = "Excluir produto"
  deleteBtn.addEventListener("click", () => deleteProduct(product.id))
  
  deleteButton.appendChild(deleteBtn)

  tr.append(editButton, deleteButton)
  tbody.appendChild(tr)
}

/**
 * Função para mostrar modal com imagem ampliada
 */
function showImageModal(imageUrl, productName) {
  const existingModal = document.getElementById("image-modal")
  if (existingModal) {
    existingModal.remove()
  }

  const modal = document.createElement("div")
  modal.id = "image-modal"
  modal.className = "image-modal"
  
  const modalContent = document.createElement("div")
  modalContent.className = "image-modal-content"
  
  const closeButton = document.createElement("button")
  closeButton.className = "image-modal-close"
  closeButton.innerHTML = '<i class="fa fa-times"></i>'
  closeButton.onclick = () => modal.remove()
  
  const img = document.createElement("img")
  img.src = imageUrl
  img.alt = productName
  img.className = "image-modal-img"
  
  const title = document.createElement("h3")
  title.textContent = productName
  title.className = "image-modal-title"
  
  modalContent.append(closeButton, img, title)
  modal.appendChild(modalContent)
  document.body.appendChild(modal)
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })
  
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      modal.remove()
      document.removeEventListener('keydown', escHandler)
    }
  })
}

/**
 * Função para excluir um produto
 */
async function deleteProduct(productId) {
  const result = await Swal.fire({
    title: 'Tem certeza?',
    text: "Você está prestes a excluir este produto!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/products/${productId}`, { 
      method: "DELETE", 
      headers: { 
        "Content-Type": "application/json", 
        "Authorization" : `Bearer ${userData.token}` 
      } 
    });
    
    if (response.ok) {
      goeatAlert("success", "Produto excluído com sucesso!")
      listProducts()
    } else {
      goeatAlert("error", "Erro ao excluir produto")
    }
  }
}

// ===========================================
// FUNÇÕES DE PESQUISA (SEM BOTÃO)
// ===========================================

/**
 * Função para configurar a pesquisa
 */
function setupProductSearch() {
  const searchInput = document.getElementById("searchInput");
  
  if (!searchInput) {
    console.error("Campo de pesquisa não encontrado");
    return;
  }

  // Limpar eventos anteriores
  searchInput.replaceWith(searchInput.cloneNode(true));
  
  // Pegar a referência novamente
  const newSearchInput = document.getElementById("searchInput");
  
  // Evento de Enter no input
  newSearchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performProductSearch();
    }
  });
  
  // Pesquisa automática enquanto digita
  newSearchInput.addEventListener('input', function() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      performProductSearch();
    }, 300);
  });
}

/**
 * Função para realizar a pesquisa
 */
function performProductSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchTerm = searchInput.value.trim().toLowerCase();
  
  if (!searchTerm) {
    displayProducts(allProducts);
    return;
  }
  
  const filteredProducts = allProducts.filter(product => {
    const name = product.name.toLowerCase();
    const description = (product.description || '').toLowerCase();
    const category = (product.categoryName || '').toLowerCase();
    const price = formatCentsToReais(product.price);
    
    return name.includes(searchTerm) || 
           description.includes(searchTerm) || 
           category.includes(searchTerm) ||
           price.includes(searchTerm);
  });
  
  displayProducts(filteredProducts);
}

/**
 * Função para exibir produtos filtrados
 */
async function displayProducts(products) {
  const tbody = document.querySelector("#tbody");
  const headers = ["Nome", "Descrição", "Preço", "Imagem", "Categoria", "Editar", "Excluir"];
  
  if (!tbody) return;
  
  tbody.innerHTML = "";
  
  if (products.length === 0) {
    showNoResultsMessage(tbody, headers.length);
    return;
  }
  
  for (const product of products) {
    await createProductRow(product, tbody);
  }
}

/**
 * Função para mostrar mensagem de nenhum produto encontrado
 */
function showNoProductsMessage(tbody, colSpan) {
  const tr = document.createElement("tr")
  const td = document.createElement("td")
  td.colSpan = colSpan
  td.className = "empty-table"
  td.innerHTML = `
    <i class="fa fa-archive"></i>
    <h3>Nenhum produto cadastrado</h3>
    <p>Comece adicionando seu primeiro produto clicando no botão "Adicionar produto"</p>
  `
  tr.appendChild(td)
  tbody.appendChild(tr)
}

/**
 * Função para mostrar mensagem de nenhum resultado na pesquisa
 */
function showNoResultsMessage(tbody, colSpan) {
  const tr = document.createElement("tr")
  const td = document.createElement("td")
  td.colSpan = colSpan
  td.className = "empty-table"
  td.innerHTML = `
    <i class="fa fa-search"></i>
    <h3>Nenhum produto encontrado</h3>
    <p>Tente usar outros termos de pesquisa ou <button onclick="clearProductSearch()" style="background:none;border:none;color:var(--goeat-primary);text-decoration:underline;cursor:pointer;">limpar a pesquisa</button></p>
  `
  tr.appendChild(td)
  tbody.appendChild(tr)
}

/**
 * Função para mostrar mensagem de erro
 */
function showErrorMessage(tbody, colSpan) {
  const tr = document.createElement("tr")
  const td = document.createElement("td")
  td.colSpan = colSpan
  td.className = "empty-table"
  td.innerHTML = `
    <i class="fa fa-exclamation-triangle" style="color: var(--goeat-red);"></i>
    <h3>Erro ao carregar produtos</h3>
    <p>Não foi possível carregar a lista de produtos. Tente recarregar a página.</p>
  `
  tr.appendChild(td)
  tbody.appendChild(tr)
}

/**
 * Função para limpar a pesquisa
 */
function clearProductSearch() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = '';
    displayProducts(allProducts);
    searchInput.focus();
  }
}

/**
 * Função legacy para registrar produto (mantida para compatibilidade)
 */
async function registerProduct() {
  const name = document.getElementById("nome")
  const description = document.getElementById("descricao")
  const price = document.getElementById("preco")

  const data = {
    name: name.value,
    description: description.value,
    price: price.value,
    imageUrl: "link da imagem",
    menuId: userData.id,
  }

  const response = await fetch(defaultProductsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (response.ok) {
    goeatAlert("success", "Produto cadastrado com sucesso!")
  }
}

// Tornar a função disponível globalmente
window.clearProductSearch = clearProductSearch;