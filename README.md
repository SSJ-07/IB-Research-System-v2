# 🌟 IB Research System

## 🎯 What This Application Does

The **IB Research System** is an AI-powered research assistant designed to help International Baccalaureate (IB) students and researchers:

### Core Features

1. **Research Idea Generation** 🤔
   - Generate initial research ideas and questions based on your research goals
   - Create structured research briefs with proposed methods and experiment plans
   - Support for IB subjects (Physics, Chemistry, etc.) with subject-specific formatting

2. **Structured Review & Evaluation** 📊
   - Multi-dimensional review of research ideas across 5 key aspects:
     - Feasibility, Originality, Clarity, Methodology, and Impact
   - Receive detailed feedback and scores to improve your research proposals
   - Iterative refinement based on review feedback

3. **Academic Paper Retrieval** 📚
   - Search and retrieve relevant academic papers from Semantic Scholar
   - Intelligent reranking of results using Hugging Face models
   - Extract and organize relevant quotes and citations from papers
   - Build a knowledge base of retrieved literature

4. **Interactive Research Exploration** 🔍
   - Chat-based interface for natural interaction with the system
   - Monte Carlo Tree Search (MCTS) for exploring research idea variations
   - Real-time feedback and suggestions

5. **Knowledge Synthesis** 🧠
   - Combine information from multiple sources
   - Generate comprehensive research proposals with proper citations
   - Validate research questions against IB requirements

### Use Cases

- **IB Students**: Generate and refine Extended Essay (EE) or Internal Assessment (IA) research questions
- **Researchers**: Explore research ideas and find relevant literature quickly
- **Educators**: Guide students through the research ideation process

## 🔗 Setup Instructions

### Prerequisites

- Python 3.12+ (recommended: Python 3.13)
- `uv` package manager (or any Python virtual environment tool)
- API keys (see Requirements section below)

### Step 1: Clone the Repository

```bash
git clone https://github.com/SSJ-07/IB-Research-System-v2.git
cd IB-Research-System-v2
```

### Step 2: Set Up Virtual Environment

This project uses `uv` for package management, but you can use any virtual environment.

```bash
# Install dependencies and create virtual environment
uv sync

# Activate the virtual environment
source .venv/bin/activate
```

**Alternative** (if not using `uv`):
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt  # If available
```

### Step 3: Configure API Keys

The application requires several API keys to function. Set them as environment variables:

```bash
# Required API Keys
export SEMANTIC_SCHOLAR_API_KEY="your_semantic_scholar_api_key"
export GEMINI_API_KEY="your_google_gemini_api_key"
export HUGGINGFACE_API_KEY="your_huggingface_api_key"

# Optional: Alternative LLM providers (if not using Gemini)
export OPENAI_API_KEY="your_openai_api_key"  # For OpenAI models
export ANTHROPIC_API_KEY="your_anthropic_api_key"  # For Claude models
```

**Alternative: Using a `.env` file**

Create a `.env` file in the project root:

```bash
SEMANTIC_SCHOLAR_API_KEY=your_semantic_scholar_api_key
GEMINI_API_KEY=your_google_gemini_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

The application will automatically load these from the `.env` file if `python-dotenv` is installed.

### Step 4: Get Your API Keys

1. **Semantic Scholar API Key**
   - Visit: https://www.semanticscholar.org/product/api
   - Sign up for a free account
   - Generate an API key from your account settings

2. **Google Gemini API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Create a new API key

3. **Hugging Face API Key**
   - Visit: https://huggingface.co/settings/tokens
   - Sign up or log in to Hugging Face
   - Create a new access token (read access is sufficient for most models)

## 🖥️ Running the Application

Ensure your virtual environment is activated, then run:

```bash
python app.py
```

The application will start a Flask web server. Open your browser and navigate to:

```
http://localhost:5000
```


## 📋 Requirements

### Required API Keys

- **Semantic Scholar API Key** - For retrieving academic papers and literature
- **LLM API Key** - For AI-powered text generation and analysis
  - **Primary**: Google Gemini API Key (recommended)
  - **Alternatives**: Any provider supported by [LiteLLM](https://docs.litellm.ai/docs/providers) (OpenAI, Anthropic, etc.)
- **Hugging Face API Key** - For accessing reranking models and other ML models

### System Requirements

- Python 3.12 or higher
- Sufficient disk space for:
  - Python packages and dependencies
  - Downloaded ML models (cached locally)
  - Retrieved papers and processed documents

### Dependencies

All dependencies are managed through `uv` (or `pip`). Key dependencies include:
- Flask & Flask-SocketIO (web framework)
- LiteLLM (LLM integration)
- Semantic Scholar API client
- Hugging Face Transformers & Hub
- PyMuPDF (PDF processing)
- And more (see `pyproject.toml` or `uv.lock`)

## 🚀 Quick Start Guide

1. **Start the application** (see Running the Application above)
2. **Open the web interface** at `http://localhost:5000`
3. **Enter a research goal** in the chat interface (e.g., "I want to study the effects of temperature on enzyme activity")
4. **Generate an idea** - The system will create a structured research proposal
5. **Review the idea** - Get feedback across multiple dimensions
6. **Retrieve papers** - Search for relevant academic literature
7. **Refine and iterate** - Use the feedback to improve your research question

## 🛠️ Troubleshooting

### API Key Issues

- **"API key not found" errors**: Make sure environment variables are set correctly
- **403 Forbidden errors**: Verify your API keys are valid and have proper permissions
- **Rate limit errors**: Some APIs have usage limits; wait and try again

### Import Errors

- Ensure virtual environment is activated: `source .venv/bin/activate`
- Reinstall dependencies: `uv sync` or `pip install -r requirements.txt`

### Port Already in Use

If port 5000 is already in use, you can modify `app.py` to use a different port, or set:
```bash
export FLASK_RUN_PORT=5001
```


**Need Help?** Check the code comments, configuration files in `config/`, or open an issue on GitHub.

## Documentation

For comprehensive documentation, see the [`docs/`](./docs/) directory:

| Document | Description |
|----------|-------------|
| [Architecture](./docs/ARCHITECTURE.md) | System architecture, code maps, and component diagrams |
| [API Reference](./docs/API.md) | Complete API reference with all endpoints |
| [Frontend Guide](./docs/FRONTEND.md) | Frontend architecture and JavaScript modules |
| [Development Guide](./docs/DEVELOPMENT.md) | Developer setup and contribution guidelines |

Additional documentation:
- [Prompts & Metrics](./PROMPTS_AND_METRICS.md) - LLM prompts and evaluation metrics
- [Railway Deployment](./RAILWAY_DEPLOYMENT.md) - Production deployment guide

## Project Structure

```
IB-Research-System-v2/
├── app.py                  # Main Flask application
├── config/                 # Configuration files
│   ├── config.yaml         # Main app configuration
│   └── ib/                 # IB-specific configs
├── src/                    # Source code
│   ├── agents/             # AI agents (Ideation, Review, Retrieval)
│   ├── mcts/               # Monte Carlo Tree Search
│   └── retrieval_api/      # ScholarQA integration
├── static/                 # Frontend assets (JS, CSS)
├── templates/              # HTML templates
├── docs/                   # Documentation
└── requirements.txt        # Python dependencies
```

## License

This project is for educational purposes.
