# Railway Deployment Guide

## Environment Variables

Set these in Railway Dashboard → Your Service → Variables tab:

### Required Variables

- **`FLASK_SECRET_KEY`** (Critical)
  - Used for Flask session security
  - Generate a secure random string: `python -c "import secrets; print(secrets.token_hex(32))"`

- **`PYTHONUNBUFFERED=1`** (Recommended)
  - Ensures logs appear immediately in Railway dashboard
  - Set value to `1`

### LLM API Keys (At least one required)

- **`GEMINI_API_KEY`** (Primary LLM provider)
  - Get from: https://aistudio.google.com/apikey
  - Used for ideation and review agents

- **`OPENAI_API_KEY`** (Alternative LLM provider)
  - Get from: https://platform.openai.com/api-keys
  - Can be used instead of or alongside Gemini

- **`AZURE_OPENAI_API_KEY`** (Optional - Azure OpenAI)
  - If using Azure OpenAI, also set `AZURE_OPENAI_ENDPOINT`

### Optional API Keys

- **`SEMANTIC_SCHOLAR_API_KEY`** (Optional)
  - Get from: https://www.semanticscholar.org/product/api
  - Used for paper retrieval features
  - App will work without it, but with limited functionality

- **`HUGGINGFACE_API_KEY`** (Optional)
  - Get from: https://huggingface.co/settings/tokens
  - Used for reranking models if configured

### Deployment Mode (Optional)

- **`DEPLOY=true`** (Optional)
  - Set to `true` to enable deployment mode
  - Affects API key loading behavior

### Note on PORT

- **`PORT`** is automatically set by Railway - DO NOT add manually
- The app reads `PORT` environment variable automatically

## Deployment Checklist

1. ✅ All files committed to Git
2. ✅ Railway connected to GitHub repository
3. ✅ Environment variables set in Railway dashboard
4. ✅ `PYTHONUNBUFFERED=1` set for better logs
5. ✅ `FLASK_SECRET_KEY` set with secure random value

## Files Created for Railway

- `Procfile` - Gunicorn start command with eventlet worker
- `requirements.txt` - Python dependencies
- `runtime.txt` - Python 3.12 specification
- `.railwayignore` - Excluded files from deployment
- `app.py` - Updated to use `PORT` environment variable

## Verification

After deployment, check:
1. Railway logs for startup errors
2. WebSocket connections work (if using SocketIO features)
3. Static files load correctly
4. API endpoints respond

## Troubleshooting

- **Build fails**: Check `requirements.txt` has all dependencies
- **App won't start**: Check Railway logs for missing env vars
- **WebSocket issues**: Verify eventlet is installed and Procfile uses `--worker-class eventlet`
- **Port errors**: Ensure app.py reads `PORT` env var (already updated)

