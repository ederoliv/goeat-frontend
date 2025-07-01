function addProduct() {
  const name = document.getElementById("nameInput").value
  const description = document.getElementById("descriptionInput").value
  const priceInput = document.getElementById("priceInput")
  const price = getPriceInCents(priceInput)
  const categoryId = document.getElementById("categoryInput").value

  const currentImageCid = getCurrentProductImageCid();
  const imageUrlField = document.getElementById("imageUrlInput").value;
  const imageUrl = currentImageCid || imageUrlField || "";

  if (!name || price <= 0) {
    goeatAlert("warning", "Por favor, preencha os campos obrigatórios corretamente.")
    return
  }

  const productData = {
    name,
    description,
    price,
    imageUrl,
    menuId: userData.id,
    categoryId: categoryId || null
  }

  fetch(`${API_BASE_URL}/partners/${userData.id}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userData.token}`
    },
    body: JSON.stringify(productData),
  })
    .then((response) => {
      if (response.status === 200 || response.status === 201) {
        goeatAlert("success", "Produto adicionado com sucesso!")
        const modal = document.getElementById("modal")
        if (modal) {
          modal.remove()
        }
        resetProductImageState();
        listProducts()
      } else {
        goeatAlert("error", "Falha ao adicionar produto")
        throw new Error("Falha ao adicionar produto")
      }
    })
    .catch((error) => {
      console.error("Erro completo:", error)
      goeatAlert("error", "Erro ao adicionar produto")
    })
}

function updateProduct(productId) {
  const name = document.getElementById("nameInput").value
  const description = document.getElementById("descriptionInput").value
  const priceInput = document.getElementById("priceInput")
  const price = getPriceInCents(priceInput)
  const categoryId = document.getElementById("categoryInput").value

  const currentImageCid = getCurrentProductImageCid();
  const imageUrlField = document.getElementById("imageUrlInput").value;
  const imageUrl = currentImageCid || imageUrlField || "";

  if (!name || price <= 0) {
    goeatAlert("warning", "Por favor, preencha os campos obrigatórios corretamente.")
    return
  }

  const productData = {
    name,
    description,
    price,
    imageUrl,
    menuId: userData.id,
    categoryId: categoryId || null
  }

  fetch(`${API_BASE_URL}/partners/${userData.id}/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userData.token}`
    },
    body: JSON.stringify(productData),
  })
    .then((response) => {
      if (response.ok) {
        goeatAlert("success", "Produto atualizado com sucesso!")
        const modal = document.getElementById("modal")
        if (modal) {
          modal.remove()
        }
        resetProductImageState();
        listProducts()
        return response.json()
      }
      throw new Error("Falha ao atualizar produto")
    })
    .catch((error) => {
      goeatAlert("error", "Falha ao atualizar produto")
    })
}