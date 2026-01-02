// API Base URL
const API_BASE = '/api/todos';

// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const clearCompletedBtn = document.getElementById('clearCompleted');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');

// Event Listeners
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});

// API Functions
async function fetchTodos() {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error('Failed to load todos');
        todos = await response.json();
        renderTodos();
    } catch (error) {
        console.error('Error fetching todos:', error);
        showError('An error occurred while loading todos');
    }
}

async function createTodo(text) {
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, completed: false })
        });
        
        if (!response.ok) throw new Error('Failed to create todo');
        const newTodo = await response.json();
        todos.push(newTodo);
        renderTodos();
        return newTodo;
    } catch (error) {
        console.error('Error creating todo:', error);
        showError('An error occurred while creating todo');
        throw error;
    }
}

async function updateTodo(id, updates) {
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });
        
        if (!response.ok) throw new Error('Failed to update todo');
        const updatedTodo = await response.json();
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos[index] = updatedTodo;
        }
        renderTodos();
        return updatedTodo;
    } catch (error) {
        console.error('Error updating todo:', error);
        showError('An error occurred while updating todo');
        throw error;
    }
}

async function deleteTodo(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete todo');
        todos = todos.filter(t => t.id !== id);
        renderTodos();
    } catch (error) {
        console.error('Error deleting todo:', error);
        showError('An error occurred while deleting todo');
    }
}

async function clearCompleted() {
    try {
        const response = await fetch(API_BASE, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to clear completed todos');
        todos = todos.filter(t => !t.completed);
        renderTodos();
    } catch (error) {
        console.error('Error clearing completed:', error);
        showError('An error occurred while clearing completed todos');
    }
}

// UI Functions
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    
    todoInput.value = '';
    createTodo(text);
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        updateTodo(id, { completed: !todo.completed });
    }
}

function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const todoItem = document.querySelector(`[data-id="${id}"]`);
    const todoText = todoItem.querySelector('.todo-text');
    const originalText = todo.text;
    
    // Create input element for editing
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.className = 'todo-text editing';
    
    // Event listeners
    const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            updateTodo(id, { text: newText });
        } else {
            todoText.textContent = originalText;
        }
        todoText.style.display = 'block';
        input.remove();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            todoText.textContent = originalText;
            todoText.style.display = 'block';
            input.remove();
        }
    });
    
    // Replace text with input
    todoText.style.display = 'none';
    todoItem.insertBefore(input, todoText);
    input.focus();
    input.select();
}

function renderTodos() {
    // Filter todos based on current filter
    let filteredTodos = todos;
    if (currentFilter === 'active') {
        filteredTodos = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    }
    
    // Clear list
    todoList.innerHTML = '';
    
    // Render todos
    if (filteredTodos.length === 0) {
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        filteredTodos.forEach(todo => {
            const li = createTodoElement(todo);
            todoList.appendChild(li);
        });
    }
    
    // Update count
    const activeCount = todos.filter(t => !t.completed).length;
    todoCount.textContent = `${activeCount} active todo${activeCount !== 1 ? 's' : ''}`;
    
    // Show/hide clear button
    const hasCompleted = todos.some(t => t.completed);
    clearCompletedBtn.style.display = hasCompleted ? 'block' : 'none';
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.setAttribute('data-id', todo.id);
    
    li.innerHTML = `
        <input 
            type="checkbox" 
            class="todo-checkbox" 
            ${todo.completed ? 'checked' : ''}
        >
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <div class="todo-actions">
            <button class="todo-btn edit-btn">Edit</button>
            <button class="todo-btn delete-btn">Delete</button>
        </div>
    `;
    
    // Event listeners
    const checkbox = li.querySelector('.todo-checkbox');
    const editBtn = li.querySelector('.edit-btn');
    const deleteBtn = li.querySelector('.delete-btn');
    
    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    editBtn.addEventListener('click', () => editTodo(todo.id));
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));
    
    return li;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Simple error display
    alert(message);
}

// Initialize
fetchTodos();

