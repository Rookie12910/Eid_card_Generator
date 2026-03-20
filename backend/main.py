import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import models
import api
from database import engine

# Create the SQLite tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# Add CORS Middleware to allow requests from the React frontend port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Securely mount static files directory (for images/fonts)
static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if not os.path.exists(static_path):
    os.makedirs(static_path)
app.mount("/static", StaticFiles(directory=static_path), name="static")

# Expose API endpoints
app.include_router(api.router)

@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI Auth and Static server"}
def read_root():
    return {"message": "Hello from FastAPI"}
