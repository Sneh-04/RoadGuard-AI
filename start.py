import os
import uvicorn

# Create necessary directories
os.makedirs("models", exist_ok=True)
os.makedirs("data", exist_ok=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.backend.api.main:app", host="0.0.0.0", port=port)
