# Todo PWA - Functional Specification and Design

## 1. Overview

Todo PWA is a single-page Progressive Web Application for managing a todo list. Built with vanilla JavaScript, HTML, and CSS, it provides a responsive, offline-first experience using the SAM (State-Action-Model) architectural pattern for state management. All data persists locally via browser Local Storage, enabling seamless offline functionality and the ability to install the app on mobile devices.

**Key Characteristics:**
- Zero external dependencies (vanilla stack)
- Offline-capable with service worker
- Installable on mobile devices
- Fully accessible with semantic HTML and ARIA labels
- Local-first data persistence

---

## 2. Functional Requirements (User Stories)

### User Story 1: Add a New Todo
**Title:** Create a new todo item
**Description:** As a user, I want to add a new todo item to my list so that I can track tasks I need to complete.
**Acceptance Criteria:**
- An input field accepts text for a new todo
- A submit button (or Enter key) creates the todo
- Empty submissions are rejected (validation)
- Input field clears after successful submission
- New todo appears in the list immediately
- Todo is assigned a unique ID and created timestamp

### User Story 2: Display Todo List
**Title:** View all todo items
**Description:** As a user, I want to see all my todos displayed in a list so that I can review what needs to be done.
**Acceptance Criteria:**
- Todos are displayed in reverse chronological order (newest first)
- Each todo shows its title text
- Completed todos have visual distinction (strikethrough, muted color)
- List updates immediately when todos are added, deleted, or modified
- Empty state message displays when no todos exist

### User Story 3: Mark Todo as Complete
**Title:** Toggle todo completion status
**Description:** As a user, I want to mark a todo as complete so that I can track my progress.
**Acceptance Criteria:**
- Clicking a todo checkbox toggles completion state
- Keyboard shortcut (Space key on focused todo) also toggles state
- Completed todos are visually distinct (strikethrough text, grayed out)
- State persists in Local Storage immediately
- Completed status affects filter counts

### User Story 4: Delete a Todo
**Title:** Remove a todo from the list
**Description:** As a user, I want to delete a todo so that I can remove tasks that are no longer relevant.
**Acceptance Criteria:**
- A delete button (trash icon) appears on hover or focus
- Clicking delete removes the todo from the list
- Deleted todos are removed from Local Storage
- No confirmation dialog required for single deletes
- List updates immediately

### User Story 5: Edit Todo Title
**Title:** Modify a todo's text inline
**Description:** As a user, I want to edit a todo's text so that I can correct or update task descriptions.
**Acceptance Criteria:**
- Double-clicking a todo title enters edit mode
- Text becomes editable in an input field
- Pressing Enter saves changes
- Pressing Escape cancels editing (reverts text)
- Changes persist in Local Storage
- Empty edits are rejected
- Edit mode has visual indicator (border, background)

### User Story 6: Filter Todos
**Title:** View todos by completion status
**Description:** As a user, I want to filter todos so that I can focus on specific task states.
**Acceptance Criteria:**
- Three filter options: All, Active (incomplete), Completed
- Filters are buttons or tabs in the UI
- Current filter is visually highlighted
- List updates immediately when filter changes
- Filter selection persists across page reloads (stored in Local Storage)
- Active filter affects the display but doesn't delete todos

### User Story 7: Display Active Count
**Title:** Show remaining active todos
**Description:** As a user, I want to see how many active todos I have so that I know how much work remains.
**Acceptance Criteria:**
- A counter displays the number of incomplete todos
- Counter updates in real-time when todos are added, deleted, or toggled
- Displays singular "1 item left" or plural "N items left"
- Counter is prominently placed in the footer
- Correctly reflects the count regardless of current filter

### User Story 8: Clear Completed Todos
**Title:** Bulk delete all completed todos
**Description:** As a user, I want to clear all completed todos at once so that I can declutter my list.
**Acceptance Criteria:**
- A "Clear Completed" button appears in the footer
- Button is only visible when completed todos exist
- Clicking removes all completed todos from the list
- Changes persist in Local Storage
- List updates immediately
- No confirmation required

### User Story 9: Data Persistence
**Title:** Save todos across page reloads
**Description:** As a user, I want my todos to be saved so that I don't lose data when I refresh the page.
**Acceptance Criteria:**
- All todos persist in Local Storage
- Filter preference persists across reloads
- Data is updated in Local Storage on every change (optimistic write)
- Page reload displays the exact state from before reload
- No backend server is required

---

## 3. Data Model

### Local Storage Schema

**Key:** `todos`
**Type:** JSON array string
**Structure:**
```json
[
  {
    "id": "unique-identifier-uuid-or-timestamp",
    "title": "Buy groceries",
    "completed": false,
    "createdAt": 1707000000000
  },
  {
    "id": "another-unique-id",
    "title": "Complete project",
    "completed": true,
    "createdAt": 1706999000000
  }
]
```

**Key:** `currentFilter`
**Type:** String
**Values:** `"all"` | `"active"` | `"completed"`
**Default:** `"all"`

### Todo Object Structure

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | String | Unique identifier | Generated on creation (timestamp + counter or UUID) |
| `title` | String | Todo text description | 1-500 characters, required, trimmed |
| `completed` | Boolean | Completion status | Default: `false` |
| `createdAt` | Number | Creation timestamp | Unix milliseconds, set on creation |

### Business Rules

- Todos are immutable by reference; state changes create new arrays
- IDs must be globally unique within the local storage
- Titles must be non-empty strings (after trimming whitespace)
- Completed status is binary (true/false)
- Creation timestamp is set once and never modified

---

## 4. SAM Architecture (State-Action-Model)

### Architecture Overview

The SAM pattern separates concerns into three layers:

1. **Model:** Holds state, enforces business rules
2. **Actions:** Pure functions that propose state changes
3. **State (Representation):** Renders current model state to DOM

The flow: User → Action → Model → State → DOM

### Model Layer

**Responsibility:** Maintain authoritative todo list state and enforce business rules.

**State Object Structure:**
```javascript
{
  todos: [],           // Array of todo objects
  currentFilter: 'all' // 'all' | 'active' | 'completed'
}
```

**Model Responsibilities:**
- Load state from Local Storage on initialization
- Accept action proposals and validate changes
- Reject invalid state changes (empty titles, duplicate IDs, etc.)
- Persist state to Local Storage after changes
- Provide computed properties (activeCount, filteredTodos, etc.)

**Model Methods:**
- `init()`: Load state from Local Storage or initialize empty
- `addTodo(title)`: Create and add new todo, return updated state
- `toggleTodo(id)`: Toggle completion status, return updated state
- `deleteTodo(id)`: Remove todo by ID, return updated state
- `editTodo(id, newTitle)`: Update todo title, return updated state
- `setFilter(filterType)`: Change current filter, return updated state
- `clearCompleted()`: Remove all completed todos, return updated state
- `save(state)`: Persist state to Local Storage
- `load()`: Retrieve state from Local Storage

### Actions Layer

**Responsibility:** Pure functions that interpret user interactions and propose state changes.

**Design Principles:**
- Actions are pure functions (no side effects)
- Each action receives current state and user input
- Each action returns a proposed new state or null if invalid
- Actions validate input and enforce business rules

**Action Functions:**
```javascript
addTodoAction(state, title)
  - Input: title (string)
  - Validation: title not empty after trim
  - Returns: new state with todo added, or null

toggleTodoAction(state, todoId)
  - Input: todoId (string)
  - Validation: todo exists
  - Returns: new state with todo toggled

deleteTodoAction(state, todoId)
  - Input: todoId (string)
  - Validation: todo exists
  - Returns: new state with todo removed

editTodoAction(state, todoId, newTitle)
  - Input: todoId, newTitle (string)
  - Validation: title not empty, todo exists
  - Returns: new state with todo title updated

setFilterAction(state, filterType)
  - Input: filterType ('all' | 'active' | 'completed')
  - Validation: valid filter type
  - Returns: new state with filter changed

clearCompletedAction(state)
  - Input: none
  - Returns: new state with completed todos removed
```

### State Representation Layer

**Responsibility:** Render current model state to the DOM.

**State Function Responsibilities:**
- Observe model state changes
- Compute UI-specific derived data (filtered lists, counts, etc.)
- Update DOM to reflect state
- Minimize re-renders (update only changed elements)

**State Function Operations:**
- Render header with app title
- Render input field and submit button
- Render filtered todo list with completion checkboxes and delete buttons
- Render filter tabs (All, Active, Completed) with current filter highlighted
- Render active todo count
- Render "Clear Completed" button (only when completed todos exist)
- Set focus after actions (new input after add, first todo after clear)

**Derived Data Computed by State:**
- `filteredTodos`: Array of todos matching current filter
- `activeCount`: Number of incomplete todos
- `completedCount`: Number of completed todos
- `hasCompleted`: Boolean indicating if any completed todos exist

### SAM Flow Diagram

```
User Interaction (click, keypress, input)
         ↓
    Action Handler
         ↓
  Action Function (validate, propose)
         ↓
    Model Accepts/Rejects
         ↓
  Model Persists to Local Storage
         ↓
  State Re-renders DOM
         ↓
    User sees changes
```

### Initialization Flow

```javascript
// 1. Model loads state from Local Storage
const initialState = model.load();

// 2. State renders initial DOM
state.render(initialState);

// 3. Event listeners attached to actions
document.addEventListener('click', (e) => {
  if (e.target.matches('.add-btn')) {
    const title = inputField.value;
    const newState = addTodoAction(currentState, title);
    if (newState) {
      model.save(newState);
      state.render(newState);
      currentState = newState;
    }
  }
});
```

---

## 5. UI Layout

### Overall Structure

```
┌─────────────────────────────────────┐
│ HEADER                              │
│ Todo PWA                            │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ INPUT SECTION                       │
│ [Input field] [Add Button]          │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ FILTER TABS                         │
│ All  Active  Completed              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ TODO LIST                           │
│ ☑ Todo 1        [Delete]            │
│ ☐ Todo 2        [Delete]            │
│ ☑ Todo 3        [Delete]            │
│ (No todos message if empty)         │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ FOOTER                              │
│ 2 items left  [Clear Completed]     │
└─────────────────────────────────────┘
```

### Header Section
- Title: "Todo PWA" or "My Tasks"
- Centered, prominent styling
- Mobile-friendly padding

### Input Section
- Text input field with placeholder "Add a new todo..."
- Submit button labeled "Add" or icon button (checkmark)
- Enter key submits the form
- Input field has focus after page load and successful submission
- Clear visual feedback on input focus

### Filter Tabs Section
- Three buttons: "All", "Active", "Completed"
- Active filter visually highlighted (underline, bold, background color)
- Buttons styled as tabs or radio buttons
- Accessible keyboard navigation between tabs

### Todo List Section
- Each todo is a list item containing:
  - Checkbox (toggle completion)
  - Todo title text (clickable to edit on double-click)
  - Delete button (trash icon, appears on hover/focus)
- Strikethrough applied to completed todos
- Muted color for completed todos (e.g., gray text)
- Empty state message: "No todos yet. Add one above!" (or similar)
- List updates based on current filter
- Smooth animations on add/delete (optional, fade/slide)

### Footer Section
- Display: "N items left" (or "1 item left" if one active)
- Active only when todos exist
- "Clear Completed" button (appears only if completed todos exist)
- Button clearly labeled
- Footer aligned to bottom on mobile

### Responsive Behavior
- Mobile-first design
- Single column layout on small screens
- Adequate padding and touch targets (44px minimum height)
- Text input and buttons sized for mobile interaction
- Horizontal centering of content on larger screens
- Max-width constraint on desktop (e.g., 600px)

---

## 6. Technical Architecture

### File Structure

```
project-root/
├── index.html          # Single HTML file, markup and structure
├── app.js              # SAM implementation (Model, Actions, State)
├── styles.css          # All styling
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support and caching
└── icons/              # App icons for PWA
    ├── icon-192.png    # 192x192 icon
    └── icon-512.png    # 512x512 icon
```

### app.js Module Structure

**Section 1: Constants and Utilities**
- `STORAGE_KEY = 'todos'`
- `FILTER_KEY = 'currentFilter'`
- `generateId()`: Create unique todo ID (timestamp + counter)
- `trimTitle(title)`: Normalize input

**Section 2: Model Object**
```javascript
const model = {
  state: { todos: [], currentFilter: 'all' },
  
  load() {
    // Load from Local Storage or return default
  },
  
  save(newState) {
    // Persist to Local Storage
    // Update this.state
  },
  
  addTodo(title) { /* ... */ },
  toggleTodo(id) { /* ... */ },
  deleteTodo(id) { /* ... */ },
  editTodo(id, newTitle) { /* ... */ },
  setFilter(filterType) { /* ... */ },
  clearCompleted() { /* ... */ },
  
  getActiveCount() { /* ... */ },
  getCompletedCount() { /* ... */ },
  getFilteredTodos() { /* ... */ }
};
```

**Section 3: Actions Object**
```javascript
const actions = {
  addTodo(title) {
    const newState = addTodoAction(model.state, title);
    if (newState) model.save(newState);
    return newState;
  },
  // Similar for toggleTodo, deleteTodo, etc.
};
```

**Section 4: State Rendering Function**
```javascript
function renderState(state) {
  // Compute derived data
  const filtered = getFilteredTodos(state);
  const activeCount = getActiveCount(state);
  
  // Update DOM elements
  updateTodoList(filtered);
  updateFilterButtons(state.currentFilter);
  updateActiveCountDisplay(activeCount);
  updateClearCompletedButton(activeCount > 0);
}
```

**Section 5: Event Listeners**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  model.load();
  renderState(model.state);
  
  // Attach event handlers for:
  // - Input field (Enter to submit)
  // - Add button (click)
  // - Delete buttons (click)
  // - Checkboxes (change event)
  // - Filter buttons (click)
  // - Edit on double-click
  // - Escape to cancel edit
});
```

### Styling Architecture (styles.css)

**Organization:**
1. Reset/Normalize: Base styles, font stack
2. Layout: Grid, flexbox for header, input, list, footer
3. Components: Buttons, input fields, list items, filter tabs
4. States: Completed todos, edit mode, active filter, hover states
5. Responsive: Media queries for mobile/tablet/desktop
6. Accessibility: Focus states, high contrast, reduced-motion

**Key CSS Classes:**
- `.container`: Main wrapper
- `.header`: App title
- `.input-section`: Input field and button
- `.filter-tabs`: Filter buttons container
- `.todo-list`: Unordered list
- `.todo-item`: Individual list item
- `.todo-checkbox`: Checkbox element
- `.todo-title`: Title text
- `.todo-delete`: Delete button
- `.todo-item.completed`: Strikethrough style
- `.todo-item.editing`: Edit mode style
- `.filter-tabs button.active`: Highlighted active filter
- `.footer`: Count and clear button
- `.empty-state`: No todos message

---

## 7. PWA Configuration

### manifest.json

```json
{
  "name": "Todo PWA",
  "short_name": "Todo",
  "description": "A simple, offline-first todo list application",
  "start_url": "/",
  "display": "standalone",
  "scope": "/",
  "theme_color": "#2196F3",
  "background_color": "#FFFFFF",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "categories": ["productivity"]
}
```

**Manifest Fields Explained:**
- `name`: Full application name displayed during install
- `short_name`: Abbreviated name for home screen icon label
- `display: "standalone"`: App appears as standalone application, not browser
- `start_url`: Entry point when launched from home screen
- `theme_color`: Status bar color on Android
- `background_color`: Splash screen background color during launch
- `icons`: App icons in various sizes for different devices

### service-worker.js

**Strategy:** Cache-first with network fallback

**Implementation:**

```javascript
const CACHE_NAME = 'todo-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  // Cache all assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old cache versions
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

**Caching Strategy Explanation:**
1. **Install Event:** Pre-cache all essential assets on first install
2. **Fetch Event:** Serve from cache first, fall back to network if not cached
3. **Activate Event:** Clean up old cache versions on update
4. **Result:** Works offline with latest cached version; network requests update cache if available

### Offline Behavior

- **First Load:** App caches all assets during service worker installation
- **Subsequent Loads:** Served entirely from cache, instant load times
- **Data Persistence:** Local Storage works offline without service worker involvement
- **No Network:** App functions fully; todos sync to Local Storage as normal
- **Reconnect:** Service worker updates cache on next network request (transparent)
- **Update:** New version cached on next app visit; user experiences new version on subsequent visit

### index.html Meta Tags for PWA

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#2196F3">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Todo">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

---

## 8. Acceptance Criteria Summary

### Functional Acceptance Criteria

✅ **Add Todo**
- Input field accepts text; Enter key or button click adds todo
- Empty submissions rejected with visual feedback
- Field clears after successful add
- New todo appears in list
- Persists in Local Storage

✅ **Display Todos**
- Todos shown in reverse chronological order
- Completed todos visually distinct (strikethrough, gray)
- Empty state shown when no todos exist
- Updates immediately on changes

✅ **Toggle Completion**
- Checkbox toggles completion status
- Space key also toggles on focused todo
- Persists immediately to Local Storage
- Affects filter counts

✅ **Delete Todo**
- Delete button removes todo
- Removed from Local Storage
- List updates immediately
- No confirmation required

✅ **Edit Todo**
- Double-click enters edit mode
- Enter saves; Escape cancels
- Empty edits rejected
- Persists to Local Storage

✅ **Filtering**
- Three filters: All, Active, Completed
- Current filter highlighted
- Filters affect display only, not data
- Selection persists across reloads

✅ **Active Count**
- Shows "N items left" (or "1 item left")
- Updates in real-time
- Only counts incomplete todos
- Visible in footer

✅ **Clear Completed**
- Button removes all completed todos
- Only visible when completed todos exist
- Persists immediately
- No confirmation required

✅ **Data Persistence**
- All todos persist in Local Storage
- Filter preference persists
- State matches after page reload
- Updates optimistically (no network delay)

### Technical Acceptance Criteria

✅ **Vanilla Stack**
- No frameworks (React, Vue, Angular, etc.)
- No npm dependencies
- No build tools
- HTML, CSS, JavaScript only

✅ **SAM Architecture**
- Model holds authoritative state
- Actions are pure functions
- State rendering is separate from business logic
- Clear data flow: User → Action → Model → State → DOM
- State changes trigger DOM updates

✅ **Single-Page Application**
- One index.html file
- app.js contains all logic
- styles.css contains all styling
- No page reloads
- Smooth, single-page experience

✅ **Responsive Design**
- Mobile-first approach
- Touch-friendly targets (44px minimum)
- Readable on small screens
- Adapts to tablet and desktop
- No horizontal scrolling on mobile

✅ **Progressive Web App**
- manifest.json present with required fields
- service-worker.js with cache-first strategy
- Installable on mobile devices (Android, iOS)
- Works fully offline
- Icons for home screen
- Fast load times (cached assets)

✅ **Accessibility**
- Semantic HTML (form, ul, li, button, etc.)
- ARIA labels on interactive elements
- Keyboard navigation (Tab, Enter, Escape, Space)
- High contrast colors (WCAG AA)
- Focus indicators on all interactive elements
- No reliance on color alone for information

✅ **Code Quality**
- Clean separation of concerns
- Consistent naming conventions (camelCase)
- JSDoc comments on functions
- No console errors or warnings
- Efficient DOM updates (minimize reflows)

### Testing Acceptance Criteria

✅ **Manual Testing Checklist**
- Add multiple todos and verify display
- Toggle completion and verify visual changes
- Delete a todo and verify removal
- Edit a todo and verify changes
- Switch between filters and verify list changes
- Verify active count updates correctly
- Clear completed todos and verify removal
- Refresh page and verify state restoration
- Test on mobile device or mobile emulator
- Test offline functionality (DevTools offline mode)
- Test install prompt and home screen launch
- Test all keyboard shortcuts (Enter, Escape, Space)
- Verify all elements are keyboard accessible
- Test on small, medium, and large screens

### Performance Acceptance Criteria

✅ **Load Time**
- Initial load < 2 seconds on 3G
- Subsequent loads < 1 second (cached)

✅ **Interactions**
- Add, delete, toggle, edit respond immediately
- No noticeable lag or jank
- Filter changes instant

✅ **Storage**
- Local Storage usage reasonable (< 1MB for 1000 todos)
- Cache size appropriate (only essential assets)

---

## Summary

This specification defines a complete, offline-first Todo PWA using vanilla JavaScript, the SAM architectural pattern, and Progressive Web App standards. The app prioritizes simplicity, accessibility, and mobile-first design while maintaining clean code architecture and immediate data persistence through Local Storage. Implementation should follow the detailed specifications in each section to ensure a consistent, reliable, and user-friendly experience.