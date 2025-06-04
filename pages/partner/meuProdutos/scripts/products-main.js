/**
 * Arquivo principal para gerenciamento de produtos
 * Responsável pela inicialização e listagem de produtos
 */

const userDataString = sessionStorage.getItem("userData")
const userData = JSON.parse(userDataString)
const defaultProductsUrl = `${API_BASE_URL}/products/`

window.onload = () => {
  if (userDataString) {
    document.getElementById("userName").textContent = userData.name
    listProducts()
  }
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

  // Removida a coluna "ID" dos cabeçalhos
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

    data.forEach((product) => {
      const tr = document.createElement("tr")
      // Removido o ID do array de campos a serem exibidos
      const fields = [
        product.name, 
        product.description, 
        `R$ ${(product.price / 100).toFixed(2)}`, 
        product.imageUrl,
        product.categoryName || "Sem categoria" // Fallback caso não tenha categoria
      ]
      
      fields.forEach((field) => {
        const td = document.createElement("td")
        td.innerText = field
        tr.appendChild(td)
      })

      // Botão de editar
      const editButton = document.createElement("td")
      editButton.className = "action-cell"
      
      const editBtn = document.createElement("button")
      editBtn.className = "action-btn edit-btn"
      editBtn.innerHTML = '<i class="fa fa-pencil"></i>'
      editBtn.title = "Editar produto"
      editBtn.addEventListener("click", () => editProduct(product))
      
      editButton.appendChild(editBtn)

      // Botão de excluir
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
    })
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