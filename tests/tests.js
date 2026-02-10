/**
 * Todo PWA - Unit and Integration Tests
 *
 * Tests cover:
 * - Utility functions (trimTitle, generateId)
 * - Model layer (CRUD, filters, persistence, validation)
 * - Computed properties (counts, filtered lists)
 * - Edge cases (corrupt data, quota errors, boundary values)
 */

/* ==========================================================================
   Utility Tests
   ========================================================================== */

testRunner.test('trimTitle: trims whitespace from strings', () => {
  assert.equal(trimTitle('  hello  '), 'hello');
  assert.equal(trimTitle('test'), 'test');
  assert.equal(trimTitle('  '), '');
});

testRunner.test('trimTitle: returns empty string for non-string input', () => {
  assert.equal(trimTitle(null), '');
  assert.equal(trimTitle(undefined), '');
  assert.equal(trimTitle(123), '');
  assert.equal(trimTitle({}), '');
});

testRunner.test('generateId: returns a non-empty string', () => {
  const id = generateId();
  assert.ok(typeof id === 'string', 'ID should be a string');
  assert.ok(id.length > 0, 'ID should not be empty');
});

testRunner.test('generateId: returns unique IDs', () => {
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    ids.add(generateId());
  }
  assert.equal(ids.size, 100, 'All 100 IDs should be unique');
});

/* ==========================================================================
   Model: addTodo Tests
   ========================================================================== */

testRunner.test('model.addTodo: creates a todo with correct properties', () => {
  resetState();
  const result = model.addTodo('Buy groceries');
  assert.ok(result, 'Should return new state');
  assert.equal(result.todos.length, 1);
  assert.equal(result.todos[0].title, 'Buy groceries');
  assert.equal(result.todos[0].completed, false);
  assert.ok(typeof result.todos[0].id === 'string');
  assert.ok(typeof result.todos[0].createdAt === 'number');
});

testRunner.test('model.addTodo: trims whitespace from title', () => {
  resetState();
  const result = model.addTodo('  trimmed title  ');
  assert.equal(result.todos[0].title, 'trimmed title');
});

testRunner.test('model.addTodo: rejects empty title', () => {
  resetState();
  assert.notOk(model.addTodo(''), 'Empty string rejected');
  assert.notOk(model.addTodo('   '), 'Whitespace-only rejected');
  assert.equal(model.state.todos.length, 0);
});

testRunner.test('model.addTodo: rejects title over 500 characters', () => {
  resetState();
  const longTitle = 'a'.repeat(501);
  assert.notOk(model.addTodo(longTitle));
  assert.equal(model.state.todos.length, 0);
});

testRunner.test('model.addTodo: accepts title at exactly 500 characters', () => {
  resetState();
  const title = 'a'.repeat(500);
  const result = model.addTodo(title);
  assert.ok(result);
  assert.equal(result.todos[0].title.length, 500);
});

testRunner.test('model.addTodo: prepends new todo to list', () => {
  resetState();
  model.addTodo('First');
  model.addTodo('Second');
  assert.equal(model.state.todos[0].title, 'Second');
  assert.equal(model.state.todos[1].title, 'First');
});

testRunner.test('model.addTodo: persists to localStorage', () => {
  resetState();
  model.addTodo('Persistent todo');
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].title, 'Persistent todo');
});

testRunner.test('model.addTodo: rejects non-string input', () => {
  resetState();
  assert.notOk(model.addTodo(null));
  assert.notOk(model.addTodo(undefined));
  assert.notOk(model.addTodo(42));
});

/* ==========================================================================
   Model: toggleTodo Tests
   ========================================================================== */

testRunner.test('model.toggleTodo: toggles completed to true', () => {
  resetState();
  model.addTodo('Toggle me');
  const id = model.state.todos[0].id;
  const result = model.toggleTodo(id);
  assert.ok(result);
  assert.equal(result.todos[0].completed, true);
});

testRunner.test('model.toggleTodo: toggles back to false', () => {
  resetState();
  model.addTodo('Toggle twice');
  const id = model.state.todos[0].id;
  model.toggleTodo(id);
  const result = model.toggleTodo(id);
  assert.equal(result.todos[0].completed, false);
});

testRunner.test('model.toggleTodo: returns null for non-existent ID', () => {
  resetState();
  assert.notOk(model.toggleTodo('nonexistent'));
});

testRunner.test('model.toggleTodo: does not affect other todos', () => {
  resetState();
  model.addTodo('First');
  model.addTodo('Second');
  const id = model.state.todos[0].id;
  model.toggleTodo(id);
  assert.equal(model.state.todos[0].completed, true);
  assert.equal(model.state.todos[1].completed, false);
});

testRunner.test('model.toggleTodo: persists to localStorage', () => {
  resetState();
  model.addTodo('Persist toggle');
  const id = model.state.todos[0].id;
  model.toggleTodo(id);
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(stored[0].completed, true);
});

/* ==========================================================================
   Model: deleteTodo Tests
   ========================================================================== */

testRunner.test('model.deleteTodo: removes the todo', () => {
  resetState();
  model.addTodo('Delete me');
  const id = model.state.todos[0].id;
  const result = model.deleteTodo(id);
  assert.ok(result);
  assert.equal(result.todos.length, 0);
});

testRunner.test('model.deleteTodo: returns null for non-existent ID', () => {
  resetState();
  assert.notOk(model.deleteTodo('nonexistent'));
});

testRunner.test('model.deleteTodo: only removes the target todo', () => {
  resetState();
  model.addTodo('Keep');
  model.addTodo('Delete');
  const deleteId = model.state.todos[0].id; // 'Delete' is first (prepended)
  model.deleteTodo(deleteId);
  assert.equal(model.state.todos.length, 1);
  assert.equal(model.state.todos[0].title, 'Keep');
});

testRunner.test('model.deleteTodo: persists to localStorage', () => {
  resetState();
  model.addTodo('Will be deleted');
  const id = model.state.todos[0].id;
  model.deleteTodo(id);
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(stored.length, 0);
});

/* ==========================================================================
   Model: editTodo Tests
   ========================================================================== */

testRunner.test('model.editTodo: updates the title', () => {
  resetState();
  model.addTodo('Original');
  const id = model.state.todos[0].id;
  const result = model.editTodo(id, 'Updated');
  assert.ok(result);
  assert.equal(result.todos[0].title, 'Updated');
});

testRunner.test('model.editTodo: trims the new title', () => {
  resetState();
  model.addTodo('Original');
  const id = model.state.todos[0].id;
  model.editTodo(id, '  Trimmed  ');
  assert.equal(model.state.todos[0].title, 'Trimmed');
});

testRunner.test('model.editTodo: rejects empty title', () => {
  resetState();
  model.addTodo('Keep this');
  const id = model.state.todos[0].id;
  assert.notOk(model.editTodo(id, ''));
  assert.notOk(model.editTodo(id, '   '));
  assert.equal(model.state.todos[0].title, 'Keep this');
});

testRunner.test('model.editTodo: rejects title over 500 characters', () => {
  resetState();
  model.addTodo('Original');
  const id = model.state.todos[0].id;
  assert.notOk(model.editTodo(id, 'a'.repeat(501)));
  assert.equal(model.state.todos[0].title, 'Original');
});

testRunner.test('model.editTodo: returns null for non-existent ID', () => {
  resetState();
  assert.notOk(model.editTodo('nonexistent', 'New title'));
});

testRunner.test('model.editTodo: preserves other properties', () => {
  resetState();
  model.addTodo('Original');
  const id = model.state.todos[0].id;
  const createdAt = model.state.todos[0].createdAt;
  model.toggleTodo(id); // Mark completed
  model.editTodo(id, 'Updated');
  assert.equal(model.state.todos[0].id, id);
  assert.equal(model.state.todos[0].completed, true);
  assert.equal(model.state.todos[0].createdAt, createdAt);
});

testRunner.test('model.editTodo: persists to localStorage', () => {
  resetState();
  model.addTodo('Original');
  const id = model.state.todos[0].id;
  model.editTodo(id, 'Persisted edit');
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(stored[0].title, 'Persisted edit');
});

/* ==========================================================================
   Model: setFilter Tests
   ========================================================================== */

testRunner.test('model.setFilter: sets valid filter values', () => {
  resetState();
  model.setFilter('active');
  assert.equal(model.state.currentFilter, 'active');
  model.setFilter('completed');
  assert.equal(model.state.currentFilter, 'completed');
  model.setFilter('all');
  assert.equal(model.state.currentFilter, 'all');
});

testRunner.test('model.setFilter: rejects invalid filter values', () => {
  resetState();
  assert.notOk(model.setFilter('invalid'));
  assert.notOk(model.setFilter(''));
  assert.notOk(model.setFilter(null));
  assert.equal(model.state.currentFilter, 'all');
});

testRunner.test('model.setFilter: persists to localStorage', () => {
  resetState();
  model.setFilter('active');
  assert.equal(localStorage.getItem(FILTER_KEY), 'active');
});

/* ==========================================================================
   Model: clearCompleted Tests
   ========================================================================== */

testRunner.test('model.clearCompleted: removes all completed todos', () => {
  resetState();
  model.addTodo('Active');
  model.addTodo('Completed');
  model.toggleTodo(model.state.todos[0].id); // Mark 'Completed' as done
  model.clearCompleted();
  assert.equal(model.state.todos.length, 1);
  assert.equal(model.state.todos[0].title, 'Active');
});

testRunner.test('model.clearCompleted: keeps all active todos', () => {
  resetState();
  model.addTodo('One');
  model.addTodo('Two');
  model.clearCompleted();
  assert.equal(model.state.todos.length, 2);
});

testRunner.test('model.clearCompleted: works with empty list', () => {
  resetState();
  const result = model.clearCompleted();
  assert.ok(result);
  assert.equal(result.todos.length, 0);
});

testRunner.test('model.clearCompleted: persists to localStorage', () => {
  resetState();
  model.addTodo('Done');
  model.toggleTodo(model.state.todos[0].id);
  model.clearCompleted();
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  assert.equal(stored.length, 0);
});

/* ==========================================================================
   Model: Computed Properties Tests
   ========================================================================== */

testRunner.test('model.getActiveCount: returns count of incomplete todos', () => {
  resetState();
  model.addTodo('Active 1');
  model.addTodo('Active 2');
  model.addTodo('Completed');
  model.toggleTodo(model.state.todos[0].id);
  assert.equal(model.getActiveCount(), 2);
});

testRunner.test('model.getActiveCount: returns 0 for empty list', () => {
  resetState();
  assert.equal(model.getActiveCount(), 0);
});

testRunner.test('model.getCompletedCount: returns count of completed todos', () => {
  resetState();
  model.addTodo('Active');
  model.addTodo('Completed');
  model.toggleTodo(model.state.todos[0].id);
  assert.equal(model.getCompletedCount(), 1);
});

testRunner.test('model.getFilteredTodos: returns all todos with "all" filter', () => {
  resetState();
  model.addTodo('One');
  model.addTodo('Two');
  model.toggleTodo(model.state.todos[0].id);
  model.setFilter('all');
  assert.equal(model.getFilteredTodos().length, 2);
});

testRunner.test('model.getFilteredTodos: returns only active with "active" filter', () => {
  resetState();
  model.addTodo('Active');
  model.addTodo('Completed');
  model.toggleTodo(model.state.todos[0].id);
  model.setFilter('active');
  const filtered = model.getFilteredTodos();
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].completed, false);
});

testRunner.test('model.getFilteredTodos: returns only completed with "completed" filter', () => {
  resetState();
  model.addTodo('Active');
  model.addTodo('Completed');
  model.toggleTodo(model.state.todos[0].id);
  model.setFilter('completed');
  const filtered = model.getFilteredTodos();
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].completed, true);
});

/* ==========================================================================
   Model: Persistence / Load Tests
   ========================================================================== */

testRunner.test('model.load: restores todos from localStorage', () => {
  resetState();
  model.addTodo('Saved');
  const savedId = model.state.todos[0].id;

  // Simulate page reload
  model.state = { todos: [], currentFilter: 'all' };
  model.load();

  assert.equal(model.state.todos.length, 1);
  assert.equal(model.state.todos[0].title, 'Saved');
  assert.equal(model.state.todos[0].id, savedId);
});

testRunner.test('model.load: restores filter from localStorage', () => {
  resetState();
  model.setFilter('completed');

  model.state = { todos: [], currentFilter: 'all' };
  model.load();

  assert.equal(model.state.currentFilter, 'completed');
});

testRunner.test('model.load: handles missing localStorage gracefully', () => {
  resetState();
  model.load();
  assert.equal(model.state.todos.length, 0);
  assert.equal(model.state.currentFilter, 'all');
});

testRunner.test('model.load: handles corrupt JSON gracefully', () => {
  localStorage.setItem(STORAGE_KEY, 'not valid json{{{');
  model.state = { todos: [], currentFilter: 'all' };
  model.load();
  assert.equal(model.state.todos.length, 0);
  assert.equal(model.state.currentFilter, 'all');
});

testRunner.test('model.load: filters out invalid todo objects', () => {
  const data = [
    { id: 'valid', title: 'Good', completed: false, createdAt: 1000 },
    { id: 123, title: 'Bad id' },       // id not string
    { id: 'ok', title: null },           // title not string
    null,                                // null entry
    { title: 'No id' }                   // missing id
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  model.state = { todos: [], currentFilter: 'all' };
  model.load();
  assert.equal(model.state.todos.length, 1);
  assert.equal(model.state.todos[0].id, 'valid');
});

testRunner.test('model.load: sorts todos by createdAt descending', () => {
  const data = [
    { id: 'a', title: 'Old', completed: false, createdAt: 1000 },
    { id: 'b', title: 'New', completed: false, createdAt: 2000 },
    { id: 'c', title: 'Mid', completed: false, createdAt: 1500 }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  model.state = { todos: [], currentFilter: 'all' };
  model.load();
  assert.equal(model.state.todos[0].title, 'New');
  assert.equal(model.state.todos[1].title, 'Mid');
  assert.equal(model.state.todos[2].title, 'Old');
});

testRunner.test('model.load: ignores invalid filter values', () => {
  localStorage.setItem(FILTER_KEY, 'bogus');
  model.state = { todos: [], currentFilter: 'all' };
  model.load();
  assert.equal(model.state.currentFilter, 'all');
});

/* ==========================================================================
   Model: Immutability Tests
   ========================================================================== */

testRunner.test('model.addTodo: creates new todos array (immutable)', () => {
  resetState();
  const before = model.state.todos;
  model.addTodo('New');
  assert.ok(model.state.todos !== before, 'Should be a new array reference');
});

testRunner.test('model.toggleTodo: creates new todos array (immutable)', () => {
  resetState();
  model.addTodo('Toggle');
  const before = model.state.todos;
  model.toggleTodo(model.state.todos[0].id);
  assert.ok(model.state.todos !== before, 'Should be a new array reference');
});

testRunner.test('model.deleteTodo: creates new todos array (immutable)', () => {
  resetState();
  model.addTodo('Delete');
  const before = model.state.todos;
  model.deleteTodo(model.state.todos[0].id);
  assert.ok(model.state.todos !== before, 'Should be a new array reference');
});

testRunner.test('model.editTodo: creates new todo object (immutable)', () => {
  resetState();
  model.addTodo('Original');
  const beforeTodo = model.state.todos[0];
  model.editTodo(beforeTodo.id, 'Updated');
  assert.ok(model.state.todos[0] !== beforeTodo, 'Should be a new object reference');
});

/* ==========================================================================
   Integration: SAM Data Flow Tests
   ========================================================================== */

testRunner.test('SAM flow: addTodo triggers renderState and updates DOM', () => {
  resetState();
  renderState();
  actions.addTodo('Integration test');
  const items = document.querySelectorAll('#todo-list .todo-item');
  assert.equal(items.length, 1);
  assert.equal(items[0].querySelector('.todo-title').textContent, 'Integration test');
});

testRunner.test('SAM flow: toggleTodo updates DOM checkbox and class', () => {
  resetState();
  actions.addTodo('Toggle integration');
  const id = model.state.todos[0].id;
  actions.toggleTodo(id);
  const item = document.querySelector('#todo-list .todo-item');
  assert.ok(item.classList.contains('completed'));
  assert.equal(item.querySelector('.todo-checkbox').checked, true);
});

testRunner.test('SAM flow: deleteTodo removes from DOM', () => {
  resetState();
  actions.addTodo('Delete me');
  const id = model.state.todos[0].id;
  actions.deleteTodo(id);
  assert.equal(document.querySelectorAll('#todo-list .todo-item').length, 0);
});

testRunner.test('SAM flow: active count updates in DOM', () => {
  resetState();
  actions.addTodo('One');
  actions.addTodo('Two');
  assert.equal(document.getElementById('active-count').textContent, '2 items left');
  actions.toggleTodo(model.state.todos[0].id);
  assert.equal(document.getElementById('active-count').textContent, '1 item left');
});

testRunner.test('SAM flow: filter changes what is displayed', () => {
  resetState();
  actions.addTodo('Active todo');
  actions.addTodo('Completed todo');
  actions.toggleTodo(model.state.todos[0].id); // Complete the first
  actions.setFilter('active');
  assert.equal(document.querySelectorAll('#todo-list .todo-item').length, 1);
  actions.setFilter('completed');
  assert.equal(document.querySelectorAll('#todo-list .todo-item').length, 1);
  actions.setFilter('all');
  assert.equal(document.querySelectorAll('#todo-list .todo-item').length, 2);
});

testRunner.test('SAM flow: clearCompleted removes completed from DOM', () => {
  resetState();
  actions.addTodo('Keep');
  actions.addTodo('Remove');
  actions.toggleTodo(model.state.todos[0].id);
  actions.clearCompleted();
  const items = document.querySelectorAll('#todo-list .todo-item');
  assert.equal(items.length, 1);
  assert.equal(items[0].querySelector('.todo-title').textContent, 'Keep');
});

testRunner.test('SAM flow: empty state shows when no todos', () => {
  resetState();
  renderState();
  assert.equal(document.getElementById('empty-state').hidden, false);
  assert.equal(document.getElementById('empty-state').textContent, 'No todos yet. Add one above!');
});

testRunner.test('SAM flow: empty state hides when todos exist', () => {
  resetState();
  actions.addTodo('Not empty');
  assert.equal(document.getElementById('empty-state').hidden, true);
});

testRunner.test('SAM flow: footer hidden when no todos, visible otherwise', () => {
  resetState();
  renderState();
  assert.equal(document.getElementById('footer').hidden, true);
  actions.addTodo('Show footer');
  assert.equal(document.getElementById('footer').hidden, false);
});

testRunner.test('SAM flow: clear completed button visibility', () => {
  resetState();
  actions.addTodo('Active');
  assert.equal(document.getElementById('clear-completed').hidden, true);
  actions.toggleTodo(model.state.todos[0].id);
  assert.equal(document.getElementById('clear-completed').hidden, false);
});

testRunner.test('SAM flow: singular count text "1 item left"', () => {
  resetState();
  actions.addTodo('Only one');
  assert.equal(document.getElementById('active-count').textContent, '1 item left');
});

testRunner.test('SAM flow: plural count text "0 items left"', () => {
  resetState();
  renderState();
  assert.equal(document.getElementById('active-count').textContent, '0 items left');
});
