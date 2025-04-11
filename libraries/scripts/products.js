const userDataString = sessionStorage.getItem("userData")
const userData = JSON.parse(userDataString)
const defaultProductsUrl = `${API_BASE_URL}/products/`
const urlWithUserId = `${defaultProductsUrl}${userData.partnerId}`

window.onload = () => {
  if (userDataString) {
    document.getElementById("userName").textContent = userData.name
    listProducts()
  }
}

// Função para criar o modal de produtos (cadastro ou edição)
function _createProductModal(title, productData = null) {
  let modal = document.getElementById("modal")
  if (!modal) {
    modal = document.createElement("div")
    modal.id = "modal"
    modal.className = "modal"
    document.body.appendChild(modal)
  } else {
    modal.innerHTML = "" // Limpa o conteúdo existente
  }

  const modalContent = document.createElement("div")
  modalContent.className = "modal-content"

  const modalHeader = document.createElement("div")
  modalHeader.className = "modal-header"

  const modalTitle = document.createElement("h2")
  modalTitle.textContent = title

  const closeButton = document.createElement("button")
  closeButton.className = "close-button fa fa-times"
  closeButton.onclick = () => (modal.style.display = "none")

  modalHeader.append(modalTitle, closeButton)

  const modalBody = document.createElement("div")
  modalBody.className = "modal-body"

  // Criação dos inputs diretamente dentro da função
  const inputs = [
    { id: "nameInput", type: "text", placeholder: "Nome do produto...", label: "Nome do Produto*" },
    { id: "descriptionInput", type: "text", placeholder: "Descrição do produto...", label: "Descrição" },
    { id: "priceInput", type: "number", placeholder: "Preço do produto...", label: "Preço*" },
    { id: "imageUrlInput", type: "text", placeholder: "URL da imagem do produto...", label: "URL da Imagem" },
  ]

  inputs.forEach((input) => {
    const label = document.createElement("label")
    label.textContent = input.label
    label.setAttribute("for", input.id)

    const inputElement = document.createElement("input")
    inputElement.id = input.id
    inputElement.type = input.type
    inputElement.placeholder = input.placeholder
    inputElement.className = "input-modal"
    
    // Se temos dados do produto, preencher os campos
    if (productData) {
      switch(input.id) {
        case "nameInput":
          inputElement.value = productData.name || "";
          break;
        case "descriptionInput":
          inputElement.value = productData.description || "";
          break;
        case "priceInput":
          inputElement.value = productData.price || "";
          break;
        case "imageUrlInput":
          inputElement.value = productData.imageUrl || "";
          break;
      }
    }

    modalBody.append(label, inputElement)
  })

  // Adicionar o campo de categoria como um combobox
  const categoryLabel = document.createElement("label")
  categoryLabel.textContent = "Categoria*"
  categoryLabel.setAttribute("for", "categoryInput")

  const categorySelect = document.createElement("select")
  categorySelect.id = "categoryInput"
  categorySelect.className = "input-modal"

  // Adicionar evento de change para detectar quando "Adicionar categoria" é selecionado
  categorySelect.addEventListener("change", function () {
    if (this.value === "add_new_category") {
      // Resetar a seleção para a opção padrão
      this.selectedIndex = 0
      // Abrir o modal de gerenciamento de categorias
      openCategoryManagementModal()
    }
  })

  // Adicionar uma opção de carregamento inicial
  const loadingOption = document.createElement("option")
  loadingOption.textContent = "Carregando categorias..."
  loadingOption.disabled = true
  loadingOption.selected = true
  categorySelect.appendChild(loadingOption)

  modalBody.append(categoryLabel, categorySelect)

  // Carregar categorias no dropdown
  loadCategories(categorySelect, productData?.categoryId)

  const modalFooter = document.createElement("div")
  modalFooter.className = "modal-footer"

  const cancelButton = document.createElement("button")
  cancelButton.className = "cancel-button"
  cancelButton.textContent = "Cancelar"
  cancelButton.onclick = () => (modal.style.display = "none")

  const saveButton = document.createElement("button")
  saveButton.className = "save-button"
  saveButton.textContent = productData ? "Atualizar" : "Salvar"
  saveButton.onclick = productData 
    ? () => updateProduct(productData.id) 
    : addProduct

  modalFooter.append(cancelButton, saveButton)
  modalContent.append(modalHeader, modalBody, modalFooter)
  modal.appendChild(modalContent)
  document.body.appendChild(modal)
  
  return modal
}

// Função para abrir o modal de adição de produtos
function _addProductModal() {
  const modal = _createProductModal("Cadastrar Produto")
  modal.style.display = "flex"
}

// Função para editar um produto existente
function editProduct(product) {
  const modal = _createProductModal("Editar Produto", product)
  modal.style.display = "flex"
}

// Função para carregar categorias no dropdown
function loadCategories(categorySelect, selectedCategoryId = null) {
  fetch(`${API_BASE_URL}/menus/${userData.partnerId}/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Falha ao buscar categorias")
      }
      return response.json()
    })
    .then((categories) => {
      // Limpar a opção de carregamento
      categorySelect.innerHTML = ""

      // Adicionar uma opção padrão
      const defaultOption = document.createElement("option")
      defaultOption.textContent = "Selecione uma categoria"
      defaultOption.value = ""
      defaultOption.disabled = true
      
      // Se não temos uma categoria selecionada, marcar a opção padrão como selecionada
      if (!selectedCategoryId) {
        defaultOption.selected = true
      }
      
      categorySelect.appendChild(defaultOption)

      // Adicionar a opção "Adicionar categoria"
      const addCategoryOption = document.createElement("option")
      addCategoryOption.textContent = "Adicionar categoria"
      addCategoryOption.value = "add_new_category"
      categorySelect.appendChild(addCategoryOption)

      // Adicionar as categorias ao combobox
      categories.forEach((category) => {
        const option = document.createElement("option")
        option.value = category.id
        option.textContent = category.name
        
        // Se esta é a categoria do produto que estamos editando, marcá-la como selecionada
        if (selectedCategoryId && category.id == selectedCategoryId) {
          option.selected = true
        }
        
        categorySelect.appendChild(option)
      })
    })
    .catch((error) => {
      console.error("Erro ao buscar categorias:", error)
      categorySelect.innerHTML = ""
      const errorOption = document.createElement("option")
      errorOption.textContent = "Erro ao carregar categorias"
      errorOption.disabled = true
      errorOption.selected = true
      categorySelect.appendChild(errorOption)
    })
}

// Função para abrir o modal de gerenciamento de categorias
function openCategoryManagementModal() {
  // Criar o modal de gerenciamento de categorias
  let categoryModal = document.getElementById("categoryModal")
  if (!categoryModal) {
    categoryModal = document.createElement("div")
    categoryModal.id = "categoryModal"
    categoryModal.className = "modal"
    document.body.appendChild(categoryModal)
  } else {
    categoryModal.innerHTML = "" // Limpa o conteúdo existente
  }

  const modalContent = document.createElement("div")
  modalContent.className = "modal-content"

  const modalHeader = document.createElement("div")
  modalHeader.className = "modal-header"

  const modalTitle = document.createElement("h2")
  modalTitle.textContent = "Gerenciar Categorias"

  const closeButton = document.createElement("button")
  closeButton.className = "close-button fa fa-times"
  closeButton.onclick = () => {
    categoryModal.style.display = "none"
    // Recarregar as categorias no dropdown do modal de produtos
    const categorySelect = document.getElementById("categoryInput")
    if (categorySelect) {
      loadCategories(categorySelect)
    }
  }

  modalHeader.append(modalTitle, closeButton)

  const modalBody = document.createElement("div")
  modalBody.className = "modal-body"

  // Criar o formulário para adicionar nova categoria
  const addCategoryForm = document.createElement("div")
  addCategoryForm.className = "add-category-form"

  const categoryNameLabel = document.createElement("label")
  categoryNameLabel.textContent = "Nome da Categoria"
  categoryNameLabel.setAttribute("for", "newCategoryInput")

  const categoryNameInput = document.createElement("input")
  categoryNameInput.id = "newCategoryInput"
  categoryNameInput.type = "text"
  categoryNameInput.placeholder = "Digite o nome da categoria..."
  categoryNameInput.className = "input-modal"

  const addButton = document.createElement("button")
  addButton.className = "save-button"
  addButton.textContent = "Adicionar"
  addButton.onclick = () => {
    const categoryName = categoryNameInput.value.trim()
    if (categoryName) {
      addCategory(categoryName, () => {
        // Limpar o input após adicionar
        categoryNameInput.value = ""
        // Recarregar a lista de categorias
        loadCategoryList(categoryListContainer)
      })
    }
  }

  addCategoryForm.append(categoryNameLabel, categoryNameInput, addButton)

  // Criar o container para a lista de categorias
  const categoryListContainer = document.createElement("div")
  categoryListContainer.className = "category-list-container"
  categoryListContainer.innerHTML = "<h3>Categorias Existentes</h3>"

  // Carregar a lista de categorias
  loadCategoryList(categoryListContainer)

  modalBody.append(addCategoryForm, categoryListContainer)

  modalContent.append(modalHeader, modalBody)
  categoryModal.appendChild(modalContent)
  document.body.appendChild(categoryModal)
  categoryModal.style.display = "flex"
}

// Função para carregar a lista de categorias no modal de gerenciamento
function loadCategoryList(container) {
  // Limpar a lista existente, mantendo apenas o título
  const title = container.querySelector("h3")
  container.innerHTML = ""
  container.appendChild(title)

  // Criar a tabela de categorias
  const table = document.createElement("table")
  table.className = "category-table"

  const thead = document.createElement("thead")
  const headerRow = document.createElement("tr")

  const nameHeader = document.createElement("th")
  nameHeader.textContent = "Nome"

  const actionsHeader = document.createElement("th")
  actionsHeader.textContent = "Ações"

  headerRow.append(nameHeader, actionsHeader)
  thead.appendChild(headerRow)

  const tbody = document.createElement("tbody")

  table.append(thead, tbody)
  container.appendChild(table)

  // Buscar categorias da API
  fetch(`${API_BASE_URL}/menus/${userData.partnerId}/categories`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Falha ao buscar categorias")
      }
      return response.json()
    })
    .then((categories) => {
      if (categories.length === 0) {
        const emptyRow = document.createElement("tr")
        const emptyCell = document.createElement("td")
        emptyCell.colSpan = 2
        emptyCell.textContent = "Nenhuma categoria encontrada"
        emptyCell.style.textAlign = "center"
        emptyRow.appendChild(emptyCell)
        tbody.appendChild(emptyRow)
      } else {
        categories.forEach((category) => {
          const row = document.createElement("tr")

          const nameCell = document.createElement("td")
          nameCell.textContent = category.name

          const actionsCell = document.createElement("td")

          const editButton = document.createElement("button")
          editButton.className = "icon-button"
          editButton.innerHTML = '<i class="fa fa-pencil-square-o"></i>'
          editButton.onclick = () => editCategory(category.id, category.name, () => loadCategoryList(container))

          const deleteButton = document.createElement("button")
          deleteButton.className = "icon-button"
          deleteButton.innerHTML = '<i class="fa fa-trash"></i>'
          deleteButton.onclick = () => deleteCategory(category.id, () => loadCategoryList(container))

          actionsCell.append(editButton, deleteButton)
          row.append(nameCell, actionsCell)
          tbody.appendChild(row)
        })
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar categorias:", error)
      const errorRow = document.createElement("tr")
      const errorCell = document.createElement("td")
      errorCell.colSpan = 2
      errorCell.textContent = "Erro ao carregar categorias"
      errorCell.style.textAlign = "center"
      errorRow.appendChild(errorCell)
      tbody.appendChild(errorRow)
    })
}

// Função para adicionar uma nova categoria
function addCategory(name, callback) {
  fetch(`${API_BASE_URL}/menus/${userData.partnerId}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      partnerId: userData.partnerId,
    }),
  })
    .then((response) => {
      if (response.status === 201) {
        alert("Categoria adicionada com sucesso!")
        if (callback) callback()
        return
      }
      throw new Error("Falha ao adicionar categoria")
    })
    .catch((error) => {
      console.error("Erro ao adicionar categoria:", error)
      alert("Erro ao adicionar categoria. Tente novamente.")
    })
}

// Função para editar uma categoria existente
function editCategory(id, currentName, callback) {
  const newName = prompt("Digite o novo nome da categoria:", currentName)
  if (newName && newName !== currentName) {
    fetch(`${API_BASE_URL}/menus/${userData.partnerId}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newName,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
                      Swal.fire({
            position: "center",
            icon: "error",
            title: "Erro ao editar categoria",
            showConfirmButton: false,
            timer: 2000
          }))
        }
        return response.json()
      })
      .then(() => {
        Swal.fire({
          position: "center",
          icon: "success",
          title: "Categoria atualizada com sucesso!",
          showConfirmButton: false,
          timer: 2000
        });
        if (callback) callback()
      })
      .catch((error) => {
        Swal.fire({
          position: "center",
          icon: "error",
          title: "Erro ao editar categoria",
          showConfirmButton: false,
          timer: 2000
        });
      })
  }
}

// Função para excluir uma categoria
function deleteCategory(id, callback) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    fetch(`${API_BASE_URL}/menus/${userData.partnerId}/categories/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.status === 204) {
          goeatAlert("success", "Categoria excluída com sucesso!");

          if (callback) callback()
          return
        }
        throw new Error(
          goeatAlert("error", "Erro ao excluir categoria")
        )
      })
      .catch((error) => {
        goeatAlert("error", `Erro ao excluir categoria: ${error}`)
      })
  }
}

// Função para adicionar um produto
function addProduct() {
  const name = document.getElementById("nameInput").value
  const description = document.getElementById("descriptionInput").value
  const price = parseFloat(document.getElementById("priceInput").value) || 0
  const imageUrl = document.getElementById("imageUrlInput").value
  const categoryId = document.getElementById("categoryInput").value

  if (!name || price <= 0) {
    goeatAlert("warning", "Por favor, preencha os campos obrigatórios corretamente.")
    return
  }

  const productData = {
    name,
    description,
    price,
    imageUrl,
    menuId: userData.partnerId,
    categoryId: categoryId || null
  }

  fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  })
    .then((response) => {
      if (response.status === 200 || response.status === 201) {
        goeatAlert("success", "Produto adicionado com sucesso!")
        document.getElementById("modal").style.display = "none"
        // Atualizar a lista de produtos
        listProducts()
        return response.json()
      }
      throw new Error(goeatAlert("error", "Falha ao adicionar produto"))
    })
    .catch((error) => {
      goeatAlert("error", "Erro ao adicionar produto")
    })
}

// Função para atualizar um produto existente
function updateProduct(productId) {
  const name = document.getElementById("nameInput").value
  const description = document.getElementById("descriptionInput").value
  const price = parseFloat(document.getElementById("priceInput").value) || 0
  const imageUrl = document.getElementById("imageUrlInput").value
  const categoryId = document.getElementById("categoryInput").value

  if (!name || price <= 0) {
    goeatAlert("warning", "Por favor, preencha os campos obrigatórios corretamente.")
    return
  }

  const productData = {
    name,
    description,
    price,
    imageUrl,
    menuId: userData.partnerId,
    categoryId: categoryId || null
  }

  fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  })
    .then((response) => {
      if (response.ok) {
        goeatAlert("success", "Produto atualizado com sucesso!")
        document.getElementById("modal").style.display = "none"
        // Atualizar a lista de produtos
        listProducts()
        return response.json()
      }
      throw new Error("Falha ao atualizar produto")
    })
    .catch((error) => {
      goeatAlert("error", "Falha ao atualizar produto")
    })
}

function fechar() {
  const modal = document.getElementById("modal")
  if (modal) {
    modal.style.display = "none"
  }
}

// Função para listar os produtos - sem exibir a coluna ID
async function listProducts() {
  const table = document.querySelector("table")

  // Remover thead existente para evitar duplicação
  const existingThead = table.querySelector("thead")
  if (existingThead) {
    table.removeChild(existingThead)
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
  tbody.innerHTML = "" // Limpa o conteúdo existente

  try {
    const response = await fetch(urlWithUserId)
    if (!response.ok) {
      throw new Error("Falha ao carregar produtos")
    }
    const data = await response.json()

    if (data.length === 0) {
      // Mostrar mensagem quando não há produtos
      const tr = document.createElement("tr")
      const td = document.createElement("td")
      td.colSpan = headers.length
      td.textContent = "Nenhum produto encontrado"
      td.style.textAlign = "center"
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
      const editIcon = document.createElement("i")
      editIcon.className = "fa fa-pencil-square-o list-product-edit-button"
      editButton.appendChild(editIcon)
      editButton.addEventListener("click", () => editProduct(product))

      // Botão de excluir
      const deleteButton = document.createElement("td")
      const deleteIcon = document.createElement("i")
      deleteIcon.className = "fa fa-trash list-product-delete-button"
      deleteButton.appendChild(deleteIcon)
      deleteButton.addEventListener("click", () => deleteProduct(product.id))

      tr.append(editButton, deleteButton)
      tbody.appendChild(tr)
    })
  } catch (error) {
    console.error("Erro ao listar produtos:", error)
    const tr = document.createElement("tr")
    const td = document.createElement("td")
    td.colSpan = headers.length
    td.textContent = "Erro ao carregar produtos"
    td.style.textAlign = "center"
    tr.appendChild(td)
    tbody.appendChild(tr)
  }
}

async function deleteProduct(productId) {
  if (confirm("Tem certeza que deseja excluir este produto?")) {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, { method: "DELETE" })
    if (response.ok) {
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Produto excluído com sucesso!",
        showConfirmButton: false,
        timer: 1500
      });
      listProducts()
    } else {
      Swal.fire({
        position: "top-end",
        icon: "error",
        title: "Erro ao excluir produto",
        showConfirmButton: false,
        timer: 1500
      });
    }
  }
}

async function registerProduct() {
  const name = document.getElementById("nome")
  const description = document.getElementById("descricao")
  const price = document.getElementById("preco")

  const data = {
    name: name.value,
    description: description.value,
    price: price.value,
    imageUrl: "link da imagem",
    menuId: userData.partnerId,
  }

  const response = await fetch(defaultProductsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (response.ok) {
    alertaSucesso()
  }
}

function alertaSucesso() {
  document.getElementById("modal").style.display = "block"
}