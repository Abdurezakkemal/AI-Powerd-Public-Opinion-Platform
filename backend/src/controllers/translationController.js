const axios = require("axios");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

const TRANSLATE_SPACE_URL = process.env.TRANSLATE_SPACE_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "https://ai-sevice.onrender.com";

const getTranslateEndpoint = () => {
  if (!TRANSLATE_SPACE_URL) return null;
  return TRANSLATE_SPACE_URL.endsWith("/translate")
    ? TRANSLATE_SPACE_URL
    : `${TRANSLATE_SPACE_URL.replace(/\/$/, "")}/translate`;
};

const getCacheKey = (text, sourceLang, targetLang) => {
  const key = `translate:${sourceLang}:${targetLang}:${text}`;
  const crypto = require("crypto");
  return `trans:${crypto.createHash("md5").update(key).digest("hex")}`;
};

// Helper to detect language using AI service
const detectLanguage = async (text) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      { text },
      {
        headers: { "X-Internal-API-Key": INTERNAL_API_KEY },
        timeout: 5000,
      },
    );
    return response.data.language;
  } catch (err) {
    logger.error(
      "Language detection failed, defaulting to English",
      err.message,
    );
    return "en";
  }
};

exports.translate = async (req, res) => {
  try {
    let { text, sourceLang, targetLang = "en" } = req.body;
    
    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "text is required and must be a non-empty string",
        null,
        400,
      );
    }

    // Validate target language
    const supportedLanguages = ['en', 'am', 'om', 'ti'];
    if (!supportedLanguages.includes(targetLang)) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        `targetLang must be one of: ${supportedLanguages.join(', ')}`,
        null,
        400,
      );
    }

    // Auto‑detect source language if not provided
    if (!sourceLang) {
      sourceLang = await detectLanguage(text);
      logger.info(`Auto-detected source language: ${sourceLang}`);
    }

    // Skip translation if source and target are the same
    if (sourceLang === targetLang) {
      return sendSuccess(
        res,
        { translatedText: text },
        "Source and target languages are the same",
      );
    }

    // Check cache
    const cacheKey = getCacheKey(text, sourceLang, targetLang);
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`Translation cache hit for ${sourceLang} -> ${targetLang}`);
      return sendSuccess(
        res,
        { translatedText: cached },
        "Translation retrieved from cache",
      );
    }

    // Validate translation service configuration
    if (!TRANSLATE_SPACE_URL) {
      logger.error("TRANSLATE_SPACE_URL environment variable not set");
      return sendError(
        res,
        ErrorCodes.INTERNAL,
        "Translation service not configured",
        null,
        503,
      );
    }

    const endpoint = getTranslateEndpoint();
    logger.info(`Translating from ${sourceLang} to ${targetLang} using ${endpoint}`);

    // Call translation service
    const response = await axios.post(
      endpoint,
      { 
        text: text.trim(), 
        source_lang: sourceLang, 
        target_lang: targetLang 
      },
      {
        headers: { 
          "X-Internal-API-Key": INTERNAL_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 60000,
      },
    );

    // Extract translated text
    const translated = response.data.translated_text || response.data.translatedText;
    
    if (!translated || typeof translated !== 'string' || translated.trim().length === 0) {
      logger.error("Translation service returned empty or invalid response", response.data);
      return sendError(
        res,
        ErrorCodes.INTERNAL,
        "Translation service returned invalid response",
        null,
        503,
      );
    }

    // Cache the result
    await redisClient.setEx(cacheKey, 86400, translated);
    logger.info(`Translation successful and cached`);

    return sendSuccess(
      res,
      { translatedText: translated },
      "Translation successful",
    );
  } catch (err) {
    logger.error("Translation error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      code: err.code,
    });

    // Handle specific error cases
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return sendError(
        res,
        ErrorCodes.INTERNAL,
        "Translation service timeout. Please try again.",
        null,
        504,
      );
    }

    if (err.response) {
      const status = err.response.status;
      if (status === 401 || status === 403) {
        return sendError(
          res,
          ErrorCodes.INTERNAL,
          "Translation service authentication failed",
          null,
          503,
        );
      }
      if (status === 429) {
        return sendError(
          res,
          ErrorCodes.INTERNAL,
          "Translation service rate limit exceeded. Please try again later.",
          null,
          429,
        );
      }
    }

    return sendError(
      res,
      ErrorCodes.INTERNAL,
      "Translation service unavailable. Please try again later.",
      null,
      503,
    );
  }
};
