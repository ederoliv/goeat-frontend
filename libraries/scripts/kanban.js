window.onload = function() {
  const userDataString = sessionStorage.getItem('userData');
if (userDataString) {
    const userData = JSON.parse(userDataString);
    document.getElementById('userName').textContent = userData.name;
}
};

const kanbanItems = document.querySelectorAll('.kanban-item');
const kanbanColumns = document.querySelectorAll('.kanban-column');

// Adiciona evento de arrastar aos cards
kanbanItems.forEach(item => {
  item.addEventListener('dragstart', dragStart);
  item.addEventListener('dragend', dragEnd);
});

kanbanColumns.forEach(column => {
  column.addEventListener('dragover', dragOver);
  column.addEventListener('drop', drop);
});

function dragStart(event) {
  event.dataTransfer.setData('text/plain', event.target.id);
}

function dragOver(event) {
  event.preventDefault();
  this.classList.add('dragover');
}

function drop(event) {
  event.preventDefault();
  this.classList.remove('dragover');
  const id = event.dataTransfer.getData('text/plain');
  const draggable = document.getElementById(id);
  this.appendChild(draggable);
}

function dragEnd(event) {
  // Garante que o item volte a ser exibido após o arraste, caso não seja dropado em um lugar válido
  event.target.style.display = 'block';
}
