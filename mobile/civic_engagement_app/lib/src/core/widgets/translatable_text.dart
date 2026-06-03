import 'package:flutter/material.dart';

import '../di/service_locator.dart';
import '../localization/app_localizations.dart';
import '../services/translation_service.dart';
import '../settings/app_settings_scope.dart';
import '../theme/app_theme.dart';

class TranslatableText extends StatefulWidget {
  const TranslatableText({
    required this.text,
    super.key,
    this.style,
    this.maxLines,
    this.overflow,
    this.sourceLang = 'en',
    this.showControls = true,
  });

  final String text;
  final TextStyle? style;
  final int? maxLines;
  final TextOverflow? overflow;
  final String sourceLang;
  final bool showControls;

  @override
  State<TranslatableText> createState() => _TranslatableTextState();
}

class _TranslatableTextState extends State<TranslatableText> {
  String? _translatedText;
  String? _translatedLanguage;
  bool _loading = false;
  bool _showOriginal = true;
  String? _error;

  @override
  void didUpdateWidget(covariant TranslatableText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text) {
      _translatedText = null;
      _translatedLanguage = null;
      _showOriginal = true;
      _error = null;
    }
  }

  Future<void> _translate(String languageCode) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final translated = await serviceLocator<TranslationService>().translate(
        text: widget.text,
        sourceLang: widget.sourceLang,
        targetLang: languageCode,
      );
      if (!mounted) return;
      setState(() {
        _translatedText = translated;
        _translatedLanguage = languageCode;
        _showOriginal = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(
          () => _error = AppLocalizations.of(context).t('translation_failed'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showLanguagePicker() async {
    final l10n = AppLocalizations.of(context);
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                l10n.t('select_language'),
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              for (final locale in AppLocalizations.supportedLocales)
                ListTile(
                  leading: const Icon(Icons.translate_rounded),
                  title:
                      Text(AppLocalizations.languageName(locale.languageCode)),
                  onTap: () => Navigator.of(context).pop(locale.languageCode),
                ),
            ],
          ),
        ),
      ),
    );

    if (selected != null) {
      await _translate(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsScope.of(context);
    final l10n = AppLocalizations.of(context);
    final preferredLanguage = settings.languageCode;
    final canUsePreferredLanguage = preferredLanguage != widget.sourceLang;
    final visibleText = !_showOriginal && _translatedText != null
        ? _translatedText!
        : widget.text;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          visibleText,
          style: widget.style,
          maxLines: widget.maxLines,
          overflow: widget.overflow,
        ),
        if (widget.showControls) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              TextButton.icon(
                onPressed: _loading
                    ? null
                    : canUsePreferredLanguage
                        ? () => _translate(preferredLanguage)
                        : _showLanguagePicker,
                icon: _loading
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.translate_rounded, size: 16),
                label: Text(
                  _loading
                      ? l10n.t('translating')
                      : canUsePreferredLanguage
                          ? '${l10n.t('translate_to')} ${AppLocalizations.languageName(preferredLanguage)}'
                          : l10n.t('translate'),
                ),
                style: TextButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
              IconButton(
                tooltip: l10n.t('select_language'),
                onPressed: _loading ? null : _showLanguagePicker,
                icon: const Icon(Icons.language_rounded, size: 18),
                visualDensity: VisualDensity.compact,
              ),
              if (_translatedText != null)
                TextButton(
                  onPressed: () =>
                      setState(() => _showOriginal = !_showOriginal),
                  style: TextButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    _showOriginal
                        ? AppLocalizations.languageName(
                            _translatedLanguage ?? settings.languageCode,
                          )
                        : l10n.t('show_original'),
                  ),
                ),
            ],
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                _error!,
                style: const TextStyle(color: Colors.redAccent, fontSize: 12),
              ),
            ),
        ],
      ],
    );
  }
}
