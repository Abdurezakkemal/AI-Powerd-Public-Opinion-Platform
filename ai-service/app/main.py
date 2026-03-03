from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from keybert import KeyBERT
from .predict import router as predict_router

app = FastAPI()

# Load models at startup (this may take a few seconds)
print("Loading sentiment model...")
sentiment_pipeline = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-xlm-roberta-base-sentiment"
)

print("Loading keyword extraction model...")
kw_model = KeyBERT(model="paraphrase-multilingual-MiniLM-L12-v2")

class AnalyzeRequest(BaseModel):
    text: str

class AnalyzeResponse(BaseModel):
    sentiment: str
    confidence: float
    keywords: list[str]

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    # Sentiment analysis
    sent_result = sentiment_pipeline(request.text)[0]
    # Convert label to lowercase: 'Positive' -> 'positive'
    label = sent_result['label'].lower()
    confidence = sent_result['score']

    # Keyword extraction (top 5 keywords/phrases)
    keywords = kw_model.extract_keywords(
        request.text,
        keyphrase_ngram_range=(1, 2),
        stop_words=None,
        top_n=5
    )
    keyword_list = [kw[0] for kw in keywords]

    return AnalyzeResponse(
        sentiment=label,
        confidence=confidence,
        keywords=keyword_list
    )

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(predict_router, prefix="/predict", tags=["predict"])