# Architecture Documentation

## System Overview

The IB Research System is an AI-powered research assistant built using a multi-agent, tree-search architecture. It helps IB students generate, refine, and validate research ideas using Monte Carlo Tree Search (MCTS), Large Language Models, and academic paper retrieval.

## High-Level Architecture

```
+------------------------------------------------------------------+
|                        Web Interface                              |
|  (HTML/CSS/JavaScript - Flask Templates + Socket.IO)              |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                     Flask Application                             |
|                        (app.py)                                   |
|  +------------------+  +------------------+  +------------------+ |
|  |  HTTP Endpoints  |  | WebSocket Events |  |  State Manager   | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
         |                      |                      |
         v                      v                      v
+------------------+  +------------------+  +------------------+
|   Agent System   |  |   MCTS Engine    |  | Retrieval System |
+------------------+  +------------------+  +------------------+
|  - IdeationAgent |  |  - Selection     |  |  - ScholarQA     |
|  - ReviewAgent   |  |  - Expansion     |  |  - Semantic      |
|  - Structured    |  |  - Simulation    |  |    Scholar API   |
|    ReviewAgent   |  |  - Backprop      |  |  - Reranker      |
+------------------+  +------------------+  +------------------+
         |                      |                      |
         v                      v                      v
+------------------------------------------------------------------+
|                     LLM Integration Layer                         |
|                (LiteLLM - Gemini/OpenAI/Anthropic)               |
+------------------------------------------------------------------+
```

## Directory Structure Code Map

```
IB-Research-System-v2/
├── app.py                              # Main Flask application (3,600+ lines)
│                                       # Entry point, all HTTP/WebSocket handlers
│
├── config/                             # Configuration Files
│   ├── config.yaml                     # Main app config (MCTS params, models, ports)
│   ├── prompts.yaml                    # Prompt templates (alternative to prompts.py)
│   ├── ideas.yaml                      # Pre-defined research ideas
│   └── ib/                             # IB-specific configurations
│       ├── physics_topics.yaml         # 25 Physics IA topics (A.1-E.5)
│       ├── chemistry_topics.yaml       # Chemistry IA topics
│       └── rq_formats.yaml             # Research question validation rules
│
├── src/                                # Source Code
│   ├── agents/                         # AI Agent Implementations
│   │   ├── base.py                     # BaseAgent abstract class
│   │   ├── ideation.py                 # IdeationAgent - idea generation/refinement
│   │   ├── review.py                   # ReviewAgent - 5-metric evaluation
│   │   ├── structured_review.py        # StructuredReviewAgent - detailed feedback
│   │   ├── retrieval.py                # RetrievalAgent - paper search
│   │   ├── prompts.py                  # All LLM prompt definitions
│   │   └── llm_utils.py                # LLM helper functions
│   │
│   ├── mcts/                           # Monte Carlo Tree Search
│   │   ├── node.py                     # MCTSState & MCTSNode classes
│   │   └── tree.py                     # MCTS algorithm implementation
│   │
│   ├── models/                         # Model Utilities
│   │   └── llm.py                      # HuggingFace API interface
│   │
│   ├── utils/                          # Utility Functions
│   │   ├── ib_config.py                # IB topic & RQ format loading
│   │   ├── key_manager.py              # API key encryption/management
│   │   └── paper_processing.py         # PDF processing utilities
│   │
│   └── retrieval_api/                  # ScholarQA Integration
│       └── scholarqa/                  # AI2 Scholar QA package
│           ├── rag/                    # Retrieval-Augmented Generation
│           │   ├── retrieval.py        # PaperFinder classes
│           │   ├── reranker/           # Cross-encoder reranking
│           │   └── retriever_base.py   # Base retriever interface
│           ├── llms/                   # LLM integrations
│           ├── postprocess/            # Output post-processing
│           ├── preprocess/             # Input pre-processing
│           └── state_mgmt/             # State management
│
├── static/                             # Frontend Static Assets
│   ├── js/                             # JavaScript Modules
│   │   ├── app.js                      # Main frontend app (157KB)
│   │   ├── mcts_auto.js                # Auto-exploration controls
│   │   ├── retrieval.js                # Paper retrieval UI
│   │   ├── review-ui.js                # Review panel interface
│   │   ├── review-integration.js       # Review data integration
│   │   ├── review-helpers.js           # Review utility functions
│   │   ├── debug-tools.js              # Development debug tools
│   │   └── secure-keys.js              # API key management UI
│   ├── css/                            # Stylesheets
│   │   └── style.css                   # Main stylesheet
│   └── icons/                          # SVG icons
│
├── templates/                          # HTML Templates
│   ├── index.html                      # Main interface (45KB)
│   └── review-panel.html               # Review panel component
│
├── data/                               # Data Storage (gitignored)
│   ├── retrieved/                      # Downloaded papers
│   └── grobid_processed/               # Processed PDFs
│
├── uploads/                            # User uploads (gitignored)
├── results/                            # MCTS results (gitignored)
├── logs/                               # Application logs (gitignored)
└── secure_keys/                        # Encrypted API keys (gitignored)
```

## Component Interaction Diagram

```
User Input (Browser)
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    templates/index.html                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Chat Panel  │  │ Idea Panel  │  │ Tree View   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │Review Panel │  │ Literature  │  │  Controls   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└──────────────────────────────────────────────────────────────┘
       │ HTTP/WebSocket
       ▼
┌──────────────────────────────────────────────────────────────┐
│                         app.py                                │
│                                                               │
│  Global State:                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ mcts          = MCTS("config/config.yaml")           │   │
│  │ current_root  = None  # Root MCTSNode                │   │
│  │ current_node  = None  # Selected MCTSNode            │   │
│  │ main_idea     = ""    # Current idea text            │   │
│  │ chat_messages = []    # Chat history                 │   │
│  │ knowledge     = []    # Retrieved papers             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Endpoints:                                                   │
│  ├── /api/chat              → Process user input             │
│  ├── /api/generate_query    → Create search queries          │
│  ├── /api/retrieve_knowledge→ Fetch papers                   │
│  ├── /api/review_aspect     → Evaluate idea                  │
│  ├── /api/improve_idea      → Refine based on feedback       │
│  ├── /api/refresh_idea      → Generate new approach          │
│  ├── /api/step              → Execute MCTS step              │
│  └── /api/tree              → Get tree structure             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                      Agent System                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ IdeationAgent (src/agents/ideation.py)                  │ │
│  │ ├── generate()           - Create initial idea          │ │
│  │ ├── refresh_idea()       - New approach                 │ │
│  │ ├── retrieve_and_refine()- Improve with papers          │ │
│  │ ├── review_and_refine()  - Improve with feedback        │ │
│  │ └── process_feedback()   - Apply user feedback          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ReviewAgent (src/agents/review.py)                      │ │
│  │ └── unified_review()     - Evaluate across 5 metrics    │ │
│  │     ├── Novelty (1-10)                                  │ │
│  │     ├── Clarity (1-10)                                  │ │
│  │     ├── Feasibility (1-10)                              │ │
│  │     ├── Effectiveness (1-10)                            │ │
│  │     └── Impact (1-10)                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ RetrievalAgent (src/agents/retrieval.py)                │ │
│  │ ├── search_papers()      - Query Semantic Scholar       │ │
│  │ ├── process_pdf()        - Extract text from PDFs       │ │
│  │ └── rerank_results()     - Reorder by relevance         │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                     MCTS Engine                               │
│                  (src/mcts/tree.py)                           │
│                                                               │
│  Algorithm:                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. SELECT    - Navigate tree using UCT formula       │   │
│  │    UCT = Q/N + C * sqrt(ln(parent.N) / N)            │   │
│  │                                                       │   │
│  │ 2. EXPAND    - Create new child nodes                │   │
│  │    - Generate new idea variants                       │   │
│  │    - Apply different refinement actions               │   │
│  │                                                       │   │
│  │ 3. SIMULATE  - Evaluate new nodes                    │   │
│  │    - Run IdeationAgent actions                        │   │
│  │    - Get ReviewAgent scores                           │   │
│  │    - reward = average_score / 10                      │   │
│  │                                                       │   │
│  │ 4. BACKPROP  - Update cumulative rewards             │   │
│  │    - Update Q-values up to root                       │   │
│  │    - Increment visit counts                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  Parameters (from config.yaml):                               │
│  ├── exploration_constant: 1.414                             │
│  ├── max_iterations: 100                                     │
│  ├── max_depth: 3                                            │
│  └── discount_factor: 0.9                                    │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                  External Services                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ LLM Providers (via LiteLLM)                             │ │
│  │ ├── Google Gemini (primary)                             │ │
│  │ ├── OpenAI GPT models                                   │ │
│  │ └── Anthropic Claude                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Semantic Scholar API                                    │ │
│  │ └── Academic paper search and metadata                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ HuggingFace (optional)                                  │ │
│  │ └── Cross-encoder reranking models                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Idea Generation Flow

```
User enters research goal
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/chat                      │
│ ├── Parse user input                │
│ ├── Detect intent                   │
│ └── Route to appropriate handler    │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ IdeationAgent.generate()            │
│ ├── Load IDEATION_GENERATE_PROMPT   │
│ ├── Call LLM with research goal     │
│ ├── Parse JSON response:            │
│ │   ├── title                       │
│ │   ├── proposed_method             │
│ │   └── experiment_plan             │
│ └── Store in memory (avoid repeat)  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ ReviewAgent.unified_review()        │
│ ├── Load UNIFIED_REVIEW_PROMPT      │
│ ├── Evaluate 5 metrics (1-10)       │
│ └── Return scores + feedback        │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Create MCTSState & MCTSNode         │
│ ├── state.current_idea = idea       │
│ ├── state.reward = avg_score / 10   │
│ ├── state.review_scores = scores    │
│ └── Set as current_root             │
└─────────────────────────────────────┘
         │
         ▼
Return idea + scores to frontend
```

### 2. Literature Retrieval Flow

```
User clicks "Find Literature"
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/generate_query            │
│ └── IdeationAgent generates 3       │
│     diverse search queries          │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ POST /api/retrieve_knowledge        │
│ ├── RetrievalAgent.search_papers()  │
│ ├── Query Semantic Scholar API      │
│ └── Get paper metadata + abstracts  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Reranking (optional)                │
│ ├── Load cross-encoder model        │
│ ├── Score query-paper relevance     │
│ └── Reorder by relevance score      │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Store in knowledge_chunks           │
│ ├── Paper title                     │
│ ├── Authors                         │
│ ├── Abstract                        │
│ ├── URL                             │
│ └── Relevance score                 │
└─────────────────────────────────────┘
         │
         ▼
Return papers to frontend
```

### 3. MCTS Exploration Flow

```
User clicks "Auto-Explore"
         │
         ▼
┌─────────────────────────────────────┐
│ WebSocket: start_exploration        │
│ └── Begin MCTS loop                 │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ For each iteration:                 │
│                                     │
│ 1. SELECTION                        │
│    ├── Start from root              │
│    ├── Apply UCT formula            │
│    └── Navigate to best leaf        │
│                                     │
│ 2. EXPANSION                        │
│    ├── Choose action:               │
│    │   ├── refresh_idea             │
│    │   ├── review_and_refine        │
│    │   └── retrieve_and_refine      │
│    └── Create new child node        │
│                                     │
│ 3. SIMULATION                       │
│    ├── Execute agent action         │
│    ├── Get review scores            │
│    └── Calculate reward             │
│                                     │
│ 4. BACKPROPAGATION                  │
│    ├── Update Q-values              │
│    └── Increment visit counts       │
└─────────────────────────────────────┘
         │
         ▼
Emit tree update via WebSocket
         │
         ▼
Continue until max_iterations or stop
```

## State Management

### MCTSState (src/mcts/node.py)

```python
class MCTSState:
    research_goal: str          # User's research objective
    current_idea: str           # Current idea text
    depth: int                  # Depth in search tree
    reward: float               # Score (0-1)
    review_scores: dict         # {metric: score} for 5 metrics
    reviewed_knowledge: list    # Retrieved papers
    subject: str                # Physics/Chemistry/etc
    assessment_type: str        # IA/EE
    research_question: str      # Hyper-specific RQ
    expanded_sections: dict     # Background, procedure, etc
    section_citations: dict     # Citations per section
```

### MCTSNode (src/mcts/node.py)

```python
class MCTSNode:
    state: MCTSState            # State at this node
    id: str                     # Unique identifier
    parent: MCTSNode            # Parent node reference
    children: List[MCTSNode]    # Child nodes

    # MCTS statistics (tracked in tree.py)
    Q: float                    # Cumulative reward
    N: int                      # Visit count
```

### Global Application State (app.py)

```python
# MCTS Engine
mcts = MCTS("config/config.yaml")

# Current tree state
current_root: MCTSNode = None      # Root of exploration tree
current_node: MCTSNode = None      # Currently selected node

# User session state
selected_subject: str = None       # Physics/Chemistry
main_idea: str = ""                # Current idea text
chat_messages: list = []           # Chat history

# Knowledge base
retrieval_results: dict = {}       # Retrieved papers by query
knowledge_chunks: list = []        # Processed paper chunks

# Agents
ideation_agent: IdeationAgent
review_agent: ReviewAgent
retrieval_agent: RetrievalAgent
```

## Agent Prompts Reference

| Prompt | Location | Purpose |
|--------|----------|---------|
| `IDEATION_SYSTEM_PROMPT` | prompts.py:4-13 | System instructions for ideation |
| `IDEATION_GENERATE_PROMPT` | prompts.py:113-138 | Generate initial research idea |
| `IDEATION_REFRESH_APPROACH_PROMPT` | prompts.py:169-204 | Generate different approach |
| `IDEATION_REFINE_WITH_RETRIEVAL_PROMPT` | prompts.py:206-249 | Refine using papers |
| `IDEATION_DIRECT_FEEDBACK_PROMPT` | prompts.py:252-285 | Apply user feedback |
| `IDEATION_IMPROVE_WITH_FEEDBACK_PROMPT` | prompts.py:288-326 | Improve from review |
| `IDEATION_GENERATE_QUERY_PROMPT` | prompts.py:19-35 | Generate search queries |
| `REVIEW_SYSTEM_PROMPT` | prompts.py:363-367 | System instructions for review |
| `UNIFIED_REVIEW_PROMPT` | prompts.py:421-455 | 5-metric evaluation |
| `REVIEW_SINGLE_ASPECT_PROMPT` | prompts.py:370-418 | Single aspect review |

## Review Metrics

| Metric | Weight | Description |
|--------|--------|-------------|
| Novelty | 20% | Originality compared to existing work |
| Clarity | 20% | How well-defined and understandable |
| Feasibility | 20% | Technical practicality |
| Effectiveness | 20% | How well it solves the problem |
| Impact | 20% | Scientific/practical significance |

### IB-Specific Metrics (Physics/Chemistry)

| Metric | Description |
|--------|-------------|
| RQ Design Fit | Alignment with IB requirements |
| Data Analysis Viability | Can data be meaningfully analyzed |
| Conclusion Traceability | Can conclusions be drawn from data |
| Evaluation Potential | Room for critical evaluation |
| Safety & Practicality | School lab feasibility |

## Configuration Reference

### config/config.yaml

```yaml
experiment:
  n_rollouts: 4              # MCTS rollouts per iteration
  max_depth: 3               # Maximum tree depth
  save_intermediate: true    # Save results during execution
  results_dir: "results/"

app:
  host: "0.0.0.0"
  port: 5001
  debug: false

mcts:
  exploration_constant: 1.414    # UCT exploration parameter
  max_iterations: 100
  discount_factor: 0.9

ideation_agent:
  model: "gemini/gemini-2.0-flash-lite"
  temperature: 0.7
  max_tokens: 512

review_agent:
  model: "gemini/gemini-2.0-flash-lite"

retrieval_agent:
  max_papers: 10
  rerank_top_k: 5
  summary_max_length: 200
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | HTML/CSS/JS | User interface |
| Real-time | Socket.IO | Live updates during MCTS |
| Backend | Flask | HTTP API server |
| Production | Gunicorn + Eventlet | Production server |
| LLM | LiteLLM | Multi-provider LLM support |
| Search | Semantic Scholar API | Academic paper retrieval |
| Reranking | HuggingFace | Result relevance scoring |
| PDF | PyMuPDF | PDF text extraction |
