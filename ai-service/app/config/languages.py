# ai-service/app/config/languages.py

SENTIMENT_MODELS = {
    "am": {  # Amharic
        "model": "Hailay/FT_EXLMR",
        "labels": {0: "negative", 1: "neutral", 2: "positive"},  # Verify after first test
        "description": "EXLMR fine-tuned on AfriSenti (supports multiple Ethiopian languages)"
    },
    "om": {  # Afaan Oromo
        "model": "Hailay/FT_EXLMR",
        "labels": {0: "negative", 1: "neutral", 2: "positive"},  # Same model, same labels
        "description": "EXLMR fine-tuned on AfriSenti (supports multiple Ethiopian languages)"
    },
    "ti": {  # Tigrinya
        "model": "Hailay/FT_EXLMR",
        "labels": {0: "negative", 1: "neutral", 2: "positive"},
        "description": "EXLMR fine-tuned on AfriSenti (supports multiple Ethiopian languages)"
    },
    "en": {  # English fallback
        "model": "cardiffnlp/twitter-xlm-roberta-base-sentiment",
        "labels": {0: "negative", 1: "neutral", 2: "positive"},
        "description": "XLM-R fine-tuned on Twitter sentiment"
    }
}