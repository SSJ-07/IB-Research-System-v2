# Railway Deployment Guide

## Overview

This guide covers deploying the IB Research System to Railway while keeping the Docker image under 4GB.

**Key Strategy**: The HuggingFace reranker (which requires torch/transformers ~2GB+) is disabled by default on Railway. Retrieval still works using Semantic Scholar's search and synthesis.

## Environment Variables

Set these in Railway Dashboard → Your Service → Variables tab:

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `FLASK_SECRET_KEY` | Random string | Flask session security. Generate with: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GEMINI_API_KEY` | Your API key | Primary LLM provider. Get from: https://aistudio.google.com/apikey |
| `PYTHONUNBUFFERED` | `1` | Ensures logs appear immediately in Railway dashboard |

### Optional Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | Your API key | Alternative LLM provider |
| `SEMANTIC_SCHOLAR_API_KEY` | Your API key | Paper retrieval. Get from: https://www.semanticscholar.org/product/api |
| `DEPLOY` | `true` | Enables deployment mode (affects API key loading) |

### Reranker Configuration (Important!)

| Variable | Value | Description |
|----------|-------|-------------|
| `RERANK_MODE` | `none` (default) | **Do NOT set this on Railway** - leave unset or set to `none` |

**Why?** Setting `RERANK_MODE=hf` would try to load torch/transformers, causing:
- Build failure (missing dependencies)
- Image size explosion (>4GB)

Retrieval works fine without reranking - it just uses Semantic Scholar's native relevance scores.

### Note on PORT

- `PORT` is automatically set by Railway - **DO NOT add manually**
- The app reads `PORT` environment variable automatically

## Local Development with Reranking

To enable HuggingFace reranking locally:

1. Install dev dependencies:
   ```bash
   pip install -r requirements-dev.txt
   ```

2. Set in your `.env` file:
   ```
   RERANK_MODE=hf
   ```

3. Run the app normally - reranking will be enabled.

## Files for Railway Deployment

| File | Purpose |
|------|---------|
| `Procfile` | Gunicorn start command with eventlet worker for SocketIO |
| `requirements.txt` | **Production only** - minimal deps, no torch/transformers |
| `requirements-dev.txt` | **Local dev only** - includes torch/transformers for reranking |
| `runtime.txt` | Python 3.12 specification |
| `.railwayignore` | Excludes heavy/local files from deployment |

## Deployment Checklist

1. ✅ Ensure `requirements.txt` does NOT include torch/transformers
2. ✅ Verify `ai2-scholar-qa` (not `ai2-scholar-qa[all]`) in requirements.txt
3. ✅ `RERANK_MODE` is NOT set (or set to `none`) in Railway Variables
4. ✅ `FLASK_SECRET_KEY` is set with secure random value
5. ✅ `GEMINI_API_KEY` (or another LLM key) is set
6. ✅ `PYTHONUNBUFFERED=1` is set for better logs
7. ✅ All changes committed and pushed to GitHub

## Expected Build Results

With this configuration:
- **Image size**: ~500MB - 1GB (vs 4GB+ with torch)
- **Build time**: ~2-5 minutes
- **Retrieval**: Works (uses Semantic Scholar search + synthesis)
- **Reranking**: Disabled (not a big quality loss for demo)

## Verification

After deployment, check:

1. Railway logs show: `Reranking disabled (RERANK_MODE=none or unset)`
2. No torch/transformers in build logs
3. WebSocket connections work (test real-time features)
4. API endpoints respond (`/api/idea`, `/api/retrieve_knowledge`, etc.)
5. Literature panel shows retrieved papers

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Build exceeds 4GB** | Ensure `requirements.txt` has `ai2-scholar-qa` (not `[all]`). Check for any torch imports. |
| **App won't start** | Check Railway logs for missing env vars |
| **"torch not found" errors** | Good! This means torch isn't installed (correct for prod). Make sure `RERANK_MODE` is unset. |
| **WebSocket issues** | Verify eventlet is in requirements.txt and Procfile uses `--worker-class eventlet` |
| **Retrieval fails** | Check `SEMANTIC_SCHOLAR_API_KEY` is set (optional but improves results) |
| **LLM errors** | Verify `GEMINI_API_KEY` or `OPENAI_API_KEY` is set correctly |

## Architecture Notes

```
Railway (Production)                    Local Development
─────────────────────                   ──────────────────
requirements.txt                        requirements-dev.txt
├─ ai2-scholar-qa                       ├─ -r requirements.txt
├─ flask, gunicorn, etc.                ├─ torch
└─ NO torch/transformers                ├─ transformers
                                        └─ sentence-transformers

RERANK_MODE=none (default)              RERANK_MODE=hf
├─ PaperFinder (no reranker)            ├─ PaperFinderWithReranker
└─ Uses S2 relevance scores             └─ Uses HF cross-encoder
```

## Quick Deploy Commands

```bash
# Verify requirements are correct
grep -i torch requirements.txt  # Should return nothing

# Check ai2-scholar-qa version
grep ai2-scholar-qa requirements.txt  # Should NOT have [all]

# Commit and push
git add .
git commit -m "Railway deployment: disable reranker for <4GB image"
git push origin main
```

Railway will automatically redeploy when you push to your connected branch.
