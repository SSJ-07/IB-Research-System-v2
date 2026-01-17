# IB Research System Documentation

Welcome to the IB Research System documentation. This directory contains comprehensive documentation for understanding, using, and developing the system.

## Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, code maps, and component diagrams |
| [API.md](./API.md) | Complete API reference with endpoints and examples |
| [FRONTEND.md](./FRONTEND.md) | Frontend architecture, components, and JavaScript modules |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Developer setup guide and contribution guidelines |

## Quick Links

### For Users
- [Main README](../README.md) - Getting started and basic usage
- [Setup Complete](../SETUP_COMPLETE.md) - Quick verification checklist

### For Developers
- [Development Guide](./DEVELOPMENT.md) - Local setup and workflow
- [API Reference](./API.md) - All available endpoints
- [Architecture](./ARCHITECTURE.md) - System design and code maps

### For Deployment
- [Railway Deployment](../RAILWAY_DEPLOYMENT.md) - Production deployment guide
- [Prompts & Metrics](../PROMPTS_AND_METRICS.md) - LLM prompts documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    IB Research System                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend          │  Backend            │  External APIs   │
│  ─────────         │  ───────            │  ─────────────   │
│  - HTML/CSS/JS     │  - Flask            │  - Google Gemini │
│  - jQuery          │  - Flask-SocketIO   │  - Semantic      │
│  - D3.js           │  - MCTS Engine      │    Scholar       │
│  - Socket.IO       │  - Agent System     │  - HuggingFace   │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

1. **AI-Powered Research Ideation**
   - Generate research ideas from goals
   - Multi-dimensional review and scoring
   - Iterative refinement with feedback

2. **Monte Carlo Tree Search**
   - Systematic exploration of idea variations
   - Real-time visualization of search tree
   - UCT-based selection for balance

3. **Academic Paper Retrieval**
   - Semantic Scholar integration
   - Intelligent reranking (optional)
   - Literature-informed refinement

4. **IB-Specific Support**
   - Physics and Chemistry IA topics
   - Research question validation
   - Section expansion with citations

## Architecture Diagram

```
User Input → Flask App → Agent System → LLM (Gemini)
                │              │
                │              └→ Retrieval → Semantic Scholar
                │
                └→ MCTS Engine → Tree Updates → WebSocket → Frontend
```

## Getting Help

- Check the relevant documentation file above
- Review existing [GitHub Issues](https://github.com/SSJ-07/IB-Research-System-v2/issues)
- Open a new issue for bugs or feature requests
