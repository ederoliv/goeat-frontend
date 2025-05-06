// Inicializa eventos de arrastar e soltar
function initDragAndDrop() {
    const kanbanItems = document.querySelectorAll('.kanban-item');
    const kanbanColumns = document.querySelectorAll('.kanban-column');
  
    // Adiciona evento de arrastar aos cards
    kanbanItems.forEach(item => {
      item.addEventListener('dragstart', dragStart);
      item.addEventListener('dragend', dragEnd);
    });
  
    kanbanColumns.forEach(column => {
      column.addEventListener('dragover', dragOver);
      column.addEventListener('dragleave', dragLeave);
      column.addEventListener('drop', drop);
    });
  }
  
  function dragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
    this.classList.add('dragging');
  }
  
  function dragEnd(event) {
    this.classList.remove('dragging');
  }
  
  function dragOver(event) {
    event.preventDefault();
    this.classList.add('dragover');
  }
  
  function dragLeave(event) {
    this.classList.remove('dragover');
  }
  
  async function drop(event) {
    event.preventDefault();
    this.classList.remove('dragover');
    
    const id = event.dataTransfer.getData('text/plain');
    const draggable = document.getElementById(id);
    
    // Obtém a coluna de origem
    const sourceColumn = draggable.parentNode;
    
    // Obtém a coluna de destino
    const targetColumn = this;
    
    // Se for a mesma coluna, apenas reordena
    if (sourceColumn === targetColumn) {
      targetColumn.appendChild(draggable);
      return;
    }
    
    // Obtém o ID do pedido e o novo status
    const orderId = draggable.dataset.orderId;
    const newStatus = columnToStatusMap[targetColumn.id];
    
    // Tenta atualizar o status no backend
    try {
      const response = await fetch(`${API_BASE_URL}/partners/${userData.id}/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          id: parseInt(orderId),
          status: newStatus
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao atualizar status: ${response.status}`);
      }
      
      // Se atualizado com sucesso, move o card
      targetColumn.appendChild(draggable);
      
      // Atualiza o status no array local
      const orderIndex = ordersData.findIndex(o => o.id == orderId);
      if (orderIndex >= 0) {
        ordersData[orderIndex].orderStatus = newStatus;
      }
      
      // Atualiza estado dos botões após a mudança de status
      const moveForwardButton = draggable.querySelector('.move-forward-button');
      const moveBackButton = draggable.querySelector('.move-back-button');
      
      // Reset classes de desativação
      moveForwardButton.classList.remove('disabled-button');
      moveBackButton.classList.remove('disabled-button');
      moveForwardButton.disabled = false;
      moveBackButton.disabled = false;
      
      // Ajusta conforme a nova coluna
      if (newStatus === 'ESPERANDO') {
          moveBackButton.disabled = true;
          moveBackButton.classList.add('disabled-button');
      } else if (newStatus === 'FINALIZADOS') {
          moveForwardButton.disabled = true;
          moveForwardButton.classList.add('disabled-button');
      }
  
      goeatAlert('success', `Pedido #${orderId} movido para ${getStatusName(newStatus)}`);
      
    } catch (error) {
      
      goeatAlert('error', `Erro ao atualizar status do pedido #${orderId}. Tente novamente.`);
      
      sourceColumn.appendChild(draggable);
    }
  }