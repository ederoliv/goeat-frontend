const root = window.location.origin;

let API_BASE_URL = 'http://localhost:8080/api/v1'; // Valor default para ambiente local

// Se não for o ambiente local (localhost ou 127.0.0.1), usa o valor da variável de ambiente
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    API_BASE_URL = 'https://goeat-api.ederoliv.com.br/api/v1'; // Para Vercel
}

// Tornando a variável API_BASE_URL acessível globalmente
window.API_BASE_URL = API_BASE_URL;


//rotas (Ah VÁ?)
routes = {

    main: 'index.html',

    //PAGES
    store : '/pages/client/store/index.html',

    //ASSETS
    assets : '/libraries/assets/',
    
}


function router(routes) {
return root+routes;
}

function apiRoute(){
    return routes.api;
}