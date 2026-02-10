# Todo PWA - User Stories by Sprint

## Sprint Organization Strategy

This project is organized into 5 sprints following an incremental delivery approach:

1. **Sprint 1:** Core CRUD Operations - Essential todo management
2. **Sprint 2:** Display and UI Polish - Visual feedback and user experience
3. **Sprint 3:** Persistence and State Management - Data durability
4. **Sprint 4:** Filtering and Advanced Features - Enhanced usability
5. **Sprint 5:** PWA Features - Offline capability and installability

Each sprint delivers working, testable functionality. The app becomes progressively more feature-complete with each sprint.

---

## Sprint 1: Core CRUD Operations (Foundation)
**Goal:** Establish basic todo management functionality with in-memory state

### Story 1.1: Add a New Todo
**Title:** Create a new todo item

**Description:** As a user, I want to add a new todo item to my list so that I can track tasks I need to complete.

**Acceptance Criteria:**
- [ ] An input field accepts text for a new todo
- [ ] A submit button (or Enter key) creates the todo
- [ ] Empty submissions are rejected (validation)
- [ ] Input field clears after successful submission
- [ ] New todo appears in the list immediately
- [ ] Todo is assigned a unique ID and created timestamp

**Technical Notes:**
- Implement `generateId()` utility (timestamp + counter)
- Use `trimTitle()` for input normalization
- Initial implementation can use in-memory array (not persisted yet)

---

### Story 1.2: Display Todo List
**Title:** View all todo items

**Description:** As a user, I want to see all my todos displayed in a list so that I can review what needs to be done.

**Acceptance Criteria:**
- [ ] Todos are displayed in reverse chronological order (newest first)
- [ ] Each todo shows its title text
- [ ] Completed todos have visual distinction (strikethrough, muted color)
- [ ] List updates immediately when todos are added, deleted, or modified
- [ ] Empty state message displays when no todos exist ("No todos yet. Add one above!")

**Technical Notes:**
- Use semantic HTML (`<ul>`, `<li>`)
- Apply `.todo-item` and `.todo-item.completed` CSS classes
- Implement initial `renderState()` function

---

### Story 1.3: Mark Todo as Complete
**Title:** Toggle todo completion status

**Description:** As a user, I want to mark a todo as complete so that I can track my progress.

**Acceptance Criteria:**
- [ ] Clicking a todo checkbox toggles completion state
- [ ] Keyboard shortcut (Space key on focused todo) also toggles state
- [ ] Completed todos are visually distinct (strikethrough text, grayed out)
- [ ] State updates in-memory immediately
- [ ] Completed status changes are reflected in the list

**Technical Notes:**
- Implement `toggleTodoAction()` in actions layer
- Use checkbox input with `.todo-checkbox` class
- Apply CSS strikethrough and muted color on `.completed` class

---

### Story 1.4: Delete a Todo
**Title:** Remove a todo from the list

**Description:** As a user, I want to delete a todo so that I can remove tasks that are no longer relevant.

**Acceptance Criteria:**
- [ ] A delete button (trash icon) appears on hover or focus
- [ ] Clicking delete removes the todo from the list
- [ ] Deleted todos are removed from in-memory state
- [ ] No confirmation dialog required for single deletes
- [ ] List updates immediately

**Technical Notes:**
- Implement `deleteTodoAction()` in actions layer
- Use button with `.todo-delete` class
- Show delete button on hover (CSS `:hover` pseudo-class)

---

## Sprint 2: Display and UI Polish
**Goal:** Enhance user experience with editing capability and visual refinements

### Story 2.1: Edit Todo Title
**Title:** Modify a todo's text inline

**Description:** As a user, I want to edit a todo's text so that I can correct or update task descriptions.

**Acceptance Criteria:**
- [ ] Double-clicking a todo title enters edit mode
- [ ] Text becomes editable in an input field
- [ ] Pressing Enter saves changes
- [ ] Pressing Escape cancels editing (reverts text)
- [ ] Changes update in-memory state immediately
- [ ] Empty edits are rejected (validation)
- [ ] Edit mode has visual indicator (border, background)

**Technical Notes:**
- Implement `editTodoAction()` in actions layer
- Add `.editing` class to `.todo-item` during edit
- Store original value for Escape key revert
- Use inline input field replacement

---

### Story 2.2: Display Active Count
**Title:** Show remaining active todos

**Description:** As a user, I want to see how many active todos I have so that I know how much work remains.

**Acceptance Criteria:**
- [ ] A counter displays the number of incomplete todos
- [ ] Counter updates in real-time when todos are added, deleted, or toggled
- [ ] Displays singular "1 item left" or plural "N items left"
- [ ] Counter is prominently placed in the footer
- [ ] Correctly reflects the count regardless of current view

**Technical Notes:**
- Implement `getActiveCount()` computed property in model
- Update footer display on every state change
- Use conditional text rendering for singular/plural

---

### Story 2.3: Responsive UI Design
**Title:** Mobile-first responsive layout

**Description:** As a user, I want the app to work well on my mobile device so that I can manage todos on the go.

**Acceptance Criteria:**
- [ ] Single column layout on small screens
- [ ] Touch targets are at least 44px height
- [ ] Text input and buttons sized for mobile interaction
- [ ] No horizontal scrolling on mobile devices
- [ ] Horizontal centering of content on larger screens
- [ ] Max-width constraint on desktop (600px)
- [ ] Adequate padding and spacing for readability

**Technical Notes:**
- Mobile-first CSS approach (start with mobile, add media queries for larger screens)
- Use flexbox for layout
- Apply responsive padding and margins
- Test on 320px, 768px, and 1024px+ viewports

---

## Sprint 3: Persistence and State Management
**Goal:** Implement Local Storage persistence and SAM architecture

### Story 3.1: Data Persistence
**Title:** Save todos across page reloads

**Description:** As a user, I want my todos to be saved so that I don't lose data when I refresh the page.

**Acceptance Criteria:**
- [ ] All todos persist in Local Storage
- [ ] Data is updated in Local Storage on every change (optimistic write)
- [ ] Page reload displays the exact state from before reload
- [ ] No backend server is required
- [ ] State includes all todo properties (id, title, completed, createdAt)

**Technical Notes:**
- Implement `model.save()` to write to Local Storage
- Implement `model.load()` to read from Local Storage
- Use `localStorage.setItem('todos', JSON.stringify(state.todos))`
- Call `model.save()` after every action
- Initialize state from Local Storage on page load

**Storage Schema:**
```javascript
localStorage.setItem('todos', JSON.stringify([
  { id: '123', title: 'Example', completed: false, createdAt: 1707000000000 }
]))
```

---

### Story 3.2: SAM Architecture Implementation
**Title:** Refactor to SAM pattern

**Description:** As a developer, I want to organize code using the SAM pattern so that the application is maintainable and testable.

**Acceptance Criteria:**
- [ ] Model layer holds authoritative state
- [ ] Actions are pure functions that propose state changes
- [ ] State representation layer renders model to DOM
- [ ] Clear data flow: User → Action → Model → State → DOM
- [ ] State changes automatically trigger DOM updates
- [ ] Business rules enforced in model layer

**Technical Notes:**
- Create `model` object with state management methods
- Create `actions` object with action functions
- Create `renderState()` function for DOM updates
- Separate concerns: no DOM manipulation in model or actions
- Model validates all state changes before accepting

**SAM Flow:**
```javascript
User Event → Action Function → Model.save() → renderState() → DOM Update
```

---

### Story 3.3: State Initialization
**Title:** Initialize app from Local Storage

**Description:** As a developer, I want the app to load saved state on startup so that users see their previous data.

**Acceptance Criteria:**
- [ ] App initializes with empty state if no Local Storage data exists
- [ ] App loads todos from Local Storage if data exists
- [ ] Initial render displays loaded state correctly
- [ ] Event listeners attached after initialization
- [ ] Focus set to input field after page load

**Technical Notes:**
- Implement initialization in `DOMContentLoaded` event
- Call `model.load()` first
- Then call `renderState(model.state)`
- Then attach event listeners
- Handle missing or corrupted Local Storage data gracefully

---

## Sprint 4: Filtering and Advanced Features
**Goal:** Add filtering, bulk operations, and enhanced usability

### Story 4.1: Filter Todos
**Title:** View todos by completion status

**Description:** As a user, I want to filter todos so that I can focus on specific task states.

**Acceptance Criteria:**
- [ ] Three filter options: All, Active (incomplete), Completed
- [ ] Filters are buttons or tabs in the UI
- [ ] Current filter is visually highlighted
- [ ] List updates immediately when filter changes
- [ ] Filter selection persists across page reloads (stored in Local Storage)
- [ ] Active filter affects the display but doesn't delete todos

**Technical Notes:**
- Add `currentFilter` property to model state
- Implement `getFilteredTodos()` computed property
- Store filter in Local Storage (`localStorage.setItem('currentFilter', 'active')`)
- Add `.active` class to current filter button
- Filter values: `'all'`, `'active'`, `'completed'`

**Filter Logic:**
- All: Show all todos
- Active: Show only `completed === false`
- Completed: Show only `completed === true`

---

### Story 4.2: Clear Completed Todos
**Title:** Bulk delete all completed todos

**Description:** As a user, I want to clear all completed todos at once so that I can declutter my list.

**Acceptance Criteria:**
- [ ] A "Clear Completed" button appears in the footer
- [ ] Button is only visible when completed todos exist
- [ ] Clicking removes all completed todos from the list
- [ ] Changes persist in Local Storage
- [ ] List updates immediately
- [ ] No confirmation required

**Technical Notes:**
- Implement `clearCompletedAction()` in actions layer
- Use `getCompletedCount()` to determine button visibility
- Filter out todos where `completed === true`
- Update both in-memory state and Local Storage

---

### Story 4.3: Filter State Persistence
**Title:** Remember filter selection

**Description:** As a user, I want my filter selection to be remembered so that I don't have to reselect it after reloading.

**Acceptance Criteria:**
- [ ] Current filter is saved to Local Storage
- [ ] Page reload restores the last selected filter
- [ ] Filter state is loaded during initialization
- [ ] Default filter is "All" if no saved preference exists

**Technical Notes:**
- Store filter in separate Local Storage key: `'currentFilter'`
- Load filter in `model.load()` method
- Save filter in `model.save()` method
- Apply loaded filter on initial render

---

## Sprint 5: PWA Features (Progressive Enhancement)
**Goal:** Add offline capability, installability, and PWA manifest

### Story 5.1: PWA Manifest
**Title:** Create installable web app

**Description:** As a user, I want to install the app on my home screen so that I can access it like a native app.

**Acceptance Criteria:**
- [ ] `manifest.json` file present with required fields
- [ ] Manifest linked in `index.html` (`<link rel="manifest">`)
- [ ] App name, short name, and description defined
- [ ] Icons provided in 192x192 and 512x512 sizes
- [ ] Display mode set to "standalone"
- [ ] Theme color and background color specified
- [ ] Install prompt appears on supported browsers
- [ ] App appears in home screen after installation

**Technical Notes:**
- Create `manifest.json` with all required PWA fields
- Create app icons at 192x192 and 512x512 resolution
- Store icons in `/icons/` directory
- Add `<meta name="theme-color">` to HTML
- Add Apple-specific meta tags for iOS support

**Manifest Structure:**
```json
{
  "name": "Todo PWA",
  "short_name": "Todo",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2196F3",
  "icons": [...]
}
```

---

### Story 5.2: Service Worker for Offline Support
**Title:** Enable offline functionality

**Description:** As a user, I want the app to work offline so that I can manage todos without an internet connection.

**Acceptance Criteria:**
- [ ] Service worker registered in `index.html`
- [ ] All app assets cached on first load (HTML, CSS, JS, icons)
- [ ] Cache-first strategy: serve from cache, fall back to network
- [ ] App loads instantly on subsequent visits (from cache)
- [ ] App fully functional without network connection
- [ ] Old cache versions cleaned up on update

**Technical Notes:**
- Create `service-worker.js` with install, fetch, and activate events
- Cache all assets in install event: `index.html`, `app.js`, `styles.css`, `manifest.json`, icons
- Implement cache-first fetch strategy
- Use versioned cache name (`'todo-pwa-v1'`)
- Clean up old caches in activate event

**Service Worker Registration:**
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

---

### Story 5.3: Offline Data Persistence
**Title:** Ensure data works offline

**Description:** As a user, I want my todo changes to be saved even when offline so that I don't lose work.

**Acceptance Criteria:**
- [ ] Local Storage works without network connection
- [ ] Add, edit, delete, toggle operations work offline
- [ ] No errors or warnings in offline mode
- [ ] State persists correctly across online/offline transitions
- [ ] App displays same data whether online or offline

**Technical Notes:**
- Local Storage is inherently offline-capable (no code changes needed)
- Test in Chrome DevTools offline mode
- Verify no network requests are made for data operations
- Ensure service worker doesn't interfere with Local Storage

---

### Story 5.4: PWA Accessibility and Metadata
**Title:** Complete PWA metadata and accessibility

**Description:** As a user, I want the app to be fully accessible and properly configured as a PWA.

**Acceptance Criteria:**
- [ ] All interactive elements have ARIA labels
- [ ] Semantic HTML used throughout (form, ul, li, button)
- [ ] Keyboard navigation works (Tab, Enter, Escape, Space)
- [ ] Focus indicators visible on all interactive elements
- [ ] High contrast colors (WCAG AA compliance)
- [ ] Viewport meta tag configured for mobile
- [ ] Apple-specific meta tags for iOS PWA support

**Technical Notes:**
- Add ARIA labels: `aria-label`, `role` attributes
- Use semantic HTML5 elements
- Style `:focus` pseudo-class for all interactive elements
- Test with keyboard only (no mouse)
- Test with screen reader (NVDA, VoiceOver)
- Add Apple meta tags:
  - `<meta name="apple-mobile-web-app-capable">`
  - `<link rel="apple-touch-icon">`

---

## Sprint Summary

### Sprint 1 (Core CRUD)
- 4 stories
- Deliverable: Basic todo management (add, display, toggle, delete)
- No persistence yet (in-memory only)

### Sprint 2 (Display and UI)
- 3 stories
- Deliverable: Editing, active count, responsive design
- Polished user experience

### Sprint 3 (Persistence)
- 3 stories
- Deliverable: Local Storage persistence, SAM architecture
- Data survives page reloads

### Sprint 4 (Filtering)
- 3 stories
- Deliverable: Filtering, bulk operations, filter persistence
- Enhanced usability

### Sprint 5 (PWA)
- 4 stories
- Deliverable: Offline support, installability, full PWA compliance
- Production-ready progressive web app

**Total:** 17 user stories across 5 sprints

---

## Testing Strategy by Sprint

### Sprint 1 Testing
- Manual testing: Add, display, toggle, delete todos
- Test empty state message
- Test input validation (empty submission)
- Test unique ID generation

### Sprint 2 Testing
- Manual testing: Edit mode (Enter, Escape)
- Test active count updates
- Test responsive layout (320px, 768px, 1024px)
- Test touch targets on mobile

### Sprint 3 Testing
- Test Local Storage read/write
- Test page reload restores state
- Test corrupted Local Storage handling
- Verify SAM data flow

### Sprint 4 Testing
- Test all three filters (All, Active, Completed)
- Test filter persistence across reloads
- Test "Clear Completed" bulk operation
- Test filter affects display only (data unchanged)

### Sprint 5 Testing
- Test offline mode (DevTools offline)
- Test install prompt and home screen launch
- Test service worker caching
- Test keyboard accessibility (Tab, Enter, Space, Escape)
- Test with screen reader
- Test on actual mobile device (Android, iOS)

---

## Dependencies and Blockers

### Sprint 1 → Sprint 2
- No blockers; Sprint 2 builds on Sprint 1

### Sprint 2 → Sprint 3
- No blockers; persistence is independent enhancement

### Sprint 3 → Sprint 4
- **Dependency:** Filtering requires persistence to be implemented
- Filter state must be stored in Local Storage

### Sprint 4 → Sprint 5
- No blockers; PWA features are additive

### Critical Path
1. Sprint 1 must complete first (foundation)
2. Sprint 3 must complete before Sprint 4 (filter persistence dependency)
3. Sprints 2 and 5 can be worked in parallel with others if needed

---

## Definition of Done (All Sprints)

Each user story is considered complete when:

- [ ] All acceptance criteria met
- [ ] Code follows camelCase naming convention
- [ ] JSDoc comments added to functions
- [ ] Manual testing completed and passing
- [ ] No console errors or warnings
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on mobile device or emulator
- [ ] Accessible via keyboard
- [ ] Git commit created with descriptive message
- [ ] Code reviewed (if team environment)

---

## Technical Debt and Future Enhancements

### Not Included in Current Sprints
- Undo/redo functionality
- Todo priority or categories
- Due dates and reminders
- Multi-device sync (would require backend)
- Drag-and-drop reordering
- Todo search functionality
- Dark mode theme
- Animations on add/delete (optional in Sprint 2)

These features can be addressed in future sprints based on user feedback and priorities.
