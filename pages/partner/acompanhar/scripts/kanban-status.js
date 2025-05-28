// Função para mover o pedido para o próximo status
async function moveOrderForward(orderId, card) {
  try {
    console.log(`Tentando avançar pedido ${orderId} para próximo status`);
    
    // Obtém o status atual
    const currentColumn = card.parentNode;
    const currentStatus = columnToStatusMap[currentColumn.id];
    
    console.log(`Status atual: ${currentStatus}`);
    
    // Define o próximo status na sequência
    let nextStatus;
    switch(currentStatus) {
      case 'ESPERANDO':
        nextStatus = 'PREPARANDO';
        break;
      case 'PREPARANDO':
        nextStatus = 'ENCAMINHADOS';
        break;
      case 'ENCAMINHADOS':
        nextStatus = 'FINALIZADOS';
        break;
      case 'FINALIZADOS':
        // Já está no último status, não faz nada
        console.log(`Pedido #${orderId} já está no último status`);
        goeatAlert('info', `Pedido #${orderId} já está no último status`);
        return;
    }
    
    console.log(`Próximo status: ${nextStatus}`);
    
    // Obtém a coluna de destino
    const targetColumn = document.getElementById(statusToColumnMap[nextStatus]);
    
    if (!targetColumn) {
      console.error(`Coluna de destino não encontrada para status: ${nextStatus}`);
      throw new Error('Coluna de destino não encontrada');
    }
    
    // Desabilita temporariamente os botões para evitar cliques múltiplos
    const moveButtons = card.querySelectorAll('.move-forward-button, .move-back-button');
    moveButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });
    
    console.log('Enviando requisição para o backend...');
    
    // Tenta atualizar o status no backend
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        id: parseInt(orderId),
        status: nextStatus
      })
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error(`Erro na requisição: ${response.status} - ${errorText}`);
      throw new Error(`Erro ao atualizar status: ${response.status} - ${errorText}`);
    }
    
    console.log('Status atualizado com sucesso no backend');
    
    // Se atualizado com sucesso, move o card
    targetColumn.appendChild(card);
    
    // Atualiza o status no array local
    const orderIndex = ordersData.findIndex(o => o.id == orderId);
    if (orderIndex >= 0) {
      ordersData[orderIndex].orderStatus = nextStatus;
      console.log(`Status local atualizado para pedido ${orderId}: ${nextStatus}`);
    }
    
    // Reabilita os botões e atualiza o estado dos botões
    updateCardButtons(card, nextStatus);
    
    // Atualiza a exibição para recalcular os limites se necessário
    refreshOrdersDisplay();
    
    goeatAlert('success', `Pedido #${orderId} movido para ${getStatusName(nextStatus)}`);
    
  } catch (error) {
    console.error('Erro detalhado ao mover pedido:', error);
    
    // Reabilita os botões em caso de erro
    const moveButtons = card.querySelectorAll('.move-forward-button, .move-back-button');
    moveButtons.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
    });
    
    goeatAlert('error', `Erro ao atualizar status do pedido #${orderId}: ${error.message}`);
  }
}

// Função para mover o pedido para o status anterior
async function moveOrderBack(orderId, card) {
  try {
    console.log(`Tentando voltar pedido ${orderId} para status anterior`);
    
    // Obtém o status atual
    const currentColumn = card.parentNode;
    const currentStatus = columnToStatusMap[currentColumn.id];
    
    console.log(`Status atual: ${currentStatus}`);
    
    // Define o status anterior na sequência
    let previousStatus;
    switch(currentStatus) {
      case 'FINALIZADOS':
        previousStatus = 'ENCAMINHADOS';
        break;
      case 'ENCAMINHADOS':
        previousStatus = 'PREPARANDO';
        break;
      case 'PREPARANDO':
        previousStatus = 'ESPERANDO';
        break;
      case 'ESPERANDO':
        // Já está no primeiro status, não faz nada
        console.log(`Pedido #${orderId} já está no primeiro status`);
        goeatAlert('info', `Pedido #${orderId} já está no primeiro status`);
        return;
    }
    
    console.log(`Status anterior: ${previousStatus}`);
    
    // Obtém a coluna de destino
    const targetColumn = document.getElementById(statusToColumnMap[previousStatus]);
    
    if (!targetColumn) {
      console.error(`Coluna de destino não encontrada para status: ${previousStatus}`);
      throw new Error('Coluna de destino não encontrada');
    }
    
    // Desabilita temporariamente os botões
    const moveButtons = card.querySelectorAll('.move-forward-button, .move-back-button');
    moveButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });
    
    console.log('Enviando requisição para o backend...');
    
    // Tenta atualizar o status no backend
    const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.token}`
      },
      body: JSON.stringify({
        id: parseInt(orderId),
        status: previousStatus
      })
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error(`Erro na requisição: ${response.status} - ${errorText}`);
      throw new Error(`Erro ao atualizar status: ${response.status} - ${errorText}`);
    }
    
    console.log('Status atualizado com sucesso no backend');
    
    // Se atualizado com sucesso, move o card
    targetColumn.appendChild(card);
    
    // Atualiza o status no array local
    const orderIndex = ordersData.findIndex(o => o.id == orderId);
    if (orderIndex >= 0) {
      ordersData[orderIndex].orderStatus = previousStatus;
      console.log(`Status local atualizado para pedido ${orderId}: ${previousStatus}`);
    }
    
    // Reabilita os botões e atualiza o estado dos botões
    updateCardButtons(card, previousStatus);
    
    // Atualiza a exibição para recalcular os limites se necessário
    refreshOrdersDisplay();
    
    goeatAlert('success', `Pedido #${orderId} movido para ${getStatusName(previousStatus)}`);
    
  } catch (error) {
    console.error('Erro detalhado ao mover pedido:', error);
    
    // Reabilita os botões em caso de erro
    const moveButtons = card.querySelectorAll('.move-forward-button, .move-back-button');
    moveButtons.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
    });
    
    goeatAlert('error', `Erro ao atualizar status do pedido #${orderId}: ${error.message}`);
  }
}

// Função para atualizar o estado dos botões baseado no status
function updateCardButtons(card, status) {
  const moveBackButton = card.querySelector('.move-back-button');
  const moveForwardButton = card.querySelector('.move-forward-button');
  
  if (!moveBackButton || !moveForwardButton) {
    console.error('Botões não encontrados no card');
    return;
  }
  
  // Remove classes de desabilitado
  moveBackButton.classList.remove('disabled-button');
  moveForwardButton.classList.remove('disabled-button');
  
  // Reabilita todos os botões primeiro
  moveBackButton.disabled = false;
  moveForwardButton.disabled = false;
  moveBackButton.style.opacity = '1';
  moveForwardButton.style.opacity = '1';
  
  // Desabilita conforme a posição no fluxo
  if (status === 'ESPERANDO') {
    moveBackButton.disabled = true;
    moveBackButton.classList.add('disabled-button');
    moveBackButton.style.opacity = '0.5';
  } else if (status === 'FINALIZADOS') {
    moveForwardButton.disabled = true;
    moveForwardButton.classList.add('disabled-button');
    moveForwardButton.style.opacity = '0.5';
  }
  
  console.log(`Botões atualizados para status: ${status}`);
}