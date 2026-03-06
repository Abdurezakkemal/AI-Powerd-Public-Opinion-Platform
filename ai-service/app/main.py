from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from keybert import KeyBERT

# Import your modules
from .models.sentiment import SentimentModel
from .utils.language_detector import detect_language
from .utils.preprocess import normalize_text
from .config.languages import SENTIMENT_MODELS
from .predict import router as predict_router

app = FastAPI(title="AI Service for Multilingual Sentiment Analysis")

# Initialize models (lazy loading)
sentiment_model = SentimentModel()
kw_model = KeyBERT(model="paraphrase-multilingual-MiniLM-L12-v2")

class AnalyzeRequest(BaseModel):
    text: str
    language: Optional[str] = None

class AnalyzeResponse(BaseModel):
    sentiment: str
    confidence: float
    keywords: list[str]
    language: str

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    # 1. Normalize input text
    cleaned_text = normalize_text(request.text)
    
    # 2. Detect language if not provided
    language = request.language
    if language is None:
        language = detect_language(cleaned_text)
        print(f"Detected language: {language}")
    
    # 3. Get sentiment from appropriate model
    try:
        sentiment, confidence = sentiment_model.analyze(cleaned_text, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")
    
    # 4. Extract keywords (multilingual)
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

# ------------------- New Comparison Endpoint -------------------

class CompareRequest(BaseModel):
    text: str
    language: Optional[str] = None

class CompareResponse(BaseModel):
    primary: dict
    english: dict
    detected_language: str
    text: str

@app.post("/compare", response_model=CompareResponse)
async def compare_models(request: CompareRequest):
    # 1. Normalize text
    cleaned_text = normalize_text(request.text)
    
    # 2. Determine language (use provided or detect)
    language = request.language
    if language is None:
        language = detect_language(cleaned_text)
        print(f"Detected language: {language}")
    
    # 3. Get primary model result (language‑specific)
    try:
        prim_sent, prim_conf = sentiment_model.analyze(cleaned_text, language)
        primary_model = SENTIMENT_MODELS.get(language, SENTIMENT_MODELS["en"])["model"]
    except Exception:
        # Fallback to English if primary fails
        prim_sent, prim_conf = sentiment_model.analyze(cleaned_text, "en")
        primary_model = SENTIMENT_MODELS["en"]["model"]
        language = "en"  # adjust detected language
    
    # 4. Get English model result (force "en")
    eng_sent, eng_conf = sentiment_model.analyze(cleaned_text, "en")
    english_model = SENTIMENT_MODELS["en"]["model"]
    
    # 5. Extract keywords (same for both – we can return one set)
    keywords = kw_model.extract_keywords(
        cleaned_text,
        keyphrase_ngram_range=(1, 2),
        stop_words=None,
        top_n=5
    )
    keyword_list = [kw[0] for kw in keywords]
    
    # 6. Build response
    return CompareResponse(
        primary={
            "sentiment": prim_sent,
            "confidence": prim_conf,
            "keywords": keyword_list,
            "model_used": primary_model
        },
        english={
            "sentiment": eng_sent,
            "confidence": eng_conf,
            "keywords": keyword_list,
            "model_used": english_model
        },
        detected_language=language,
        text=cleaned_text
    )

# ------------------- End of Comparison Endpoint -------------------

@app.get("/health")
async def health():
    return {"status": "ok"}

# Include prediction router (for enhanced analytics)
app.include_router(predict_router, prefix="/predict", tags=["predict"])