# Frontend Documentation

## Overview

The IB Research System frontend is a single-page application built with vanilla JavaScript, jQuery, and Bootstrap. It communicates with the Flask backend via REST API calls and WebSocket (Socket.IO) for real-time updates.

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| jQuery | 3.5.1 | DOM manipulation, AJAX |
| Bootstrap | 4.5.2 | Component styling |
| D3.js | v7 | Tree visualization |
| Socket.IO | Latest | Real-time communication |
| marked.js | Latest | Markdown rendering |
| CryptoJS | 4.1.1 | Client-side encryption |

## File Structure

```
static/
├── js/
│   ├── app.js                 # Main application logic (157KB)
│   ├── chat.js                # Chat functionality
│   ├── mcts_auto.js           # MCTS auto-exploration controls
│   ├── retrieval.js           # Paper retrieval UI
│   ├── review-ui.js           # Review panel interface
│   ├── review-integration.js  # Review data integration
│   ├── review-helpers.js      # Review utility functions
│   ├── debug-tools.js         # Development debugging tools
│   └── secure-keys.js         # API key management UI
├── css/
│   ├── styles.css             # Main stylesheet
│   ├── app.css                # Application-specific styles
│   └── review-styles.css      # Review panel styles
└── icons/
    └── *.svg                  # SVG icons

templates/
├── index.html                 # Main application page
└── review-panel.html          # Review panel component
```

## Main Components

### 1. App.js - Main Application

**Location**: `static/js/app.js`

The main application file handles:

#### Global State

```javascript
// Application state
const state = {
    currentReviewAspectIndex: 0,
    aspectsToReview: ["lack_of_novelty", "assumptions", "vagueness", ...],
    acceptedReviews: [],
    reviewInProgress: false
};

// MCTS configuration
const MCTS_CONFIG = {
    maxIterations: 5,
    explorationDelay: 3000,
    explorationConstant: 1.414,
    discountFactor: 0.95,
    maxDepth: 3
};

// Tree visualization state
let treeMode = false;
let treeData = null;
let current_root = null;

// Current idea
let main_idea = "";

// Selected subject
let selectedSubject = 'physics';
```

#### Key Functions

| Function | Purpose |
|----------|---------|
| `sendMessage()` | Process user input and send to backend |
| `loadIdea()` | Fetch and display current research idea |
| `loadChat()` | Load chat history |
| `loadKnowledge()` | Load retrieved papers |
| `updateScoreDisplay()` | Update review score visualization |
| `formatMessage()` | Convert markdown to HTML |
| `switchTab()` | Switch between UI tabs |
| `showGenerateRQButton()` | Show RQ generation button |

#### Event Handlers

```javascript
$(document).ready(function() {
    loadKnowledge();
    loadChat();
    loadIdea(true);

    // Subject selector
    $('#subject-select').on('change', function() {
        const subject = $(this).val();
        selectedSubject = subject;
        saveSubject(subject);
        updateSubjectUI(subject);
    });

    // Enter key for chat
    $('#chat-input').on('keypress', function(e) {
        if (e.which === 13) {
            e.preventDefault();
            sendMessage();
        }
    });
});
```

### 2. MCTS Auto-Exploration

**Location**: `static/js/mcts_auto.js`

Handles automatic MCTS exploration with real-time updates.

#### Functions

| Function | Purpose |
|----------|---------|
| `startAutoExplore()` | Begin MCTS exploration |
| `stopAutoExplore()` | Stop exploration |
| `updateIterationCounter()` | Update UI with iteration count |
| `renderTree()` | Render MCTS tree visualization |

#### Socket.IO Integration

```javascript
const socket = io();

socket.on('exploration_update', function(data) {
    updateIterationCounter(data.iteration);
    updateTree(data.tree);
    updateCurrentIdea(data.current_node);
});

socket.on('exploration_complete', function(data) {
    displayBestResult(data.best_idea, data.best_score);
});

function startAutoExplore() {
    socket.emit('start_exploration', {
        max_iterations: MCTS_CONFIG.maxIterations,
        max_depth: MCTS_CONFIG.maxDepth
    });
}
```

### 3. Review UI

**Location**: `static/js/review-ui.js`

Manages the review panel showing scores and feedback.

#### Functions

| Function | Purpose |
|----------|---------|
| `displayReviewScores()` | Show all metric scores |
| `displayReviewFeedback()` | Show detailed feedback |
| `navigateReview()` | Navigate between review aspects |
| `acceptFeedback()` | Accept and apply feedback |
| `rejectFeedback()` | Dismiss feedback |

#### Score Display

```javascript
function displayReviewScores(scores) {
    const aspects = ['novelty', 'clarity', 'feasibility', 'effectiveness', 'impact'];

    aspects.forEach(aspect => {
        const score = scores[aspect];
        const bar = $(`#${aspect}-bar`);
        const label = $(`#${aspect}-score`);

        bar.css('width', `${score * 10}%`);
        label.text(`${score}/10`);

        // Color coding
        if (score >= 7) bar.addClass('score-good');
        else if (score >= 5) bar.addClass('score-medium');
        else bar.addClass('score-low');
    });
}
```

### 4. Retrieval UI

**Location**: `static/js/retrieval.js`

Manages paper search and display.

#### Functions

| Function | Purpose |
|----------|---------|
| `searchPapers()` | Execute paper search |
| `displayPapers()` | Render paper results |
| `selectPaper()` | Select paper for inclusion |
| `generateQueries()` | Get AI-generated queries |

#### Paper Display

```javascript
function displayPapers(papers) {
    const container = $('#paper-results');
    container.empty();

    papers.forEach(paper => {
        const card = $('<div class="paper-card"></div>');
        card.html(`
            <h4>${paper.title}</h4>
            <p class="authors">${paper.authors.join(', ')}</p>
            <p class="abstract">${paper.abstract}</p>
            <div class="paper-meta">
                <span>Year: ${paper.year}</span>
                <span>Citations: ${paper.citation_count}</span>
            </div>
            <button onclick="selectPaper('${paper.id}')">Add to Knowledge</button>
        `);
        container.append(card);
    });
}
```

### 5. Debug Tools

**Location**: `static/js/debug-tools.js`

Development utilities for debugging.

```javascript
// Enable debug mode
window.DEBUG = true;

// Log API calls
function debugLog(endpoint, data) {
    if (window.DEBUG) {
        console.log(`[API] ${endpoint}:`, data);
    }
}

// Inspect state
window.inspectState = function() {
    console.log('Current State:', state);
    console.log('Tree Data:', treeData);
    console.log('Main Idea:', main_idea);
};
```

---

## UI Layout

### Main Page Structure

```
+---------------------------------------------------------------+
|  Header (Title + Subject Selector)                             |
+---------------------------------------------------------------+
|                    |                      |                    |
|   Chat Panel       |   Idea Panel         |   Review Panel     |
|   (Left)           |   (Center)           |   (Right)          |
|                    |                      |                    |
|   - Chat history   |   - Research idea    |   - Score bars     |
|   - Input field    |   - Action buttons   |   - Feedback       |
|   - Send button    |   - Tab navigation   |   - Accept/Reject  |
|                    |                      |                    |
+---------------------------------------------------------------+
|                    Tree Visualization (Expandable)             |
+---------------------------------------------------------------+
|                    Literature Panel (Bottom)                   |
+---------------------------------------------------------------+
```

### HTML Element IDs

| ID | Purpose |
|----|---------|
| `#chat-box` | Chat message container |
| `#chat-input` | User input field |
| `#main-idea` | Research idea display |
| `#review-panel` | Review scores and feedback |
| `#tree-container` | MCTS tree visualization |
| `#literature-panel` | Retrieved papers display |
| `#subject-select` | Subject dropdown |
| `#proposal-content` | Research proposal display |
| `#welcome-message` | Initial welcome screen |

---

## CSS Architecture

### Main Stylesheet (styles.css)

```css
/* Layout */
.main-container {
    display: grid;
    grid-template-columns: 300px 1fr 350px;
    height: calc(100vh - 60px);
}

/* Chat Panel */
.chat-panel {
    border-right: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
}

.chat-box {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
}

/* Idea Panel */
.idea-panel {
    padding: 20px;
    overflow-y: auto;
}

/* Review Panel */
.review-panel {
    border-left: 1px solid #e5e7eb;
    padding: 20px;
}

/* Score Bars */
.score-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}

.score-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.score-good { background: #10b981; }
.score-medium { background: #f59e0b; }
.score-low { background: #ef4444; }
```

### Review Styles (review-styles.css)

```css
/* Review Feedback */
.review-feedback {
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
    margin-top: 15px;
}

/* Aspect Cards */
.aspect-card {
    padding: 12px;
    margin-bottom: 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
}

.aspect-card.active {
    border-color: #3b82f6;
    background: #eff6ff;
}

/* Action Buttons */
.accept-btn {
    background: #10b981;
    color: white;
}

.reject-btn {
    background: #ef4444;
    color: white;
}
```

---

## API Communication

### AJAX Pattern

```javascript
function apiCall(endpoint, method, data) {
    return $.ajax({
        url: `/api/${endpoint}`,
        type: method,
        contentType: 'application/json',
        data: JSON.stringify(data)
    });
}

// Usage
apiCall('chat', 'POST', { content: 'My research goal' })
    .done(function(response) {
        // Handle success
        updateIdea(response.idea);
        updateScores(response.review.scores);
    })
    .fail(function(xhr, status, error) {
        // Handle error
        showError(xhr.responseJSON?.error || error);
    });
```

### WebSocket Pattern

```javascript
const socket = io();

// Connect event
socket.on('connect', function() {
    console.log('WebSocket connected');
});

// Listen for updates
socket.on('exploration_update', function(data) {
    handleExplorationUpdate(data);
});

// Emit events
socket.emit('start_exploration', {
    max_iterations: 10
});
```

---

## State Management

### Global State Object

```javascript
window.AppState = {
    // User session
    selectedSubject: 'physics',
    currentIdea: '',
    chatHistory: [],

    // MCTS state
    treeData: null,
    currentNode: null,
    explorationInProgress: false,

    // Review state
    currentReviewIndex: 0,
    reviewScores: {},
    acceptedFeedback: [],

    // Knowledge base
    retrievedPapers: [],
    selectedPapers: []
};
```

### State Updates

```javascript
function updateState(key, value) {
    window.AppState[key] = value;

    // Trigger UI updates
    switch(key) {
        case 'currentIdea':
            renderIdea(value);
            break;
        case 'reviewScores':
            renderScores(value);
            break;
        case 'treeData':
            renderTree(value);
            break;
    }
}
```

---

## Tree Visualization (D3.js)

### Tree Rendering

```javascript
function renderTree(data) {
    const svg = d3.select('#tree-container svg');
    const width = 800;
    const height = 400;

    // Create tree layout
    const treeLayout = d3.tree()
        .size([width - 100, height - 100]);

    // Create hierarchy
    const root = d3.hierarchy(data);
    const treeData = treeLayout(root);

    // Draw links
    svg.selectAll('.link')
        .data(treeData.links())
        .join('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));

    // Draw nodes
    const nodes = svg.selectAll('.node')
        .data(treeData.descendants())
        .join('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodes.append('circle')
        .attr('r', 10)
        .attr('fill', d => getNodeColor(d.data.reward));

    nodes.on('click', function(event, d) {
        selectNode(d.data.id);
    });
}

function getNodeColor(reward) {
    if (reward >= 0.7) return '#10b981';
    if (reward >= 0.5) return '#f59e0b';
    return '#ef4444';
}
```

---

## Event Flow

### 1. User Submits Research Goal

```
User types in #chat-input
         │
         ▼
    sendMessage()
         │
         ▼
POST /api/chat ──────────────────┐
         │                       │
         ▼                       │
Show loading indicator           │
         │                       │
         ◄───────────────────────┘
         │
         ▼
Update #main-idea with response.idea
Update #review-panel with response.review
Show action buttons
```

### 2. User Clicks "Find Literature"

```
User clicks "Find Literature" button
         │
         ▼
POST /api/generate_query
         │
         ▼
Display generated queries
         │
         ▼
User selects query
         │
         ▼
POST /api/retrieve_knowledge
         │
         ▼
displayPapers() renders results
```

### 3. MCTS Auto-Exploration

```
User clicks "Auto-Explore"
         │
         ▼
socket.emit('start_exploration')
         │
         ▼
┌─────────────────────────────┐
│ For each iteration:         │
│                             │
│ socket.on('exploration_update')
│         │                   │
│         ▼                   │
│ updateIterationCounter()    │
│ updateTree()                │
│ updateCurrentIdea()         │
│                             │
└─────────────────────────────┘
         │
         ▼
socket.on('exploration_complete')
         │
         ▼
Display best result
```

---

## Responsive Design

### Breakpoints

```css
/* Desktop (default) */
.main-container {
    grid-template-columns: 300px 1fr 350px;
}

/* Tablet */
@media (max-width: 1024px) {
    .main-container {
        grid-template-columns: 250px 1fr 300px;
    }
}

/* Mobile */
@media (max-width: 768px) {
    .main-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto;
    }

    .chat-panel, .review-panel {
        position: fixed;
        /* Slide-out panels */
    }
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Ctrl+Enter` | Send message (in textarea) |
| `Esc` | Close modal/panel |

```javascript
document.addEventListener('keydown', function(e) {
    // Enter to send
    if (e.key === 'Enter' && !e.shiftKey) {
        if (document.activeElement.id === 'chat-input') {
            e.preventDefault();
            sendMessage();
        }
    }

    // Escape to close
    if (e.key === 'Escape') {
        closeActiveModal();
    }
});
```

---

## Error Handling

### Display Errors

```javascript
function showError(message) {
    const errorDiv = $('<div class="error-message"></div>')
        .text(message)
        .hide();

    $('#chat-box').append(errorDiv);
    errorDiv.slideDown();

    // Auto-dismiss after 5 seconds
    setTimeout(() => errorDiv.slideUp(() => errorDiv.remove()), 5000);
}
```

### API Error Handling

```javascript
$.ajax({
    url: '/api/endpoint',
    // ...
    error: function(xhr, status, error) {
        let message = 'An error occurred';

        if (xhr.responseJSON?.error) {
            message = xhr.responseJSON.error;
        } else if (xhr.status === 0) {
            message = 'Network error - please check your connection';
        } else if (xhr.status === 500) {
            message = 'Server error - please try again later';
        }

        showError(message);
    }
});
```

---

## Performance Optimizations

### Debouncing

```javascript
// Debounce search input
let searchTimeout;
$('#search-input').on('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        performSearch($(this).val());
    }, 300);
});
```

### Lazy Loading

```javascript
// Load papers on scroll
$('#literature-panel').on('scroll', function() {
    if (isNearBottom(this)) {
        loadMorePapers();
    }
});

function isNearBottom(element) {
    return element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
}
```

### Caching

```javascript
// Cache API responses
const cache = new Map();

async function cachedFetch(url, options = {}) {
    const cacheKey = JSON.stringify({ url, options });

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    cache.set(cacheKey, data);
    return data;
}
```
