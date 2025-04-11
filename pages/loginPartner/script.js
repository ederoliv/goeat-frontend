function login() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const email = emailInput.value;
  const password = passwordInput.value;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE_URL}/partners/login`, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  const credentials = {
    email: email,
    password: password
  };

  xhr.send(JSON.stringify(credentials));

  xhr.onload = function() {//em caso de sucesso
    if (xhr.status === 200) {

    const partnerData = JSON.parse(xhr.responseText);
    sessionStorage.setItem('userData', JSON.stringify(partnerData));

    window.location.replace('../partner/acompanhar/index.html');
    
    } else {
      alertaErroLogin();
    }
  };
}


//modal
function alertaErroLogin() {
  document.getElementById("modal").style.display = "block";
}

var span = document.getElementsByClassName("close")[0];
span.onclick = fechar();

function fechar() {

  document.getElementById("modal").style.display = "none";
}