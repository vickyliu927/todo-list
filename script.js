// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const todoInput = document.getElementById('todoInput');
    const addButton = document.getElementById('addButton');
    const todoList = document.getElementById('todoList');
    const prioritySelect = document.getElementById('prioritySelect');
    const dueDateInput = document.getElementById('dueDateInput');
    const tabList = document.getElementById('tabList');
    const newTabBtn = document.getElementById('newTabBtn');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const highPrioritySound = document.getElementById('highPrioritySound');
    const mediumPrioritySound = document.getElementById('mediumPrioritySound');
    const lowPrioritySound = document.getElementById('lowPrioritySound');
    const aiSummary = document.getElementById('aiSummary');

    // Priority order for sorting
    const priorityOrder = {
        'high': 1,
        'medium': 2,
        'low': 3
    };

    // Confetti configuration
    const confettiColors = {
        high: ['#ff4444', '#ff0000', '#ff6b6b', '#ff8c8c', '#ffa5a5', '#ffd1d1'],
        medium: ['#ff9933', '#ffa500', '#ffb366', '#ffc080', '#ffd1a3', '#ffe0c0'],
        low: ['#4CAF50', '#45a049', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9']
    };

    // Sound configuration
    const prioritySounds = {
        high: highPrioritySound,
        medium: mediumPrioritySound,
        low: lowPrioritySound
    };

    // Funny summary templates
    const summaryTemplates = [
        "Looks like we've got {completed} out of {total} tasks done. {motivation}",
        "Achievement unlocked: {completed}/{total} tasks completed! {reaction}",
        "Current progress report: {completed} down, {remaining} to go. {comment}"
    ];

    const motivationalSnippets = {
        great: [
            "You're absolutely crushing it! Want a medal? 🏅",
            "Look at you being all productive and stuff! 🌟",
            "Your todo list is disappearing faster than my patience! 👏"
        ],
        good: [
            "Not too shabby! Keep this up and you might get a virtual high five! ✋",
            "Making progress! Though my AI standards are pretty low... 😉",
            "You're doing better than expected (low expectations, but still!) 🎉"
        ],
        needsWork: [
            "Maybe try checking things off instead of just staring at them? 😅",
            "I've seen snails move faster through their todo list... but you got this! 🐌",
            "Pro tip: Tasks don't complete themselves (I wish they did!) 💫"
        ]
    };

    // Set minimum date to current date
    dueDateInput.min = new Date().toISOString().slice(0, 16);

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Calculate time remaining
    function getTimeRemaining(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        
        if (diff < 0) return 'Overdue';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return `${hours}h ${minutes}m`;
    }

    // Get countdown class based on time remaining
    function getCountdownClass(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;
        
        if (diff < 0) return 'urgent';
        if (diff < 24 * 60 * 60 * 1000) return 'warning';
        return 'normal';
    }

    // Update countdown timers
    function updateCountdowns() {
        const countdowns = document.querySelectorAll('.countdown');
        countdowns.forEach(countdown => {
            const dueDate = countdown.dataset.dueDate;
            const timeRemaining = getTimeRemaining(dueDate);
            const countdownClass = getCountdownClass(dueDate);
            
            countdown.textContent = timeRemaining;
            countdown.className = `countdown ${countdownClass}`;
        });
    }

    function celebrateCompletion(priority) {
        const colors = confettiColors[priority];
        const sound = prioritySounds[priority];
        
        // Play sound
        sound.currentTime = 0;
        sound.play().catch(error => console.log('Sound play failed:', error));
        
        // Create a more dramatic celebration
        const defaults = {
            spread: 360,
            ticks: 100,
            gravity: 0,
            decay: 0.94,
            startVelocity: 30,
            shapes: ['star', 'circle'],
            colors: colors,
            scalar: 1.2
        };

        function shoot() {
            confetti({
                ...defaults,
                particleCount: 40,
                scalar: 0.75,
                shapes: ['circle', 'star']
            });

            confetti({
                ...defaults,
                particleCount: 10,
                scalar: 0.2,
                shapes: ['circle', 'star']
            });
        }

        setTimeout(shoot, 0);
        setTimeout(shoot, 100);
        setTimeout(shoot, 200);
    }

    // State
    let categories = JSON.parse(localStorage.getItem('categories')) || {
        'General': []  // Default category
    };
    let currentCategory = localStorage.getItem('currentCategory') || 'General';

    // Initialize tabs
    function initializeTabs() {
        tabList.innerHTML = '';
        Object.keys(categories).forEach(category => {
            createTab(category);
        });
        setActiveTab(currentCategory);
    }

    // Create a new tab
    function createTab(category) {
        const tab = document.createElement('button');
        tab.className = `tab ${category === currentCategory ? 'active' : ''}`;
        
        const tabText = document.createElement('span');
        tabText.textContent = category;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            if (Object.keys(categories).length > 1) {
                deleteCategory(category);
            }
        };

        tab.appendChild(tabText);
        if (category !== 'General') {
            tab.appendChild(closeBtn);
        }
        
        tab.onclick = () => switchCategory(category);
        tabList.appendChild(tab);
    }

    // Switch category
    function switchCategory(category) {
        currentCategory = category;
        localStorage.setItem('currentCategory', category);
        setActiveTab(category);
        renderTodos();
    }

    // Set active tab
    function setActiveTab(category) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.firstChild.textContent === category);
        });
    }

    // Delete category
    function deleteCategory(category) {
        if (confirm(`Are you sure you want to delete the "${category}" category and all its todos?`)) {
            delete categories[category];
            if (currentCategory === category) {
                currentCategory = 'General';
            }
            saveCategories();
            initializeTabs();
            renderTodos();
        }
    }

    // Add new category
    function addNewCategory() {
        const category = prompt('Enter new category name:');
        if (category && category.trim() && !categories[category]) {
            categories[category] = [];
            saveCategories();
            createTab(category);
            switchCategory(category);
        }
    }

    // Save categories to localStorage
    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    // Sort todos by priority
    function sortTodosByPriority(todos) {
        return [...todos].sort((a, b) => {
            // First sort by priority
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // If priorities are equal, completed items go to the bottom
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            
            return 0;
        });
    }

    // Calculate and update progress
    function updateProgress() {
        const todos = categories[currentCategory];
        if (todos.length === 0) {
            progressFill.style.width = '0%';
            progressText.textContent = '0% Complete';
            return;
        }

        const completedCount = todos.filter(todo => todo.completed).length;
        const percentage = Math.round((completedCount / todos.length) * 100);
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% Complete`;
    }

    function getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    function toGerund(verb) {
        // Common irregular verbs
        const irregularVerbs = {
            'be': 'being',
            'have': 'having',
            'do': 'doing',
            'go': 'going',
            'come': 'coming',
            'run': 'running',
            'think': 'thinking',
            'make': 'making',
            'take': 'taking',
            'see': 'seeing',
            'get': 'getting',
            'read': 'reading',
            'write': 'writing',
            'eat': 'eating',
            'drink': 'drinking',
            'buy': 'buying',
            'pay': 'paying',
            'put': 'putting',
            'send': 'sending',
            'meet': 'meeting'
        };

        // Return irregular form if it exists
        if (irregularVerbs[verb.toLowerCase()]) {
            return irregularVerbs[verb.toLowerCase()];
        }

        // Regular verb rules
        if (verb.endsWith('e')) {
            return verb.slice(0, -1) + 'ing'; // ride -> riding
        } else if (verb.match(/[aeiou][^aeiou]$/) && !verb.endsWith('w')) {
            return verb + verb.slice(-1) + 'ing'; // run -> running
        } else {
            return verb + 'ing'; // walk -> walking
        }
    }

    function formatTaskText(text) {
        // Split the text into words
        const words = text.toLowerCase().split(' ');
        // If it's a single word, treat it as a verb
        if (words.length === 1) {
            return toGerund(words[0]);
        }
        return text.toLowerCase();
    }

    function generateFunnySummary() {
        const todos = categories[currentCategory];
        if (todos.length === 0) {
            return `Empty ${currentCategory} list. Living your best life or expert procrastinator? 🤔`;
        }

        const incompleteTasks = todos.filter(todo => !todo.completed);
        const completedTasks = todos.filter(todo => todo.completed);
        const highPriorityTasks = incompleteTasks.filter(todo => todo.priority === 'high');
        const overdueTasks = todos.filter(todo => todo.dueDate && new Date(todo.dueDate) < new Date());

        // Get the most relevant tasks to mention
        const pendingTaskTexts = incompleteTasks.map(todo => formatTaskText(todo.text)).slice(0, 2);
        
        // Generate concise summaries based on state
        if (highPriorityTasks.length > 0) {
            const highPriorityTask = formatTaskText(highPriorityTasks[0].text);
            return `${highPriorityTasks.length} urgent tasks waiting! Maybe ${highPriorityTask} should be your priority? 😅`;
        }

        if (overdueTasks.length > 0) {
            return `${overdueTasks.length} overdue tasks! Time management isn't your thing, huh? ⏰`;
        }

        if (incompleteTasks.length === 0) {
            return `All ${completedTasks.length} tasks done! Who are you and what's your secret? 🌟`;
        }

        if (completedTasks.length === 0) {
            return `${pendingTaskTexts.join(' and ')} won't do themselves! Just saying... 👀`;
        }

        return `${completedTasks.length} done, ${incompleteTasks.length} to go. Not bad, keep it up! 💪`;
    }

    // Render todos for current category
    function renderTodos() {
        todoList.innerHTML = '';
        const sortedTodos = sortTodosByPriority(categories[currentCategory]);
        
        sortedTodos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.dueDate && new Date(todo.dueDate) < new Date() ? 'overdue' : ''}`;
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => toggleTodo(index));
            
            const priorityBadge = document.createElement('span');
            priorityBadge.className = `priority-badge priority-${todo.priority}`;
            priorityBadge.textContent = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
            
            const todoText = document.createElement('span');
            todoText.className = 'todo-text';
            todoText.textContent = todo.text;
            
            // Add due date and countdown if exists
            if (todo.dueDate) {
                const dueDateSpan = document.createElement('span');
                dueDateSpan.className = 'due-date';
                dueDateSpan.textContent = `Due: ${formatDate(todo.dueDate)}`;
                
                const countdownSpan = document.createElement('span');
                countdownSpan.className = `countdown ${getCountdownClass(todo.dueDate)}`;
                countdownSpan.dataset.dueDate = todo.dueDate;
                countdownSpan.textContent = getTimeRemaining(todo.dueDate);
                
                todoText.appendChild(dueDateSpan);
                todoText.appendChild(countdownSpan);
            }
            
            // Add double-click handler for editing
            todoText.addEventListener('dblclick', () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'edit-input';
                input.value = todo.text;
                
                // Replace text with input
                todoText.replaceWith(input);
                input.focus();
                
                // Handle save on enter or blur
                function saveEdit() {
                    const newText = input.value.trim();
                    if (newText && newText !== todo.text) {
                        const originalIndex = categories[currentCategory].findIndex(t => 
                            t.text === todo.text && t.priority === todo.priority
                        );
                        categories[currentCategory][originalIndex].text = newText;
                        saveCategories();
                        renderTodos();
                    } else {
                        renderTodos();
                    }
                }
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        saveEdit();
                    } else if (e.key === 'Escape') {
                        renderTodos();
                    }
                });
                
                input.addEventListener('blur', saveEdit);
            });
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.textContent = '×';
            deleteButton.addEventListener('click', () => deleteTodo(sortedTodos.indexOf(todo)));
            
            li.appendChild(checkbox);
            li.appendChild(priorityBadge);
            li.appendChild(todoText);
            li.appendChild(deleteButton);
            todoList.appendChild(li);
        });

        updateProgress();
        aiSummary.textContent = generateFunnySummary();
    }

    // Add new todo
    function addTodo() {
        const text = todoInput.value.trim();
        const priority = prioritySelect.value;
        const dueDate = dueDateInput.value;
        
        if (text && priority) {
            categories[currentCategory].push({
                text,
                completed: false,
                priority,
                dueDate: dueDate || null
            });
            
            todoInput.value = '';
            prioritySelect.value = '';
            dueDateInput.value = '';
            saveCategories();
            renderTodos();
        }
    }

    // Toggle todo completion
    function toggleTodo(index) {
        const sortedTodos = sortTodosByPriority(categories[currentCategory]);
        const todo = sortedTodos[index];
        const originalIndex = categories[currentCategory].findIndex(t => 
            t.text === todo.text && t.priority === todo.priority
        );

        if (!todo.completed) {
            celebrateCompletion(todo.priority);
        }

        categories[currentCategory][originalIndex].completed = !categories[currentCategory][originalIndex].completed;
        saveCategories();
        renderTodos();
    }

    // Delete todo
    function deleteTodo(index) {
        const sortedTodos = sortTodosByPriority(categories[currentCategory]);
        const todo = sortedTodos[index];
        const originalIndex = categories[currentCategory].findIndex(t => 
            t.text === todo.text && t.priority === todo.priority
        );
        categories[currentCategory].splice(originalIndex, 1);
        saveCategories();
        renderTodos();
    }

    // Event Listeners
    addButton.addEventListener('click', addTodo);
    
    todoInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const text = todoInput.value.trim();
            const priority = prioritySelect.value;
            
            if (!priority) {
                alert('Please select a priority level');
                prioritySelect.focus();
                return;
            }
            
            addTodo();
        }
    });

    newTabBtn.addEventListener('click', addNewCategory);

    // Initialize the app
    initializeTabs();
    renderTodos();

    // Start countdown timer updates
    setInterval(updateCountdowns, 60000); // Update every minute
}); 