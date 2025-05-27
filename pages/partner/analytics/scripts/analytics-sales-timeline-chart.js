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

    // Pega o período selecionado no dropdown da página
    const periodSelect = document.getElementById('period-select');
    const period = periodSelect ? periodSelect.value : '30'; // Default 30 dias se não encontrar

    try {
        // Faz a requisição real para a API
        const response = await fetch(`${API_BASE_URL}/analytics/sales-timeline?period=${period}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const apiResponse = await response.json();
        
        // Verifica se a resposta tem a estrutura esperada
        if (!apiResponse.data || !apiResponse.data.labels || !apiResponse.data.revenue || !apiResponse.data.orders) {
            throw new Error('Estrutura de dados inválida retornada pela API');
        }
        
        return apiResponse.data;
        
    } catch (apiError) {
        console.warn('Erro na API, usando dados mock:', apiError.message);
        
        // Fallback para dados mock se a API falhar
        return getMockDataByPeriod(period);
    }
}

/**
 * Retorna dados mock baseados no período selecionado
 */
function getMockDataByPeriod(period) {
    const periodNum = parseInt(period);
    
    if (periodNum <= 7) {
        // Últimos 7 dias
        return {
            labels: ['21/12', '22/12', '23/12', '24/12', '25/12', '26/12', '27/12'],
            revenue: [4500, 5200, 4800, 6100, 5500, 4900, 5300],
            orders: [45, 52, 48, 61, 55, 49, 53]
        };
    } else if (periodNum <= 30) {
        // Últimos 30 dias
        return {
            labels: ['01/12', '02/12', '03/12', '04/12', '05/12', '06/12', '07/12', '08/12', '09/12', '10/12', '11/12', '12/12', '13/12', '14/12', '15/12'],
            revenue: [3200, 4100, 3800, 5200, 4900, 6100, 5500, 4800, 5300, 4600, 5800, 6200, 5100, 4900, 5400],
            orders: [32, 41, 38, 52, 49, 61, 55, 48, 53, 46, 58, 62, 51, 49, 54]
        };
    } else if (periodNum <= 90) {
        // Últimos 90 dias (por semana)
        return {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8', 'Sem 9', 'Sem 10', 'Sem 11', 'Sem 12'],
            revenue: [15000, 18000, 16500, 19200, 17800, 20100, 18500, 16900, 19800, 17200, 21000, 19500],
            orders: [150, 180, 165, 192, 178, 201, 185, 169, 198, 172, 210, 195]
        };
    } else {
        // Último ano (por mês)
        return {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            revenue: [45000, 52000, 48000, 55000, 51000, 58000, 62000, 59000, 56000, 61000, 64000, 67000],
            orders: [450, 520, 480, 550, 510, 580, 620, 590, 560, 610, 640, 670]
        };
    }
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
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return `Data: ${context[0].label}`;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            return `Faturamento: R$ ${value.toFixed(2).replace('.', ',')}`;
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
                        color: '#666',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.1)',
                        lineWidth: 1
                    },
                    border: {
                        color: '#ddd'
                    }
                },
                x: {
                    ticks: {
                        color: '#666',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        color: '#ddd'
                    }
                }
            },
            elements: {
                point: {
                    hoverRadius: 8
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
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
            const value = context.parsed.y;
            return `Faturamento: R$ ${value.toFixed(2).replace('.', ',')}`;
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
            const value = context.parsed.y;
            return `Pedidos: ${value}`;
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

/**
 * Função auxiliar para mostrar loading específico do gráfico
 */
function showChartLoading(chartId) {
    const chartContainer = document.querySelector('.sales-timeline-content');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="sales-timeline-loading">
                <i class="fa fa-spinner fa-pulse"></i>
                <p>Carregando dados de vendas...</p>
            </div>
        `;
    }
}

/**
 * Função auxiliar para mostrar erro específico do gráfico
 */
function showChartError(chartId, message) {
    const chartContainer = document.querySelector('.sales-timeline-content');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div class="sales-timeline-error">
                <i class="fa fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="retry-button" onclick="initializeSalesTimelineChart()">
                    <i class="fa fa-refresh"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}