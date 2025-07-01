/**
 * Arquivo principal para gerenciamento de produtos
 * Responsável pela inicialização e listagem de produtos
 * VERSÃO CORRIGIDA PARA PROBLEMAS DE CORS
 */

const userDataString = sessionStorage.getItem("userData")
const userData = JSON.parse(userDataString)
const defaultProductsUrl = `${API_BASE_URL}/products/`

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
  
  // Se já é uma URL completa, usa diretamente
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Se é um CID, constrói URL com gateway
  if (imageUrl.startsWith('baf')) {
    // Verifica cache primeiro
    const cacheKey = `${imageUrl}_${gatewayIndex}`;
    if (workingUrls.has(cacheKey)) {
      return workingUrls.get(cacheKey);
    }
    
    // Usa gateway baseado no índice
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
    
    // Adiciona parâmetros para evitar cache e CORS
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
  
  // Verifica cache global primeiro
  if (workingUrls.has(imageUrl)) {
    return workingUrls.get(imageUrl);
  }
  
  // Testa todos os gateways
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const testUrl = buildImageUrl(imageUrl, i);
      await testImageUrl(testUrl, 3000); // Timeout de 3 segundos
      
      // Salva no cache se funcionou
      workingUrls.set(imageUrl, testUrl);
      console.log(`Gateway funcionando para ${imageUrl}: ${IPFS_GATEWAYS[i]}`);
      
      return testUrl;
    } catch (error) {
      console.log(`Gateway ${IPFS_GATEWAYS[i]} falhou para ${imageUrl}`);
      continue;
    }
  }
  
  // Se nenhum gateway funcionou, retorna null
  console.warn(`Nenhum gateway IPFS funcionou para: ${imageUrl}`);
  return null;
}

/**
 * Função principal para listar os produtos na tabela
 */
async function listProducts() {
  const table = document.querySelector("table")

  // Verificar se a tabela existe
  if (!table) {
    console.error("Tabela não encontrada")
    return
  }

  // Remover thead existente para evitar duplicação
  const existingThead = table.querySelector("thead")
  if (existingThead) {
    existingThead.remove()
  }

  const thead = document.createElement("thead")
  const tr = document.createElement("tr")

  // Cabeçalhos da tabela
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
  
  tbody.innerHTML = "" // Limpa o conteúdo existente

  // Mostra estado de carregamento
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

    // Remove o loading
    tbody.innerHTML = ""

    if (data.length === 0) {
      // Mostrar mensagem quando não há produtos
      const tr = document.createElement("tr")
      const td = document.createElement("td")
      td.colSpan = headers.length
      td.className = "empty-table"
      td.innerHTML = `
        <i class="fa fa-archive"></i>
        <h3>Nenhum produto cadastrado</h3>
        <p>Comece adicionando seu primeiro produto clicando no botão "Adicionar produto"</p>
      `
      tr.appendChild(td)
      tbody.appendChild(tr)
      return
    }

    // Processa os produtos
    for (const product of data) {
      await createProductRow(product, tbody);
    }
    
  } catch (error) {
    console.error("Erro ao listar produtos:", error)
    
    // Remove o loading e mostra erro
    tbody.innerHTML = ""
    
    const tr = document.createElement("tr")
    const td = document.createElement("td")
    td.colSpan = headers.length
    td.className = "empty-table"
    td.innerHTML = `
      <i class="fa fa-exclamation-triangle" style="color: var(--goeat-red);"></i>
      <h3>Erro ao carregar produtos</h3>
      <p>Não foi possível carregar a lista de produtos. Tente recarregar a página.</p>
    `
    tr.appendChild(td)
    tbody.appendChild(tr)
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
  // Remover modal existente se houver
  const existingModal = document.getElementById("image-modal")
  if (existingModal) {
    existingModal.remove()
  }

  // Criar modal para exibir imagem
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
  
  // Fechar modal ao clicar fora da imagem
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove()
    }
  })
  
  // Fechar modal com ESC
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
  // Usa o Swal.fire para mostrar uma caixa de confirmação
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

  // Se o usuário confirmou a exclusão
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