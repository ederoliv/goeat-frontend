
function register() {

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    

    if(password.value === confirmPassword.value){

    const name = document.getElementById('name');
    const cnpj = document.getElementById('cnpj');
    const number = document.getElementById('number');
    const email = document.getElementById('email');
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/partners`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
  
    const registry = {
      name: name.value,
      email: email.value,
      password: password.value,
      cnpj: cnpj.value,
      phone: number.value
    };
  
    xhr.send(JSON.stringify(registry));
  
    xhr.onload = function() {//em caso de sucesso
      if (xhr.status === 200) {
  
      const partnerData = JSON.parse(xhr.responseText);
      sessionStorage.setItem('userData', JSON.stringify(partnerData));
  
      window.location.replace('../loginPartner/index.html');
      } else {
        alert('Login failed!');
        // caso  de falha

      }
    };

  }else{

        alert('Passwords do not match');

  }
}