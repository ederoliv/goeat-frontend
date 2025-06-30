function login() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const email = emailInput.value;
  const password = passwordInput.value;

  // Verificações básicas
  if (!email || !password) {
    Swal.fire({
      icon: "warning",
      title: "Campos obrigatórios",
      text: "Por favor, preencha todos os campos",
    });
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE_URL}/partners/login`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  const credentials = {
    email: email,
    password: password
  };

  xhr.send(JSON.stringify(credentials));

  xhr.onload = function() {
    if (xhr.status === 200) {
      const partnerData = JSON.parse(xhr.responseText);
      sessionStorage.setItem('userData', JSON.stringify(partnerData));
      window.location.replace('../partner/acompanhar/index.html');
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Usuário incorreto e/ou inexistente!",
        footer: '<a id="forgot" href="../forgotPassword/index.html">Esqueceu a senha ?</a>'
      });
    }
  };

  xhr.onerror = function() {
    Swal.fire({
      icon: "error",
      title: "Erro de conexão",
      text: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
    });
  };
}

// Função para fechar modal (mantida para compatibilidade)
function fechar() {
  const modal = document.getElementById("modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Configuração de eventos quando o DOM estiver carregado
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

  // Adicionar evento de Enter em todo o formulário
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        login();
      }
    });
  }

  // Configurar eventos para elementos de modal se existirem
  const closeButton = document.querySelector('.close');
  if (closeButton) {
    closeButton.addEventListener('click', fechar);
  }

  // Evento de clique fora do modal para fechá-lo (se existir)
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal');
    if (modal && event.target === modal) {
      fechar();
    }
  });

  // Foco automático no primeiro campo quando a página carregar
  if (emailInput) {
    emailInput.focus();
  }
});