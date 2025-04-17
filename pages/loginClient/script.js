function login() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const email = emailInput.value;
  const password = passwordInput.value;

  // Verificações básicas
  if (!email || !password) {
      alertaErroLogin("Por favor, preencha todos os campos");
      return;
  }

  const credentials = {
    email: email,
    password: password
  };

  fetch(`${API_BASE_URL}/clients/login`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
    },
    body: JSON.stringify(credentials)
})
.then(response => {
    // Vamos capturar e mostrar mais detalhes sobre a resposta
    console.log('Status da resposta:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
    
    // Vamos tentar ler o corpo da resposta mesmo se for um erro
    return response.text().then(text => {
        try {
            // Tenta converter para JSON se possível
            const data = JSON.parse(text);
            console.log('Corpo da resposta:', data);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${data.message || text}`);
            }
            
            return data; // retorna os dados se for sucesso
        } catch (e) {
            console.log('Resposta não-JSON:', text);
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${text}`);
            }
            return JSON.parse(text);
        }
    });
})
.then(clientData => {
    // código de sucesso existente
})
.catch(error => {
    console.error("Detalhes completos do erro:", error);
    alert("Erro no login: " + error.message);
});
      
      // Salva os dados no sessionStorage
      sessionStorage.setItem('clientData', JSON.stringify(userData));

      // Verifica se deve retornar para o checkout
      const urlParams = new URLSearchParams(window.location.search);
      const returnTo = urlParams.get('returnTo');
      const partnerId = urlParams.get('partnerId');
      
      if (returnTo === 'checkout' && partnerId) {
          // Redireciona para a página de checkout com o partnerId
          window.location.replace(`../client/store/checkout.html?partnerId=${partnerId}`);
      } else {
          // Redireciona para a página principal
          window.location.replace('../client/index.html');
      }
  })
  .catch(error => {
      console.error('Erro no login:', error);
      alertaErroLogin("Usuário incorreto e/ou inexistente!");
  });
}

// Função para mostrar o modal de erro
function alertaErroLogin(mensagem = "Usuário incorreto e/ou inexistente!") {
const modal = document.getElementById("modal");
const mensagemElement = modal.querySelector("p");

if (mensagemElement) {
  mensagemElement.textContent = mensagem;
}

modal.style.display = "block";
}

// Função para fechar o modal
function fechar() {
document.getElementById("modal").style.display = "none";
}

// Adicionar listener para tecla Enter nos campos de input
document.addEventListener('DOMContentLoaded', function() {
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

if (emailInput && passwordInput) {
  emailInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      passwordInput.focus();
    }
  });
  
  passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      login();
    }
  });
}

// Configurar evento para o botão de fechar do modal
const closeButton = document.querySelector('.close');
if (closeButton) {
  closeButton.addEventListener('click', fechar);
}

// Configurar evento para o botão OK do modal
const okButton = document.getElementById('deleteButton');
if (okButton) {
  okButton.addEventListener('click', fechar);
}
});