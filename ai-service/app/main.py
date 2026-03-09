from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from keybert import KeyBERT
import time

from .utils.language_detector import detect_language, detect_language_full
from .utils.preprocess import normalize_text
from .models import ModelManager

app = FastAPI(title="AI Service for Multilingual Sentiment Analysis")

# Keyword extraction model (remains global)
kw_model = KeyBERT(model="paraphrase-multilingual-MiniLM-L12-v2")

# ------------------- Request/Response Models -------------------

class AnalyzeRequest(BaseModel):
    text: str
    language: Optional[str] = None

class AnalyzeResponse(BaseModel):
    sentiment: str
    confidence: float
    keywords: List[str]
    language: str

class BenchmarkRequest(BaseModel):
    text: str
    language: Optional[str] = None

class BenchmarkResponse(BaseModel):
    text: str
    detected_language: str
    detection_raw_label: Optional[str] = None
    detection_confidence: Optional[float] = None
    results: List[Dict[str, Any]]

# ------------------- Endpoints -------------------

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    cleaned_text = normalize_text(request.text)
    
    # Detect language if not provided
    language = request.language
    if language is None:
        language = detect_language(cleaned_text)
    
    # Get default model for language
    model = ModelManager.get_model_for_language(language)
    sentiment, confidence = model.predict(cleaned_text, language)
    
    # Extract keywords
    keywords = kw_model.extract_keywords(
        cleaned_text,
        keyphrase_ngram_range=(1, 2),
        stop_words=None,
        top_n=5
    )
    keyword_list = [kw[0] for kw in keywords]
    
    return AnalyzeResponse(
        sentiment=sentiment,
        confidence=confidence,
        keywords=keyword_list,
        language=language
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
    
    # Get all models for this language
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
    
    return BenchmarkResponse(
        text=cleaned_text,
        detected_language=language,
        detection_raw_label=detection_raw,
        detection_confidence=detection_conf,
        results=results
    )

@app.get("/health")
async def health():
    return {"status": "ok"}