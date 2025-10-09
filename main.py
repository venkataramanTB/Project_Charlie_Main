from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI()

# Define the path to the frontend build
frontend_build_path = Path(__file__).parent / "frontend" / "build"

# Mount the static folder
app.mount("/static", StaticFiles(directory=frontend_build_path / "static"), name="static")

# Serve index.html for root
@app.get("/")
async def serve_root():
    return FileResponse(frontend_build_path / "index.html")

# Serve index.html for any unmatched frontend routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str, request: Request):
    file_path = frontend_build_path / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    else:
        # This ensures refresh or client-side routing still shows React app
        return FileResponse(frontend_build_path / "index.html")

