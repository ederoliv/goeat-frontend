
function formatCentsToReais(cents) {
    if (!cents || isNaN(cents)) return "0,00";
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function parseReaisToCents(reaisString) {
    if (!reaisString) return 0;
    let cleaned = reaisString.toString()
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const reais = parseFloat(cleaned) || 0;
    return Math.round(reais * 100);
}

function setupPriceInputFormatter(input) {
    if (!input) return;
    
    function applyMask(value) {
        // Remove tudo que não é dígito
        let digits = value.replace(/\D/g, '');
        if (!digits) return '';
        
        // Converter para número
        let number = parseInt(digits) || 0;
        
        // Se tem menos de 3 dígitos, tratar como reais inteiros
        // Se tem 3 ou mais dígitos, os últimos 2 são centavos
        let reais;
        if (digits.length <= 2) {
            // 1 ou 2 dígitos = reais inteiros (33 = 33,00)
            reais = number;
        } else {
            // 3+ dígitos = últimos 2 são centavos (3300 = 33,00, 3350 = 33,50)
            reais = number / 100;
        }
        
        return reais.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    input.addEventListener('input', function(e) {
        const cursorPosition = e.target.selectionStart;
        const oldValue = e.target.value;
        const newValue = applyMask(oldValue);
        e.target.value = newValue;
        const newPosition = Math.min(cursorPosition, newValue.length);
        e.target.setSelectionRange(newPosition, newPosition);
    });
    
    input.addEventListener('blur', function(e) {
        if (!e.target.value) {
            e.target.value = '0,00';
        }
    });
    
    input.addEventListener('focus', function(e) {
        if (e.target.value === '0,00') {
            e.target.value = '';
        }
    });
    
    input.addEventListener('keypress', function(e) {
        const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
                           'Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 
                           'ArrowRight', 'Home', 'End'];
        if (!allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    });
}

function getPriceInCents(inputOrValue) {
    const value = typeof inputOrValue === 'string' ? inputOrValue : inputOrValue.value;
    return parseReaisToCents(value);
}

function setPriceFromCents(input, cents) {
    if (!input) return;
    input.value = formatCentsToReais(cents);
}

window.formatCentsToReais = formatCentsToReais;
window.parseReaisToCents = parseReaisToCents;
window.setupPriceInputFormatter = setupPriceInputFormatter;
window.getPriceInCents = getPriceInCents;
window.setPriceFromCents = setPriceFromCents;