/**
 * Gráfico: Vendas ao Longo do Tempo
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

    // Fazer requisição para obter dados
    fetchSalesTimelineData()
        .then(data => {
            createSalesTimelineChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados do gráfico de vendas:', error);
            // Mostrar mensagem de erro no lugar do gráfico
            const chartContainer = document.querySelector('.sales-timeline-content');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fa fa-exclamation-triangle"></i>
                        <p>Erro ao carregar dados de vendas</p>
                        <button class="retry-button" onclick="initializeSalesTimelineChart()">
                            <i class="fa fa-refresh"></i> Tentar Novamente
                        </button>
                    </div>
                `;
            }
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

    // Pega o período selecionado
    const periodSelect = document.getElementById('period-select');
    const period = periodSelect ? periodSelect.value : '30';

    try {
        const response = await fetch(`${API_BASE_URL}/analytics/sales-timeline?period=${period}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Valida a estrutura dos dados
        if (!data.labels || !data.revenue || !data.orders) {
            throw new Error('Estrutura de dados inválida');
        }
        
        return data;
        
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
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
                data: data.revenue.map(value => value / 100), // Converter de centavos para reais
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
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeInOutQuart'
            }
        }
    });

    // Armazenar dados originais para toggle
    salesTimelineChart.originalData = data;
}

/**
 * Alterna entre faturamento e pedidos no gráfico
 */
function toggleSalesTimelineChart(type) {
    if (!salesTimelineChart || !salesTimelineChart.originalData) return;
    
    const data = salesTimelineChart.originalData;
    
    // Atualizar botões ativos
    document.querySelectorAll('.sales-timeline-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-chart="${type}"]`).classList.add('active');
    
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
 * Atualiza o gráfico de vendas
 */
function refreshSalesTimelineChart() {
    if (!salesTimelineChart) {
        initializeSalesTimelineChart();
        return;
    }
    
    fetchSalesTimelineData()
        .then(data => {
            const ctx = document.getElementById('sales-timeline-chart');
            createSalesTimelineChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao atualizar gráfico de vendas:', error);
        });
}