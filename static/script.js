// script.js

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        todoInput: document.getElementById('todoInput'),
        todoList: document.getElementById('todoList'),
        prioritySelect: document.getElementById('prioritySelect'),
        dueDateInput: document.getElementById('dueDateInput'),
        categorySelect: document.getElementById('categorySelect'),
        aiSummary: document.getElementById('summaryText'),
        highPrioritySound: document.getElementById('highPrioritySound'),
        mediumPrioritySound: document.getElementById('mediumPrioritySound'),
        lowPrioritySound: document.getElementById('lowPrioritySound')
    };

    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const confettiColors = {
        high: ['#ff4444', '#ff0000'],
        medium: ['#ffa500', '#ffb366'],
        low: ['#4CAF50', '#81c784']
    };
    const prioritySounds = {
        high: elements.highPrioritySound,
        medium: elements.mediumPrioritySound,
        low: elements.lowPrioritySound
    };

    let todos = [];

    async function loadTodos() {
        try {
            const res = await fetch('/api/todos');
            todos = await res.json();
            renderTodos();
        } catch (err) {
            console.error('Failed to load todos:', err);
            todos = [];
        }
    }

    async function saveTodos() {
        try {
            await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(todos)
            });
        } catch (err) {
            console.error('Failed to save todos:', err);
        }
    }

    function addTodo() {
        const text = elements.todoInput.value.trim();
        const priority = elements.prioritySelect.value;
        const dueDate = elements.dueDateInput.value;

        if (!text || !priority) return;

        const newTodo = {
            id: Date.now(),
            text,
            priority,
            dueDate,
            completed: false
        };

        todos.push(newTodo);
        saveTodos();
        renderTodos();

        elements.todoInput.value = '';
        elements.prioritySelect.value = 'low';
        elements.dueDateInput.value = '';
    }

    function toggleTodo(index) {
        todos[index].completed = !todos[index].completed;
        celebrateCompletion(todos[index].priority);
        saveTodos();
        renderTodos();
    }

    function deleteTodo(index) {
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
    }

    function celebrateCompletion(priority) {
        const sound = prioritySounds[priority];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }

        const colors = confettiColors[priority] || ['#ccc'];
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                confetti({
                    spread: 360,
                    particleCount: 50,
                    colors: colors
                });
            }, i * 150);
        }
    }

    function renderTodos() {
        elements.todoList.innerHTML = '';
        const sorted = [...todos].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        sorted.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => toggleTodo(index));

            const span = document.createElement('span');
            span.textContent = `${todo.text} (${todo.priority})`;

            const del = document.createElement('button');
            del.textContent = '×';
            del.className = 'delete-btn';
            del.addEventListener('click', () => deleteTodo(index));

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(del);

            elements.todoList.appendChild(li);
        });

        generateSummary();
    }

    async function generateSummary() {
        if (todos.length === 0) {
            elements.aiSummary.textContent = 'Nothing to do! 🥳';
            return;
        }

        elements.aiSummary.textContent = 'Thinking of something witty... 🤔';

        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ todos })
            });

            const data = await res.json();
            elements.aiSummary.textContent = data.summary || 'Summary unavailable.';
        } catch (err) {
            console.error('AI summary failed:', err);
            const completed = todos.filter(t => t.completed).length;
            elements.aiSummary.textContent = `${completed} done, ${todos.length - completed} to go. Keep at it! 💪`;
        }
    }

    // Event Listeners
    elements.todoInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') addTodo();
    });

    loadTodos();
});
