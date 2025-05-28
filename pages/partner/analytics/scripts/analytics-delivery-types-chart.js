/**
 * Gráfico: Tipos de Entrega (Pizza)
 */

let deliveryTypesChart = null;

/**
 * Inicializa o gráfico de tipos de entrega
 */
function initializeDeliveryTypesChart() {
    const ctx = document.getElementById('delivery-types-chart');
    if (!ctx) {
        console.error('Canvas delivery-types-chart não encontrado');
        return;
    }

    // Fazer requisição para obter dados
    fetchDeliveryTypesData()
        .then(data => {
            createDeliveryTypesChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao carregar dados do gráfico de tipos de entrega:', error);
            // Mostrar mensagem de erro no lugar do gráfico
            const chartContainer = document.querySelector('.delivery-types-content');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="error-state">
                        <i class="fa fa-exclamation-triangle"></i>
                        <p>Erro ao carregar dados de entrega</p>
                        <button class="retry-button" onclick="initializeDeliveryTypesChart()">
                            <i class="fa fa-refresh"></i> Tentar Novamente
                        </button>
                    </div>
                `;
            }
        });
}

/**
 * Busca dados dos tipos de entrega da API
 */
async function fetchDeliveryTypesData() {
    const userData = JSON.parse(sessionStorage.getItem('userData'));
    if (!userData || !userData.token) {
        throw new Error('Usuário não autenticado');
    }

    // Pega o período selecionado
    const periodSelect = document.getElementById('period-select');
    const period = periodSelect ? periodSelect.value : '30';

    try {
            const response = await fetch(`${API_BASE_URL}/analytics/delivery-types?period=${period}`, {
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
        if (!data.delivery || !data.pickup) {
            throw new Error('Estrutura de dados inválida');
        }
        
        return data;
        
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        throw error;
    }
}

/**
 * Cria o gráfico de tipos de entrega (pizza)
 */
function createDeliveryTypesChart(ctx, data) {
    // Destruir gráfico existente se houver
    if (deliveryTypesChart) {
        deliveryTypesChart.destroy();
    }

    // Prepara os dados iniciais (começando com pedidos)
    const labels = ['Entrega', 'Retirada no Local'];
    const deliveryOrders = data.delivery.orders;
    const pickupOrders = data.pickup.orders;
    const totalOrders = deliveryOrders + pickupOrders;

    // Se não houver pedidos, mostra estado vazio
    if (totalOrders === 0) {
        const chartContainer = document.querySelector('.delivery-types-content');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="empty-data-state">
                    <i class="fa fa-truck"></i>
                    <p>Nenhum pedido encontrado no período selecionado</p>
                </div>
            `;
        }
        return;
    }

    // Cores específicas para delivery
    const backgroundColors = [
        '#06CF90', // Verde para entrega
        '#53BDEB'  // Azul para retirada
    ];

    deliveryTypesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pedidos',
                data: [deliveryOrders, pickupOrders],
                backgroundColor: backgroundColors,
                borderColor: '#fff',
                borderWidth: 4,
                hoverBorderWidth: 6,
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
                            size: 14,
                            weight: 'bold'
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const dataset = data.datasets[0];
                                    const value = dataset.data[i];
                                    const total = dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                    
                                    return {
                                        text: `${label}: ${percentage}%`,
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
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                            
                            // Determina se está mostrando pedidos ou faturamento
                            const isRevenue = context.dataset.label === 'Faturamento (R$)';
                            const dataType = context.dataIndex === 0 ? 'delivery' : 'pickup';
                            
                            if (isRevenue) {
                                const revenue = formatCurrency(value);
                                const orders = dataType === 'delivery' ? data.delivery.orders : data.pickup.orders;
                                const avgTicket = orders > 0 ? formatCurrency(Math.round(value / orders)) : 'R$ 0,00';
                                
                                return [
                                    `Faturamento: ${revenue}`,
                                    `Participação: ${percentage}%`,
                                    `Pedidos: ${orders}`,
                                    `Ticket Médio: ${avgTicket}`
                                ];
                            } else {
                                const revenue = dataType === 'delivery' ? 
                                    formatCurrency(data.delivery.revenue) : 
                                    formatCurrency(data.pickup.revenue);
                                const avgTicket = value > 0 ? formatCurrency(Math.round(
                                    (dataType === 'delivery' ? data.delivery.revenue : data.pickup.revenue) / value
                                )) : 'R$ 0,00';
                                
                                return [
                                    `Pedidos: ${value}`,
                                    `Participação: ${percentage}%`,
                                    `Faturamento: ${revenue}`,
                                    `Ticket Médio: ${avgTicket}`
                                ];
                            }
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeInOutQuart'
            },
            elements: {
                arc: {
                    borderWidth: 4
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
                ctx.font = 'bold 18px Arial';
                ctx.fillStyle = '#623CA7';
                ctx.fillText('TIPOS DE', centerX, centerY - 12);
                
                // Texto secundário
                ctx.font = 'bold 16px Arial';
                ctx.fillStyle = '#666';
                ctx.fillText('ENTREGA', centerX, centerY + 12);
                
                ctx.restore();
            }
        }]
    });

    // Armazenar dados originais para toggle
    deliveryTypesChart.originalData = data;
    
    // Atualizar métricas na interface
    updateDeliveryMetrics(data);
}

/**
 * Alterna entre pedidos e faturamento no gráfico
 */
function toggleDeliveryTypesChart(type) {
    if (!deliveryTypesChart || !deliveryTypesChart.originalData) return;
    
    const data = deliveryTypesChart.originalData;
    
    // Atualizar botões ativos
    document.querySelectorAll('.delivery-types-toggle').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-chart="${type}"]`).classList.add('active');
    
    if (type === 'orders') {
        deliveryTypesChart.data.datasets[0].data = [data.delivery.orders, data.pickup.orders];
        deliveryTypesChart.data.datasets[0].label = 'Pedidos';
    } else {
        deliveryTypesChart.data.datasets[0].data = [data.delivery.revenue, data.pickup.revenue];
        deliveryTypesChart.data.datasets[0].label = 'Faturamento (R$)';
    }
    
    deliveryTypesChart.update('active');
}

/**
 * Atualiza as métricas de entrega na interface
 */
function updateDeliveryMetrics(data) {
    const totalOrders = data.delivery.orders + data.pickup.orders;
    const totalRevenue = data.delivery.revenue + data.pickup.revenue;
    const avgTicketDelivery = data.delivery.orders > 0 ? 
        Math.round(data.delivery.revenue / data.delivery.orders) : 0;
    const avgTicketPickup = data.pickup.orders > 0 ? 
        Math.round(data.pickup.revenue / data.pickup.orders) : 0;
    
    // Atualizar elementos na interface se existirem
    const metricsContainer = document.querySelector('.delivery-metrics');
    if (metricsContainer) {
        metricsContainer.innerHTML = `
            <div class="delivery-metric">
                <span class="delivery-metric-label">Total de Pedidos</span>
                <span class="delivery-metric-value">${totalOrders}</span>
            </div>
            <div class="delivery-metric">
                <span class="delivery-metric-label">Faturamento Total</span>
                <span class="delivery-metric-value">${formatCurrency(totalRevenue)}</span>
            </div>
            <div class="delivery-metric">
                <span class="delivery-metric-label">Ticket Médio Entrega</span>
                <span class="delivery-metric-value">${formatCurrency(avgTicketDelivery)}</span>
            </div>
            <div class="delivery-metric">
                <span class="delivery-metric-label">Ticket Médio Retirada</span>
                <span class="delivery-metric-value">${formatCurrency(avgTicketPickup)}</span>
            </div>
        `;
    }
}

/**
 * Atualiza o gráfico de tipos de entrega
 */
function refreshDeliveryTypesChart() {
    if (!deliveryTypesChart) {
        initializeDeliveryTypesChart();
        return;
    }
    
    fetchDeliveryTypesData()
        .then(data => {
            const ctx = document.getElementById('delivery-types-chart');
            createDeliveryTypesChart(ctx, data);
        })
        .catch(error => {
            console.error('Erro ao atualizar gráfico de tipos de entrega:', error);
        });
}