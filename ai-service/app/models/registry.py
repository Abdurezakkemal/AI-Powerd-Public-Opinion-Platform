# Registry of all available models with metadata
MODEL_REGISTRY = {
    "ti": [
        {
            "name": "fgaim/tiroberta-sentiment",
            "type": "pipeline",
            "task": "sentiment-analysis",
            "languages": ["ti"],
            "description": "TiRoBERTa fine-tuned on Tigrinya YouTube comments"
        },
        {
            "name": "Hailay/FT_EXLMR",
            "type": "custom",
            "languages": ["ti", "am", "om"],
            "description": "EXLMR fine-tuned on AfriSenti (multilingual)"
        },
        {
            "name": "cardiffnlp/twitter-xlm-roberta-base-sentiment",
            "type": "pipeline",
            "task": "sentiment-analysis",
            "languages": ["en", "ti", "am", "om"],
            "description": "XLM-R Twitter sentiment (multilingual baseline)"
        }
    ],
    "am": [
        {
            "name": "rasyosef/bert-medium-amharic-finetuned-sentiment",
            "type": "pipeline",
            "task": "text-classification",
            "languages": ["am"],
            "description": "BERT-medium fine-tuned on Amharic sentiment dataset"
        },
        {
            "name": "Hailay/FT_EXLMR",
            "type": "custom",
            "languages": ["am", "ti", "om"],
            "description": "EXLMR fine-tuned on AfriSenti"
        },
        {
            "name": "cardiffnlp/twitter-xlm-roberta-base-sentiment",
            "type": "pipeline",
            "task": "sentiment-analysis",
            "languages": ["en", "ti", "am", "om"],
            "description": "XLM-R Twitter sentiment (multilingual baseline)"
        }
    ],
    "om": [
        {
            "name": "Hailay/FT_EXLMR",
            "type": "custom",
            "languages": ["om", "am", "ti"],
            "description": "EXLMR fine-tuned on AfriSenti"
        },
        {
            "name": "cardiffnlp/twitter-xlm-roberta-base-sentiment",
            "type": "pipeline",
            "task": "sentiment-analysis",
            "languages": ["en", "ti", "am", "om"],
            "description": "XLM-R Twitter sentiment (multilingual baseline)"
        }
    ],
    "en": [
        {
            "name": "cardiffnlp/twitter-xlm-roberta-base-sentiment",
            "type": "pipeline",
            "task": "sentiment-analysis",
            "languages": ["en"],
            "description": "XLM-R Twitter sentiment"
        }
    ]
}

# Flat list of all unique models (for benchmarking)
ALL_MODELS = []
seen = set()
for lang_models in MODEL_REGISTRY.values():
    for model in lang_models:
        if model["name"] not in seen:
            seen.add(model["name"])
            ALL_MODELS.append(model)