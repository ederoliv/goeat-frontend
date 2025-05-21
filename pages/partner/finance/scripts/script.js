document.addEventListener('DOMContentLoaded', function() {
    // Tenta obter dados do parceiro do localStorage
    // Garanta que 'userData' contenha 'id' e 'token'
    const userData = JSON.parse(localStorage.getItem('userData')); 
    const userNameElement = document.getElementById('userName');

    if (userData && userData.name) {
        userNameElement.textContent = `Olá, ${userData.name}`;
    } else {
        userNameElement.textContent = 'Olá, Parceiro';
    }

    if (!userData || !userData.id || !userData.token) {
        console.error("Dados do parceiro (ID ou Token) não encontrados no localStorage. As requisições não serão feitas.");
        // Pode ser útil exibir uma mensagem para o usuário aqui ou redirecionar para o login
        if (typeof Swal !== 'undefined') {
            Swal.fire("Erro de Autenticação", "Não foi possível carregar seus dados financeiros. Por favor, faça login novamente.", "error");
        }
        // Limpa os campos para indicar falha no carregamento
        document.getElementById('finance-today').innerHTML = `Erro <i class="fa fa-eye icon" title="Falha ao autenticar"></i>`;
        document.getElementById('finance-week').innerHTML = `Erro <i class="fa fa-eye icon" title="Falha ao autenticar"></i>`;
        document.getElementById('finance-month').innerHTML = `Erro <i class="fa fa-eye icon" title="Falha ao autenticar"></i>`;
        return; // Impede a execução de fetchFinancialData se os dados essenciais não estiverem presentes
    }
    
    // Carrega os dados financeiros ao iniciar a página
    fetchFinancialData(userData);
});

// Função para buscar e formatar um valor individual de um endpoint financeiro
async function fetchReportValue(endpoint, userData, elementId, iconClass = "fa fa-eye icon") {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Elemento com ID '${elementId}' não encontrado.`);
        return;
    }

    // Verifica se API_BASE_URL está definida
    if (typeof API_BASE_URL === 'undefined') {
        console.error("API_BASE_URL não está definida. Verifique seus scripts globais (routes.js ou utilities.js).");
        element.innerHTML = `Erro Config. <i class="${iconClass}" title="Erro de configuração da API"></i>`;
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/reports/${endpoint}`, {
            method: 'GET',
            headers: {
                // 'Content-Type': 'application/json', // Geralmente não é necessário para GET
                'Authorization': `Bearer ${userData.token}` // Token do parceiro
            }
        });

        if (!response.ok) {
            let errorMsg = `HTTP ${response.status} ${response.statusText}`;
            try { // Tenta obter uma mensagem de erro mais detalhada do corpo da resposta
                const errorBody = await response.json();
                errorMsg = (errorBody && errorBody.message) ? errorBody.message : errorMsg;
            } catch (e) { /* Ignora se o corpo do erro não for JSON */ }
            
            console.error(`Erro ao buscar dados para ${endpoint}: ${errorMsg}`);
            element.innerHTML = `Erro <i class="${iconClass}" title="${errorMsg}"></i>`;
            return;
        }

        const responseData = await response.json(); 
        const valueInCents = responseData.value; 

        if (typeof valueInCents === 'undefined') {
            console.error(`Propriedade "value" não encontrada na resposta JSON para ${endpoint}`);
            element.innerHTML = `Inválido <i class="${iconClass}" title="Resposta inválida da API"></i>`;
            return;
        }

        element.innerHTML = `R$ ${formatCurrencyFromCents(valueInCents)} <i class="${iconClass}" title="Visualizar detalhes"></i>`;

    } catch (error) {
        console.error(`Exceção na requisição para ${endpoint}:`, error);
        element.innerHTML = `N/A <i class="${iconClass}" title="Dados indisponíveis: ${error.message}"></i>`;
    }
}

// Função principal para buscar todos os dados financeiros
async function fetchFinancialData(userData) {
    // Mostra um alerta de carregamento (se SweetAlert2 estiver disponível)
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Carregando dados financeiros...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    // As três requisições são feitas em paralelo
    const promises = [
        fetchReportValue('daily', userData, 'finance-today'),
        fetchReportValue('weekly', userData, 'finance-week'),
        fetchReportValue('monthly', userData, 'finance-month')
    ];

    try {
        await Promise.all(promises);
        if (typeof Swal !== 'undefined') Swal.close(); 
    } catch (error) {
        console.error("Um ou mais relatórios financeiros falharam ao carregar (Promise.all).", error);
        if (typeof Swal !== 'undefined') {
            Swal.fire("Erro Inesperado", "Falha ao carregar todos os dados financeiros. Por favor, tente atualizar.", "error");
        }
    }
}

// Formata um valor em centavos para o formato de moeda Real (R$ xxx,xx)
function formatCurrencyFromCents(valueInCents) {
    const number = parseInt(valueInCents, 10); 
    if (isNaN(number)) {
        return '0,00'; 
    }
    const reais = Math.floor(number / 100);
    const centavos = number % 100;
    return `${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
}

// Navega para a página de detalhes financeiros/análise
function navigateToFinancialDetailsPage() {
    console.log("Navegando para a página de análise de vendas...");
    window.location.href = "../analytics/index.html"; // Ajuste o caminho se necessário
}
