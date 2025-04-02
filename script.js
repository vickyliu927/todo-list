// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check for localStorage support
    if (!window.localStorage) {
        console.error("localStorage is not available");
        alert("Your browser doesn't support local storage. The app may not work properly.");
    }

    // DOM Elements with error checking
    const elements = {
        todoInput: document.getElementById('todoInput'),
        addButton: document.getElementById('addButton'),
        todoList: document.getElementById('todoList'),
        prioritySelect: document.getElementById('prioritySelect'),
        dueDateInput: document.getElementById('dueDateInput'),
        tabList: document.getElementById('tabList'),
        newTabBtn: document.getElementById('newTabBtn'),
        progressFill: document.querySelector('.progress-fill'),
        progressText: document.querySelector('.progress-text'),
        highPrioritySound: document.getElementById('highPrioritySound'),
        mediumPrioritySound: document.getElementById('mediumPrioritySound'),
        lowPrioritySound: document.getElementById('lowPrioritySound'),
        aiSummary: document.getElementById('aiSummary')
    };

    // Verify all elements are found
    Object.entries(elements).forEach(([name, element]) => {
        if (!element) {
            console.error(`Missing DOM element: ${name}`);
        }
    });

    // Initialize with error handling
    try {
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
            high: elements.highPrioritySound,
            medium: elements.mediumPrioritySound,
            low: elements.lowPrioritySound
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
        elements.dueDateInput.min = new Date().toISOString().slice(0, 16);

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

        // Initialize state with error handling
        let categories = {};
        try {
            categories = JSON.parse(localStorage.getItem('categories')) || { 'General': [] };
        } catch (e) {
            console.error('Error loading categories from localStorage:', e);
            categories = { 'General': [] };
        }

        let currentCategory = localStorage.getItem('currentCategory') || 'General';

        // Save initial state
        try {
            localStorage.setItem('categories', JSON.stringify(categories));
            localStorage.setItem('currentCategory', currentCategory);
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }

        // Initialize tabs
        function initializeTabs() {
            elements.tabList.innerHTML = '';
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
            elements.tabList.appendChild(tab);
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
                elements.progressFill.style.width = '0%';
                elements.progressText.textContent = '0% Complete';
                return;
            }

            const completedCount = todos.filter(todo => todo.completed).length;
            const percentage = Math.round((completedCount / todos.length) * 100);
            
            elements.progressFill.style.width = `${percentage}%`;
            elements.progressText.textContent = `${percentage}% Complete`;
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

        // Backend URL configuration
        const BACKEND_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:8000' 
            : 'https://todo-list-backend.onrender.com';

        // Update the generateFunnySummary function to use the API
        async function generateFunnySummary() {
            try {
                const todos = categories[currentCategory];
                const response = await fetch(`${BACKEND_URL}/api/generate-summary`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        todos: todos,
                        category: currentCategory
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                elements.aiSummary.textContent = data.summary;
                elements.aiSummary.style.display = 'block';
            } catch (error) {
                console.error('Error generating summary:', error);
                // Use local fallback
                const todos = categories[currentCategory];
                const completed = todos.filter(todo => todo.completed).length;
                const total = todos.length;
                const remaining = total - completed;
                
                let template = getRandomElement(summaryTemplates);
                let motivation = '';
                
                if (total === 0) {
                    elements.aiSummary.textContent = "No tasks yet! Time to add some! 🎯";
                } else {
                    const progress = completed / total;
                    if (progress === 1) {
                        motivation = getRandomElement(motivationalSnippets.great);
                    } else if (progress >= 0.5) {
                        motivation = getRandomElement(motivationalSnippets.good);
                    } else {
                        motivation = getRandomElement(motivationalSnippets.needsWork);
                    }
                    
                    elements.aiSummary.textContent = template
                        .replace('{completed}', completed)
                        .replace('{total}', total)
                        .replace('{remaining}', remaining)
                        .replace('{motivation}', motivation)
                        .replace('{reaction}', motivation)
                        .replace('{comment}', motivation);
                }
                elements.aiSummary.style.display = 'block';
            }
        }

        // Update the renderTodos function to handle async summary
        async function renderTodos() {
            elements.todoList.innerHTML = '';
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
                elements.todoList.appendChild(li);
            });

            updateProgress();
            
            // Update summary with loading state
            elements.aiSummary.textContent = 'Thinking of something witty... 🤔';
            const summary = await generateFunnySummary();
            elements.aiSummary.textContent = summary;
        }

        // Add new todo
        function addTodo() {
            const text = elements.todoInput.value.trim();
            const priority = elements.prioritySelect.value;
            const dueDate = elements.dueDateInput.value;
            
            if (text && priority) {
                categories[currentCategory].push({
                    text,
                    completed: false,
                    priority,
                    dueDate: dueDate || null
                });
                
                elements.todoInput.value = '';
                elements.prioritySelect.value = '';
                elements.dueDateInput.value = '';
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
        elements.addButton.addEventListener('click', () => {
            try {
                addTodo();
            } catch (e) {
                console.error('Error adding todo:', e);
            }
        });
        
        elements.todoInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const text = elements.todoInput.value.trim();
                const priority = elements.prioritySelect.value;
                
                if (!priority) {
                    alert('Please select a priority level');
                    elements.prioritySelect.focus();
                    return;
                }
                
                addTodo();
            }
        });

        elements.newTabBtn.addEventListener('click', () => {
            try {
                addNewCategory();
            } catch (e) {
                console.error('Error adding category:', e);
            }
        });

        // Initialize the app
        initializeTabs();
        renderTodos();

        // Start countdown timer updates
        setInterval(updateCountdowns, 1000);
    } catch (e) {
        console.error('Error during initialization:', e);
        alert('There was an error initializing the app. Please check the console for details.');
    }
}); 