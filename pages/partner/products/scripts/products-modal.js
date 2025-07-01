function _createProductModal(title, productData = null) {
  const existingModal = document.getElementById("modal")
  if (existingModal) {
    existingModal.remove()
  }

  resetProductImageState();

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
    modal.remove()
  }

  modalHeader.append(modalTitle, closeButton)

  const modalBody = document.createElement("div")
  modalBody.className = "modal-body"

  const basicInputs = [
    { id: "nameInput", type: "text", placeholder: "Nome do produto...", label: "Nome do Produto*" },
    { id: "descriptionInput", type: "text", placeholder: "Descrição do produto...", label: "Descrição" },
    { id: "priceInput", type: "text", placeholder: "0,00", label: "Preço (R$)*", isPriceField: true }
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
    
    if (input.isPriceField) {
      const priceContainer = document.createElement("div")
      priceContainer.className = "price-input-container"
      
      const currencyIcon = document.createElement("span")
      currencyIcon.className = "currency-icon"
      currencyIcon.textContent = "R$"
      
      inputElement.style.paddingLeft = "35px"
      inputElement.style.textAlign = "right"
      inputElement.style.fontFamily = "'Courier New', monospace"
      inputElement.style.fontWeight = "500"
      
      priceContainer.appendChild(currencyIcon)
      priceContainer.appendChild(inputElement)
      
      modalBody.append(label, priceContainer)
      
      setupPriceInputFormatter(inputElement)
    } else {
      modalBody.append(label, inputElement)
    }
    
    if (productData) {
      switch(input.id) {
        case "nameInput":
          inputElement.value = productData.name || "";
          break;
        case "descriptionInput":
          inputElement.value = productData.description || "";
          break;
        case "priceInput":
          if (productData.price) {
            setPriceFromCents(inputElement, productData.price);
          }
          break;
      }
    }
  })

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

  const imageUrlInput = document.createElement("input")
  imageUrlInput.id = "imageUrlInput"
  imageUrlInput.type = "hidden"
  
  if (productData && productData.imageUrl) {
    imageUrlInput.value = productData.imageUrl
  }

  modalBody.append(imageLabel, imageContainer, imageUrlInput)

  const categoryLabel = document.createElement("label")
  categoryLabel.textContent = "Categoria*"
  categoryLabel.setAttribute("for", "categoryInput")

  const categorySelect = document.createElement("select")
  categorySelect.id = "categoryInput"
  categorySelect.className = "input-modal"

  categorySelect.addEventListener("change", function () {
    if (this.value === "add_new_category") {
      this.selectedIndex = 0
      openCategoryManagementModal()
    }
  })

  const loadingOption = document.createElement("option")
  loadingOption.textContent = "Carregando categorias..."
  loadingOption.disabled = true
  loadingOption.selected = true
  categorySelect.appendChild(loadingOption)

  modalBody.append(categoryLabel, categorySelect)

  loadCategories(categorySelect, productData?.categoryId)

  const modalFooter = document.createElement("div")
  modalFooter.className = "modal-footer"

  const cancelButton = document.createElement("button")
  cancelButton.className = "cancel-button"
  cancelButton.textContent = "Cancelar"
  cancelButton.onclick = () => {
    modal.remove()
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
  
  setupProductImageUpload()

  if (productData && productData.imageUrl) {
    loadExistingProductImage(productData.imageUrl)
  }
  
  return modal
}

function _addProductModal() {
  const modal = _createProductModal("Cadastrar Produto")
  modal.classList.add('flex')
}

function editProduct(product) {
  const modal = _createProductModal("Editar Produto", product)
  modal.classList.add('flex')
}

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
      categorySelect.innerHTML = ""

      const defaultOption = document.createElement("option")
      defaultOption.textContent = "Selecione uma categoria"
      defaultOption.value = ""
      defaultOption.disabled = true
      
      if (!selectedCategoryId) {
        defaultOption.selected = true
      }
      
      categorySelect.appendChild(defaultOption)

      const addCategoryOption = document.createElement("option")
      addCategoryOption.textContent = "Adicionar categoria"
      addCategoryOption.value = "add_new_category"
      categorySelect.appendChild(addCategoryOption)

      categories.forEach((category) => {
        const option = document.createElement("option")
        option.value = category.id
        option.textContent = category.name
        
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

function fechar() {
  const modal = document.getElementById("modal")
  if (modal) {
    modal.remove()
  }
}