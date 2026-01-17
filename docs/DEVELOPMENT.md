# Development Guide

This guide provides instructions for setting up and developing the IB Research System.

## Prerequisites

- **Python**: 3.12 or higher (Python 3.13 recommended)
- **Node.js**: Not required (frontend uses CDN-hosted libraries)
- **Git**: For version control
- **uv** (recommended) or pip: For Python package management

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/SSJ-07/IB-Research-System-v2.git
cd IB-Research-System-v2
```

### 2. Set Up Python Environment

**Using uv (Recommended)**:
```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate
```

**Using pip**:
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# For local development with reranking:
pip install -r requirements-dev.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Required
GEMINI_API_KEY=your_google_gemini_api_key

# Recommended
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Optional - Alternative LLM providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key

# Development settings
FLASK_ENV=development
FLASK_DEBUG=1

# Local reranking (requires requirements-dev.txt)
RERANK_MODE=hf
```

### 4. Create Required Directories

```bash
mkdir -p uploads logs results secure_keys data/retrieved data/grobid_processed
```

### 5. Run the Application

```bash
python app.py
```

Open your browser to `http://localhost:5000`

---

## Project Structure

```
IB-Research-System-v2/
├── app.py                      # Main application entry point
├── config/
│   ├── config.yaml             # Application configuration
│   ├── prompts.yaml            # Prompt templates
│   └── ib/                     # IB-specific configs
├── src/
│   ├── agents/                 # AI agents
│   ├── mcts/                   # MCTS implementation
│   ├── models/                 # Model utilities
│   ├── utils/                  # Utility functions
│   └── retrieval_api/          # ScholarQA package
├── static/
│   ├── js/                     # JavaScript files
│   ├── css/                    # Stylesheets
│   └── icons/                  # SVG icons
├── templates/                  # HTML templates
├── docs/                       # Documentation
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies
├── pyproject.toml              # Project metadata
└── Procfile                    # Production server config
```

---

## Configuration

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

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SEMANTIC_SCHOLAR_API_KEY` | No | Semantic Scholar API key (improves retrieval) |
| `HUGGINGFACE_API_KEY` | No | HuggingFace API key (for reranking) |
| `OPENAI_API_KEY` | No | OpenAI API key (alternative LLM) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key (alternative LLM) |
| `FLASK_SECRET_KEY` | No | Flask session secret (auto-generated if not set) |
| `FLASK_ENV` | No | `development` or `production` |
| `RERANK_MODE` | No | `hf` for HuggingFace reranking, `none` to disable |

---

## Development Workflow

### Running in Development Mode

```bash
# Set debug mode
export FLASK_DEBUG=1
export FLASK_ENV=development

# Run with auto-reload
python app.py
```

### Code Style

The project follows PEP 8 style guidelines. Use a linter:

```bash
# Install development tools
pip install flake8 black isort

# Check style
flake8 src/ app.py

# Format code
black src/ app.py
isort src/ app.py
```

### Testing

```bash
# Run tests (if available)
pytest tests/

# Run with coverage
pytest --cov=src tests/
```

---

## Adding New Features

### Adding a New Agent

1. Create a new file in `src/agents/`:

```python
# src/agents/my_agent.py
from src.agents.base import BaseAgent

class MyAgent(BaseAgent):
    def __init__(self, config_path: str):
        super().__init__(config_path)
        # Load agent-specific config

    def execute_action(self, action: str, **kwargs):
        if action == "my_action":
            return self._my_action(**kwargs)
        raise ValueError(f"Unknown action: {action}")

    def _my_action(self, input_text: str) -> str:
        # Implement action logic
        prompt = f"Process this: {input_text}"
        return self._call_llm(prompt)
```

2. Add prompts in `src/agents/prompts.py`:

```python
MY_AGENT_PROMPT = """
You are a helpful agent that...
{input}
"""
```

3. Initialize in `app.py`:

```python
from src.agents.my_agent import MyAgent
my_agent = MyAgent("config/config.yaml")
```

4. Create API endpoint:

```python
@app.route("/api/my_action", methods=["POST"])
def my_action():
    data = request.get_json()
    result = my_agent.execute_action("my_action", input_text=data["input"])
    return jsonify({"result": result})
```

### Adding a New API Endpoint

1. Define the route in `app.py`:

```python
@app.route("/api/new_endpoint", methods=["GET", "POST"])
def new_endpoint():
    if request.method == "GET":
        # Handle GET request
        return jsonify({"data": "value"})
    else:
        # Handle POST request
        data = request.get_json()
        # Process data
        return jsonify({"result": "success"})
```

2. Add frontend integration in `static/js/app.js`:

```javascript
function callNewEndpoint(data) {
    return $.ajax({
        url: '/api/new_endpoint',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data)
    });
}
```

3. Document in `docs/API.md`

### Adding Frontend Components

1. Add HTML in `templates/index.html`:

```html
<div id="my-component" class="my-component">
    <h3>My Component</h3>
    <div id="my-content"></div>
    <button onclick="handleMyAction()">Action</button>
</div>
```

2. Add JavaScript in `static/js/app.js`:

```javascript
function handleMyAction() {
    callNewEndpoint({ data: 'value' })
        .done(function(response) {
            $('#my-content').html(response.result);
        })
        .fail(function(xhr) {
            showError(xhr.responseJSON?.error || 'Error');
        });
}
```

3. Add styles in `static/css/styles.css`:

```css
.my-component {
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}
```

---

## Debugging

### Backend Debugging

```python
# Add logging
import logging
logger = logging.getLogger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.warning("Warning message")
logger.error("Error message")

# View logs in console
# Logs are also saved to logs/ directory
```

### Frontend Debugging

```javascript
// Enable debug mode
window.DEBUG = true;

// Use browser developer tools
console.log('Debug:', variable);

// Inspect application state
window.inspectState();
```

### Common Issues

**1. "API key not found" error**
```bash
# Verify environment variables are set
echo $GEMINI_API_KEY

# Reload environment
source .venv/bin/activate
python -c "import os; print(os.getenv('GEMINI_API_KEY'))"
```

**2. Import errors**
```bash
# Ensure virtual environment is activated
which python  # Should show .venv/bin/python

# Reinstall dependencies
pip install -r requirements.txt
pip install -e src/retrieval_api/
```

**3. Port already in use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
python app.py --port 5001
```

**4. WebSocket connection fails**
- Check that Flask-SocketIO is installed
- Verify eventlet is installed for production
- Check browser console for CORS errors

---

## Database & Storage

The application uses file-based storage:

| Directory | Purpose |
|-----------|---------|
| `uploads/` | User-uploaded files |
| `data/retrieved/` | Downloaded papers |
| `data/grobid_processed/` | Processed PDFs |
| `results/` | MCTS exploration results |
| `logs/` | Application logs |
| `secure_keys/` | Encrypted API keys |

### Clearing Data

```bash
# Clear all temporary data
rm -rf uploads/* data/retrieved/* data/grobid_processed/* results/* logs/*

# Keep secure keys
# secure_keys/ contains encrypted API keys
```

---

## Production Deployment

### Local Production Build

```bash
# Install production dependencies only
pip install -r requirements.txt

# Set production environment
export FLASK_ENV=production
export FLASK_SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Run with Gunicorn
gunicorn app:app --worker-class eventlet -w 1 -b 0.0.0.0:5000
```

### Railway Deployment

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

Key points:
- Use `requirements.txt` (not `requirements-dev.txt`)
- Set `RERANK_MODE=none` to avoid loading torch
- Set required environment variables in Railway dashboard

### Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "app:app", "--worker-class", "eventlet", "-w", "1", "-b", "0.0.0.0:5000"]
```

---

## Contributing

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### Commit Messages

```
type(scope): description

feat(agents): add new summarization agent
fix(retrieval): handle empty search results
docs(api): update endpoint documentation
refactor(mcts): optimize tree traversal
```

### Pull Request Process

1. Create a feature branch
2. Make changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval

---

## API Keys Setup Guide

### Google Gemini

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API key"
4. Copy key to `.env` as `GEMINI_API_KEY`

### Semantic Scholar

1. Go to https://www.semanticscholar.org/product/api
2. Sign up for free account
3. Generate API key from settings
4. Copy key to `.env` as `SEMANTIC_SCHOLAR_API_KEY`

### HuggingFace

1. Go to https://huggingface.co/settings/tokens
2. Sign up or log in
3. Create new access token (read access)
4. Copy key to `.env` as `HUGGINGFACE_API_KEY`

---

## Architecture Decisions

### Why MCTS?

Monte Carlo Tree Search allows systematic exploration of research idea variations. It balances:
- **Exploration**: Trying new approaches
- **Exploitation**: Refining promising ideas

### Why Flask + Socket.IO?

- Flask provides simple, flexible HTTP routing
- Socket.IO enables real-time updates during MCTS exploration
- Both integrate well with Python ML ecosystem

### Why LiteLLM?

LiteLLM provides a unified interface to multiple LLM providers:
- Easy switching between providers
- Consistent API across models
- Built-in retry and fallback logic

### Why Semantic Scholar?

- Free API for academic paper search
- Good coverage of scientific literature
- Structured metadata (authors, citations, etc.)
