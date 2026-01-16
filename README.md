# 🌟 IB Research System


![IB Research System Diagram](assets/Diagram.png)

## 🔗 Setup

This project uses ```uv``` for package management, but you can use any virtual environment.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SSJ-07/IB-Research-System-v2.git
    cd IB-Research-System-v2
    ```

2.  **Activate virtual environment:**
    ```bash
    uv sync
    source .venv/bin/activate 
    ```

3.  **Set Environment Variables:**
    Setup your API keys:
    ```bash
    export SEMANTIC_SCHOLAR_API_KEY="your_semantic_scholar_api_key" 
    export GEMINI_API_KEY="your_google_gemini_api_key" 
    ```

## 🖥️ Running the Application

Ensure your virtual environment is activated, then run:

```bash
python app.py
```

![IB Research System Interface](assets/Interface.png)

## 📋 Requirements

- Semantic Scholar API Key
-  LLM API Key for any provider supported by LiteLLM
