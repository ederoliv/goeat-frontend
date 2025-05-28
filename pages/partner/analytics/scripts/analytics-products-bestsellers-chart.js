/**
 * Gráfico: Produtos Mais Vendidos (Rosca)
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

    // Fazer requisição para obter dados
    fetchProductsBestsellersData()
        .then(data => {
            createProductsBestsellersChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados do gráfico de produtos mais vendidos:', error);
            // Mostrar mensagem de erro no lugar do gráfico
            const chartContainer = document.querySelector('.products-bestsellers-content');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fa fa-exclamation-triangle"></i>
                        <p>Erro ao carregar dados dos produtos</p>
                        <button class="retry-button" onclick="initializeProductsBestsellersChart()">
                            <i class="fa fa-refresh"></i> Tentar Novamente
                        </button>
                    </div>
                `;
            }
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

    // Pega o período selecionado
    const periodSelect = document.getElementById('period-select');
    const period = periodSelect ? periodSelect.value : '30';

    try {
        const response = await fetch(`${API_BASE_URL}/analytics/products-bestsellers`, {
        //const response = await fetch(`${API_BASE_URL}/analytics/products-bestsellers?period=${period}`, {
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
        if (!data.products || !Array.isArray(data.products)) {
            throw new Error('Estrutura de dados inválida');
        }
        
        return data;
        
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
    }
}

/**
 * Cria o gráfico de produtos mais vendidos (rosca)
 */
function createProductsBestsellersChart(ctx, data) {
    // Destruir gráfico existente se houver
    if (productsBestsellersChart) {
        productsBestsellersChart.destroy();
    }

    // Prepara os dados para o gráfico de rosca
    const products = data.products.slice(0, 10); // Limita aos top 10
    const labels = products.map(product => product.name);
    const quantities = products.map(product => product.quantity);
    const revenues = products.map(product => product.revenue);
    
    // Cores vibrantes para o gráfico
    const backgroundColors = [
        '#623CA7', // Roxo principal
        '#06CF90', // Verde principal  
        '#53BDEB', // Azul principal
        '#FCCC48', // Amarelo principal
        '#FF5555', // Vermelho principal
        '#8B5CF6', // Roxo claro
        '#10B981', // Verde esmeralda
        '#3B82F6', // Azul royal
        '#F59E0B', // Laranja
        '#EF4444'  // Vermelho coral
    ];

    productsBestsellersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade Vendida',
                data: quantities,
                backgroundColor: backgroundColors.slice(0, products.length),
                borderColor: '#fff',
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%', // Cria o efeito de rosca
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const dataset = data.datasets[0];
                                    const quantity = dataset.data[i];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((quantity / total) * 100).toFixed(1);
                                    
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: dataset.backgroundColor[i],
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#623CA7',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const quantity = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((quantity / total) * 100).toFixed(1);
                            const revenue = revenues[context.dataIndex];
                            
                            return [
                                `Quantidade: ${quantity} unidades`,
                                `Participação: ${percentage}%`,
                                `Faturamento: ${formatCurrency(revenue)}`
                            ];
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeInOutQuart'
            },
            // Elemento central personalizado
            elements: {
                arc: {
                    borderWidth: 3
                }
            }
        },
        plugins: [{
            // Plugin personalizado para mostrar informações no centro
            id: 'centerText',
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                const centerX = chart.width / 2;
                const centerY = chart.height / 2;
                
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Texto principal
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#623CA7';
                ctx.fillText('TOP', centerX, centerY - 10);
                
                // Texto secundário
                ctx.font = '14px Arial';
                ctx.fillStyle = '#666';
                ctx.fillText('PRODUTOS', centerX, centerY + 10);
                
                ctx.restore();
            }
        }]
    });

    // Armazenar dados originais para toggle
    productsBestsellersChart.originalData = data;
}

/**
 * Alterna entre quantidade e faturamento no gráfico
 */
function toggleProductsBestsellersChart(type) {
    if (!productsBestsellersChart || !productsBestsellersChart.originalData) return;
    
    const data = productsBestsellersChart.originalData;
    const products = data.products.slice(0, 10);
    
    // Atualizar botões ativos
    document.querySelectorAll('.products-bestsellers-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-chart="${type}"]`).classList.add('active');
    
    if (type === 'quantity') {
        productsBestsellersChart.data.datasets[0].data = products.map(product => product.quantity);
        productsBestsellersChart.data.datasets[0].label = 'Quantidade Vendida';
        
        // Atualizar tooltip
        productsBestsellersChart.options.plugins.tooltip.callbacks.label = function(context) {
            const quantity = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((quantity / total) * 100).toFixed(1);
            const revenue = products[context.dataIndex].revenue;
            
            return [
                `Quantidade: ${quantity} unidades`,
                `Participação: ${percentage}%`,
                `Faturamento: ${formatCurrency(revenue)}`
            ];
        };
    } else {
        productsBestsellersChart.data.datasets[0].data = products.map(product => product.revenue);
        productsBestsellersChart.data.datasets[0].label = 'Faturamento (R$)';
        
        // Atualizar tooltip
        productsBestsellersChart.options.plugins.tooltip.callbacks.label = function(context) {
            const revenue = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((revenue / total) * 100).toFixed(1);
            const quantity = products[context.dataIndex].quantity;
            
            return [
                `Faturamento: ${formatCurrency(revenue)}`,
                `Participação: ${percentage}%`,
                `Quantidade: ${quantity} unidades`
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
    
    fetchProductsBestsellersData()
        .then(data => {
            const ctx = document.getElementById('products-bestsellers-chart');
            createProductsBestsellersChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao atualizar gráfico de produtos mais vendidos:', error);
        });
}