/**
 * Arquivo: pdf-generator.js
 * Gera PDF simples baseado na tela do relatório personalizado
 */

/**
 * Gera e faz download do PDF do relatório financeiro
 * @param {string} startDate - Data de início (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 * @param {Object} data - Dados do relatório
 */
function exportReportToPDF(startDate, endDate, data) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Gerando PDF',
            html: '<i class="fa fa-file-pdf-o fa-3x"></i><p>Criando seu relatório...</p>',
            showConfirmButton: false,
            allowOutsideClick: false
        });
        
        setTimeout(() => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Calcular métricas
            const diffDays = calculateDateDifference(startDate, endDate);
            const totalOrders = data.totalOrders || 0;
            const canceledOrders = data.canceledOrders || 0;
            const dailyAverage = Math.round((data.totalSales || 0) / diffDays);
            const cancellationRate = totalOrders > 0 ? ((canceledOrders / totalOrders) * 100).toFixed(1) : '0.0';
            
            let y = 20;
            
            // Cabeçalho
            doc.setFontSize(20);
            doc.setTextColor(98, 60, 167);
            doc.text('GOEAT - Relatório Financeiro', 20, y);
            y += 15;
            
            // Período
            doc.setFontSize(14);
            doc.setTextColor(60, 60, 60);
            doc.text(`Período: ${formatDateForDisplay(startDate)} até ${formatDateForDisplay(endDate)}`, 20, y);
            y += 10;
            doc.text(`${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`, 20, y);
            y += 20;
            
            // Dados principais
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            const metrics = [
                ['Total de Vendas:', formatCurrency(data.totalSales || 0)],
                ['Ticket Médio:', formatCurrency(data.averageTicket || 0)],
                ['Média Diária:', formatCurrency(dailyAverage)],
                ['Total de Pedidos:', (totalOrders).toLocaleString('pt-BR')],
                ['Cancelamentos:', `${formatCurrency(data.canceledOrdersValue || 0)} (${canceledOrders} pedidos)`],
                ['Taxa de Cancelamento:', `${cancellationRate}%`]
            ];
            
            metrics.forEach(([label, value]) => {
                doc.text(label, 20, y);
                doc.text(value, 120, y);
                y += 10;
            });
            
            // Rodapé
            y = 280;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, y);
            
            // Salvar
            const fileName = `relatorio-financeiro-${startDate}-${endDate}.pdf`;
            doc.save(fileName);
            
            Swal.close();
            goeatAlert('success', 'PDF gerado com sucesso!');
            
        }, 500);
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        Swal.close();
        goeatAlert('error', 'Erro ao gerar PDF. Verifique se as bibliotecas estão carregadas.');
    }
}

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 */
function formatDateForDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

/**
 * Calcula a diferença em dias entre duas datas
 */
function calculateDateDifference(startDate, endDate) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Formata valor em centavos para moeda
 */
function formatCurrency(value) {
    const valueInCents = Number(value);
    if (isNaN(valueInCents)) return 'R$ 0,00';
    
    const reais = Math.floor(valueInCents / 100);
    const centavos = Math.abs(valueInCents % 100);
    return `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
}