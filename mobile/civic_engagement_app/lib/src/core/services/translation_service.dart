import '../network/api_client.dart';

class TranslationService {
  TranslationService(this._apiClient);

  final ApiClient _apiClient;
  final Map<String, String> _cache = {};

  Future<String> translate({
    required String text,
    required String targetLang,
    String sourceLang = 'en',
  }) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || targetLang == sourceLang) return trimmed;

    final cacheKey = '$sourceLang:$targetLang:$trimmed';
    final cached = _cache[cacheKey];
    if (cached != null) {
      print('[TranslationService] Cache hit for $sourceLang -> $targetLang');
      return cached;
    }

    print('[TranslationService] Translating from $sourceLang to $targetLang');
    print('[TranslationService] Text: ${trimmed.substring(0, trimmed.length > 50 ? 50 : trimmed.length)}...');

    try {
      final response = await _apiClient.post(
        '/translate',
        body: {
          'text': trimmed,
          'sourceLang': sourceLang,
          'targetLang': targetLang,
        },
      );

      print('[TranslationService] Response received: ${response.data}');

      final translated = _translatedText(response.data);
      if (translated == null || translated.trim().isEmpty) {
        print('[TranslationService] ERROR: Empty translation response');
        throw const FormatException('Translation response did not include text.');
      }

      _cache[cacheKey] = translated;
      print('[TranslationService] Translation successful, cached');
      return translated;
    } catch (error) {
      print('[TranslationService] ERROR: $error');
      rethrow;
    }
  }

  String? _translatedText(dynamic decoded) {
    if (decoded is Map<String, dynamic>) {
      final direct = decoded['translated_text'] ??
          decoded['translatedText'] ??
          decoded['translation'];
      if (direct != null) return direct.toString();
      final data = decoded['data'];
      if (data is Map<String, dynamic>) return _translatedText(data);
    }
    return null;
  }
}
