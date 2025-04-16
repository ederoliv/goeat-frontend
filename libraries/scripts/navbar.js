const sessionButton = document.getElementById("session-button");//used into client/index.html and client/store/index.html

function setAuthenticatedNavbar() {

    alert("Authenticated")
    sessionButton.TextContent = "Seu perfil";
    sessionButton.href = "profile/index.html";

    
}

function setUnauthenticatedNavbar() {

    alert("Unauthenticated")
    sessionButton.innerHTML = "Fazer Login1";
    sessionButton.href = "profile/index.html";
}