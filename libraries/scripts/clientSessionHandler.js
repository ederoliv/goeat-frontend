function isAuthenticatedClient(){

    if(sessionStorage.getItem('clientData')) {//se o session já foi criado
        clientData = JSON.parse(sessionStorage.getItem('clientData')); //pega os dados do session
        return clientData.isAuthenticated; //e retorna o estado, autenticado ou não
    } else {
        //se o session não existe, cria um novo session com os dados padrão
        clientData = {
            isAuthenticated: false,
            id: null,
            username: null,
            token: null,
        };
        sessionStorage.setItem('clientData', JSON.stringify(clientData));

        return clientData.isAuthenticated; //retorna o estado que vai ser falso
    }
}

function getAuthenticatedClient(){
    if(sessionStorage.getItem('clientData')) {
        clientData = JSON.parse(sessionStorage.getItem('clientData'));
        return clientData;
    }
    return null;
}
//após a autencicação, o usuário é autenticado e os dados são armazenados no sessionStorage
function setAuthenticatedClient(userData){
    clientData = userData;
    sessionStorage.setItem('clientData', JSON.stringify(clientData));
}

function logoutClient() {
    // Limpa os dados do cliente do sessionStorage
    const clientData = {
        isAuthenticated: false,
        id: null,
        username: null,
        token: null,
    };
    sessionStorage.setItem('clientData', JSON.stringify(clientData));
}