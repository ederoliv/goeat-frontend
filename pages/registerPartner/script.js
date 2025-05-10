async function register() {
  // Captura os valores dos campos
  const nameInput = document.getElementById('name');
  const cnpjInput = document.getElementById('cnpj');
  const phoneInput = document.getElementById('number');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  
  // Validações básicas
  if (!nameInput.value || !cnpjInput.value || !phoneInput.value || 
      !emailInput.value || !passwordInput.value || !confirmPasswordInput.value) {
      Swal.fire({
          icon: 'warning',
          title: 'Dados incompletos',
          text: 'Por favor, preencha todos os campos!',
          confirmButtonColor: '#06CF90'
      });
      return;
  }
  
  // Verifica se as senhas conferem
  if (passwordInput.value !== confirmPasswordInput.value) {
      Swal.fire({
          icon: 'error',
          title: 'Senhas diferentes',
          text: 'As senhas não coincidem! Verifique e tente novamente.',
          confirmButtonColor: '#06CF90'
      });
      return;
  }
  
  // Prepara o objeto de registro
  const registrationData = {
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      cnpj: cnpjInput.value,
      phone: phoneInput.value
  };
  
  try {
      // Mostra loading
      Swal.fire({
          title: 'Registrando...',
          text: 'Por favor, aguarde.',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
              Swal.showLoading();
          }
      });
      
      // Faz a requisição para a API
      const response = await fetch(`${API_BASE_URL}/partners`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(registrationData)
      });
      
      // Fecha o loading
      Swal.close();
      
      if (response.ok) {
          // Tenta fazer o parse dos dados retornados
          let partnerData = null;
          try {
              partnerData = await response.json();
          } catch (e) {
              // Se não conseguir fazer parse (resposta vazia), não é um problema crítico
              console.log('Resposta vazia ou não-JSON, continuando...');
          }
          
          // Armazena os dados se houver
          if (partnerData) {
              sessionStorage.setItem('userData', JSON.stringify(partnerData));
          }
          
          // Mostra sucesso e redireciona
          Swal.fire({
              icon: 'success',
              title: 'Cadastro realizado!',
              text: 'Sua conta foi criada com sucesso. Você será redirecionado para a página de login.',
              confirmButtonColor: '#06CF90',
              allowOutsideClick: false
          }).then((result) => {
              if (result.isConfirmed) {
                  window.location.replace('../loginPartner/index.html');
              }
          });
          
      } else {
          // Tenta extrair mensagem de erro da resposta
          let errorMessage = 'Erro ao criar sua conta.';
          try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
          } catch (e) {
              // Se não conseguir fazer parse do erro, usa mensagem padrão
              console.error('Erro ao fazer parse da resposta de erro:', e);
          }
          
          Swal.fire({
              icon: 'error',
              title: 'Falha no cadastro',
              text: errorMessage,
              confirmButtonColor: '#06CF90'
          });
      }
      
  } catch (error) {
      // Fecha o loading se ainda estiver aberto
      Swal.close();
      
      console.error('Erro durante o registro:', error);
      
      Swal.fire({
          icon: 'error',
          title: 'Erro de conexão',
          text: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
          confirmButtonColor: '#06CF90'
      });
  }
}

// Função para aplicar máscara no CNPJ
function mascaraCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, ''); // Remove caracteres não numéricos
  cnpj = cnpj.replace(/^(\d{2})(\d)/, '$1.$2'); // Coloca ponto após os dois primeiros dígitos
  cnpj = cnpj.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3'); // Coloca ponto após o quinto dígito
  cnpj = cnpj.replace(/\.(\d{3})(\d)/, '.$1/$2'); // Coloca barra após o oitavo dígito
  cnpj = cnpj.replace(/(\d{4})(\d)/, '$1-$2'); // Coloca hífen após o décimo segundo dígito
  return cnpj;
}

// Função para aplicar máscara no telefone
function mascaraTelefone(telefone) {
  telefone = telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
  telefone = telefone.replace(/^(\d{2})(\d)/g, '($1) $2'); // Coloca parênteses em volta dos dois primeiros dígitos
  telefone = telefone.replace(/(\d)(\d{4})$/, '$1-$2'); // Coloca hífen antes dos 4 últimos dígitos
  return telefone;
}

// Configura os eventos quando o documento estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  // Aplica máscara ao CNPJ enquanto o usuário digita
  const cnpjInput = document.getElementById('cnpj');
  if (cnpjInput) {
      cnpjInput.addEventListener('input', function() {
          this.value = mascaraCNPJ(this.value);
      });
  }
  
  // Aplica máscara ao telefone enquanto o usuário digita
  const phoneInput = document.getElementById('number');
  if (phoneInput) {
      phoneInput.addEventListener('input', function() {
          this.value = mascaraTelefone(this.value);
      });
  }
  
  // Adiciona evento de submit no formulário
  const form = document.querySelector('form');
  if (form) {
      form.addEventListener('submit', function(e) {
          e.preventDefault();
          register();
      });
  }
  
  // Adiciona evento de Enter nos campos de senha
  const confirmPasswordInput = document.getElementById('confirmPassword');
  if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              e.preventDefault();
              register();
          }
      });
  }
});