/**
 * Gráfico: Produtos Mais Vendidos
 * Arquivo: analytics-products-bestsellers-chart.js
 */

let productsBestsellersChart = null;

/**
 * Inicializa o gráfico de produtos mais vendidos
 */
function initializeProductsBestsellersChart() {
    const ctx = document.getElementById('products-bestsellers-chart');
    if (!ctx) {
        console.error('Canvas products-bestsellers-chart não encontrado');
        return;
    }

    // Mostrar loading
    showChartLoading('products-bestsellers-chart');
    
    // Fazer requisição para obter dados
    fetchProductsBestsellersData()
        .then(data => {
            createProductsBestsellersChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados dos produtos mais vendidos:', error);
            showChartError('products-bestsellers-chart', 'Erro ao carregar produtos mais vendidos');
        });
}

/**
 * Busca dados dos produtos mais vendidos da API
 */
async function fetchProductsBestsellersData() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData || !userData.token) {
        throw new Error('Usuário não autenticado');
    }

    // Por enquanto, retorna dados mock - depois substituir por chamada real
    // const response = await fetch(`${API_BASE_URL}/analytics/products-bestsellers?period=30`, {
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
    return [
        { name: 'Pizza Margherita', quantity: 156, revenue: 18720, percentage: 25.2 },
        { name: 'Hambúrguer Clássico', quantity: 134, revenue: 16080, percentage: 21.6 },
        { name: 'Lasanha Bolonhesa', quantity: 98, revenue: 14700, percentage: 15.8 },
        { name: 'Salada Caesar', quantity: 87, revenue: 10440, percentage: 14.0 },
        { name: 'Pizza Pepperoni', quantity: 76, revenue: 9120, percentage: 12.3 },
        { name: 'Outros', quantity: 45, revenue: 6820, percentage: 11.1 }
    ];
}

/**
 * Cria o gráfico de produtos mais vendidos
 */
function createProductsBestsellersChart(ctx, data) {
    // Destruir gráfico existente se houver
    if (productsBestsellersChart) {
        productsBestsellersChart.destroy();
    }

    const colors = [
        '#623CA7', // Roxo principal
        '#06CF90', // Verde
        '#53BDEB', // Azul
        '#FCCC48', // Amarelo
        '#FF5555', // Vermelho
        '#9C88FF'  // Roxo claro
    ];

    productsBestsellersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(p => p.name),
            datasets: [{
                data: data.map(p => p.quantity),
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverBorderWidth: 4,
                hoverBorderColor: '#fff',
                hoverOffset: 8
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
                        pointStyle: 'circle',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        color: '#333',
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const dataset = data.datasets[0];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((dataset.data[i] / total) * 100).toFixed(1);
                                    
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: dataset.backgroundColor[i],
                                        strokeStyle: dataset.borderColor,
                                        lineWidth: dataset.borderWidth,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    },
                    onClick: function(e, legendItem, legend) {
                        const index = legendItem.index;
                        const chart = legend.chart;
                        const meta = chart.getDatasetMeta(0);
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#623CA7',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const item = data[context.dataIndex];
                            return [
                                `Quantidade: ${item.quantity} unidades`,
                                `Faturamento: ${formatCurrency(item.revenue)}`,
                                `Participação: ${item.percentage}%`
                            ];
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false
            }
        }
    });

    // Armazenar dados para referência
    productsBestsellersChart.originalData = data;
    
    // Atualizar métricas do produto
    updateBestsellersMetrics(data);
}

/**
 * Atualiza as métricas dos produtos mais vendidos
 */
function updateBestsellersMetrics(data) {
    const metricsContainer = document.querySelector('.bestsellers-metrics');
    if (!metricsContainer) return;
    
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const topProduct = data[0];
    
    metricsContainer.innerHTML = `
        <div class="bestsellers-metric">
            <span class="bestsellers-metric-label">Total Vendido</span>
            <span class="bestsellers-metric-value">${totalQuantity}</span>
        </div>
        <div class="bestsellers-metric">
            <span class="bestsellers-metric-label">Faturamento</span>
            <span class="bestsellers-metric-value">${formatCurrency(totalRevenue)}</span>
        </div>
        <div class="bestsellers-metric">
            <span class="bestsellers-metric-label">Mais Vendido</span>
            <span class="bestsellers-metric-value">${topProduct.name}</span>
        </div>
    `;
}

/**
 * Alterna entre visualização por quantidade e por faturamento
 */
function toggleBestsellersView(type) {
    if (!productsBestsellersChart || !productsBestsellersChart.originalData) return;
    
    const data = productsBestsellersChart.originalData;
    
    if (type === 'quantity') {
        productsBestsellersChart.data.datasets[0].data = data.map(p => p.quantity);
        
        productsBestsellersChart.options.plugins.tooltip.callbacks.label = function(context) {
            const item = data[context.dataIndex];
            return [
                `Quantidade: ${item.quantity} unidades`,
                `Faturamento: ${formatCurrency(item.revenue)}`,
                `Participação: ${item.percentage}%`
            ];
        };
    } else {
        productsBestsellersChart.data.datasets[0].data = data.map(p => p.revenue / 100); // Converter de centavos
        
        productsBestsellersChart.options.plugins.tooltip.callbacks.label = function(context) {
            const item = data[context.dataIndex];
            return [
                `Faturamento: ${formatCurrency(item.revenue)}`,
                `Quantidade: ${item.quantity} unidades`,
                `Participação: ${item.percentage}%`
            ];
        };
    }
    
    productsBestsellersChart.update('active');
}

/**
 * Atualiza o gráfico de produtos mais vendidos
 */
function refreshProductsBestsellersChart() {
    if (!productsBestsellersChart) {
        initializeProductsBestsellersChart();
        return;
    }
    
    showChartLoading('products-bestsellers-chart');
    
    fetchProductsBestsellersData()
        .then(data => {
            const ctx = document.getElementById('products-bestsellers-chart');
            createProductsBestsellersChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao atualizar produtos mais vendidos:', error);
            showChartError('products-bestsellers-chart', 'Erro ao atualizar dados');
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