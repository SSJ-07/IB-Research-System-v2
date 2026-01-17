# API Reference

This document provides a comprehensive reference for all HTTP and WebSocket endpoints in the IB Research System.

## Base URL

- **Local Development**: `http://localhost:5000`
- **Production**: Depends on deployment (e.g., Railway URL)

## Response Format

All endpoints return JSON responses with the following general structure:

```json
// Success
{
  "data": { ... },
  "status": "success"
}

// Error
{
  "error": "Error message description"
}
```

---

## Core Endpoints

### Index

#### `GET /`
Serves the main web interface.

**Response**: HTML page (`templates/index.html`)

---

## Chat & Idea Generation

### Chat

#### `GET /api/chat`
Retrieve chat history.

**Response**:
```json
[
  {
    "role": "user",
    "content": "I want to study enzyme activity"
  },
  {
    "role": "assistant",
    "content": "I'll help you develop a research idea..."
  }
]
```

#### `POST /api/chat`
Process user input and generate/update research ideas.

**Request Body**:
```json
{
  "content": "User message text"
}
```

**Response**:
```json
{
  "response": "Assistant response",
  "idea": "Generated research idea text",
  "review": {
    "scores": {
      "novelty": 7,
      "clarity": 8,
      "feasibility": 6,
      "effectiveness": 7,
      "impact": 8
    },
    "reviews": {
      "novelty": "Detailed novelty assessment...",
      "clarity": "Detailed clarity assessment..."
    },
    "average_score": 7.2
  },
  "tree": { ... }  // MCTS tree structure
}
```

### Get Current Idea

#### `GET /api/idea`
Retrieve the current research idea.

**Response**:
```json
{
  "idea": "Current research idea text with full details..."
}
```

### Refresh Idea

#### `POST /api/refresh_idea`
Generate a completely different research approach.

**Request Body**:
```json
{
  "research_goal": "Original research goal"
}
```

**Response**:
```json
{
  "idea": "New research idea with different approach",
  "review": {
    "scores": { ... },
    "reviews": { ... },
    "average_score": 7.5
  }
}
```

---

## Review System

### Review Aspect

#### `POST /api/review_aspect`
Review a specific aspect of the current idea.

**Request Body**:
```json
{
  "aspect": "feasibility",  // or "novelty", "clarity", etc.
  "idea": "Current idea text"
}
```

**Response**:
```json
{
  "aspect": "feasibility",
  "score": 7,
  "highlight": "Exact text from idea being reviewed",
  "category": "feasibility_and_practicality",
  "review": "Detailed review of this aspect...",
  "summary": "Brief summary of the review"
}
```

### Improve Idea

#### `POST /api/improve_idea`
Improve the idea based on review feedback.

**Request Body**:
```json
{
  "feedback": "Specific feedback to address",
  "aspect": "feasibility"
}
```

**Response**:
```json
{
  "idea": "Improved research idea...",
  "review": {
    "scores": { ... },
    "reviews": { ... },
    "average_score": 8.0
  }
}
```

### Set Aspect Weights

#### `POST /api/set_aspect_weights`
Configure custom weights for review metrics.

**Request Body**:
```json
{
  "weights": {
    "novelty": 0.25,
    "clarity": 0.15,
    "feasibility": 0.20,
    "effectiveness": 0.20,
    "impact": 0.20
  }
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Aspect weights updated"
}
```

---

## Literature Retrieval

### Generate Query

#### `POST /api/generate_query`
Generate search queries for finding relevant literature.

**Request Body**:
```json
{
  "idea": "Current research idea",
  "research_goal": "Original research goal"
}
```

**Response**:
```json
{
  "queries": [
    "enzyme kinetics temperature effects",
    "Michaelis-Menten temperature dependency",
    "thermal stability proteins biochemistry"
  ]
}
```

### Retrieve Knowledge

#### `POST /api/retrieve_knowledge`
Search and retrieve academic papers from Semantic Scholar.

**Request Body**:
```json
{
  "query": "enzyme kinetics temperature",
  "max_results": 10
}
```

**Response**:
```json
{
  "papers": [
    {
      "title": "Temperature Effects on Enzyme Activity",
      "authors": ["Smith, J.", "Jones, M."],
      "abstract": "This study investigates...",
      "year": 2023,
      "url": "https://semanticscholar.org/paper/...",
      "citation_count": 45,
      "relevance_score": 0.89
    }
  ],
  "total_found": 156
}
```

### Improve Idea with Knowledge

#### `POST /api/improve_idea_with_knowledge`
Refine the research idea using retrieved literature.

**Request Body**:
```json
{
  "knowledge": [
    {
      "title": "Paper title",
      "abstract": "Paper abstract...",
      "url": "https://..."
    }
  ],
  "current_idea": "Current idea text"
}
```

**Response**:
```json
{
  "idea": "Refined idea incorporating literature...",
  "citations_added": 3,
  "review": { ... }
}
```

### Knowledge Management

#### `GET /api/knowledge`
Get all stored knowledge chunks.

**Response**:
```json
[
  {
    "id": 1,
    "text": "Key finding from paper...",
    "full_text": "Complete text...",
    "source": "Smith et al. (2023)"
  }
]
```

#### `POST /api/add_knowledge`
Add a knowledge chunk to the knowledge base.

**Request Body**:
```json
{
  "text": "Knowledge chunk text",
  "source": "Source citation"
}
```

**Response**:
```json
{
  "id": 2,
  "text": "Knowledge chunk text",
  "full_text": "Knowledge chunk text",
  "source": "Source citation"
}
```

---

## MCTS (Tree Search)

### Get Tree

#### `GET /api/tree`
Retrieve the current MCTS tree structure.

**Response**:
```json
{
  "id": "root",
  "idea": "Root research idea...",
  "reward": 0.72,
  "visits": 15,
  "depth": 0,
  "children": [
    {
      "id": "node-1",
      "idea": "Variant 1...",
      "reward": 0.78,
      "visits": 5,
      "depth": 1,
      "children": []
    }
  ]
}
```

### Execute Step

#### `POST /api/step`
Execute a single MCTS step (select, expand, simulate, backpropagate).

**Request Body**:
```json
{
  "action": "expand",  // or "select", "simulate", "backprop"
  "node_id": "node-1"   // optional, for specific node operations
}
```

**Response**:
```json
{
  "tree": { ... },
  "current_node": "node-2",
  "action_taken": "expand",
  "new_idea": "Expanded idea variant...",
  "reward": 0.75
}
```

### Select Node

#### `POST /api/node`
Select a specific node in the tree as the current working node.

**Request Body**:
```json
{
  "node_id": "node-5"
}
```

**Response**:
```json
{
  "idea": "Selected node's idea...",
  "review": { ... },
  "node_id": "node-5",
  "depth": 2
}
```

### Get Best Child

#### `POST /api/get_best_child`
Find the best child node based on scores.

**Request Body**:
```json
{
  "node_id": "node-1",
  "metric": "average_score"  // optional, defaults to average
}
```

**Response**:
```json
{
  "best_child_id": "node-3",
  "idea": "Best child idea...",
  "score": 8.2
}
```

---

## IB-Specific Endpoints

### Physics Topics

#### `GET /api/physics/topics`
Get all Physics IA topics.

**Response**:
```json
{
  "topics": {
    "A": {
      "name": "Space, Time, and Motion",
      "subtopics": [
        {"id": "A.1", "name": "Kinematics"},
        {"id": "A.2", "name": "Forces and momentum"}
      ]
    },
    "B": {
      "name": "Particulate Nature of Matter",
      "subtopics": [ ... ]
    }
  }
}
```

### Chemistry Topics

#### `GET /api/chemistry/topics`
Get all Chemistry IA topics.

**Response**:
```json
{
  "topics": {
    "Structure": {
      "name": "Structure",
      "subtopics": [ ... ]
    },
    "Reactivity": {
      "name": "Reactivity",
      "subtopics": [ ... ]
    }
  }
}
```

### Generate Research Question

#### `POST /api/generate_rq`
Generate an IB-compliant research question.

**Request Body**:
```json
{
  "topic_id": "A.1",
  "subject": "physics",
  "assessment_type": "IA",
  "context": "I want to study projectile motion"
}
```

**Response**:
```json
{
  "research_question": "How does the launch angle affect the horizontal range of a projectile...",
  "independent_variable": "launch angle (degrees)",
  "dependent_variable": "horizontal range (meters)",
  "validation": {
    "is_valid": true,
    "issues": []
  }
}
```

### Approve Research Question

#### `POST /api/approve_rq`
Approve and save the generated research question.

**Request Body**:
```json
{
  "research_question": "Approved RQ text...",
  "independent_variable": "IV",
  "dependent_variable": "DV"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "Research question approved"
}
```

### Approve Section

#### `POST /api/approve_section/<section>`
Approve a generated section (background, procedure, etc.).

**Path Parameter**: `section` - One of: `background`, `procedure`, `research_design`

**Request Body**:
```json
{
  "content": "Section content to approve"
}
```

**Response**:
```json
{
  "status": "success",
  "section": "background"
}
```

---

## Section Expansion

### Expand Background

#### `POST /api/expand/background`
Generate background section with citations.

**Request Body**:
```json
{
  "research_question": "RQ text",
  "knowledge": [ ... ]  // Retrieved papers
}
```

**Response**:
```json
{
  "background": "Generated background section with [1] citations...",
  "citations": [
    {"id": 1, "reference": "Smith et al. (2023)..."}
  ]
}
```

### Expand Procedure

#### `POST /api/expand/procedure`
Generate methodology/procedure section.

**Request Body**:
```json
{
  "research_question": "RQ text",
  "background": "Background section"
}
```

**Response**:
```json
{
  "procedure": "1. Set up apparatus...\n2. Measure initial values...",
  "equipment_list": ["thermometer", "beaker", "..."]
}
```

### Expand Research Design

#### `POST /api/expand/research_design`
Generate research design section.

**Request Body**:
```json
{
  "research_question": "RQ text",
  "procedure": "Procedure section"
}
```

**Response**:
```json
{
  "research_design": "Variables:\n- IV: ...\n- DV: ...\n- Controls: ..."
}
```

### Improve Section with Knowledge

#### `POST /api/section/improve_with_knowledge`
Improve a section using retrieved literature.

**Request Body**:
```json
{
  "section": "background",
  "content": "Current section content",
  "knowledge": [ ... ]
}
```

**Response**:
```json
{
  "improved_content": "Improved section with additional citations...",
  "new_citations": [ ... ]
}
```

---

## Citations

### Add Citation

#### `POST /api/citations/add`
Add a citation to the current document.

**Request Body**:
```json
{
  "section": "background",
  "citation": {
    "title": "Paper title",
    "authors": ["Author 1", "Author 2"],
    "year": 2023,
    "url": "https://..."
  }
}
```

**Response**:
```json
{
  "citation_id": 3,
  "formatted": "[3] Author 1 et al. (2023). Paper title..."
}
```

### Retrieve Citations

#### `POST /api/citations/retrieve`
Get all citations for a section or the entire document.

**Request Body**:
```json
{
  "section": "background"  // optional, omit for all citations
}
```

**Response**:
```json
{
  "citations": [
    {"id": 1, "reference": "...", "section": "background"},
    {"id": 2, "reference": "...", "section": "background"}
  ]
}
```

---

## File Upload

### Upload File

#### `POST /api/upload`
Upload a document (PDF, TXT, DOC, DOCX).

**Request**: `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The document to upload |

**Response**:
```json
{
  "filename": "uploaded_file.pdf",
  "id": "uuid-string",
  "text_content": "Extracted text from document...",
  "pages": 12
}
```

---

## Subject & State Management

### Subject

#### `GET /api/subject`
Get the currently selected subject.

**Response**:
```json
{
  "subject": "physics"  // or "chemistry", null
}
```

#### `POST /api/subject`
Set the selected subject.

**Request Body**:
```json
{
  "subject": "physics"
}
```

**Response**:
```json
{
  "subject": "physics"
}
```

### Reset

#### `POST /api/reset`
Reset all application state for a new project.

**Response**:
```json
{
  "success": true
}
```

---

## API Key Management

### Set API Key

#### `POST /api/set_api_key`
Save an API key securely.

**Request Body**:
```json
{
  "provider": "gemini",  // or "openai", "claude", "deepseek", "semantic_scholar"
  "key": "your-api-key-here"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "API key for gemini saved successfully"
}
```

### Get API Keys

#### `GET /api/get_api_keys`
List configured API keys (without exposing values).

**Response**:
```json
{
  "keys": [
    {"provider": "gemini", "configured": true},
    {"provider": "openai", "configured": false}
  ]
}
```

### Delete API Key

#### `POST /api/delete_api_key`
Remove an API key.

**Request Body**:
```json
{
  "provider": "gemini"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "API key for gemini deleted successfully"
}
```

### LLM Client Info

#### `GET /api/llm_client_info`
Get information about the current LLM configuration.

**Response**:
```json
{
  "client_info": {
    "provider": "gemini",
    "model": "gemini-2.0-flash-lite"
  },
  "environment": {
    "DEPLOY": "false",
    "AZURE_OPENAI_API_KEY_SET": false,
    "AZURE_OPENAI_ENDPOINT_SET": false
  }
}
```

---

## WebSocket Events

The application uses Socket.IO for real-time communication during MCTS exploration.

### Client → Server Events

#### `start_exploration`
Begin automatic MCTS exploration.

**Payload**:
```json
{
  "max_iterations": 10,
  "max_depth": 3
}
```

#### `stop_exploration`
Stop the current exploration.

**Payload**: None

### Server → Client Events

#### `exploration_update`
Sent after each MCTS iteration.

**Payload**:
```json
{
  "iteration": 5,
  "tree": { ... },
  "current_node": "node-id",
  "action": "expand",
  "reward": 0.75,
  "best_score": 8.2
}
```

#### `exploration_complete`
Sent when exploration finishes.

**Payload**:
```json
{
  "total_iterations": 10,
  "best_node": "node-id",
  "best_idea": "Best idea found...",
  "best_score": 8.5
}
```

#### `exploration_error`
Sent if an error occurs during exploration.

**Payload**:
```json
{
  "error": "Error message",
  "iteration": 5
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created (for POST creating resources) |
| `400` | Bad Request - Invalid input |
| `404` | Not Found - Resource doesn't exist |
| `500` | Internal Server Error |

## Rate Limiting

The application does not implement rate limiting itself, but external APIs have limits:

- **Semantic Scholar**: ~100 requests/5 minutes (with API key)
- **Google Gemini**: Varies by tier
- **OpenAI**: Varies by tier

## Authentication

Currently, the application does not require authentication. API keys are managed server-side and not exposed to clients.

---

## Example Usage

### Python

```python
import requests

BASE_URL = "http://localhost:5000"

# Start a new research session
response = requests.post(f"{BASE_URL}/api/chat", json={
    "content": "I want to study enzyme activity and temperature"
})
data = response.json()
print(data["idea"])

# Get review scores
print(data["review"]["scores"])

# Generate search queries
response = requests.post(f"{BASE_URL}/api/generate_query", json={
    "idea": data["idea"],
    "research_goal": "Study enzyme activity"
})
queries = response.json()["queries"]

# Retrieve papers
for query in queries:
    response = requests.post(f"{BASE_URL}/api/retrieve_knowledge", json={
        "query": query,
        "max_results": 5
    })
    papers = response.json()["papers"]
    print(f"Found {len(papers)} papers for: {query}")
```

### JavaScript

```javascript
// Using fetch API
const BASE_URL = 'http://localhost:5000';

// Start research
const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: 'Study enzyme kinetics' })
});
const chatData = await chatResponse.json();

// Connect to WebSocket for exploration
const socket = io(BASE_URL);

socket.on('exploration_update', (data) => {
  console.log(`Iteration ${data.iteration}: ${data.reward}`);
});

socket.emit('start_exploration', { max_iterations: 10 });
```
