/**
 * Arquivo responsável pelo gerenciamento de categorias
 * Inclui CRUD completo de categorias e modal de gerenciamento
 */

/**
 * Função para abrir o modal de gerenciamento de categorias
 */
function openCategoryManagementModal() {
  // Remover modal existente se houver
  const existingModal = document.getElementById("categoryModal")
  if (existingModal) {
    existingModal.remove()
  }

  // Criar novo modal
  const categoryModal = document.createElement("div")
  categoryModal.id = "categoryModal"
  categoryModal.className = "modal"

  const modalContent = document.createElement("div")
  modalContent.className = "modal-content"

  const modalHeader = document.createElement("div")
  modalHeader.className = "modal-header"

  const modalTitle = document.createElement("h2")
  modalTitle.textContent = "Gerenciar Categorias"

  const closeButton = document.createElement("button")
  closeButton.className = "close-button fa fa-times"
  closeButton.onclick = () => {
    categoryModal.remove()
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
  categoryModal.classList.add('flex')
}

/**
 * Função para carregar a lista de categorias no modal de gerenciamento
 */
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
  fetch(`${API_BASE_URL}/menus/${userData.id}/categories`, {
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

/**
 * Função para adicionar uma nova categoria
 */
function addCategory(name, callback) {
  fetch(`${API_BASE_URL}/menus/${userData.id}/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userData.token}`
    },
    body: JSON.stringify({
      name: name,
      id: userData.id,
    }),
  })
    .then((response) => {
      if (response.status === 201) {
        goeatAlert("success", "Categoria adicionada com sucesso!")
        if (callback) callback()
        return
      }
      throw new Error("Falha ao adicionar categoria")
    })
    .catch((error) => {
      goeatAlert("error", "Erro ao adicionar categoria: " + error)
    })
}

/**
 * Função para editar uma categoria existente
 */
function editCategory(id, currentName, callback) {
  const newName = prompt("Digite o novo nome da categoria:", currentName)
  if (newName && newName !== currentName) {
    fetch(`${API_BASE_URL}/menus/${userData.id}/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        name: newName,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
                      goeatAlert("error", "Erro ao editar categoria")
          )
        }
        return response.json()
      })
      .then(() => {
        goeatAlert("success", "Categoria editada com sucesso!")
        if (callback) callback()
      })
      .catch((error) => {
        goeatAlert("error", "Erro ao editar categoria: " + error)
      })
  }
}

/**
 * Função para excluir uma categoria
 */
function deleteCategory(id, callback) {
  if (confirm("Tem certeza que deseja excluir esta categoria?")) {
    fetch(`${API_BASE_URL}/menus/${userData.id}/categories/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${userData.token}`
      },
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