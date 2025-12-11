class TaskManager {
    constructor() {
        this.tasks = [];
        this.taskContainer = document.getElementById('taskContainer');
        this.taskForm = document.getElementById('taskForm');
        this.taskNameInput = document.getElementById('taskName');
        this.taskDateInput = document.getElementById('taskDate');

        this.init();
    }

    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.initDatePicker();
        this.renderTasks();
    }

    initDatePicker() {
        flatpickr(this.taskDateInput, {
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "Y-m-d"
        });
    }

    setupEventListeners() {
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        this.taskContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(this.taskContainer, e.clientY);
            const draggable = document.querySelector('.dragging');
            
            if (draggable) {
                if (afterElement == null) {
                    this.taskContainer.appendChild(draggable);
                } else {
                    this.taskContainer.insertBefore(draggable, afterElement);
                }
            }
        });
    }

    // ... (rest of methods)

    setupDragAndDrop() {
        const taskItems = this.taskContainer.querySelectorAll('.task-item');

        taskItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.taskId);
                setTimeout(() => item.classList.add('dragging'), 0);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.updateTasksOrder();
            });
        });


    }

    addTask() {
        const name = this.taskNameInput.value.trim();
        const date = this.taskDateInput.value;

        if (!name) return;

        const task = {
            id: Date.now().toString(),
            name: name,
            date: date,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();

        // Clear form
        this.taskNameInput.value = '';
        this.taskDateInput.value = '';
        this.taskNameInput.focus();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
    }

    renderTasks() {
        this.taskContainer.innerHTML = '';

        if (this.tasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';

            const svg = document.createElement('svg');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('stroke', 'currentColor');

            const path = document.createElement('path');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('d', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2');

            svg.appendChild(path);
            emptyState.appendChild(svg);

            const p = document.createElement('p');
            p.textContent = 'No tasks yet. Add your first task above!';
            emptyState.appendChild(p);

            this.taskContainer.appendChild(emptyState);
            return;
        }

        // Use current order (do not sort by date)
        const sortedTasks = [...this.tasks];

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.taskContainer.appendChild(taskElement);
        });

        this.setupDragAndDrop();
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.name;

        taskContent.appendChild(taskText);

        if (task.date) {
            const taskDate = document.createElement('span');
            taskDate.className = 'task-date';
            taskDate.textContent = `Due: ${new Date(task.date).toLocaleDateString()}`;
            taskContent.appendChild(taskDate);
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.deleteTask(task.id));

        taskElement.appendChild(taskContent);
        taskElement.appendChild(deleteButton);

        return taskElement;
    }



    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateTasksOrder() {
        const newOrderIds = [...this.taskContainer.querySelectorAll('.task-item')]
            .map(item => item.dataset.taskId);
        
        // Rebuild this.tasks array based on the new order of IDs
        // This ensures we keep the original task objects (with dates etc) but in new order
        const taskMap = new Map(this.tasks.map(t => [t.id, t]));
        this.tasks = newOrderIds.map(id => taskMap.get(id)).filter(t => t !== undefined);
        
        this.saveTasks();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});