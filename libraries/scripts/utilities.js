function formatPrice(intPrice) {
   return (intPrice / 100).toFixed(2).replace('.', ',');
}

function showLoadingModal() {
   // Criar o elemento do modal
   const modalContainer = document.createElement('div');
   modalContainer.id = 'loading-modal';
   modalContainer.style.cssText = `
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background-color: rgba(0, 0, 0, 0.5);
       display: flex;
       justify-content: center;
       align-items: center;
       z-index: 9999;
   `;

   // Criar o conteúdo do modal
   const modalContent = document.createElement('div');
   modalContent.style.cssText = `
       background-color: white;
       padding: 20px;
       border-radius: 10px;
       text-align: center;
   `;

   // Adicionar a logo
   const logo = document.createElement('img');
   logo.src = '../../libraries/assets/goeat-logo.svg';
   logo.style.cssText = `
       height: 80px;
       margin-bottom: 15px;
       animation: spin 2s linear infinite;
   `;

   // Adicionar o texto de loading
   const loadingText = document.createElement('p');
   loadingText.textContent = 'Carregando...';
   loadingText.style.cssText = `
       margin: 0;
       color: var(--goeat-primary);
       font-family: Arial, sans-serif;
   `;

   // Montar a estrutura do modal
   modalContent.appendChild(logo);
   modalContent.appendChild(loadingText);
   modalContainer.appendChild(modalContent);
   document.body.appendChild(modalContainer);

   // Adicionar a animação de rotação
   const style = document.createElement('style');
   style.textContent = `
       @keyframes spin {
           0% { transform: rotate(0deg); }
           100% { transform: rotate(360deg); }
       }
   `;
   document.head.appendChild(style);
}

function hideLoadingModal() {
   const modal = document.getElementById('loading-modal');
   if (modal) {
       modal.remove();
   }
}


function goeatAlert(iconType,message){
    Swal.fire({
        position: "center",
        icon: iconType,
        title: message,
        showConfirmButton: false,
        timer: 2000
      });
}