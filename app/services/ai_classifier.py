
import os
import json
import logging
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_classifier")

# -----------------------------------------------------------------------------
# Data Models
# -----------------------------------------------------------------------------

class TransactionInput(BaseModel):
    id: str
    merchant_name: str
    amount: float
    date: str  # ISO string or YYYY-MM-DD
    description: Optional[str] = None
    category_hint: Optional[str] = None

class CategoryResult(BaseModel):
    id: str
    category: str
    confidence: float
    source: str # "gemini" | "fallback" | "failsafe"
    reason: Optional[str] = None

class CategorizeRequest(BaseModel):
    transactions: List[TransactionInput]

class CategorizeResponse(BaseModel):
    ok: bool
    mode: str # "gemini" | "fallback" | "failsafe"
    categories: List[CategoryResult]
    error: Optional[Dict[str, Any]] = None

# -----------------------------------------------------------------------------
# Classification Logic
# -----------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

VALID_CATEGORIES = [
    'Dining', 'Groceries', 'Travel', 'Gas', 'Online Shopping',
    'Entertainment', 'Utilities', 'Rent', 'Subscriptions', 'Healthcare', 'Shopping', 'Other'
]

KEYWORD_RULES = {
    'Dining': ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'burger', 'pizza', 'diner', 'sushi', 'bistro', 'eats', 'grill', 'bar', 'pub', 'bakery'],
    'Groceries': ['grocery', 'market', 'supermarket', 'trader joe', 'whole foods', 'kroger', 'safeway', 'walmart', 'costco', 'wegmans', 'aldi', 'lidl'],
    'Travel': ['airline', 'hotel', 'uber', 'lyft', 'taxi', 'flight', 'delta', 'united', 'american airlines', 'airbnb', 'expedia', 'booking.com', 'train', 'amtrak'],
    'Gas': ['gas', 'fuel', 'shell', 'exxon', 'bp', 'chevron', 'texaco', 'wawa', 'speedway', '7-eleven', 'citgo'],
    'Online Shopping': ['amazon', 'shopify', 'paypal', 'ebay', 'etsy', 'chewy', 'apple.com', 'google store'],
    'Subscriptions': ['netflix', 'hulu', 'spotify', 'youtube', 'apple music', 'prime video', 'disney+', 'hbo'],
    'Utilities': ['electric', 'water', 'gas company', 'internet', 'comcast', 'verizon', 'att', 't-mobile'],
    'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'dental', 'medical', 'clinic'],
}

class AIClassifierService:
    @staticmethod
    async def validate_model_availability() -> Dict[str, Any]:
        """Checks if the configured GEMINI_MODEL is available for the key."""
        if not GEMINI_API_KEY:
            logger.error("Validation Failed: Missing GEMINI_API_KEY")
            return {"ok": False, "error": "Missing GEMINI_API_KEY"}

        url = f"{BASE_URL}/models?key={GEMINI_API_KEY}"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url)
                
                if resp.status_code == 403:
                     logger.error("Validation Failed: API Key Invalid (403)")
                     return {"ok": False, "error": "API Key Invalid (403)"}
                
                resp.raise_for_status()
                data = resp.json()
                
                # Check if our model exists in the list
                target_model = f"models/{GEMINI_MODEL}"
                available_models = [m['name'] for m in data.get('models', [])]
                
                if target_model not in available_models:
                     logger.warning(f"Validation Warning: Model {GEMINI_MODEL} not found in user's list. Available: {available_models[:3]}...")
                     # We don't block startup, but we log it. It might be a region issue or just not listed but accessible? 
                     # Usually if not listing, it won't work.
                     return {"ok": False, "error": f"Model {GEMINI_MODEL} not found in available models", "available": available_models}

                logger.info(f"Validation Success: {GEMINI_MODEL} is available.")
                return {"ok": True, "model": GEMINI_MODEL}

        except Exception as e:
            logger.error(f"Validation Failed: {e}")
            return {"ok": False, "error": str(e)}

    @staticmethod
    async def run_self_test() -> Dict[str, Any]:
        """Runs a full self-test: ListModels + GenerateContent"""
        # Step A: Validate Model
        validation = await AIClassifierService.validate_model_availability()
        if not validation["ok"]:
            return {
                "ok": False,
                "step": "validation",
                "error": validation["error"]
            }

        # Step B: Tiny Generation
        url = f"{BASE_URL}/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": "Hello"}]}],
            "generationConfig": {"maxOutputTokens": 5}
        }
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(url, json=payload)
                
                if resp.status_code != 200:
                    return {
                        "ok": False, 
                        "step": "generation", 
                        "status": resp.status_code, 
                        "error": resp.text
                    }
                
                return {"ok": True, "mode": "gemini", "details": "Self-test passed"}
                
        except Exception as e:
            return {"ok": False, "step": "generation", "error": str(e)}

    @staticmethod
    async def categorize_batch(transactions: List[TransactionInput]) -> CategorizeResponse:
        # 1. Try Gemini
        try:
            if not GEMINI_API_KEY:
                raise ValueError("Missing GEMINI_API_KEY")
            
            return await AIClassifierService._categorize_with_gemini(transactions)
        
        except httpx.HTTPStatusError as http_err:
            # Capture specific HTTP codes
            code = http_err.response.status_code
            msg = f"HTTP {code}"
            
            if code == 404: msg = f"404: Model {GEMINI_MODEL} Not Found"
            elif code == 403: msg = "403: Invalid API Key"
            elif code == 429: msg = "429: Quota Exceeded"
            
            logger.warning(f"Gemini HTTP Error: {msg}. Switching to Fallback.")
            return AIClassifierService._get_fallback_response(transactions, {"code": str(code), "message": msg})

        except Exception as e:
            logger.warning(f"Gemini failed: {e}. Switching to Fallback.")
            return AIClassifierService._get_fallback_response(transactions, {"code": "GEMINI_ERROR", "message": str(e)})

    @staticmethod
    def _get_fallback_response(transactions: List[TransactionInput], error_details: Dict[str, Any]) -> CategorizeResponse:
        results = []
        for tx in transactions:
            results.append(AIClassifierService._categorize_deterministic(tx, source="fallback"))
            
        return CategorizeResponse(
            ok=True,
            mode="fallback",
            categories=results,
            error=error_details
        )

    @staticmethod
    async def _categorize_with_gemini(transactions: List[TransactionInput]) -> CategorizeResponse:
        # Construct Prompt
        tx_lines = []
        for tx in transactions:
            tx_lines.append(f"- ID: {tx.id} | Merchant: {tx.merchant_name} | Amount: ${tx.amount} | Desc: {tx.description or ''}")
        
        tx_block = "\n".join(tx_lines)
        
        prompt = f"""
        You are a financial transaction classifier.
        Valid Categories: {', '.join(VALID_CATEGORIES)}
        
        Transactions:
        {tx_block}
        
        Task: Classify each transaction.
        Return JSON Array ONLY: [{{ "id": "tx_id", "category": "CategoryName", "confidence": 0.95 }}]
        """
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }
        
        url = f"{BASE_URL}/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status() # Raises HTTPStatusError for non-200
            data = resp.json()
            
            # Extract JSON from response
            try:
                candidate = data.get('candidates', [{}])[0]
                content_text = candidate.get('content', {}).get('parts', [{}])[0].get('text', '')
                
                if not content_text:
                     raise ValueError("Empty response from Gemini")

                parsed = json.loads(content_text)
                
                # Map back to results
                results = []
                # Ensure parsed is a list
                if not isinstance(parsed, list):
                     parsed = [parsed] if isinstance(parsed, dict) else []

                parsed_map = {item['id']: item for item in parsed if 'id' in item}
                
                for tx in transactions:
                    if tx.id in parsed_map:
                        p = parsed_map[tx.id]
                        results.append(CategoryResult(
                            id=tx.id,
                            category=p.get('category', 'Other'),
                            confidence=p.get('confidence', 0.8),
                            source="gemini"
                        ))
                    else:
                        # Partial failure -> fallback for this item
                        results.append(AIClassifierService._categorize_deterministic(tx, source="fallback"))

                return CategorizeResponse(ok=True, mode="gemini", categories=results)

            except (KeyError, json.JSONDecodeError, IndexError, ValueError) as parse_err:
                raise ValueError(f"Failed to parse Gemini response: {parse_err}")

    @staticmethod
    def _categorize_deterministic(tx: TransactionInput, source: str) -> CategoryResult:
        merchant_lower = tx.merchant_name.lower()
        desc_lower = (tx.description or "").lower()
        full_text = f"{merchant_lower} {desc_lower}"
        
        for category, keywords in KEYWORD_RULES.items():
            for kw in keywords:
                if kw in full_text:
                    return CategoryResult(
                        id=tx.id,
                        category=category,
                        confidence=0.6, # Moderate confidence for rule match
                        source=source,
                        reason=f"Matched keyword: {kw}"
                    )
        
        # Heuristic: 'Other' is low confidence
        return CategoryResult(id=tx.id, category="Other", confidence=0.2, source=source + "_default")
