// Variáveis globais
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está autenticado
    if (!userData || !userData.token) {
        console.error('Usuário não autenticado ou token não encontrado');
        window.location.href = '../../loginPartner/index.html';
        return;
    }
    
    // Preencher nome do usuário
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.name || 'Parceiro';
    }
    
    // Carregar dados financeiros iniciais
    loadFinancialData();
});

/**
 * Carrega os dados financeiros da API
 */
async function loadFinancialData() {
    try {
        // Carregar dados em paralelo
        await Promise.all([
            fetchReportData('daily', 'finance-today'),
            fetchReportData('weekly', 'finance-week'),
            fetchReportData('monthly', 'finance-month')
        ]);
        

    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        goeatAlert('error', 'Não foi possível carregar os dados financeiros. Tente novamente mais tarde.');
    }
}

/**
 * Busca dados de um relatório específico
 * @param {string} reportType - Tipo de relatório (daily, weekly, monthly)
 * @param {string} elementId - ID do elemento onde exibir o resultado
 */
async function fetchReportData(reportType, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Exibir indicador de carregamento
    element.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/reports/${reportType}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar se há dados válidos
        if (data && typeof data.value !== 'undefined') {
            // Formatar e exibir valor
            const formattedValue = formatCurrency(data.value);
            element.textContent = formattedValue;
            
            // Adicionar classe de cor com base no valor
            element.classList.remove('green', 'red'); // Remove classes antigas
            if (data.value > 0) {
                element.classList.add('green');
            } else if (data.value < 0) {
                element.classList.add('red');
            }
        } else {
            element.textContent = 'R$ 0,00';
        }
        
    } catch (error) {
        console.error(`Erro ao buscar dados do relatório ${reportType}:`, error);
        element.innerHTML = '<span style="color: #ff5555; font-size: 14px;">Erro ao carregar</span>';
    }
}

/**
 * Formata um valor em centavos para moeda brasileira
 * @param {number} value - Valor em centavos
 * @returns {string} - Valor formatado (ex: R$ 1.234,56)
 */
function formatCurrency(value) {
    // Converter para número, caso venha como string
    const valueInCents = Number(value);
    
    // Verificar se é um número válido
    if (isNaN(valueInCents)) {
        return 'R$ 0,00';
    }
    
    // Converter centavos para reais
    const reais = Math.floor(valueInCents / 100);
    const centavos = Math.abs(valueInCents % 100);
    
    // Formatar com separadores
    return `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
}

/**
 * Atualiza os dados financeiros (chamada do botão de refresh)
 */
function refreshFinancialData() {
    // Mostrar indicador de carregamento nos cards
    const elements = ['finance-today', 'finance-week', 'finance-month'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
            element.classList.remove('green', 'red');
        }
    });
    
    // Recarregar dados
    loadFinancialData()
        .catch(() => {
            goeatAlert('error', 'Falha ao atualizar dados. Tente novamente.');
        });
}

/**
 * Navegação para a página de detalhes financeiros/relatórios
 */
function navigateToDetails() {
    // Por enquanto mostra um alerta informativo
    goeatAlert('info', 'Funcionalidade de relatório completo em desenvolvimento! Em breve você terá acesso aos detalhes completos.');
    
    // Quando implementar a página de análises, descomente a linha abaixo:
    // window.location.href = '../analytics/index.html';
}