const sessionButton = document.getElementById("session-button");//used into client/index.html and client/store/index.html

function setAuthenticatedNavbar() {

    sessionButton.textContent = "Seu perfil";
    sessionButton.href = `${root}${routes.profile}`;


}