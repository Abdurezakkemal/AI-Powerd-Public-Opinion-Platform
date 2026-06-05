import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppSettingsController extends ChangeNotifier {
  AppSettingsController(this._preferences) {
    _locale = Locale(_preferences.getString(_localeKey) ?? 'en');
    _themeMode = _parseThemeMode(_preferences.getString(_themeKey));
  }

  static const _localeKey = 'app_locale';
  static const _themeKey = 'theme_mode';

  final SharedPreferences _preferences;

  late Locale _locale;
  late ThemeMode _themeMode;

  Locale get locale => _locale;
  ThemeMode get themeMode => _themeMode;
  String get languageCode => _locale.languageCode;

  Future<void> setLocale(String languageCode) async {
    if (_locale.languageCode == languageCode) return;
    _locale = Locale(languageCode);
    await _preferences.setString(_localeKey, languageCode);
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    mode = mode == ThemeMode.dark ? ThemeMode.dark : ThemeMode.light;
    if (_themeMode == mode) return;
    _themeMode = mode;
    await _preferences.setString(_themeKey, mode.name);
    notifyListeners();
  }

  static ThemeMode _parseThemeMode(String? value) {
    switch (value) {
      case 'dark':
        return ThemeMode.dark;
      case 'light':
        return ThemeMode.light;
      default:
        // Default to light theme
        return ThemeMode.light;
    }
  }
}
