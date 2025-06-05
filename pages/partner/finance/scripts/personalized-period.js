/**
 * Arquivo: personalized-period.js
 * Responsável por gerenciar relatórios de períodos personalizados
 */

/**
 * Abre o modal para seleção de período personalizado
 */
function openCustomPeriodModal() {
    // Define datas padrão (últimos 30 dias)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    // Formatar datas para o input (YYYY-MM-DD)
    const formatDateForInput = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    const defaultStartDate = formatDateForInput(startDate);
    const defaultEndDate = formatDateForInput(endDate);
    
    Swal.fire({
        title: 'Selecione um Período',
        html: `
            <div class="custom-period-form">
                <div class="period-presets">
                    <h4>Períodos Rápidos:</h4>
                    <div class="preset-buttons">
                        <button type="button" class="preset-btn" onclick="setPresetPeriod(7)">Últimos 7 dias</button>
                        <button type="button" class="preset-btn" onclick="setPresetPeriod(15)">Últimos 15 dias</button>
                        <button type="button" class="preset-btn" onclick="setPresetPeriod(30)">Últimos 30 dias</button>
                        <button type="button" class="preset-btn" onclick="setPresetPeriod(90)">Últimos 3 meses</button>
                    </div>
                </div>
                
                <div class="custom-date-range">
                    <h4>Ou escolha um período específico:</h4>
                    <div class="date-inputs">
                        <div class="date-group">
                            <label for="start-date">Data de Início:</label>
                            <input type="date" id="start-date" class="swal2-input" value="${defaultStartDate}">
                        </div>
                        <div class="date-group">
                            <label for="end-date">Data Final:</label>
                            <input type="date" id="end-date" class="swal2-input" value="${defaultEndDate}">
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Gerar Relatório',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#06CF90',
        width: '500px',
        customClass: {
            htmlContainer: 'custom-period-modal'
        },
        preConfirm: () => {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            if (!startDate || !endDate) {
                Swal.showValidationMessage('Por favor, selecione ambas as datas');
                return false;
            }
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (start > end) {
                Swal.showValidationMessage('A data de início deve ser anterior à data final');
                return false;
            }
            
            // Verificar se o período não é muito longo (máximo 1 ano)
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 365) {
                Swal.showValidationMessage('O período máximo permitido é de 1 ano');
                return false;
            }
            
            return { startDate, endDate, diffDays };
        }
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            generateCustomPeriodReport(result.value.startDate, result.value.endDate, result.value.diffDays);
        }
    });
}

/**
 * Define um período pré-definido nos inputs de data
 * @param {number} days - Número de dias para voltar da data atual
 */
function setPresetPeriod(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const formatDateForInput = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    document.getElementById('start-date').value = formatDateForInput(startDate);
    document.getElementById('end-date').value = formatDateForInput(endDate);
}

/**
 * Gera o relatório para o período personalizado
 * @param {string} startDate - Data de início (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 * @param {number} diffDays - Diferença em dias entre as datas
 */
async function generateCustomPeriodReport(startDate, endDate, diffDays) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Gerando Relatório',
            html: `
                <div class="generating-report">
                    <i class="fa fa-spinner fa-pulse fa-3x"></i>
                    <p>Processando dados do período...</p>
                    <p class="period-info">${formatDateForDisplay(startDate)} até ${formatDateForDisplay(endDate)}</p>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        
        // Fazer requisição para a API
        const reportData = await fetchCustomPeriodData(startDate, endDate);
        
        // Mostrar relatório
        showCustomPeriodReport(reportData, startDate, endDate, diffDays);
        
    } catch (error) {
        console.error('Erro ao gerar relatório personalizado:', error);
        Swal.fire({
            title: 'Erro ao Gerar Relatório',
            text: error.message || 'Não foi possível gerar o relatório. Tente novamente.',
            icon: 'error',
            confirmButtonColor: '#06CF90'
        });
    }
}

/**
 * Busca os dados financeiros para um período personalizado
 * @param {string} startDate - Data de início
 * @param {string} endDate - Data final
 * @returns {Promise<Object>} - Dados financeiros do período
 */
async function fetchCustomPeriodData(startDate, endDate) {
    const response = await fetch(`${API_BASE_URL}/reports/finance/custom?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

/**
 * Exibe o relatório do período personalizado
 * @param {Object} data - Dados financeiros
 * @param {string} startDate - Data de início
 * @param {string} endDate - Data final
 * @param {number} diffDays - Diferença em dias
 */
function showCustomPeriodReport(data, startDate, endDate, diffDays) {
    const totalSales = formatCurrency(data.totalSales || 0);
    const averageTicket = formatCurrency(data.averageTicket || 0);
    const canceledValue = formatCurrency(data.canceledOrdersValue || 0);
    const totalOrders = data.totalOrders || 0;
    const canceledOrders = data.canceledOrders || 0;
    
    // Calcular métricas adicionais
    const dailyAverage = formatCurrency(Math.round((data.totalSales || 0) / diffDays));
    const cancellationRate = totalOrders > 0 ? ((canceledOrders / totalOrders) * 100).toFixed(1) : '0.0';
    
    Swal.fire({
        title: 'Relatório Personalizado',
        html: `
            <div class="custom-report">
                <div class="report-header">
                    <h3>Período: ${formatDateForDisplay(startDate)} até ${formatDateForDisplay(endDate)}</h3>
                    <p class="period-duration">${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}</p>
                </div>
                
                <div class="report-metrics">
                    <div class="metric-row main-metric">
                        <span class="metric-label">Total de Vendas:</span>
                        <span class="metric-value primary">${totalSales}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Ticket Médio:</span>
                        <span class="metric-value">${averageTicket}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Média Diária:</span>
                        <span class="metric-value">${dailyAverage}</span>
                    </div>
                    
                    <div class="metric-row">
                        <span class="metric-label">Total de Pedidos:</span>
                        <span class="metric-value">${totalOrders}</span>
                    </div>
                    
                    <div class="metric-row canceled">
                        <span class="metric-label">Cancelamentos:</span>
                        <span class="metric-value">${canceledValue} (${canceledOrders} pedidos)</span>
                    </div>
                    
                    <div class="metric-row canceled">
                        <span class="metric-label">Taxa de Cancelamento:</span>
                        <span class="metric-value">${cancellationRate}%</span>
                    </div>
                </div>
                
                <div class="report-actions">
                    <button type="button" class="action-btn export-btn" onclick="exportReportToPDF('${startDate}', '${endDate}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">
                        <i class="fa fa-file-pdf-o"></i> Baixar PDF
                    </button>
                    <button type="button" class="action-btn new-period-btn" onclick="Swal.close(); openCustomPeriodModal();">
                        <i class="fa fa-calendar"></i> Novo Período
                    </button>
                </div>
            </div>
        `,
        width: '600px',
        confirmButtonText: 'Fechar',
        confirmButtonColor: '#06CF90',
        customClass: {
            htmlContainer: 'custom-report-modal'
        }
    });
}

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {string} - Data formatada
 */
function formatDateForDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}