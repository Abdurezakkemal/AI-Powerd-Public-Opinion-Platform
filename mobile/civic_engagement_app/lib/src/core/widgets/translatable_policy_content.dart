import 'package:flutter/material.dart';

import '../di/service_locator.dart';
import '../localization/app_localizations.dart';
import '../services/translation_service.dart';
import '../settings/app_settings_scope.dart';
import '../theme/app_theme.dart';

class TranslatablePolicyContent extends StatefulWidget {
  const TranslatablePolicyContent({
    required this.title,
    required this.description,
    required this.titleStyle,
    required this.descriptionStyle,
    super.key,
    this.descriptionMaxLines,
    this.descriptionOverflow,
    this.sourceLang = 'en',
  });

  final String title;
  final String description;
  final TextStyle? titleStyle;
  final TextStyle? descriptionStyle;
  final int? descriptionMaxLines;
  final TextOverflow? descriptionOverflow;
  final String sourceLang;

  @override
  State<TranslatablePolicyContent> createState() =>
      _TranslatablePolicyContentState();
}

class _TranslatablePolicyContentState extends State<TranslatablePolicyContent> {
  String? _translatedTitle;
  String? _translatedDescription;
  String? _translatedLanguage;
  bool _loading = false;
  bool _showOriginal = true;
  String? _error;

  @override
  void didUpdateWidget(covariant TranslatablePolicyContent oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.title != widget.title ||
        oldWidget.description != widget.description) {
      _translatedTitle = null;
      _translatedDescription = null;
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
      final service = serviceLocator<TranslationService>();
      final results = await Future.wait([
        service.translate(
          text: widget.title,
          sourceLang: widget.sourceLang,
          targetLang: languageCode,
        ),
        service.translate(
          text: widget.description,
          sourceLang: widget.sourceLang,
          targetLang: languageCode,
        ),
      ]);

      if (!mounted) return;
      setState(() {
        _translatedTitle = results[0];
        _translatedDescription = results[1];
        _translatedLanguage = languageCode;
        _showOriginal = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = AppLocalizations.of(context).t('translation_failed');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _chooseLanguageAndTranslate() async {
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
    final hasTranslation =
        _translatedTitle != null && _translatedDescription != null;
    final title = !_showOriginal && hasTranslation
        ? _translatedTitle!
        : widget.title;
    final description = !_showOriginal && hasTranslation
        ? _translatedDescription!
        : widget.description;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: widget.titleStyle),
        const SizedBox(height: 12),
        Text(
          description,
          maxLines: widget.descriptionMaxLines,
          overflow: widget.descriptionOverflow,
          style: widget.descriptionStyle,
        ),
        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: _loading
              ? null
              : hasTranslation
                  ? () => setState(() => _showOriginal = !_showOriginal)
                  : () => _translate(settings.languageCode),
          icon: _loading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.translate_rounded, size: 18),
          label: Text(
            _loading
                ? l10n.t('translating')
                : hasTranslation
                    ? (_showOriginal
                        ? l10n.t('show_translation')
                        : l10n.t('show_original'))
                    : '${l10n.t('translate_policy_to')} ${AppLocalizations.languageName(settings.languageCode)}',
          ),
          style: OutlinedButton.styleFrom(
            foregroundColor: AppTheme.primary,
            side: BorderSide(color: AppTheme.primary.withValues(alpha: 0.35)),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            textStyle: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
        TextButton.icon(
          onPressed: _loading ? null : _chooseLanguageAndTranslate,
          icon: const Icon(Icons.language_rounded, size: 16),
          label: Text(l10n.t('select_language')),
          style: TextButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 4),
          Text(
            _error!,
            style: const TextStyle(color: Colors.redAccent, fontSize: 12),
          ),
        ],
      ],
    );
  }
}
