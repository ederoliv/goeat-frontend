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
    
    // Inicializar a página
    initializeAnalytics();
    
    // Configurar eventos
    setupEventListeners();
});

/**
 * Inicializa todos os componentes da página
 */
function initializeAnalytics() {
    // Inicializar o gráfico de vendas
    if (typeof initializeSalesTimelineChart === 'function') {
        initializeSalesTimelineChart();
    }
    
    // Inicializar o gráfico de produtos mais vendidos
    if (typeof initializeProductsBestsellersChart === 'function') {
        initializeProductsBestsellersChart();
    }
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    // Seletor de período
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            console.log('Período alterado para:', this.value);
            refreshAnalytics();
        });
    }
}

/**
 * Atualiza todos os dados da página
 */
function refreshAnalytics() {
    // Mostra loading
    showLoadingModal();
    
    // Simula nova requisição de dados
    setTimeout(() => {
        // Atualizar gráfico de vendas
        if (typeof refreshSalesTimelineChart === 'function') {
            refreshSalesTimelineChart();
        }
        
        // Atualizar gráfico de produtos mais vendidos
        if (typeof refreshProductsBestsellersChart === 'function') {
            refreshProductsBestsellersChart();
        }
        
        hideLoadingModal();
        goeatAlert('success', 'Dados atualizados com sucesso!');
    }, 1500);
}

/**
 * Formata valor em centavos para moeda brasileira
 */
function formatCurrency(value) {
    const valueInCents = Number(value);
    if (isNaN(valueInCents)) return 'R$ 0,00';
    
    const reais = Math.floor(valueInCents / 100);
    const centavos = Math.abs(valueInCents % 100);
    
    return `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
}

/**
 * Função auxiliar para mostrar indicadores de loading nos gráficos
 */
function showChartLoading(chartId) {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
        const parent = chartElement.parentElement;
        parent.innerHTML = `
            <div class="loading-state">
                <i class="fa fa-spinner fa-pulse"></i>
                <p>Carregando gráfico...</p>
            </div>
        `;
    }
}

/**
 * Função auxiliar para mostrar erro nos gráficos
 */
function showChartError(chartId, message) {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
        const parent = chartElement.parentElement;
        parent.innerHTML = `
            <div class="error-state">
                <i class="fa fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}