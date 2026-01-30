from fastapi import FastAPI
from sqlalchemy import text
from app.database import engine
from contextlib import asynccontextmanager
from app.services.ai_classifier import AIClassifierService, CategorizeRequest, CategorizeResponse
import logging

# Check model on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Startup: Validating AI Model...")
    await AIClassifierService.validate_model_availability()
    yield
    logging.info("Shutdown")

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/db-check")
async def db_check():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1 AS ok"))
        return {"db": True, "result": result.mappings().first()}

# --- AI Integration ---

@app.post("/ai/categorize", response_model=CategorizeResponse)
async def categorize_transactions(payload: CategorizeRequest):
    return await AIClassifierService.categorize_batch(payload.transactions)

@app.get("/ai/selftest")
async def ai_selftest():
    return await AIClassifierService.run_self_test()
