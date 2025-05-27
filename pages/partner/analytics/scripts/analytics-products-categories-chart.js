/**
 * Gráfico: Categorias de Produtos
 * Arquivo: analytics-products-categories-chart.js
 */

let productsCategoriesChart = null;

/**
 * Inicializa o gráfico de categorias de produtos
 */
function initializeProductsCategoriesChart() {
    const ctx = document.getElementById('products-categories-chart');
    if (!ctx) {
        console.error('Canvas products-categories-chart não encontrado');
        return;
    }

    // Mostrar loading
    showChartLoading('products-categories-chart');
    
    // Fazer requisição para obter dados
    fetchProductsCategoriesData()
        .then(data => {
            createProductsCategoriesChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados das categorias de produtos:', error);
            showChartError('products-categories-chart', 'Erro ao carregar categorias de produtos');
        });
}

/**
 * Busca dados das categorias de produtos da API
 */
async function fetchProductsCategoriesData() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData || !userData.token) {
        throw new Error('Usuário não autenticado');
    }

    // Por enquanto, retorna dados mock - depois substituir por chamada real
    // const response = await fetch(`${API_BASE_URL}/analytics/products-categories?period=30`, {
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
        { 
            name: 'Pizzas', 
            quantity: 342, 
            revenue: 41040, 
            percentage: 35.8,
            margin: 65.2,
            products: 12
        },
        { 
            name: 'Lanches', 
            quantity: 289, 
            revenue: 32670, 
            percentage: 28.5,
            margin: 58.7,
            products: 8
        },
        { 
            name: 'Pratos Principais', 
            quantity: 187, 
            revenue: 28050, 
            percentage: 24.5,
            margin: 72.3,
            products: 15
        },
        { 
            name: 'Bebidas', 
            quantity: 156, 
            revenue: 7800, 
            percentage: 6.8,
            margin: 45.6,
            products: 6
        },
        { 
            name: 'Sobremesas', 
            quantity: 89, 
            revenue: 5340, 
            percentage: 4.4,
            margin: 68.9,
            products: 4
        }
    ];
}

/**
 * Cria o gráfico de categorias de produtos
 */
function createProductsCategoriesChart(ctx, data) {
    // Destruir gráfico existente se houver
    if (productsCategoriesChart) {
        productsCategoriesChart.destroy();
    }

    const colors = [
        '#623CA7', // Roxo - Pizzas
        '#06CF90', // Verde - Lanches  
        '#53BDEB', // Azul - Pratos Principais
        '#FCCC48', // Amarelo - Bebidas
        '#FF5555'  // Vermelho - Sobremesas
    ];

    productsCategoriesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(c => c.name),
            datasets: [{
                data: data.map(c => c.revenue / 100), // Converter de centavos para reais
                backgroundColor: colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverBorderWidth: 5,
                hoverBorderColor: '#fff',
                hoverOffset: 12
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
                            size: 13,
                            weight: '500'
                        },
                        color: '#333',
                        generateLabels: function(chart) {
                            const chartData = chart.data;
                            if (chartData.labels.length && chartData.datasets.length) {
                                return chartData.labels.map((label, i) => {
                                    const dataset = chartData.datasets[0];
                                    const category = data[i];
                                    
                                    return {
                                        text: `${label} (${category.percentage}%)`,
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
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#623CA7',
                    borderWidth: 2,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const category = data[context.dataIndex];
                            return [
                                `Faturamento: ${formatCurrency(category.revenue)}`,
                                `Quantidade: ${category.quantity} unidades`,
                                `Produtos: ${category.products} itens`,
                                `Margem: ${category.margin}%`,
                                `Participação: ${category.percentage}%`
                            ];
                        }
                    }
                }
            },
            cutout: '55%',
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1200,
                easing: 'easeInOutQuart'
            },
            interaction: {
                intersect: false
            }
        }
    });

    // Armazenar dados para referência
    productsCategoriesChart.originalData = data;
    
    // Atualizar métricas das categorias
    updateCategoriesMetrics(data);
    
    // Atualizar lista detalhada
    updateCategoriesDetails(data);
}

/**
 * Atualiza as métricas das categorias
 */
function updateCategoriesMetrics(data) {
    const metricsContainer = document.querySelector('.categories-metrics');
    if (!metricsContainer) return;
    
    const totalRevenue = data.reduce((sum, cat) => sum + cat.revenue, 0);
    const totalProducts = data.reduce((sum, cat) => sum + cat.products, 0);
    const avgMargin = (data.reduce((sum, cat) => sum + cat.margin, 0) / data.length).toFixed(1);
    const topCategory = data.reduce((prev, current) => 
        prev.revenue > current.revenue ? prev : current
    );
    
    metricsContainer.innerHTML = `
        <div class="categories-metric">
            <span class="categories-metric-label">Faturamento Total</span>
            <span class="categories-metric-value">${formatCurrency(totalRevenue)}</span>
        </div>
        <div class="categories-metric">
            <span class="categories-metric-label">Total de Produtos</span>
            <span class="categories-metric-value">${totalProducts}</span>
        </div>
        <div class="categories-metric">
            <span class="categories-metric-label">Margem Média</span>
            <span class="categories-metric-value">${avgMargin}%</span>
        </div>
        <div class="categories-metric">
            <span class="categories-metric-label">Categoria Líder</span>
            <span class="categories-metric-value">${topCategory.name}</span>
        </div>
    `;
}

/**
 * Atualiza a lista detalhada das categorias
 */
function updateCategoriesDetails(data) {
    const detailsContainer = document.querySelector('.categories-details');
    if (!detailsContainer) return;
    
    const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);
    
    detailsContainer.innerHTML = `
        <h4>Detalhes por Categoria</h4>
        <div class="categories-list">
            ${sortedData.map((category, index) => `
                <div class="category-detail-item">
                    <div class="category-rank">#${index + 1}</div>
                    <div class="category-info">
                        <div class="category-name">${category.name}</div>
                        <div class="category-stats">
                            ${category.products} produtos • ${category.quantity} vendidos
                        </div>
                    </div>
                    <div class="category-values">
                        <div class="category-revenue">${formatCurrency(category.revenue)}</div>
                        <div class="category-margin">Margem: ${category.margin}%</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Alterna entre visualização por faturamento e por quantidade
 */
function toggleCategoriesView(type) {
    if (!productsCategoriesChart || !productsCategoriesChart.originalData) return;
    
    const data = productsCategoriesChart.originalData;
    
    if (type === 'revenue') {
        productsCategoriesChart.data.datasets[0].data = data.map(c => c.revenue / 100);
        
        productsCategoriesChart.options.plugins.tooltip.callbacks.label = function(context) {
            const category = data[context.dataIndex];
            return [
                `Faturamento: ${formatCurrency(category.revenue)}`,
                `Quantidade: ${category.quantity} unidades`,
                `Produtos: ${category.products} itens`,
                `Margem: ${category.margin}%`,
                `Participação: ${category.percentage}%`
            ];
        };
    } else if (type === 'quantity') {
        productsCategoriesChart.data.datasets[0].data = data.map(c => c.quantity);
        
        productsCategoriesChart.options.plugins.tooltip.callbacks.label = function(context) {
            const category = data[context.dataIndex];
            return [
                `Quantidade: ${category.quantity} unidades`,
                `Faturamento: ${formatCurrency(category.revenue)}`,
                `Produtos: ${category.products} itens`,
                `Margem: ${category.margin}%`,
                `Participação: ${category.percentage}%`
            ];
        };
    } else { // margin
        productsCategoriesChart.data.datasets[0].data = data.map(c => c.margin);
        
        productsCategoriesChart.options.plugins.tooltip.callbacks.label = function(context) {
            const category = data[context.dataIndex];
            return [
                `Margem: ${category.margin}%`,
                `Faturamento: ${formatCurrency(category.revenue)}`,
                `Quantidade: ${category.quantity} unidades`,
                `Produtos: ${category.products} itens`,
                `Participação: ${category.percentage}%`
            ];
        };
    }
    
    productsCategoriesChart.update('active');
}

/**
 * Atualiza o gráfico de categorias de produtos
 */
function refreshProductsCategoriesChart() {
    if (!productsCategoriesChart) {
        initializeProductsCategoriesChart();
        return;
    }
    
    showChartLoading('products-categories-chart');
    
    fetchProductsCategoriesData()
        .then(data => {
            const ctx = document.getElementById('products-categories-chart');
            createProductsCategoriesChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao atualizar categorias de produtos:', error);
            showChartError('products-categories-chart', 'Erro ao atualizar dados');
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