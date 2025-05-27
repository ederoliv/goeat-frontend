// Variáveis globais
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;

// Dados mock para demonstração (posteriormente virão da API)
const mockData = {
  salesData: {
    labels: ['01/12', '02/12', '03/12', '04/12', '05/12', '06/12', '07/12', '08/12', '09/12', '10/12'],
    revenue: [3200, 4100, 3800, 5200, 4900, 6100, 5500, 4800, 5300, 4600],
    orders: [32, 41, 38, 52, 49, 61, 55, 48, 53, 46]
  },
  productsData: [
    { name: 'Pizza Margherita', quantity: 156, revenue: 18720, percentage: 15.2 },
    { name: 'Hambúrguer Clássico', quantity: 134, revenue: 16080, percentage: 13.1 },
    { name: 'Lasanha Bolonhesa', quantity: 98, revenue: 14700, percentage: 11.9 },
    { name: 'Salada Caesar', quantity: 87, revenue: 10440, percentage: 8.5 },
    { name: 'Pizza Pepperoni', quantity: 76, revenue: 9120, percentage: 7.4 }
  ]
};

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
  // Simula carregamento de dados
  setTimeout(() => {
    // Inicializar apenas os gráficos específicos que existem na página
    if (typeof initializeSalesTimelineChart === 'function') {
      initializeSalesTimelineChart();
    }
    if (typeof initializeProductsBestsellersChart === 'function') {
      initializeProductsBestsellersChart();
    }
    if (typeof initializeProductsCategoriesChart === 'function') {
      initializeProductsCategoriesChart();
    }
    loadProductsTable();
  }, 1000);
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
  // Seletor de período
  const periodSelect = document.getElementById('period-select');
  if (periodSelect) {
    periodSelect.addEventListener('change', function() {
      refreshAnalytics();
    });
  }
}

/**
 * Carrega a tabela de produtos detalhada
 */
function loadProductsTable() {
  const tableBody = document.getElementById('products-table-body');
  if (!tableBody) return;
  
  const { productsData } = mockData;
  
  tableBody.innerHTML = '';
  
  productsData.forEach((product, index) => {
    const row = document.createElement('tr');
    
    // Determinar trend (simulado)
    const trends = ['up', 'down', 'stable', 'up', 'down'];
    const trendIcons = { up: 'arrow-up', down: 'arrow-down', stable: 'minus' };
    const trendLabels = { up: 'Crescendo', down: 'Caindo', stable: 'Estável' };
    const trend = trends[index];
    
    row.innerHTML = `
      <td><strong>${product.name}</strong></td>
      <td>${product.quantity}</td>
      <td>${formatCurrency(product.revenue)}</td>
      <td>${product.percentage}%</td>
      <td>${formatCurrency(Math.round(product.revenue / product.quantity))}</td>
      <td>
        <span class="trend-indicator trend-${trend}">
          <i class="fa fa-${trendIcons[trend]}"></i>
          ${trendLabels[trend]}
        </span>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
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
 * Atualiza todos os dados da página
 */
function refreshAnalytics() {
  // Mostra loading
  showLoadingModal();
  
  // Simula nova requisição de dados
  setTimeout(() => {
    // Aqui você faria a chamada real para a API
    // const period = document.getElementById('period-select').value;
    // fetchAnalyticsData(period);
    
    // Atualizar gráficos chamando as funções de refresh específicas
    if (typeof refreshSalesTimelineChart === 'function') {
      refreshSalesTimelineChart();
    }
    if (typeof refreshProductsBestsellersChart === 'function') {
      refreshProductsBestsellersChart();
    }
    if (typeof refreshProductsCategoriesChart === 'function') {
      refreshProductsCategoriesChart();
    }
    loadProductsTable();
    
    hideLoadingModal();
    goeatAlert('success', 'Dados atualizados com sucesso!');
  }, 1500);
}

/**
 * Exporta dados dos produtos (funcionalidade básica)
 */
function exportProductData() {
  const { productsData } = mockData;
  
  let csvContent = 'Produto,Quantidade Vendida,Faturamento,Percentual do Total,Ticket Médio\n';
  
  productsData.forEach(product => {
    const ticketMedio = Math.round(product.revenue / product.quantity);
    csvContent += `"${product.name}",${product.quantity},"${formatCurrency(product.revenue)}",${product.percentage}%,"${formatCurrency(ticketMedio)}"\n`;
  });
  
  // Criar e fazer download do arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `produtos-analise-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  goeatAlert('success', 'Dados exportados com sucesso!');
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

/**
 * Função chamada quando a página é carregada (fallback)
 */
window.onload = function() {
  if (!userData) {
    window.location.href = '../../loginPartner/index.html';
    return;
  }
  
  // Se o DOMContentLoaded não foi disparado, inicializar aqui
  if (document.readyState === 'complete') {
    setTimeout(initializeAnalytics, 100);
  }
};