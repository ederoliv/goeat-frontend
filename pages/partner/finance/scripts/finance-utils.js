/**
 * Arquivo: finance-utils.js
 * Funções utilitárias compartilhadas para o módulo financeiro
 */

/**
 * Formata um valor em centavos para moeda brasileira
 * @param {number} value - Valor em centavos
 * @returns {string} - Valor formatado (ex: R$ 1.234,56)
 */
function formatCurrency(value) {
    // Converter para número, caso venha como string
    const valueInCents = Number(value);
    
    // Verificar se é um número válido
    if (isNaN(valueInCents)) {
        return 'R$ 0,00';
    }
    
    // Converter centavos para reais
    const reais = Math.floor(valueInCents / 100);
    const centavos = Math.abs(valueInCents % 100);
    
    // Formatar com separadores
    return `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
}

/**
 * Valida se uma data está no formato correto e é válida
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean} - True se a data for válida
 */
function isValidDate(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    
    const date = new Date(dateString + 'T00:00:00');
    return date instanceof Date && !isNaN(date) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param {string} startDate - Data de início (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 * @returns {number} - Diferença em dias
 */
function calculateDateDifference(startDate, endDate) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos os dias
}

/**
 * Obtém a data atual no formato YYYY-MM-DD
 * @returns {string} - Data atual formatada
 */
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Obtém uma data X dias atrás no formato YYYY-MM-DD
 * @param {number} days - Número de dias para voltar
 * @returns {string} - Data formatada
 */
function getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
}

/**
 * Verifica se os dados financeiros são válidos
 * @param {Object} data - Dados financeiros
 * @returns {boolean} - True se os dados forem válidos
 */
function validateFinanceData(data) {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['totalSales', 'averageTicket', 'canceledOrdersValue'];
    return requiredFields.every(field => typeof data[field] === 'number');
}

/**
 * Calcula métricas adicionais baseadas nos dados financeiros
 * @param {Object} data - Dados financeiros básicos
 * @param {number} days - Número de dias do período
 * @returns {Object} - Métricas calculadas
 */
function calculateAdditionalMetrics(data, days = 1) {
    const totalOrders = data.totalOrders || 0;
    const canceledOrders = data.canceledOrders || 0;
    const totalSales = data.totalSales || 0;
    
    return {
        dailyAverage: Math.round(totalSales / days),
        cancellationRate: totalOrders > 0 ? ((canceledOrders / totalOrders) * 100) : 0,
        ordersPerDay: Math.round(totalOrders / days),
        effectiveOrders: totalOrders - canceledOrders
    };
}

/**
 * Formata números grandes de forma amigável (ex: 1.2K, 1.5M)
 * @param {number} num - Número a ser formatado
 * @returns {string} - Número formatado
 */
function formatLargeNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
}

/**
 * Cria um objeto de configuração padrão para requisições da API
 * @param {string} method - Método HTTP (GET, POST, etc.)
 * @param {Object} body - Corpo da requisição (opcional)
 * @returns {Object} - Configuração da requisição
 */
function createApiConfig(method = 'GET', body = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
        }
    };
    
    if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
    }
    
    return config;
}

/**
 * Manipula erros de API de forma consistente
 * @param {Error} error - Erro capturado
 * @param {string} operation - Operação que falhou
 * @returns {string} - Mensagem de erro amigável
 */
function handleApiError(error, operation = 'operação') {
    console.error(`Erro na ${operation}:`, error);
    
    if (error.message.includes('401')) {
        return 'Sessão expirada. Por favor, faça login novamente.';
    }
    
    if (error.message.includes('403')) {
        return 'Você não tem permissão para realizar esta operação.';
    }
    
    if (error.message.includes('404')) {
        return 'Recurso não encontrado.';
    }
    
    if (error.message.includes('500')) {
        return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    
    return error.message || `Erro ao executar ${operation}. Tente novamente.`;
}

/**
 * Debounce function para evitar múltiplas requisições
 * @param {Function} func - Função a ser executada
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} - Função com debounce aplicado
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Gera um ID único para elementos DOM
 * @param {string} prefix - Prefixo para o ID
 * @returns {string} - ID único
 */
function generateUniqueId(prefix = 'finance') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}