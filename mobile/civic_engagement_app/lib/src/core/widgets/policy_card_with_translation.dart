import 'package:flutter/material.dart';
import '../di/service_locator.dart';
import '../localization/app_localizations.dart';
import '../services/translation_service.dart';
import '../settings/app_settings_scope.dart';
import '../theme/app_theme.dart';

/// A reusable policy card widget with integrated translation functionality.
/// Features a single translate button in the top-right corner with language dropdown.
class PolicyCardWithTranslation extends StatefulWidget {
  const PolicyCardWithTranslation({
    required this.title,
    required this.description,
    required this.child,
    super.key,
    this.sourceLang = 'en',
    this.onTap,
  });

  final String title;
  final String description;
  final Widget child;
  final String sourceLang;
  final VoidCallback? onTap;

  @override
  State<PolicyCardWithTranslation> createState() =>
      _PolicyCardWithTranslationState();
}

class _PolicyCardWithTranslationState extends State<PolicyCardWithTranslation> {
  String? _translatedTitle;
  String? _translatedDescription;
  String? _targetLanguage;
  bool _loading = false;
  bool _showTranslation = false;
  String? _error;

  @override
  void didUpdateWidget(covariant PolicyCardWithTranslation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.title != widget.title ||
        oldWidget.description != widget.description) {
      _resetTranslation();
    }
  }

  void _resetTranslation() {
    setState(() {
      _translatedTitle = null;
      _translatedDescription = null;
      _targetLanguage = null;
      _showTranslation = false;
      _error = null;
    });
  }

  Future<void> _translate(String targetLang) async {
    if (_loading || targetLang == widget.sourceLang) return;

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
          targetLang: targetLang,
        ),
        service.translate(
          text: widget.description,
          sourceLang: widget.sourceLang,
          targetLang: targetLang,
        ),
      ]);

      if (!mounted) return;
      setState(() {
        _translatedTitle = results[0];
        _translatedDescription = results[1];
        _targetLanguage = targetLang;
        _showTranslation = true;
      });
    } catch (error) {
      if (!mounted) return;
      print('[PolicyCardWithTranslation] Translation error: $error');
      setState(() {
        _error = AppLocalizations.of(context).t('translation_failed');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showLanguageSelector() async {
    final l10n = AppLocalizations.of(context);
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
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
              const SizedBox(height: 16),
              ...AppLocalizations.supportedLocales.map((locale) {
                final langCode = locale.languageCode;
                final isSelected = _targetLanguage == langCode;
                return ListTile(
                  leading: Icon(
                    isSelected
                        ? Icons.check_circle_rounded
                        : Icons.translate_rounded,
                    color: isSelected ? AppTheme.primary : null,
                  ),
                  title: Text(
                    AppLocalizations.languageName(langCode),
                    style: TextStyle(
                      fontWeight:
                          isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? AppTheme.primary : null,
                    ),
                  ),
                  onTap: () => Navigator.of(context).pop(langCode),
                );
              }),
            ],
          ),
        ),
      ),
    );

    if (selected != null && selected != widget.sourceLang) {
      await _translate(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasTranslation =
        _translatedTitle != null && _translatedDescription != null;
    final displayTitle =
        _showTranslation && hasTranslation ? _translatedTitle! : widget.title;
    final displayDescription = _showTranslation && hasTranslation
        ? _translatedDescription!
        : widget.description;

    return GestureDetector(
      onTap: widget.onTap,
      child: Container(
        margin: EdgeInsets.zero,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with title and translate button
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    displayTitle,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                          height: 1.3,
                          letterSpacing: 0,
                        ),
                  ),
                ),
                const SizedBox(width: 12),
                // Translation button with dropdown
                _TranslateButton(
                  loading: _loading,
                  hasTranslation: hasTranslation,
                  showingTranslation: _showTranslation,
                  targetLanguage: _targetLanguage,
                  onLanguageSelected: _translate,
                  onToggle: hasTranslation
                      ? () =>
                          setState(() => _showTranslation = !_showTranslation)
                      : null,
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Description
            Text(
              displayDescription,
              style: TextStyle(
                color: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.color
                    ?.withValues(alpha: 0.72),
                height: 1.5,
                fontSize: 14,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            // Error message
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(
                _error!,
                style: const TextStyle(
                  color: Colors.redAccent,
                  fontSize: 12,
                ),
              ),
            ],
            const SizedBox(height: 16),
            // Additional content (voting info, regions, etc.)
            widget.child,
          ],
        ),
      ),
    );
  }
}

class _TranslateButton extends StatelessWidget {
  const _TranslateButton({
    required this.loading,
    required this.hasTranslation,
    required this.showingTranslation,
    required this.onLanguageSelected,
    this.targetLanguage,
    this.onToggle,
  });

  final bool loading;
  final bool hasTranslation;
  final bool showingTranslation;
  final String? targetLanguage;
  final Function(String) onLanguageSelected;
  final VoidCallback? onToggle;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PopupMenuButton<String>(
      enabled: !loading,
      icon: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: hasTranslation
              ? AppTheme.primary.withValues(alpha: 0.1)
              : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.translate_rounded,
                    size: 18,
                    color: hasTranslation
                        ? AppTheme.primary
                        : Colors.grey.shade700,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    hasTranslation && targetLanguage != null
                        ? AppLocalizations.languageName(targetLanguage!)
                        : l10n.t('translate'),
                    style: TextStyle(
                      color: hasTranslation
                          ? AppTheme.primary
                          : Colors.grey.shade700,
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0,
                    ),
                  ),
                ],
              ),
      ),
      tooltip: l10n.t('translate'),
      itemBuilder: (context) {
        final items = <PopupMenuEntry<String>>[];

        // Show original/translation toggle if translation exists
        if (hasTranslation && onToggle != null) {
          items.add(
            PopupMenuItem<String>(
              value: 'toggle',
              child: Row(
                children: [
                  Icon(
                    showingTranslation
                        ? Icons.visibility_off_rounded
                        : Icons.visibility_rounded,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    showingTranslation
                        ? AppLocalizations.of(context).t('show_original')
                        : AppLocalizations.of(context).t('show_translation'),
                  ),
                ],
              ),
            ),
          );
          items.add(const PopupMenuDivider());
        }

        // Language selection options
        items.add(
          PopupMenuItem<String>(
            enabled: false,
            child: Text(
              AppLocalizations.of(context).t('select_language'),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 12,
                color: AppTheme.mutedText,
              ),
            ),
          ),
        );

        for (final locale in AppLocalizations.supportedLocales) {
          final langCode = locale.languageCode;
          final isSelected = targetLanguage == langCode;
          items.add(
            PopupMenuItem<String>(
              value: langCode,
              child: Row(
                children: [
                  Icon(
                    isSelected
                        ? Icons.check_circle_rounded
                        : Icons.language_rounded,
                    size: 20,
                    color: isSelected ? AppTheme.primary : null,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    AppLocalizations.languageName(langCode),
                    style: TextStyle(
                      fontWeight:
                          isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? AppTheme.primary : null,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return items;
      },
      onSelected: (value) {
        if (value == 'toggle' && onToggle != null) {
          onToggle!();
        } else if (value != null && value != 'toggle') {
          // Directly translate to the selected language
          onLanguageSelected(value);
        }
      },
    );
  }
}
