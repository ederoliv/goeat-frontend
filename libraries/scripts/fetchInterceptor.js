// libraries/scripts/fetchInterceptor.js
// Sistema que MONITORA todas as requisições HTTP automaticamente
// NÃO PRECISA MEXER EM NENHUMA REQUISIÇÃO EXISTENTE!

(function() {
    'use strict';
    
    // Guarda o fetch original do navegador
    const originalFetch = window.fetch;
    
    // Substitui o fetch global do navegador
    window.fetch = async function(...args) {
        try {
            // Chama o fetch original normalmente
            const response = await originalFetch.apply(this, args);
            
            // MONITORA a resposta - se for 401, trata automaticamente
            if (response.status === 401) {
                console.warn('🔒 Erro 401 detectado automaticamente!');
                handleUnauthorized(args[0]); // Passa a URL da requisição
            }
            
            // Retorna a resposta normalmente (não interfere no código existente)
            return response;
            
        } catch (error) {
            // Se der erro na requisição, apenas repassa o erro
            console.error('Erro na requisição:', error);
            throw error;
        }
    };
    
    // Função que trata o erro 401
    function handleUnauthorized(requestUrl) {
        console.log('Tratando erro 401 para:', requestUrl);
        
        // 1. Limpa todos os dados de sessão
        clearAllSessionData();
        
        // 2. Determina para onde redirecionar baseado na URL atual
        const redirectUrl = getRedirectUrl();
        
        // 3. Mostra notificação (se SweetAlert2 estiver disponível)
        showSessionExpiredMessage(redirectUrl);
    }
    
    // Limpa TODOS os dados de sessão/localStorage
    function clearAllSessionData() {
        // Remove dados do cliente
        localStorage.removeItem('clientData');
        sessionStorage.removeItem('clientData');
        
        // Remove dados do parceiro  
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userData');
        
        // Remove carrinho
        sessionStorage.removeItem('cart');
        
        // Remove qualquer outro dado que você usar
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        console.log('✅ Dados de sessão limpos');
    }
    
    // Determina para onde redirecionar baseado na URL atual
    function getRedirectUrl() {
        const currentPath = window.location.pathname;
        
        // Se está em área de parceiro
        if (currentPath.includes('/partner/') || currentPath.includes('/loginPartner/')) {
            return getBaseUrl() + '/pages/loginPartner/index.html';
        }
        
        // Se está em área de cliente  
        if (currentPath.includes('/client/') || currentPath.includes('/loginClient/')) {
            return getBaseUrl() + '/pages/loginClient/index.html';
        }
        
        // Fallback - página principal
        return getBaseUrl() + '/index.html';
    }
    
    // Obtém a URL base do projeto
    function getBaseUrl() {
        return window.location.origin;
    }
    
    // Mostra mensagem de sessão expirada
    function showSessionExpiredMessage(redirectUrl) {
        // Verifica se SweetAlert2 está disponível
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'warning',
                title: 'Sessão Expirada',
                text: 'Sua sessão expirou. Você será redirecionado para fazer login novamente.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#06CF90',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                window.location.href = redirectUrl;
            });
        } else {
            // Fallback para alert nativo
            alert('Sua sessão expirou. Você será redirecionado para fazer login novamente.');
            window.location.href = redirectUrl;
        }
    }
    
    console.log('🛡️ Interceptor de requisições ativo - monitorando 401s automaticamente');
    
})();