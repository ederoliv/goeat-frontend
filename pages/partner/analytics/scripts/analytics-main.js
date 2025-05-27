// Variáveis globais
const userDataString = sessionStorage.getItem('userData');
const userData = userDataString ? JSON.parse(userDataString) : null;

// Variáveis para armazenar os gráficos
let salesChart = null;
let productsChart = null;
let hoursChart = null;
let statusChart = null;
let deliveryChart = null;

// Dados mock para demonstração (posteriormente virão da API)
const mockData = {
  metrics: {
    totalOrders: 1247,
    totalRevenue: 45780, // em centavos
    uniqueCustomers: 342,
    averageTicket: 3670, // em centavos
    changes: {
      orders: 12,
      revenue: 8,
      customers: 15,
      ticket: -3
    }
  },
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
  ],
  hoursData: {
    labels: ['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h'],
    data: [5, 8, 12, 28, 45, 52, 38, 25, 22, 35, 48, 65, 58, 42, 28]
  },
  statusData: {
    labels: ['Finalizados', 'Em Andamento', 'Cancelados'],
    data: [1087, 89, 71],
    colors: ['#06CF90', '#53BDEB', '#FF5555']
  },
  deliveryData: {
    labels: ['Entrega', 'Retirada'],
    data: [892, 355],
    colors: ['#623CA7', '#FCCC48']
  }
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
  showLoadingMetrics();
  
  // Simula carregamento de dados
  setTimeout(() => {
    loadMetrics();
    initializeCharts();
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
  
  // Botões de toggle dos gráficos
  const chartToggles = document.querySelectorAll('.chart-toggle');
  chartToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const chartType = this.dataset.chart;
      toggleSalesChart(chartType);
      
      // Atualizar estado ativo dos botões
      chartToggles.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

/**
 * Mostra indicadores de carregamento nas métricas
 */
function showLoadingMetrics() {
  const loadingElements = ['total-orders', 'total-revenue', 'unique-customers', 'average-ticket'];
  loadingElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '<span class="loading"><i class="fa fa-spinner fa-pulse"></i></span>';
    }
  });
}

/**
 * Carrega e exibe as métricas principais
 */
function loadMetrics() {
  const { metrics } = mockData;
  
  // Total de pedidos
  document.getElementById('total-orders').textContent = metrics.totalOrders.toLocaleString('pt-BR');
  
  // Faturamento
  document.getElementById('total-revenue').textContent = formatCurrency(metrics.totalRevenue);
  
  // Clientes únicos
  document.getElementById('unique-customers').textContent = metrics.uniqueCustomers.toLocaleString('pt-BR');
  
  // Ticket médio
  document.getElementById('average-ticket').textContent = formatCurrency(metrics.averageTicket);
  
  // Atualizar indicadores de mudança
  updateChangeIndicators(metrics.changes);
}

/**
 * Atualiza os indicadores de mudança das métricas
 */
function updateChangeIndicators(changes) {
  updateChangeElement('orders-change', changes.orders);
  updateChangeElement('revenue-change', changes.revenue);
  updateChangeElement('customers-change', changes.customers);
  updateChangeElement('ticket-change', changes.ticket);
}

/**
 * Atualiza um elemento de mudança específico
 */
function updateChangeElement(elementId, change) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const isPositive = change > 0;
  const isNegative = change < 0;
  
  // Remover classes existentes
  element.classList.remove('positive', 'negative', 'neutral');
  
  // Adicionar classe apropriada
  if (isPositive) {
    element.classList.add('positive');
    element.innerHTML = `<i class="fa fa-arrow-up"></i><span>+${change}% vs período anterior</span>`;
  } else if (isNegative) {
    element.classList.add('negative');
    element.innerHTML = `<i class="fa fa-arrow-down"></i><span>${change}% vs período anterior</span>`;
  } else {
    element.classList.add('neutral');
    element.innerHTML = `<i class="fa fa-minus"></i><span>Sem mudança vs período anterior</span>`;
  }
}

/**
 * Inicializa todos os gráficos
 */
function initializeCharts() {
  initializeSalesChart();
  initializeProductsChart();
  initializeHoursChart();
  initializeStatusChart();
  initializeDeliveryChart();
}

/**
 * Inicializa o gráfico de vendas
 */
function initializeSalesChart() {
  const ctx = document.getElementById('sales-chart');
  if (!ctx) return;
  
  const { salesData } = mockData;
  
  salesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: salesData.labels,
      datasets: [{
        label: 'Faturamento (R$)',
        data: salesData.revenue.map(value => value / 100), // Converter de centavos
        borderColor: '#623CA7',
        backgroundColor: 'rgba(98, 60, 167, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#623CA7',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value.toFixed(0);
            }
          },
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      elements: {
        point: {
          hoverRadius: 8
        }
      }
    }
  });
}

/**
 * Alterna entre faturamento e pedidos no gráfico de vendas
 */
function toggleSalesChart(type) {
  if (!salesChart) return;
  
  const { salesData } = mockData;
  
  if (type === 'revenue') {
    salesChart.data.datasets[0] = {
      label: 'Faturamento (R$)',
      data: salesData.revenue.map(value => value / 100),
      borderColor: '#623CA7',
      backgroundColor: 'rgba(98, 60, 167, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#623CA7',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6
    };
    
    salesChart.options.scales.y.ticks.callback = function(value) {
      return 'R$ ' + value.toFixed(0);
    };
  } else {
    salesChart.data.datasets[0] = {
      label: 'Número de Pedidos',
      data: salesData.orders,
      borderColor: '#06CF90',
      backgroundColor: 'rgba(6, 207, 144, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#06CF90',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6
    };
    
    salesChart.options.scales.y.ticks.callback = function(value) {
      return value + ' pedidos';
    };
  }
  
  salesChart.update();
}

/**
 * Inicializa o gráfico de produtos mais vendidos
 */
function initializeProductsChart() {
  const ctx = document.getElementById('products-chart');
  if (!ctx) return;
  
  const { productsData } = mockData;
  
  productsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: productsData.map(p => p.name),
      datasets: [{
        data: productsData.map(p => p.quantity),
        backgroundColor: [
          '#623CA7',
          '#06CF90',
          '#53BDEB',
          '#FCCC48',
          '#FF5555'
        ],
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      },
      cutout: '60%'
    }
  });
}

/**
 * Inicializa o gráfico de horários de pico
 */
function initializeHoursChart() {
  const ctx = document.getElementById('hours-chart');
  if (!ctx) return;
  
  const { hoursData } = mockData;
  
  hoursChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hoursData.labels,
      datasets: [{
        label: 'Pedidos por hora',
        data: hoursData.data,
        backgroundColor: 'rgba(83, 189, 235, 0.8)',
        borderColor: '#53BDEB',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 10
          },
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/**
 * Inicializa o gráfico de status dos pedidos
 */
function initializeStatusChart() {
  const ctx = document.getElementById('status-chart');
  if (!ctx) return;
  
  const { statusData } = mockData;
  
  statusChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: statusData.labels,
      datasets: [{
        data: statusData.data,
        backgroundColor: statusData.colors,
        borderWidth: 2,
        borderColor: '#fff',
        hoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      }
    }
  });
}

/**
 * Inicializa o gráfico de tipo de entrega
 */
function initializeDeliveryChart() {
  const ctx = document.getElementById('delivery-chart');
  if (!ctx) return;
  
  const { deliveryData } = mockData;
  
  deliveryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: deliveryData.labels,
      datasets: [{
        data: deliveryData.data,
        backgroundColor: deliveryData.colors,
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        }
      },
      cutout: '50%'
    }
  });
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
  showLoadingMetrics();
  
  // Simula nova requisição de dados
  setTimeout(() => {
    // Aqui você faria a chamada real para a API
    // const period = document.getElementById('period-select').value;
    // fetchAnalyticsData(period);
    
    // Por enquanto, apenas recarrega os dados mock
    loadMetrics();
    
    // Atualizar gráficos
    if (salesChart) salesChart.destroy();
    if (productsChart) productsChart.destroy();
    if (hoursChart) hoursChart.destroy();
    if (statusChart) statusChart.destroy();
    if (deliveryChart) deliveryChart.destroy();
    
    initializeCharts();
    loadProductsTable();
    
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