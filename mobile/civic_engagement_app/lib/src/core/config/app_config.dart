class AppConfig {
  const AppConfig._();

  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.42.0.199:5002/api',
  );

  static const apiFallbackBaseUrl = String.fromEnvironment(
    'API_FALLBACK_BASE_URL',
    defaultValue: '',
  );

  static const translateSpaceUrl = String.fromEnvironment(
    'TRANSLATE_SPACE_URL',
    defaultValue: 'https://abraham-ad77-ethio-translate.hf.space/translate',
  );

  static List<String> get apiBaseUrls {
    return [
      apiBaseUrl,
      if (apiFallbackBaseUrl.isNotEmpty && apiFallbackBaseUrl != apiBaseUrl)
        apiFallbackBaseUrl,
    ];
  }
}
