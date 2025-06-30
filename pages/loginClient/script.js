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
      // Registrar o status da resposta para debug
      console.log('Status HTTP:', response.status);
      
      // Tenta obter o corpo da resposta
      return response.text().then(text => {
          // Mostra o texto bruto para debug
          console.log('Resposta bruta:', text);
          
          // Se resposta não for ok, lança erro com detalhes
          if (!response.ok) {
              throw new Error(`Erro ${response.status}: ${text || 'Sem detalhes'}`);
          }
          
          // Tenta converter para JSON
          try {
              return JSON.parse(text);
          } catch (e) {
              console.error('Erro ao analisar JSON:', e);
              throw new Error('Resposta inválida do servidor');
          }
      });
  })
  .then(clientData => {
      // Em caso de sucesso
      // Prepara os dados para salvar no session storage
      const userData = {
        isAuthenticated: true,
        id: clientData.id,
        username: clientData.name,
        email: clientData.email,
        token: clientData.token
      };
      
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
      console.error('Detalhes do erro:', error);
      alertaErroLogin("Falha no login: " + error.message);
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

// Adicionar listener para tecla Enter nos campos de input e configurações gerais
document.addEventListener('DOMContentLoaded', function() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginButton = document.querySelector('.btn');

  // Configurar eventos de Enter nos campos de input
  if (emailInput && passwordInput) {
    emailInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // Previne comportamento padrão do form
        passwordInput.focus();
      }
    });
    
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // Previne comportamento padrão do form
        login();
      }
    });
  }

  // Configurar evento de Enter no botão de login (caso ele receba foco)
  if (loginButton) {
    loginButton.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
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

  // Adicionar evento de Enter global no modal para fechá-lo
  const modal = document.getElementById('modal');
  if (modal) {
    modal.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        fechar();
      }
    });
  }

  // Evento de clique fora do modal para fechá-lo
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
      fechar();
    }
  });
});