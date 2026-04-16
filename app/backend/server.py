"""Simple backend scaffold (FastAPI) serving placeholders."""
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from ..frontend.pages.dashboard import dashboard_placeholder

app = FastAPI(title="RoadHazardProject API")


@app.get('/api/health')
def health():
    return JSONResponse({"status": "ok"})


@app.get('/api/dashboard')
def dashboard():
    return JSONResponse(dashboard_placeholder())
