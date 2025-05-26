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

function getInvalidClientToken(code){
    // Verifica se o código de erro é 401
    if (code === 401) {
        // Limpa os dados do cliente do sessionStorage
        logoutClient();
        // Redireciona para a página de login
        window.location.href = '../../loginClient/index.html';
    }

}

function getInvalidPartnerToken(code){
    // Verifica se o código de erro é 401
    if (code === 401) {
        // Limpa os dados do parceiro do sessionStorage
        logoutPartner();
        // Redireciona para a página de login
        window.location.href = '../../loginPartner/index.html';
    }

}

function logoutPartner() {
    // Limpa os dados do parceiro do sessionStorage
    const partnerData = {
        isAuthenticated: false,
        id: null,
        name: null,
        token: null,
    };
    sessionStorage.setItem('userData', JSON.stringify(partnerData));
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