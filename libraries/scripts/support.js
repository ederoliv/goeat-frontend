const userDataString = sessionStorage.getItem('userData');
const userData = JSON.parse(userDataString);
var defaultProductsUrl = 'http://localhost:8080/api/v1/products/';
var urlWithUserId = `http://localhost:8080/api/v1/products/${userData.partnerId}`;


window.onload = function() {
  const userDataString = sessionStorage.getItem('userData');
if (userDataString) {
    const userData = JSON.parse(userDataString);
  
    document.getElementById('userName').textContent = userData.name;

    var urlWithUserId = `http://localhost:8080/api/v1/products/${userData.partnerId}`;
    
    listProducts(urlWithUserId);
}
};

function adicionarProdutoPage() {
  window.location.replace('adicionar.html');
}

function abrirModal() {
  document.getElementById("modal").style.display = "block";
}

// Função para fechar o modal quando o usuário clica no X
var span = document.getElementsByClassName("close")[0];
span.onclick = function() {
  
  document.getElementById("modal").style.display = "none";
}


// busca produtos

async function listProducts(url) { 

    const tbody = document.querySelector('#tbody');

    const response = await fetch(url);

    const data = await response.json();

    data.map((post) => {


        const tr =  document.createElement('tr');

        const id = document.createElement('th');
        const name = document.createElement('th');
        const description = document.createElement('th');
        const price = document.createElement('th');
        const imageUrl = document.createElement('th');


        id.innerText = post.id;
        name.innerText = post.name;
        description.innerText = post.description;
        price.innerText = post.price;
        imageUrl.innerText = post.imageUrl;


        tr.appendChild(id);
        tr.appendChild(name);
        tr.appendChild(description);
        tr.appendChild(price)
        tr.appendChild(imageUrl);

        tbody.appendChild(tr);
        
    });
}

async function deleteProducts(){

  const codeInput = document.getElementById("codeInput");

  const url = `http://localhost:8080/api/v1/products/${codeInput.value}`;

  console.log(url);

  const response = await fetch(url , { 
    method: 'DELETE'})
    .then(response => {

      listProducts(`${urlWithUserId}${userData.partnerId}`);
      console.log(response.status);
    });
  }