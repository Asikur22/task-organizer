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
        this.setupImportExportListeners();
        this.initDatePicker();
        this.renderTasks();
    }

    initDatePicker() {
        this.mainDatePicker = flatpickr(this.taskDateInput, {
            altInput: true,
            altFormat: "F j, Y",
            dateFormat: "d-m-Y"
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

    setupImportExportListeners() {
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTasks());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => importFile.click());
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => this.importTasks(e));
        }
    }

    exportTasks() {
        if (this.tasks.length === 0) {
            alert('No tasks to export!');
            return;
        }

        const data = JSON.stringify(this.tasks, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasks-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                if (Array.isArray(importedTasks)) {
                    // Simple validation: check if items look like tasks and have IDs
                    // We could do more strict validation if needed
                    const validTasks = importedTasks.filter(t => t.id && t.name);
                    
                    if (validTasks.length > 0) {
                        this.tasks = validTasks;
                        this.saveTasks();
                        this.renderTasks();
                        alert(`Successfully imported ${validTasks.length} tasks.`);
                    } else {
                        alert('No valid tasks found in the file.');
                    }
                } else {
                    alert('Invalid file format: Expected a JSON array.');
                }
            } catch (err) {
                console.error('Error parsing JSON:', err);
                alert('Error importing tasks: Invalid JSON file.');
            }
            // Reset the input so the same file can be selected again if needed
            event.target.value = '';
        };
        reader.readAsText(file);
    }



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
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Add to beginning of array
        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();

        // Clear form
        this.taskNameInput.value = '';
        if (this.mainDatePicker) {
            this.mainDatePicker.clear();
        }
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

        // Sort tasks: Non-completed first, then Completed.
        // Non-completed: Inherit array order (user order / LIFO default).
        // Completed: Sort by completedAt (Descending - newest completion at top).
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed === b.completed) {
                if (a.completed) {
                    // Both completed: Sort by completedAt desc
                    return new Date(b.completedAt) - new Date(a.completedAt);
                }
                // Both incomplete: Maintain original order (stable sort assumption or 0)
                // Explicitly use index to ensure stability and respect drag-and-drop order
                return this.tasks.indexOf(a) - this.tasks.indexOf(b);
            }
            return a.completed ? 1 : -1;
        });

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
        if (task.completed) {
            taskElement.classList.add('completed');
        }

        // Completion Checkbox
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'checkbox-wrapper';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id));

        checkboxWrapper.appendChild(checkbox);
        taskElement.appendChild(checkboxWrapper);

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.name;

        taskContent.appendChild(taskText);

        const dateDisplay = document.createElement('span');
        dateDisplay.className = 'task-date';
        if (task.date) {
            // Display date as stored (day, month, year)
            dateDisplay.textContent = `Due: ${task.date}`;
        }
        taskContent.appendChild(dateDisplay);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const dateBtn = document.createElement('button');
        dateBtn.className = 'edit-date-btn';
        dateBtn.innerHTML = '📅'; // Calendar icon
        dateBtn.title = 'Set Due Date';
        
        // Initialize flatpickr on the button
        flatpickr(dateBtn, {
            defaultDate: task.date || null,
            dateFormat: "d-m-Y",
            onChange: (selectedDates, dateStr) => {
                this.updateTaskDate(task.id, dateStr);
            },
            position: "auto right"
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.deleteTask(task.id));

        actionsDiv.appendChild(dateBtn);
        actionsDiv.appendChild(deleteButton);

        taskElement.appendChild(taskContent);
        taskElement.appendChild(actionsDiv);

        return taskElement;
    }

    updateTaskDate(taskId, newDate) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].date = newDate;
            this.saveTasks();
            this.renderTasks();
        }
    }

    toggleTaskCompletion(taskId) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
            if (this.tasks[taskIndex].completed) {
                this.tasks[taskIndex].completedAt = new Date().toISOString();
            } else {
                this.tasks[taskIndex].completedAt = null;
            }
            this.saveTasks();
            this.renderTasks();
        }
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