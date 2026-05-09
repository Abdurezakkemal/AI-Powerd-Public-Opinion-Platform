const axios = require("axios");
const redisClient = require("../config/redis");
const logger = require("../utils/logger");
const {
  sendSuccess,
  sendError,
  ErrorCodes,
} = require("../utils/responseHelper");

const LIBRE_TRANSLATE_URL =
  process.env.LIBRE_TRANSLATE_URL || "http://localhost:5000";

const getCacheKey = (text, sourceLang, targetLang) => {
  return `trans:${Buffer.from(`${sourceLang}|${targetLang}|${text}`).toString("base64")}`;
};

exports.translateText = async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    if (!text || !targetLang) {
      return sendError(
        res,
        ErrorCodes.VALIDATION,
        "text and targetLang are required",
        null,
        400,
      );
    }

    const src = sourceLang || "auto";
    const cacheKey = getCacheKey(text, src, targetLang);
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return sendSuccess(
        res,
        { translatedText: cached },
        "Translation from cache",
      );
    }

    const response = await axios.post(
      `${LIBRE_TRANSLATE_URL}/translate`,
      {
        q: text,
        source: src,
        target: targetLang,
        format: "text",
      },
      { timeout: 10000 },
    );

    const translated = response.data.translatedText;
    await redisClient.setEx(cacheKey, 86400, translated); // cache 24h

    return sendSuccess(
      res,
      { translatedText: translated },
      "Translation successful",
    );
  } catch (err) {
    // logger.error({ error: err.message }, "Translation failed");
    // if (err.code === "ECONNREFUSED") {
    //   return sendError(
    //     res,
    //     ErrorCodes.INTERNAL,
    //     "Translation service not running",
    //     null,
    //     503,
    //   );
    // }
    // return sendError(
    //   res,
    //   ErrorCodes.INTERNAL,
    //   "Failed to translate text",
    //   null,
    //   500,
    // );
    logger.warn(
      { error: err.message },
      "Translation service unavailable – returning fallback",
    );
    // Graceful fallback: return original text with a note
    return sendSuccess(
      res,
      {
        translatedText: `[Translation offline] ${text}`,
      },
      "Translation service unavailable – using fallback",
    );
  }
};
