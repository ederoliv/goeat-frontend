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
 * Carrega os dados financeiros da API com uma única requisição
 */
async function loadFinancialData() {
    try {
        // Mostrar indicadores de carregamento
        showLoadingIndicators();
        
        // Fazer requisição única para o endpoint /finance
        const response = await fetch(`${API_BASE_URL}/reports/finance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }
        
        const financeData = await response.json();
        
        // Atualizar os dados na interface
        updateFinanceDisplay(financeData);

    } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
        showErrorState();
        goeatAlert('error', 'Não foi possível carregar os dados financeiros. Tente novamente mais tarde.');
    }
}

/**
 * Atualiza a exibição dos dados financeiros na interface
 * @param {Object} financeData - Dados financeiros completos da API
 */
function updateFinanceDisplay(financeData) {
    // Atualizar dados diários
    if (financeData.daily) {
        updatePeriodCard('today', financeData.daily);
    }
    
    // Atualizar dados semanais
    if (financeData.weekly) {
        updatePeriodCard('week', financeData.weekly);
    }
    
    // Atualizar dados mensais
    if (financeData.monthly) {
        updatePeriodCard('month', financeData.monthly);
    }
}

/**
 * Atualiza um card de período específico
 * @param {string} period - Período (today, week, month)
 * @param {Object} data - Dados do período
 */
function updatePeriodCard(period, data) {
    const periodMap = {
        'today': 'finance-today',
        'week': 'finance-week',
        'month': 'finance-month'
    };
    
    const elementId = periodMap[period];
    const element = document.getElementById(elementId);
    
    if (!element) return;
    
    // Limpar classe de loading se existir
    element.classList.remove('loading');
    
    // Criar conteúdo do card com todos os dados
    const cardContent = createFinanceCard(data);
    element.innerHTML = cardContent;
}

/**
 * Cria o conteúdo HTML para um card de finanças
 * @param {Object} data - Dados financeiros do período
 * @returns {string} - HTML do card
 */
function createFinanceCard(data) {
    const totalSales = formatCurrency(data.totalSales || 0);
    const averageTicket = formatCurrency(data.averageTicket || 0);
    const canceledValue = formatCurrency(data.canceledOrdersValue || 0);
    
    return `
        <div class="finance-main-value">${totalSales}</div>
        <div class="finance-details">
            <div class="finance-detail-item">
                <span class="detail-label">Ticket Médio:</span>
                <span class="detail-value">${averageTicket}</span>
            </div>
            <div class="finance-detail-item canceled">
                <span class="detail-label">Cancelamentos:</span>
                <span class="detail-value">${canceledValue}</span>
            </div>
        </div>
    `;
}

/**
 * Mostra indicadores de carregamento em todos os cards
 */
function showLoadingIndicators() {
    const elements = ['finance-today', 'finance-week', 'finance-month'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<i class="fa fa-spinner fa-pulse"></i>';
            element.classList.add('loading');
        }
    });
}

/**
 * Mostra estado de erro em todos os cards
 */
function showErrorState() {
    const elements = ['finance-today', 'finance-week', 'finance-month'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<span class="error-text">Erro ao carregar</span>';
            element.classList.remove('loading');
        }
    });
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
    // Mostrar indicadores de carregamento
    showLoadingIndicators();
    
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