// Função para mover o pedido para o próximo status
async function moveOrderForward(orderId, card) {
    try {
      // Obtém o status atual
      const currentColumn = card.parentNode;
      const currentStatus = columnToStatusMap[currentColumn.id];
      
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
          goeatAlert('info', `Pedido #${orderId} já está no último status`);
          return;
      }
      
      // Obtém a coluna de destino
      const targetColumn = document.getElementById(statusToColumnMap[nextStatus]);
      
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
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status: ${response.status}`);
      }
      
      // Se atualizado com sucesso, move o card
      targetColumn.appendChild(card);
      
      // Atualiza o status no array local
      const orderIndex = ordersData.findIndex(o => o.id == orderId);
      if (orderIndex >= 0) {
        ordersData[orderIndex].orderStatus = nextStatus;
      }
      
      goeatAlert('success', `Pedido #${orderId} movido para ${getStatusName(nextStatus)}`);
      
    } catch (error) {
      goeatAlert('error', `Erro ao atualizar status do pedido #${orderId}. Tente novamente.`);
      console.error('Erro ao mover pedido:', error);
    }
  }
  
  // Função para mover o pedido para o status anterior
  async function moveOrderBack(orderId, card) {
    try {
      // Obtém o status atual
      const currentColumn = card.parentNode;
      const currentStatus = columnToStatusMap[currentColumn.id];
      
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
          goeatAlert('info', `Pedido #${orderId} já está no primeiro status`);
          return;
      }
      
      // Obtém a coluna de destino
      const targetColumn = document.getElementById(statusToColumnMap[previousStatus]);
      
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
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status: ${response.status}`);
      }
      
      // Se atualizado com sucesso, move o card
      targetColumn.appendChild(card);
      
      // Atualiza o status no array local
      const orderIndex = ordersData.findIndex(o => o.id == orderId);
      if (orderIndex >= 0) {
        ordersData[orderIndex].orderStatus = previousStatus;
      }
      
      goeatAlert('success', `Pedido #${orderId} movido para ${getStatusName(previousStatus)}`);
      
    } catch (error) {
      goeatAlert('error', `Erro ao atualizar status do pedido #${orderId}. Tente novamente.`);
      console.error('Erro ao mover pedido:', error);
    }
  }