// Arquivo de inicialização segura do checkout
// Este arquivo deve ser carregado antes dos outros scripts do checkout

// Verificação de dependências críticas
(function() {
    'use strict';
    
    // Lista de dependências necessárias
    const requiredGlobals = [
        'API_BASE_URL',
        'isAuthenticatedClient',
        'getAuthenticatedClient',
        'setAuthenticatedClient',
        'logoutClient'
    ];
    
    // Função para verificar se todas as dependências estão disponíveis
    function checkDependencies() {
        const missing = [];
        
        requiredGlobals.forEach(globalVar => {
            if (typeof window[globalVar] === 'undefined') {
                missing.push(globalVar);
            }
        });
        
        if (missing.length > 0) {
            console.error('Dependências ausentes do checkout:', missing);
            showDependencyError(missing);
            return false;
        }
        
        return true;
    }
    
    // Função para mostrar erro de dependência
    function showDependencyError(missing) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        errorDiv.innerHTML = `
            <div style="
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
            ">
                <h3 style="color: #dc3545; margin-top: 0;">Erro de Carregamento</h3>
                <p>Algumas dependências não foram carregadas corretamente.</p>
                <p><small>Dependências ausentes: ${missing.join(', ')}</small></p>
                <button onclick="window.location.reload()" style="
                    background: #06CF90;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                ">Recarregar Página</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }
    
    // Função para verificar se o SweetAlert2 está disponível
    function checkSweetAlert() {
        if (typeof Swal === 'undefined') {
            console.warn('SweetAlert2 não encontrado, usando alerts nativos como fallback');
            
            // Criar um fallback básico para Swal
            window.Swal = {
                fire: function(options) {
                    if (typeof options === 'string') {
                        alert(options);
                    } else if (options && options.text) {
                        alert(options.text);
                    } else if (options && options.title) {
                        alert(options.title);
                    }
                    return Promise.resolve({ isConfirmed: true });
                }
            };
        }
    }
    
    // Função para inicializar valores padrão
    function initializeDefaults() {
        // Garantir que API_BASE_URL existe
        if (typeof window.API_BASE_URL === 'undefined') {
            window.API_BASE_URL = 'http://localhost:8080/api/v1';
            console.warn('API_BASE_URL não definida, usando valor padrão:', window.API_BASE_URL);
        }
        
        // Garantir que orderData existe globalmente
        if (typeof window.orderData === 'undefined') {
            window.orderData = {
                partnerId: null,
                items: [],
                customer: {},
                address: {},
                deliveryType: 'delivery',
                payment: {
                    method: 'on-delivery',
                    submethod: 'card',
                    details: {}
                },
                total: 0
            };
        }
        
        // Garantir que funções básicas de formatação existem
        if (typeof window.formatPrice === 'undefined') {
            window.formatPrice = function(price) {
                if (isNaN(price)) return '0,00';
                const numPrice = typeof price === 'string' ? parseFloat(price) : price;
                const priceInReais = numPrice > 1000 ? numPrice / 100 : numPrice;
                return priceInReais.toFixed(2).replace('.', ',');
            };
        }
        
        // Garantir que funções de sessão existem como fallback
        if (typeof window.isAuthenticatedClient === 'undefined') {
            window.isAuthenticatedClient = function() {
                return false;
            };
            console.warn('isAuthenticatedClient não definida, usando fallback');
        }
        
        if (typeof window.getAuthenticatedClient === 'undefined') {
            window.getAuthenticatedClient = function() {
                return null;
            };
            console.warn('getAuthenticatedClient não definida, usando fallback');
        }
    }
    
    // Função para configurar tratamento de erros globais
    function setupGlobalErrorHandling() {
        // Capturar erros JavaScript não tratados
        window.addEventListener('error', function(event) {
            console.error('Erro JavaScript no checkout:', event.error);
            
            // Se for um erro crítico, mostrar feedback ao usuário
            if (event.error && event.error.message) {
                const message = event.error.message.toLowerCase();
                if (message.includes('network') || message.includes('fetch') || message.includes('api')) {
                    showNetworkError();
                }
            }
        });
        
        // Capturar promises rejeitadas não tratadas
        window.addEventListener('unhandledrejection', function(event) {
            console.error('Promise rejeitada no checkout:', event.reason);
            
            // Se for erro de rede, mostrar feedback
            if (event.reason && event.reason.message) {
                const message = event.reason.message.toLowerCase();
                if (message.includes('network') || message.includes('fetch')) {
                    showNetworkError();
                }
            }
        });
    }
    
    // Função para mostrar erro de rede
    function showNetworkError() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Erro de Conexão',
                text: 'Problema de conexão com o servidor. Verifique sua internet e tente novamente.',
                confirmButtonColor: '#06CF90',
                confirmButtonText: 'Tentar Novamente',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload();
                }
            });
        } else {
            if (confirm('Erro de conexão. Deseja recarregar a página?')) {
                window.location.reload();
            }
        }
    }
    
    // Função para verificar se a página está sendo executada em HTTPS (se necessário)
    function checkSecureContext() {
        // Se estivermos em produção e não for HTTPS, avisar
        if (window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1' && 
            window.location.protocol !== 'https:') {
            console.warn('Checkout executando em contexto não seguro (HTTP)');
        }
    }
    
    // Função para limpar dados antigos/corrompidos
    function cleanupOldData() {
        try {
            // Limpar dados antigos do checkout que podem estar corrompidos
            const oldKeys = [
                'checkout_temp_data',
                'old_cart_format',
                'legacy_checkout_state'
            ];
            
            oldKeys.forEach(key => {
                if (sessionStorage.getItem(key)) {
                    sessionStorage.removeItem(key);
                    console.log('Dados antigos removidos:', key);
                }
            });
            
            // Verificar se o carrinho está em formato antigo e converter se necessário
            const cartData = sessionStorage.getItem('cart');
            if (cartData) {
                try {
                    const parsed = JSON.parse(cartData);
                    // Se for array (formato antigo), deixar como está para ser tratado pelo checkout-core
                    if (Array.isArray(parsed)) {
                        console.log('Carrinho em formato antigo detectado, será convertido automaticamente');
                    }
                } catch (e) {
                    console.warn('Dados do carrinho corrompidos, removendo:', e);
                    sessionStorage.removeItem('cart');
                }
            }
            
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
        }
    }
    
    // Função principal de inicialização
    function initializeCheckout() {
        console.log('Inicializando sistema de checkout...');
        
        // 1. Verificar dependências
        if (!checkDependencies()) {
            return; // Para a execução se dependências críticas estiverem ausentes
        }
        
        // 2. Verificar SweetAlert2
        checkSweetAlert();
        
        // 3. Inicializar valores padrão
        initializeDefaults();
        
        // 4. Configurar tratamento de erros
        setupGlobalErrorHandling();
        
        // 5. Verificar contexto seguro
        checkSecureContext();
        
        // 6. Limpar dados antigos
        cleanupOldData();
        
        console.log('Sistema de checkout inicializado com sucesso');
        
        // Marcar como inicializado
        window.checkoutInitialized = true;
        
        // Disparar evento customizado para outros scripts
        window.dispatchEvent(new CustomEvent('checkoutInitialized'));
    }
    
    // Aguardar o DOM estar pronto e então inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCheckout);
    } else {
        // DOM já está pronto
        initializeCheckout();
    }
    
})();