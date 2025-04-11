
function registerClient() {

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    

    if(password.value === confirmPassword.value){

    const name = document.getElementById('name');
    const cpf = document.getElementById('cpf');
    const number = document.getElementById('number');
    const birth = document.getElementById('birth');
    const email = document.getElementById('email');
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:8080/api/v1/clients/register', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
  
    const registry = {
      name: name.value,
      email: email.value,
      password: password.value,
      cpf: cpf.value,
      phone: number.value,
      birthDate: birth.value
    };

    xhr.send(JSON.stringify(registry));
  
    xhr.onload = function() {//em caso de sucesso
      if (xhr.status === 200) {
  
      const clientData = JSON.parse(xhr.responseText);
      sessionStorage.setItem('userData', JSON.stringify(clientData));
  
      window.location.replace('../loginClient/index.html');
      } else {
        alert('Login failed!');
        // caso  de falha

      }
    };

  }else{

        alert('Passwords do not match');

  }
}