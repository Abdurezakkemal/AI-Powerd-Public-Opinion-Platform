# AI Service API Documentation

## 1. Overview

The AI service provides sentiment analysis and keyword extraction for Ethiopian languages (Amharic, Oromo, Tigrinya) and English. It is a FastAPI application called by the backend worker (not exposed to clients).

Features:

-Sentiment labels: positive, negative, neutral (with confidence score)
-Keyword extraction (top 5)
-Language detection (fastText with mapping for Oromo dialects)
-Multiple sentiment models per language
-Benchmarking endpoint to compare models

## 2. Base URL (internal)

| Environment    | URL                          |
| -------------- | ---------------------------- |
| Local (Docker) | **`http://ai-service:8000`** |
| Local (direct) | **`http://localhost:8000`**  |
| Production     | Internal network only        |

## 3. Authentication

All endpoints except `/health` require an internal API key.

Include the key in the request header:

```http
X-Internal-API-Key: your-internal-api-key
```

The key must match the `INTERNAL_API_KEY` environment variable set in both the AI service and the backend. Requests without a valid key receive a `403 Forbidden` response with a JSON error body.

## 4. Uniform Response Format

The service returns plain JSON (no status wrapper). Error responses are HTTP 500 with a JSON error object.

Success example (**`/analyze`**):

```json
{
  "sentiment": "positive",
  "confidence": 0.95,
  "keywords": ["water", "access"],
  "language": "am",
  "sentiment_model": "rasyosef/bert-medium-amharic-finetuned-sentiment",
  "keyword_model": "keybert"
}
```

Special case (cannot analyze):

```json
{ "status": "cannot_analyze" }
```

Error example:

```json
**`{ "detail": "Model loading failed" }`**
```

## 5. Endpoints

### 5.1 POST /analyze

Primary endpoint for sentiment and keyword extraction.

Request body:

| Field    | Type   | Required | Description                                                                 |
| -------- | ------ | -------- | --------------------------------------------------------------------------- |
| text     | string | yes      | Comment text (max 500 chars)                                                |
| language | string | no       | ISO code (**`am`**, **`om`**, **`ti`**, **`en`**); auto‑detected if omitted |

Response (200 OK):

| Field                 | Type             | Description                                      |
| --------------------- | ---------------- | ------------------------------------------------ |
| **`sentiment`**       | string           | **`positive`**, **`negative`**, or **`neutral`** |
| **`confidence`**      | float            | 0.0–1.0                                          |
| **`keywords`**        | array of strings | Top 5 keywords                                   |
| **`language`**        | string           | Detected or provided language code               |
| **`sentiment_model`** | string           | HuggingFace model ID used                        |
| **`keyword_model`**   | string           | Always keybert                                   |

Special response (200 OK):

```json
{ "status": "cannot_analyze" }
```

(occurs when text is empty or cannot be processed)

Error responses:

| Status | Code                  | Description                  |
| ------ | --------------------- | ---------------------------- |
| 500    | Internal Server Error | JSON with **`detail`** field |

### 5.2 POST /benchmark

Runs all sentiment models for the detected language and returns comparison results.

Request body: same as **`/analyze`**.

Response (200 OK):

| Field                      | Type   | Description                                                                                          |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| **`text`**                 | string | Normalised input text                                                                                |
| **`detected_language`**    | string | Two‑letter code                                                                                      |
| **`detection_raw_label`**  | string | Raw fastText label (e.g., **`__label__amh_Ethi`**)                                                   |
| **`detection_confidence`** | float  | fastText confidence                                                                                  |
| **`results`**              | array  | List of model results (each with **`model_name`**, **`sentiment`**, **`confidence`**, **`time_ms`**) |
| **`keywords`**             | array  | Top keywords from default model                                                                      |
| **`keyword_model`**        | string | Always **`keybert`**                                                                                 |

Example response:

```json
{
  "text": "ይህ ፖሊሲ ጥሩ ነው",
  "detected_language": "am",
  "detection_raw_label": "**`__label__amh_Ethi`**",
  "detection_confidence": 0.98,
  "results": [
    {
      "model_name": "rasyosef/bert-medium-amharic-finetuned-sentiment",
      "sentiment": "positive",
      "confidence": 0.95,
      "time_ms": 45.2
    },
    {
      "model_name": "Hailay/FT_EXLMR",
      "sentiment": "positive",
      "confidence": 0.91,
      "time_ms": 123.5
    }
  ],
  "keywords": ["ፖሊሲ", "ጥሩ"],
  "keyword_model": "keybert"
}
```

Error responses: same as **`/analyze`**.

### 5.3 GET /health

Health check.

Response (200 OK):

```json
{ "status": "ok" }
```

## 5.4 POST /suggest-topics

**New endpoint** – suggests policy topics from a predefined list using zero‑shot classification. Supports Amharic, Oromo, Tigrinya, and English.

**Request body:**

| Field            | Type   | Required | Description                                             |
| ---------------- | ------ | -------- | ------------------------------------------------------- |
| text             | string | yes      | Policy title and description (min 10 chars)             |
| candidate_topics | array  | no       | Custom topic list (if omitted, uses default 30+ topics) |

**Response (200 OK):**

| Field  | Type  | Description                                                 |
| ------ | ----- | ----------------------------------------------------------- |
| topics | array | List of objects with `topic` and `confidence` (sorted desc) |

**Example response:**

```json
{
  "topics": [
    { "topic": "Health", "confidence": 0.417 },
    { "topic": "Poverty Reduction", "confidence": 0.162 },
    { "topic": "Infrastructure", "confidence": 0.144 }
  ]
}
```

**Error responses:** same as `/analyze` (500 with `{"detail": "..."}`).

**Default topics** (30+ categories for policy domains):

    - Health, Education, Water Supply, Electricity, Housing, Transport, Roads, Bridges, Railways, Airports, Digital Infrastructure
    - Agriculture, Irrigation, Livestock, Forestry, Environment, Climate Change
    - Economy, Employment, Small Business, Industry, Trade, Tourism
    - Social Protection, Pension, Disability Support, Food Security, Poverty Reduction
    - Governance, Justice, Police, Defense, Public Safety
    - Urban Planning, Rural Development, Land Administration, Migration
    - Sports, Culture, Youth, Women Affairs, Diaspora

## 6. Language Detection

Uses fastText with model **`lid.176.bin`** (1.2 GB). Auto‑downloads on first run if not present.

Supported languages and detection mapping:

| Language | Code     | Example fastText labels                                                                            |
| -------- | -------- | -------------------------------------------------------------------------------------------------- |
| Amharic  | **`am`** | **`__label__amh_Ethi`**                                                                            |
| Oromo    | **`om`** | **`__label__gaz_Latn`**, **`__label__orm_Latn`**, **`__label__hae_Latn`** (all mapped to **`om`**) |
| Tigrinya | **`ti`** | **`__label__tir_Ethi`**                                                                            |
| English  | **`en`** | **`__label__eng_Latn`**                                                                            |

If confidence is low or detection fails, the service defaults to en.

## 7. Sentiment Models

Models are lazy‑loaded and cached in memory.

| Language              | Model ID                                               | Type     |
| --------------------- | ------------------------------------------------------ | -------- |
| Amharic               | **`rasyosef/bert-medium-amharic-finetuned-sentiment`** | Pipeline |
| Amharic (additional)  | **`Hailay/FT_EXLMR`**                                  | Custom   |
| Oromo                 | **`Hailay/FT_EXLMR`**                                  | Custom   |
| Tigrinya              | **`fgaim/tiroberta-sentiment`**                        | Pipeline |
| Tigrinya (additional) | **`Hailay/FT_EXLMR`**                                  | Custom   |
| English               | **`cardiffnlp/twitter-xlm-roberta-base-sentiment`**    | Pipeline |

## 8. Keyword Extraction

- Model: KeyBERT with sentence transformer **`paraphrase-multilingual-MiniLM-L12-v2`**
- Output: Top 5 keywords (cleaned, deduplicated, min length 3)
- Stopwords: Used for Amharic, Oromo, Tigrinya, English

The keyword model is also lazy‑loaded and cached.

## 9. Limitations

| Issue                      | Description                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| Romanised Amharic/Tigrinya | Latin script text may be detected as English. Use Ethiopic script for best results.                   |
| Oromo dialects             | fastText dialect codes (**`gaz`**,**`hae`**, etc.) are mapped to **`om`** – no loss of functionality. |
| Ge'ez script Oromo         | May rarely be detected as Amharic.                                                                    |
| Model accuracy             | Pretrained models may not be perfect across all domains; use **`/benchmark`** to compare.             |

## 10. Environment Variables

| Variable                  | Description                        | Default                              |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| **`FASTTEXT_MODEL_PATH`** | Path to fastText **`lid.176.bin`** | Auto‑downloaded to HuggingFace cache |
| **`HF_HOME`**             | HuggingFace cache directory        | **`~/.cache/huggingface`**           |

## 11. Example cURL Commands

Analyze (Amharic)

```bash
curl -X POST http://localhost:8000/analyze \
 -H "Content-Type: application/json" \
 -d '{"text": "ይህ ፖሊሲ ጥሩ ነው"}'
```

Analyze (auto language detection)

```bash
curl -X POST http://localhost:8000/analyze \
 -H "Content-Type: application/json" \
 -d '{"text": "This policy is great"}'
```

Benchmark (Tigrinya)

```bash
curl -X POST http://localhost:8000/benchmark \
 -H "Content-Type: application/json" \
 -d '{"text": "እዚ ፖሊሲ ጽቡቕ እዩ"}'
```

Health check

```bash
curl http://localhost:8000`/health
```
