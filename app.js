/**
 * Todo PWA - SAM Architecture Implementation
 *
 * Architecture: State-Action-Model (SAM)
 * - Model: Holds authoritative state, enforces business rules, persists to Local Storage
 * - Actions: Pure functions that propose state changes
 * - State: Renders current model state to DOM
 *
 * Data flow: User Interaction → Action → Model → State → DOM
 */

/* ==========================================================================
   Section 1: Constants and Utilities
   ========================================================================== */

/** @type {string} Local Storage key for todos */
const STORAGE_KEY = 'todos';

/** @type {string} Local Storage key for filter preference */
const FILTER_KEY = 'currentFilter';

/**
 * Generates a unique ID using crypto.randomUUID.
 * @returns {string} Unique identifier
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Trims and normalizes a todo title.
 * @param {string} title - Raw input title
 * @returns {string} Trimmed title
 */
function trimTitle(title) {
  return typeof title === 'string' ? title.trim() : '';
}

/* ==========================================================================
   Section 2: Model
   ========================================================================== */

/**
 * Model layer - holds authoritative state and enforces business rules.
 * Responsible for Local Storage persistence.
 */
const model = {
  /** @type {{ todos: Array<Object>, currentFilter: string }} */
  state: {
    todos: [],
    currentFilter: 'all'
  },

  /**
   * Loads state from Local Storage. Falls back to defaults on missing/corrupt data.
   */
  load() {
    try {
      const todosJson = localStorage.getItem(STORAGE_KEY);
      const filter = localStorage.getItem(FILTER_KEY);

      if (todosJson) {
        const parsed = JSON.parse(todosJson);
        if (Array.isArray(parsed)) {
          this.state.todos = parsed
            .filter(
              (t) => t && typeof t.id === 'string' && typeof t.title === 'string'
            )
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        }
      }

      if (filter && ['all', 'active', 'completed'].includes(filter)) {
        this.state.currentFilter = filter;
      }
    } catch (e) {
      // Corrupted data — start fresh
      this.state.todos = [];
      this.state.currentFilter = 'all';
    }
  },

  /**
   * Persists state to Local Storage (optimistic write).
   * @param {{ todos: Array<Object>, currentFilter: string }} newState
   */
  save(newState) {
    this.state = newState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState.todos));
      localStorage.setItem(FILTER_KEY, newState.currentFilter);
    } catch (e) {
      // Storage full or unavailable — state still updated in memory
    }
  },

  /**
   * Adds a new todo. Rejects empty titles.
   * @param {string} title - Todo title text
   * @returns {Object|null} New state or null if invalid
   */
  addTodo(title) {
    const trimmed = trimTitle(title);
    if (!trimmed || trimmed.length > 500) return null;

    const todo = {
      id: generateId(),
      title: trimmed,
      completed: false,
      createdAt: Date.now()
    };

    const newState = {
      ...this.state,
      todos: [todo, ...this.state.todos]
    };
    this.save(newState);
    return newState;
  },

  /**
   * Toggles the completion status of a todo.
   * @param {string} id - Todo ID
   * @returns {Object|null} New state or null if not found
   */
  toggleTodo(id) {
    const index = this.state.todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const newTodos = this.state.todos.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );

    const newState = { ...this.state, todos: newTodos };
    this.save(newState);
    return newState;
  },

  /**
   * Deletes a todo by ID.
   * @param {string} id - Todo ID
   * @returns {Object|null} New state or null if not found
   */
  deleteTodo(id) {
    const index = this.state.todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const newTodos = this.state.todos.filter((t) => t.id !== id);
    const newState = { ...this.state, todos: newTodos };
    this.save(newState);
    return newState;
  },

  /**
   * Edits a todo's title. Rejects empty titles.
   * @param {string} id - Todo ID
   * @param {string} newTitle - New title text
   * @returns {Object|null} New state or null if invalid
   */
  editTodo(id, newTitle) {
    const trimmed = trimTitle(newTitle);
    if (!trimmed || trimmed.length > 500) return null;

    const index = this.state.todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const newTodos = this.state.todos.map((t) =>
      t.id === id ? { ...t, title: trimmed } : t
    );

    const newState = { ...this.state, todos: newTodos };
    this.save(newState);
    return newState;
  },

  /**
   * Changes the active filter.
   * @param {string} filterType - 'all' | 'active' | 'completed'
   * @returns {Object|null} New state or null if invalid
   */
  setFilter(filterType) {
    if (!['all', 'active', 'completed'].includes(filterType)) return null;

    const newState = { ...this.state, currentFilter: filterType };
    this.save(newState);
    return newState;
  },

  /**
   * Removes all completed todos.
   * @returns {Object} New state
   */
  clearCompleted() {
    const newTodos = this.state.todos.filter((t) => !t.completed);
    const newState = { ...this.state, todos: newTodos };
    this.save(newState);
    return newState;
  },

  /**
   * Gets the count of active (incomplete) todos.
   * @returns {number}
   */
  getActiveCount() {
    return this.state.todos.filter((t) => !t.completed).length;
  },

  /**
   * Gets the count of completed todos.
   * @returns {number}
   */
  getCompletedCount() {
    return this.state.todos.filter((t) => t.completed).length;
  },

  /**
   * Gets todos filtered by the current filter setting.
   * @returns {Array<Object>}
   */
  getFilteredTodos() {
    const { todos, currentFilter } = this.state;
    switch (currentFilter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }
};

/* ==========================================================================
   Section 3: Actions (Pure Functions)
   ========================================================================== */

/**
 * Actions layer - interprets user interactions and delegates to model.
 * Each action calls the model, which validates and persists, then triggers render.
 */
const actions = {
  /**
   * Proposes adding a new todo.
   * @param {string} title - User input title
   * @returns {boolean} Whether the todo was successfully added
   */
  addTodo(title) {
    const newState = model.addTodo(title);
    if (newState) {
      renderState();
      return true;
    }
    return false;
  },

  /**
   * Proposes toggling a todo's completion.
   * @param {string} id - Todo ID
   */
  toggleTodo(id) {
    const newState = model.toggleTodo(id);
    if (newState) renderState();
  },

  /**
   * Proposes deleting a todo.
   * @param {string} id - Todo ID
   */
  deleteTodo(id) {
    const newState = model.deleteTodo(id);
    if (newState) renderState();
  },

  /**
   * Proposes editing a todo's title.
   * @param {string} id - Todo ID
   * @param {string} newTitle - New title text
   */
  editTodo(id, newTitle) {
    const newState = model.editTodo(id, newTitle);
    if (newState) renderState();
  },

  /**
   * Proposes changing the filter.
   * @param {string} filterType - 'all' | 'active' | 'completed'
   */
  setFilter(filterType) {
    const newState = model.setFilter(filterType);
    if (newState) renderState();
  },

  /**
   * Proposes clearing all completed todos.
   */
  clearCompleted() {
    model.clearCompleted();
    renderState();
  }
};

/* ==========================================================================
   Section 4: State Representation (Rendering)
   ========================================================================== */

/** @type {HTMLInputElement} */
let todoInput;
/** @type {HTMLUListElement} */
let todoListEl;
/** @type {HTMLElement} */
let emptyStateEl;
/** @type {HTMLElement} */
let footerEl;
/** @type {HTMLElement} */
let activeCountEl;
/** @type {HTMLButtonElement} */
let clearCompletedBtn;

/**
 * Caches DOM element references. Called once during initialization.
 */
function cacheDomElements() {
  todoInput = document.getElementById('todo-input');
  todoListEl = document.getElementById('todo-list');
  emptyStateEl = document.getElementById('empty-state');
  footerEl = document.getElementById('footer');
  activeCountEl = document.getElementById('active-count');
  clearCompletedBtn = document.getElementById('clear-completed');
}

/**
 * Captures the focus context within the todo list before a re-render.
 * @returns {{ todoId: string, selector: string }|null} Focus context or null
 */
function captureFocusContext() {
  const active = document.activeElement;
  if (!active || !todoListEl.contains(active)) return null;

  const li = active.closest('.todo-item');
  if (!li) return null;

  const todoId = li.dataset.id;
  if (active.classList.contains('todo-checkbox')) {
    return { todoId, selector: '.todo-checkbox' };
  }
  if (active.classList.contains('todo-title')) {
    return { todoId, selector: '.todo-title' };
  }
  if (active.classList.contains('todo-delete')) {
    return { todoId, selector: '.todo-delete' };
  }
  return { todoId, selector: null };
}

/**
 * Restores focus to the equivalent element after a re-render.
 * @param {{ todoId: string, selector: string }|null} context - Captured focus context
 */
function restoreFocusContext(context) {
  if (!context) return;

  const li = todoListEl.querySelector('[data-id="' + CSS.escape(context.todoId) + '"]');
  if (li && context.selector) {
    const target = li.querySelector(context.selector);
    if (target) target.focus();
  }
}

/**
 * Renders the full application state to the DOM.
 * Computes derived data and updates all UI sections.
 */
function renderState() {
  const focusContext = captureFocusContext();

  const filteredTodos = model.getFilteredTodos();
  const activeCount = model.getActiveCount();
  const completedCount = model.getCompletedCount();
  const totalCount = model.state.todos.length;

  renderTodoList(filteredTodos);
  renderFilterButtons(model.state.currentFilter);
  renderActiveCount(activeCount);
  renderClearCompletedButton(completedCount);
  renderEmptyState(filteredTodos.length, totalCount);
  renderFooter(totalCount);

  restoreFocusContext(focusContext);
}

/**
 * Renders the todo list items.
 * @param {Array<Object>} todos - Filtered todos to display
 */
function renderTodoList(todos) {
  todoListEl.innerHTML = '';

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', 'Toggle ' + todo.title);

    const title = document.createElement('span');
    title.className = 'todo-title';
    title.textContent = todo.title;
    title.tabIndex = 0;
    title.setAttribute('role', 'button');
    title.setAttribute('aria-label', 'Edit ' + todo.title);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'todo-delete';
    deleteBtn.textContent = '\u2715';
    deleteBtn.setAttribute('aria-label', 'Delete ' + todo.title);

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(deleteBtn);
    todoListEl.appendChild(li);
  });
}

/**
 * Updates filter button active states.
 * @param {string} currentFilter - Active filter name
 */
function renderFilterButtons(currentFilter) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    const isActive = btn.dataset.filter === currentFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive.toString());
  });
}

/**
 * Renders the active todo count.
 * @param {number} count - Number of active todos
 */
function renderActiveCount(count) {
  activeCountEl.textContent = count === 1 ? '1 item left' : count + ' items left';
}

/**
 * Shows or hides the "Clear Completed" button.
 * @param {number} completedCount - Number of completed todos
 */
function renderClearCompletedButton(completedCount) {
  clearCompletedBtn.hidden = completedCount === 0;
}

/**
 * Shows or hides the empty state message.
 * @param {number} filteredCount - Number of todos in current filter view
 * @param {number} totalCount - Total number of todos
 */
function renderEmptyState(filteredCount, totalCount) {
  if (totalCount === 0) {
    emptyStateEl.textContent = 'No todos yet. Add one above!';
    emptyStateEl.hidden = false;
  } else if (filteredCount === 0) {
    emptyStateEl.textContent = 'No ' + model.state.currentFilter + ' todos.';
    emptyStateEl.hidden = false;
  } else {
    emptyStateEl.hidden = true;
  }
}

/**
 * Shows or hides the footer based on todo count.
 * @param {number} totalCount - Total number of todos
 */
function renderFooter(totalCount) {
  footerEl.hidden = totalCount === 0;
}

/* ==========================================================================
   Section 5: Event Listeners and Initialization
   ========================================================================== */

/**
 * Enters edit mode for a todo item.
 * @param {HTMLElement} li - The todo list item element
 * @param {string} todoId - Todo ID
 * @param {string} currentTitle - Current title text
 */
function enterEditMode(li, todoId, currentTitle) {
  if (li.classList.contains('editing')) return;

  li.classList.add('editing');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'todo-edit-input';
  input.value = currentTitle;
  input.maxLength = 500;
  input.setAttribute('aria-label', 'Edit todo');

  li.appendChild(input);
  input.focus();
  input.select();

  /**
   * Saves the edit and exits edit mode.
   * Shows validation feedback if the input is empty.
   */
  function saveEdit() {
    const newTitle = trimTitle(input.value);
    if (!newTitle) {
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    if (newTitle !== currentTitle) {
      actions.editTodo(todoId, newTitle);
    } else {
      exitEditMode();
    }
  }

  /**
   * Cancels the edit and reverts to the original title.
   */
  function exitEditMode() {
    li.classList.remove('editing');
    if (input.parentNode) {
      input.remove();
    }
  }

  input.addEventListener('input', () => {
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      exitEditMode();
    }
  });

  input.addEventListener('blur', () => {
    // Small delay to allow keydown to fire first
    setTimeout(() => {
      if (li.classList.contains('editing')) {
        saveEdit();
      }
    }, 0);
  });
}

/**
 * Attaches all event listeners to the DOM.
 */
function attachEventListeners() {
  const form = document.getElementById('todo-form');

  // Add todo via form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = todoInput.value;
    const success = actions.addTodo(title);
    if (success) {
      todoInput.value = '';
      todoInput.classList.remove('invalid');
      todoInput.removeAttribute('aria-invalid');
    } else {
      todoInput.classList.add('invalid');
      todoInput.setAttribute('aria-invalid', 'true');
      todoInput.focus();
    }
  });

  // Clear validation state when user starts typing
  todoInput.addEventListener('input', () => {
    todoInput.classList.remove('invalid');
    todoInput.removeAttribute('aria-invalid');
  });

  // Todo list interactions (event delegation)
  todoListEl.addEventListener('click', (e) => {
    const li = e.target.closest('.todo-item');
    if (!li) return;
    const todoId = li.dataset.id;

    // Toggle completion
    if (e.target.classList.contains('todo-checkbox')) {
      actions.toggleTodo(todoId);
      return;
    }

    // Delete todo
    if (e.target.classList.contains('todo-delete')) {
      actions.deleteTodo(todoId);
      return;
    }
  });

  // Double-click to edit
  todoListEl.addEventListener('dblclick', (e) => {
    const titleEl = e.target.closest('.todo-title');
    if (!titleEl) return;

    const li = titleEl.closest('.todo-item');
    if (!li) return;

    const todoId = li.dataset.id;
    enterEditMode(li, todoId, titleEl.textContent);
  });

  // Keyboard: Enter on todo title enters edit mode
  todoListEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('todo-title')) {
      e.preventDefault();
      const li = e.target.closest('.todo-item');
      if (!li) return;
      const todoId = li.dataset.id;
      enterEditMode(li, todoId, e.target.textContent);
    }
  });

  // Filter buttons
  document.querySelector('.filter-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    actions.setFilter(btn.dataset.filter);
  });

  // Clear completed
  clearCompletedBtn.addEventListener('click', () => {
    actions.clearCompleted();
  });
}

/**
 * Registers the service worker for offline support.
 * Detects updates and prompts the user to reload.
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./service-worker.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateNotification(newWorker);
        }
      });
    });
  }).catch(() => {
    // Registration failed (e.g., no HTTPS, unsupported context) — app works without SW
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

/**
 * Shows an update notification bar prompting the user to reload.
 * @param {ServiceWorker} newWorker - The waiting service worker
 */
function showUpdateNotification(newWorker) {
  const banner = document.createElement('div');
  banner.className = 'update-banner';
  banner.setAttribute('role', 'alert');

  const message = document.createElement('span');
  message.textContent = 'A new version is available.';

  const updateBtn = document.createElement('button');
  updateBtn.className = 'update-btn';
  updateBtn.type = 'button';
  updateBtn.textContent = 'Update';
  updateBtn.addEventListener('click', () => {
    newWorker.postMessage('skipWaiting');
  });

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'dismiss-btn';
  dismissBtn.type = 'button';
  dismissBtn.setAttribute('aria-label', 'Dismiss');
  dismissBtn.textContent = '\u2715';
  dismissBtn.addEventListener('click', () => {
    banner.remove();
  });

  banner.appendChild(message);
  banner.appendChild(updateBtn);
  banner.appendChild(dismissBtn);
  document.body.prepend(banner);
}

/**
 * Initializes the application.
 * Loads state from Local Storage, renders the UI, and attaches events.
 */
function init() {
  cacheDomElements();
  model.load();
  renderState();
  attachEventListeners();
  todoInput.focus();
  registerServiceWorker();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
