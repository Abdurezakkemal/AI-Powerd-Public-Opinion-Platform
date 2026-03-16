from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
import time

from .utils.language_detector import detect_language, detect_language_full
from .utils.preprocess import normalize_text
from .models.sentiment import ModelManager
from .models.keywords import KeywordManager

app = FastAPI(title="AI Service for Multilingual Sentiment Analysis")

# ------------------- Request/Response Models -------------------

class AnalyzeRequest(BaseModel):
    text: str
    language: Optional[str] = None

class AnalyzeResponse(BaseModel):
    sentiment: str
    confidence: float
    keywords: List[str]
    language: str
    sentiment_model: str          # NEW: name of sentiment model used
    keyword_model: str            # NEW: name of keyword model used

class BenchmarkRequest(BaseModel):
    text: str
    language: Optional[str] = None

class BenchmarkResponse(BaseModel):
    text: str
    detected_language: str
    detection_raw_label: Optional[str] = None
    detection_confidence: Optional[float] = None
    results: List[Dict[str, Any]]
    keywords: List[str]           # NEW: keywords extracted by default keyword model
    keyword_model: str            # NEW: name of keyword model used

# ------------------- Endpoints -------------------

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    cleaned_text = normalize_text(request.text)
    
    # Detect language if not provided
    language = request.language
    if language is None:
        language = detect_language(cleaned_text)
    
    # Get default sentiment model for language
    sentiment_model = ModelManager.get_model_for_language(language)
    sentiment, confidence = sentiment_model.predict(cleaned_text, language)
    
    # Extract keywords using KeywordManager
    keywords = KeywordManager.extract(cleaned_text, language=language, top_n=5)
    keyword_model_name = KeywordManager.get_default_model_name()
    
    return AnalyzeResponse(
        sentiment=sentiment,
        confidence=confidence,
        keywords=keywords,
        language=language,
        sentiment_model=sentiment_model.name,
        keyword_model=keyword_model_name
    )

@app.post("/benchmark", response_model=BenchmarkResponse)
async def benchmark_models(request: BenchmarkRequest):
    cleaned_text = normalize_text(request.text)
    
    language = request.language
    detection_raw = None
    detection_conf = None
    if language is None:
        detection = detect_language_full(cleaned_text)
        language = detection['language']
        detection_raw = detection['raw_label']
        detection_conf = detection['confidence']
    
    # Get all sentiment models for this language
    models = ModelManager.get_all_models_for_language(language)
    results = []
    
    for model in models:
        start = time.time()
        try:
            sentiment, conf = model.predict(cleaned_text, language)
        except Exception as e:
            sentiment, conf = f"error: {str(e)}", 0.0
        elapsed = (time.time() - start) * 1000  # ms
        
        results.append({
            "model_name": model.name,
            "sentiment": sentiment,
            "confidence": round(conf, 4) if isinstance(conf, float) else conf,
            "time_ms": round(elapsed, 2)
        })
    
    # Extract keywords using default keyword model
    keywords = KeywordManager.extract(cleaned_text, language=language, top_n=5)
    keyword_model_name = KeywordManager.get_default_model_name()
    
    return BenchmarkResponse(
        text=cleaned_text,
        detected_language=language,
        detection_raw_label=detection_raw,
        detection_confidence=detection_conf,
        results=results,
        keywords=keywords,
        keyword_model=keyword_model_name
    )

@app.get("/health")
async def health():
    return {"status": "ok"}