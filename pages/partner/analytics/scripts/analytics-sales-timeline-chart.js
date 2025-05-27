/**
 * Gráfico: Vendas ao Longo do Tempo
 * Arquivo: analytics-sales-timeline-chart.js
 */

let salesTimelineChart = null;

/**
 * Inicializa o gráfico de vendas ao longo do tempo
 */
function initializeSalesTimelineChart() {
    const ctx = document.getElementById('sales-timeline-chart');
    if (!ctx) {
        console.error('Canvas sales-timeline-chart não encontrado');
        return;
    }

    // Mostrar loading
    showChartLoading('sales-timeline-chart');
    
    // Fazer requisição para obter dados
    fetchSalesTimelineData()
        .then(data => {
            createSalesTimelineChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados do gráfico de vendas:', error);
            showChartError('sales-timeline-chart', 'Erro ao carregar dados de vendas');
        });
}

/**
 * Busca dados de vendas ao longo do tempo da API
 */
async function fetchSalesTimelineData() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData || !userData.token) {
        throw new Error('Usuário não autenticado');
    }

    // Por enquanto, retorna dados mock - depois substituir por chamada real
    // const response = await fetch(`${API_BASE_URL}/analytics/sales-timeline?period=30`, {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${userData.token}`
    //     }
    // });
    
    // if (!response.ok) {
    //     throw new Error(`Erro na API: ${response.status}`);
    // }
    
    // return await response.json();

    // Dados mock por enquanto
    return {
        labels: ['01/12', '02/12', '03/12', '04/12', '05/12', '06/12', '07/12', '08/12', '09/12', '10/12'],
        revenue: [3200, 4100, 3800, 5200, 4900, 6100, 5500, 4800, 5300, 4600],
        orders: [32, 41, 38, 52, 49, 61, 55, 48, 53, 46]
    };
}

/**
 * Cria o gráfico de vendas ao longo do tempo
 */
function createSalesTimelineChart(ctx, data) {
    // Destruir gráfico existente se houver
    if (salesTimelineChart) {
        salesTimelineChart.destroy();
    }

    salesTimelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Faturamento (R$)',
                data: data.revenue.map(value => value / 100), // Converter de centavos
                borderColor: '#623CA7',
                backgroundColor: 'rgba(98, 60, 167, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#623CA7',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#623CA7',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Faturamento: R$ ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        },
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });

    // Armazenar dados para toggle
    salesTimelineChart.originalData = data;
}

/**
 * Alterna entre faturamento e pedidos no gráfico
 */
function toggleSalesTimelineChart(type) {
    if (!salesTimelineChart || !salesTimelineChart.originalData) return;
    
    const data = salesTimelineChart.originalData;
    
    if (type === 'revenue') {
        salesTimelineChart.data.datasets[0] = {
            label: 'Faturamento (R$)',
            data: data.revenue.map(value => value / 100),
            borderColor: '#623CA7',
            backgroundColor: 'rgba(98, 60, 167, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#623CA7',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        };
        
        salesTimelineChart.options.scales.y.ticks.callback = function(value) {
            return 'R$ ' + value.toFixed(0);
        };
        
        salesTimelineChart.options.plugins.tooltip.callbacks.label = function(context) {
            return 'Faturamento: R$ ' + context.parsed.y.toFixed(2);
        };
    } else {
        salesTimelineChart.data.datasets[0] = {
            label: 'Número de Pedidos',
            data: data.orders,
            borderColor: '#06CF90',
            backgroundColor: 'rgba(6, 207, 144, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#06CF90',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        };
        
        salesTimelineChart.options.scales.y.ticks.callback = function(value) {
            return value + ' pedidos';
        };
        
        salesTimelineChart.options.plugins.tooltip.callbacks.label = function(context) {
            return 'Pedidos: ' + context.parsed.y;
        };
    }
    
    salesTimelineChart.update('active');
}

/**
 * Atualiza o gráfico de vendas (chamado quando período muda)
 */
function refreshSalesTimelineChart() {
    if (!salesTimelineChart) {
        initializeSalesTimelineChart();
        return;
    }
    
    showChartLoading('sales-timeline-chart');
    
    fetchSalesTimelineData()
        .then(data => {
            const ctx = document.getElementById('sales-timeline-chart');
            createSalesTimelineChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao atualizar gráfico de vendas:', error);
            showChartError('sales-timeline-chart', 'Erro ao atualizar dados');
        });
}