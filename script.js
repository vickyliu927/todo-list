// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Get DOM elements
    const todoInput = document.getElementById('todoInput');
    const addButton = document.getElementById('addButton');
    const todoList = document.getElementById('todoList');
    const prioritySelect = document.getElementById('prioritySelect');

    console.log('Elements found:', {
        todoInput: !!todoInput,
        addButton: !!addButton,
        todoList: !!todoList,
        prioritySelect: !!prioritySelect
    });

    // Simple array to store todos
    let todos = [];

    // Function to add a new todo
    function addTodo() {
        console.log('Add todo function called');
        const text = todoInput.value.trim();
        console.log('Input text:', text);
        
        if (text) {
            // Create new todo item
            const li = document.createElement('li');
            li.className = 'todo-item';
            
            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox';
            
            // Create text span
            const textSpan = document.createElement('span');
            textSpan.className = 'todo-text';
            textSpan.textContent = text;
            
            // Create priority badge
            const priorityBadge = document.createElement('span');
            priorityBadge.className = `priority-badge priority-${prioritySelect.value}`;
            priorityBadge.textContent = prioritySelect.value.charAt(0).toUpperCase() + prioritySelect.value.slice(1);
            
            // Create delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.textContent = '×';
            
            // Add event listeners
            checkbox.addEventListener('change', function() {
                li.classList.toggle('completed');
            });
            
            deleteButton.addEventListener('click', function() {
                li.remove();
            });
            
            // Append elements to li
            li.appendChild(checkbox);
            li.appendChild(priorityBadge);
            li.appendChild(textSpan);
            li.appendChild(deleteButton);
            
            // Add to list
            todoList.appendChild(li);
            
            // Clear input
            todoInput.value = '';
            console.log('Todo added successfully');
        }
    }

    // Event listeners
    addButton.addEventListener('click', addTodo);
    
    todoInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            addTodo();
        }
    });

    console.log('Event listeners added');
}); 