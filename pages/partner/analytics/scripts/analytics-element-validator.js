/**
 * Arquivo: analytics-element-validator.js
 * Utilitário para validar se todos os elementos necessários estão presentes
 * antes de inicializar os gráficos de analytics
 */

/**
 * Lista de elementos necessários para a página de analytics
 */
const REQUIRED_ELEMENTS = {
  canvases: [
    'sales-timeline-chart',
    'products-bestsellers-chart', 
    'products-categories-chart'
  ],
  containers: [
    'period-select',
    'products-table-body',
    'userName'
  ],
  chartContainers: [
    'sales-timeline-content',
    'products-bestsellers-content',
    'products-categories-content'
  ]
};

/**
 * Valida se todos os elementos necessários estão presentes no DOM
 * @returns {Object} Resultado da validação
 */
function validateAnalyticsElements() {
  const validation = {
    isValid: true,
    missing: [],
    present: [],
    warnings: []
  };

  // Verificar canvas elements
  REQUIRED_ELEMENTS.canvases.forEach(canvasId => {
    const element = document.getElementById(canvasId);
    if (element) {
      validation.present.push(canvasId);
    } else {
      validation.missing.push(canvasId);
      validation.isValid = false;
    }
  });

  // Verificar containers
  REQUIRED_ELEMENTS.containers.forEach(containerId => {
    const element = document.getElementById(containerId);
    if (element) {
      validation.present.push(containerId);
    } else {
      validation.missing.push(containerId);
      validation.warnings.push(`Container ${containerId} não encontrado`);
    }
  });

  // Verificar containers de gráficos
  REQUIRED_ELEMENTS.chartContainers.forEach(containerId => {
    const element = document.querySelector(`.${containerId}`);
    if (element) {
      validation.present.push(containerId);
    } else {
      validation.warnings.push(`Chart container ${containerId} não encontrado`);
    }
  });

  return validation;
}

/**
 * Cria elementos canvas que estão faltando
 * @param {Array} missingCanvases - Lista de IDs de canvas faltando
 */
function createMissingCanvases(missingCanvases) {
  missingCanvases.forEach(canvasId => {
    // Determinar onde inserir o canvas baseado no ID
    let targetContainer;
    let canvasConfig = {};
    
    switch(canvasId) {
      case 'sales-timeline-chart':
        targetContainer = document.querySelector('.sales-timeline-content');
        canvasConfig = { width: 800, height: 400 };
        break;
      case 'products-bestsellers-chart':
        targetContainer = document.querySelector('.products-bestsellers-content');
        canvasConfig = { width: 400, height: 400 };
        break;
      case 'products-categories-chart':
        targetContainer = document.querySelector('.products-categories-chart-area');
        canvasConfig = { width: 400, height: 280 };
        break;
    }
    
    if (targetContainer) {
      const canvas = document.createElement('canvas');
      canvas.id = canvasId;
      canvas.width = canvasConfig.width || 400;
      canvas.height = canvasConfig.height || 300;
      
      // Limpar container e adicionar canvas
      targetContainer.innerHTML = '';
      targetContainer.appendChild(canvas);
      
      console.log(`Canvas ${canvasId} criado dinamicamente`);
    } else {
      console.error(`Container para canvas ${canvasId} não encontrado`);
    }
  });
}

/**
 * Cria a estrutura HTML mínima se não existir
 */
function createMissingStructure() {
  const main = document.querySelector('main');
  if (!main) {
    console.error('Elemento <main> não encontrado');
    return false;
  }

  let analyticsContainer = document.querySelector('.analytics-container');
  if (!analyticsContainer) {
    analyticsContainer = document.createElement('div');
    analyticsContainer.className = 'analytics-container';
    main.appendChild(analyticsContainer);
  }

  // Criar estrutura de gráficos se não existir
  let chartsSection = analyticsContainer.querySelector('.charts-section');
  if (!chartsSection) {
    chartsSection = document.createElement('div');
    chartsSection.className = 'charts-section';
    
    // Criar containers para cada gráfico
    const chartContainers = [
      {
        id: 'sales-timeline',
        title: 'Vendas ao Longo do Tempo',
        canvasId: 'sales-timeline-chart'
      },
      {
        id: 'products-bestsellers',
        title: 'Produtos Mais Vendidos', 
        canvasId: 'products-bestsellers-chart'
      },
      {
        id: 'products-categories',
        title: 'Categorias de Produtos',
        canvasId: 'products-categories-chart'
      }
    ];

    chartContainers.forEach(config => {
      const container = createChartContainer(config);
      chartsSection.appendChild(container);
    });

    analyticsContainer.appendChild(chartsSection);
  }

  return true;
}

/**
 * Cria um container de gráfico
 * @param {Object} config - Configuração do container
 * @returns {HTMLElement} - Elemento do container
 */
function createChartContainer(config) {
  const container = document.createElement('div');
  container.className = `chart-container ${config.id}-container`;
  
  container.innerHTML = `
    <div class="chart-header ${config.id}-header">
      <h3>${config.title}</h3>
    </div>
    <div class="chart-content ${config.id}-content">
      <canvas id="${config.canvasId}" width="400" height="300"></canvas>
    </div>
  `;
  
  return container;
}

/**
 * Função principal de validação e correção
 * @returns {boolean} - True se tudo estiver OK ou foi corrigido
 */
function validateAndFixAnalyticsPage() {
  console.log('Validando elementos da página de analytics...');
  
  // Primeiro, tentar criar estrutura básica se necessário
  if (!createMissingStructure()) {
    console.error('Falha ao criar estrutura básica da página');
    return false;
  }
  
  // Validar elementos
  const validation = validateAnalyticsElements();
  
  console.log('Resultado da validação:', validation);
  
  // Se há canvas faltando, tentar criar
  const missingCanvases = validation.missing.filter(id => 
    REQUIRED_ELEMENTS.canvases.includes(id)
  );
  
  if (missingCanvases.length > 0) {
    console.log('Criando canvas faltando:', missingCanvases);
    createMissingCanvases(missingCanvases);
    
    // Revalidar após criar elementos
    const revalidation = validateAnalyticsElements();
    console.log('Revalidação após correções:', revalidation);
    
    return revalidation.missing.filter(id => 
      REQUIRED_ELEMENTS.canvases.includes(id)
    ).length === 0;
  }
  
  // Exibir warnings se houver
  if (validation.warnings.length > 0) {
    console.warn('Avisos na validação:', validation.warnings);
  }
  
  return validation.missing.filter(id => 
    REQUIRED_ELEMENTS.canvases.includes(id)
  ).length === 0;
}

/**
 * Aguarda até que os elementos estejam disponíveis
 * @param {number} maxAttempts - Número máximo de tentativas
 * @param {number} interval - Intervalo entre tentativas (ms)
 * @returns {Promise<boolean>} - Promise que resolve quando elementos estão prontos
 */
function waitForElements(maxAttempts = 10, interval = 100) {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const checkElements = () => {
      attempts++;
      
      if (validateAndFixAnalyticsPage()) {
        console.log(`Elementos validados na tentativa ${attempts}`);
        resolve(true);
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.warn(`Máximo de tentativas (${maxAttempts}) atingido para validação`);
        resolve(false);
        return;
      }
      
      setTimeout(checkElements, interval);
    };
    
    checkElements();
  });
}

// Exportar funções para uso global
window.validateAnalyticsElements = validateAnalyticsElements;
window.validateAndFixAnalyticsPage = validateAndFixAnalyticsPage;
window.waitForElements = waitForElements;