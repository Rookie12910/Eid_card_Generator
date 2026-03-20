import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
import api
from database import engine

# Create the database tables
try:
    models.Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Skipping database creation: {e}")

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose API endpoints
app.include_router(api.router)

@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI"}
