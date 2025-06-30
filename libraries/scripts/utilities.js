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
       background-color: rgba(0, 0, 0, 0.6);
       display: flex;
       justify-content: center;
       align-items: center;
       z-index: 9999;
   `;

   // Criar o conteúdo do modal
   const modalContent = document.createElement('div');
   modalContent.style.cssText = `
       background-color: rgba(255, 255, 255, 0.95);
       padding: 40px;
       border-radius: 15px;
       text-align: center;
       box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
   `;

   // Adicionar a logo
   const logo = document.createElement('img');
   logo.src = `${routes.assets}goeat-logo-pg.svg`;
   logo.style.cssText = `
       height: 80px;
       margin-bottom: 20px;
       animation: pulse 1.5s ease-in-out infinite;
   `;

   // Adicionar o texto de loading
   const loadingText = document.createElement('p');
   loadingText.textContent = 'Carregando...';
   loadingText.style.cssText = `
       margin: 0;
       color: var(--goeat-primary);
       font-family: Arial, sans-serif;
       font-size: 16px;
       font-weight: 500;
   `;

   // Montar a estrutura do modal
   modalContent.appendChild(logo);
   modalContent.appendChild(loadingText);
   modalContainer.appendChild(modalContent);
   document.body.appendChild(modalContainer);

   // Adicionar a animação de pulse (vai e vem)
   const style = document.createElement('style');
   style.textContent = `
       @keyframes pulse {
           0% { 
               transform: scale(1);
               opacity: 1;
           }
           50% { 
               transform: scale(1.1);
               opacity: 0.7;
           }
           100% { 
               transform: scale(1);
               opacity: 1;
           }
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