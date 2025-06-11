/**
 * Arquivo responsável pelos modais de produtos
 * Inclui criação, edição e gerenciamento de modais de produtos
 * VERSÃO ATUALIZADA COM UPLOAD DE IMAGEM
 */

/**
 * Função para criar o modal de produtos (cadastro ou edição)
 */
function _createProductModal(title, productData = null) {
  // Remover modal existente se houver
  const existingModal = document.getElementById("modal")
  if (existingModal) {
    existingModal.remove()
  }

  // Resetar o estado da imagem
  resetProductImageState();

  // Criar novo modal
  const modal = document.createElement("div")
  modal.id = "modal"
  modal.className = "modal"

  const modalContent = document.createElement("div")
  modalContent.className = "modal-content"

  const modalHeader = document.createElement("div")
  modalHeader.className = "modal-header"

  const modalTitle = document.createElement("h2")
  modalTitle.textContent = title

  const closeButton = document.createElement("button")
  closeButton.className = "close-button fa fa-times"
  closeButton.onclick = () => {
    modal.remove() // Remove completamente o modal
  }

  modalHeader.append(modalTitle, closeButton)

  const modalBody = document.createElement("div")
  modalBody.className = "modal-body"

  // Criação dos inputs básicos
  const basicInputs = [
    { id: "nameInput", type: "text", placeholder: "Nome do produto...", label: "Nome do Produto*" },
    { id: "descriptionInput", type: "text", placeholder: "Descrição do produto...", label: "Descrição" },
    { id: "priceInput", type: "number", placeholder: "Preço do produto...", label: "Preço*" }
  ]

  basicInputs.forEach((input) => {
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
      }
    }

    modalBody.append(label, inputElement)
  })

  // Seção de Upload de Imagem
  const imageLabel = document.createElement("label")
  imageLabel.textContent = "Imagem do Produto"

  const imageContainer = document.createElement("div")
  imageContainer.id = "product-image-container"
  imageContainer.className = "product-image-container"

  const imagePreview = document.createElement("img")
  imagePreview.id = "product-image-preview"
  imagePreview.className = "product-image-preview"
  imagePreview.style.display = "none"

  const imageIcon = document.createElement("i")
  imageIcon.id = "product-image-icon"
  imageIcon.className = "fa fa-image product-image-icon"

  const imageUploadOverlay = document.createElement("div")
  imageUploadOverlay.id = "product-image-upload-overlay"
  imageUploadOverlay.className = "product-image-upload-overlay"

  const overlayIcon = document.createElement("i")
  overlayIcon.className = "fa fa-camera"

  const overlayText = document.createElement("span")
  overlayText.textContent = "Clique ou arraste uma imagem"

  imageUploadOverlay.append(overlayIcon, overlayText)

  const removeImageButton = document.createElement("button")
  removeImageButton.id = "remove-image-button"
  removeImageButton.className = "remove-image-button"
  removeImageButton.innerHTML = '<i class="fa fa-times"></i>'
  removeImageButton.style.display = "none"
  removeImageButton.type = "button"

  const imageInput = document.createElement("input")
  imageInput.id = "product-image-input"
  imageInput.type = "file"
  imageInput.accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
  imageInput.style.display = "none"

  imageContainer.append(imagePreview, imageIcon, imageUploadOverlay, removeImageButton, imageInput)

  // Campo de URL da imagem (oculto, usado internamente)
  const imageUrlInput = document.createElement("input")
  imageUrlInput.id = "imageUrlInput"
  imageUrlInput.type = "hidden"
  
  // Se temos dados do produto, preencher o campo de imagem
  if (productData && productData.imageUrl) {
    imageUrlInput.value = productData.imageUrl
  }

  modalBody.append(imageLabel, imageContainer, imageUrlInput)

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
  cancelButton.onclick = () => {
    modal.remove() // Remove completamente o modal
  }

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
  
  // Configurar o upload de imagem após criar o modal
  setupProductImageUpload()

  // Se estamos editando e há uma imagem, carregá-la
  if (productData && productData.imageUrl) {
    loadExistingProductImage(productData.imageUrl)
  }
  
  return modal
}

/**
 * Função para abrir o modal de adição de produtos
 */
function _addProductModal() {
  const modal = _createProductModal("Cadastrar Produto")
  modal.classList.add('flex')
}

/**
 * Função para editar um produto existente
 */
function editProduct(product) {
  const modal = _createProductModal("Editar Produto", product)
  modal.classList.add('flex')
}

/**
 * Função para carregar categorias no dropdown
 */
function loadCategories(categorySelect, selectedCategoryId = null) {
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

/**
 * Função para fechar modais
 */
function fechar() {
  const modal = document.getElementById("modal")
  if (modal) {
    modal.remove() // Remove completamente o modal
  }
}