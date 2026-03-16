# AI Service for Multilingual Sentiment Analysis

This FastAPI-based service provides sentiment analysis and keyword extraction for Ethiopian languages (Amharic, Oromo, Tigrinya) and English. It supports multiple sentiment models per language and includes a benchmarking endpoint for comparison.

## Table of Contents

- Overview
- Setup
- Running the Service
- API Endpoints
  - POST /analyze
  - POST /benchmark
  - GET /health
  - GET /predict
- Language Detection
- Models
- Limitations
- Testing with cURL
- Environment Variables

---

## Overview

The service provides two main functions.

**Sentiment Analysis**

Returns one of the following labels:

- positive
- negative
- neutral

A confidence score is also returned.

**Keyword Extraction**

The service extracts the top 5 keywords or phrases from the input text using a multilingual transformer model through KeyBERT.

Language detection is handled using fastText with the `lid.176.bin` model, which supports 176 languages including Ethiopian languages.

---

# Setup

## Requirements

- Python 3.8 or newer
- pip

---

## Installation

Clone the repository and navigate to the AI service directory.

```
cd ai-service
```

Create a virtual environment.

```
python -m venv venv311
venv311\Scripts\activate
```

Install dependencies.

```
pip install -r requirements.txt
```

Create a `.env` file (optional).

```
FASTTEXT_MODEL_PATH=PATH_TO_FASTTEXT_MODEL
```

If this variable is not set, the fastText language detection model will automatically download from HuggingFace during the first run (approximately 1.2GB).

---

# Running the Service

Start the FastAPI server.

```
uvicorn app.main:app --reload --port PORT_NUMBER
```

The service will be available at:

```
http://HOST:PORT_NUMBER
```

Interactive documentation can be accessed at:

```
http://HOST:PORT_NUMBER/docs
```

---

# API Endpoints

---

## POST /analyze

This is the primary endpoint used for sentiment analysis.

It accepts text input and returns:

- detected language
- sentiment label
- confidence score
- extracted keywords

### Request Body

```json
{
  "text": "INPUT_TEXT",
  "language": "LANGUAGE_CODE"
}
```

The `language` field is optional. If it is not provided, the service will automatically detect the language.

---

### Response

```json
{
"sentiment": "SENTIMENT_LABEL",
"confidence": CONFIDENCE_SCORE,
"keywords": [
"KEYWORD_1",
"KEYWORD_2",
"KEYWORD_3",
"KEYWORD_4",
"KEYWORD_5"
],
"language": "LANGUAGE_CODE"
}
```

---

### Example (cURL)

```
curl -X POST http://HOST:PORT_NUMBER/analyze \
-H "Content-Type: application/json" \
-d '{"text": "SAMPLE_TEXT"}'
```

---

## POST /benchmark

This endpoint compares all available sentiment models for a detected or specified language.

It returns:

- normalized text
- detected language
- raw fastText detection label
- confidence score
- results from multiple models
- inference time for each model

This endpoint is mainly used for evaluation and testing.

---

### Request Body

```json
{
  "text": "INPUT_TEXT",
  "language": "LANGUAGE_CODE"
}
```

The language parameter is optional.

---

### Response

```json
{
"text": "NORMALIZED_TEXT",
"detected_language": "LANGUAGE_CODE",
"detection_raw_label": "FASTTEXT_LABEL",
"detection_confidence": CONFIDENCE_SCORE,
"results": [
{
"model_name": "MODEL_NAME",
"sentiment": "SENTIMENT_LABEL",
"confidence": CONFIDENCE_SCORE,
"time_ms": INFERENCE_TIME_MS
}
]
}
```

Multiple models may appear inside the `results` array depending on the detected language.

---

## GET /health

This endpoint checks whether the service is running.

### Response

```json
{
  "status": "ok"
}
```

### GET /predict/predict/:policyId

Generate rating predictions for a policy (internal service only).

Path Parameter:

- policyId – policy ID

Query Parameters (optional):

- days – number of days to predict (default 5)

Response:

```json
{
  "policyId": "60d...",
  "predictions": [
    {
      "date": "2026-03-08",
      "predictedRating": 4.12
    },
    {
      "date": "2026-03-09",
      "predictedRating": 4.08
    }
  ]
}
```

---

# Language Detection

The service uses fastText's `lid.176.bin` model for language detection.

Supported Ethiopian languages include:

- Amharic (am)
- Oromo (om)
- Tigrinya (ti)
- English (en)

Example fastText labels include:

- Amharic → `__label__amh_Ethi`
- Oromo → `__label__gaz_Latn`
- Tigrinya → `__label__tir_Ethi`
- English → `__label__eng_Latn`

If the confidence score from fastText is low, the service defaults to English (`en`).

---

# Models

The AI service supports multiple sentiment models depending on the language.

Amharic:

- Default model: AMHARIC_SENTIMENT_MODEL
- Additional model: Hailay/FT_EXLMR

Oromo:

- Default model: Hailay/FT_EXLMR

Tigrinya:

- Default model: TIROBERTA_SENTIMENT_MODEL
- Additional model: Hailay/FT_EXLMR

English:

- Default model: XLM_ROBERTA_SENTIMENT_MODEL

All models are lazy-loaded and cached in memory after the first use.

---

# Limitations

### Romanized Amharic and Tigrinya

Text written using Latin script may not be correctly detected.

Example:

```
yih polisi tiru new
```

This text may be detected as English instead of Amharic.

Users should write in Ethiopic script whenever possible.

---

### Oromo Dialects

fastText may return dialect codes such as:

- gaz (West Central Oromo)
- hae (Eastern Oromo)

All dialect codes are mapped to `om` in the API response.

---

### Ge'ez Script Oromo

In rare cases, Oromo written using Ethiopic script may be detected as Amharic.

---

### Model Accuracy

Pretrained sentiment models may not perform perfectly across all domains.

The `/benchmark` endpoint can be used to compare model performance on custom test inputs.

---

# Testing with cURL

## Analyze Example

```
curl -X POST http://HOST:PORT_NUMBER/analyze \
-H "Content-Type: application/json" \
-d '{"text": "SAMPLE_AMHARIC_TEXT"}'
```

---

## Benchmark Example

```
curl -X POST http://HOST:PORT_NUMBER/benchmark \
-H "Content-Type: application/json" \
-d '{"text": "SAMPLE_TIGRINYA_TEXT"}'
```

---

# Environment Variables

FASTTEXT_MODEL_PATH

Path to the fastText language detection model.

If this variable is not provided, the model will automatically download to the HuggingFace cache.

---

HF_HOME

Optional directory for HuggingFace model caching.

Default location:

```
~/.cache/huggingface
```
