import 'package:flutter/material.dart';
import 'dart:ui';

import '../../../../core/localization/app_localizations.dart';
import '../../../../core/settings/app_settings_scope.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/app_button.dart';

class LandingPage extends StatefulWidget {
  const LandingPage({
    required this.onLogin,
    required this.onRegister,
    super.key,
  });

  final VoidCallback onLogin;
  final VoidCallback onRegister;

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  final _pageController = PageController();
  int _pageIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final pages = [
      _LandingSlideData(
        imagePath: 'assets/onboarding/citizen_voting.jpg',
        icon: Icons.how_to_vote_rounded,
        title: l10n.t('landing.slide_vote_title'),
        subtitle: l10n.t('landing.slide_vote_subtitle'),
      ),
      _LandingSlideData(
        imagePath: 'assets/onboarding/citizen_diverse.jpg',
        icon: Icons.translate_rounded,
        title: l10n.t('landing.slide_translate_title'),
        subtitle: l10n.t('landing.slide_translate_subtitle'),
      ),
      _LandingSlideData(
        imagePath: 'assets/onboarding/citizen_engagement.jpg',
        icon: Icons.insights_rounded,
        title: l10n.t('landing.slide_track_title'),
        subtitle: l10n.t('landing.slide_track_subtitle'),
      ),
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Page content
          PageView.builder(
            controller: _pageController,
            itemCount: pages.length,
            onPageChanged: (index) => setState(() => _pageIndex = index),
            itemBuilder: (context, index) => _LandingSlide(
              data: pages[index],
              pageIndex: index,
              totalPages: pages.length,
              onNext: () {
                if (index == pages.length - 1) {
                  widget.onRegister();
                } else {
                  _pageController.nextPage(
                    duration: const Duration(milliseconds: 350),
                    curve: Curves.easeInOutCubic,
                  );
                }
              },
              onLogin: widget.onLogin,
            ),
          ),

          // Language selector at top
          Positioned(
            top: 0,
            right: 0,
            left: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    _LanguageSelector(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Data model for landing slide
class _LandingSlideData {
  const _LandingSlideData({
    required this.imagePath,
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final String imagePath;
  final IconData icon;
  final String title;
  final String subtitle;
}

class _LandingSlide extends StatelessWidget {
  const _LandingSlide({
    required this.data,
    required this.pageIndex,
    required this.totalPages,
    required this.onNext,
    required this.onLogin,
  });

  final _LandingSlideData data;
  final int pageIndex;
  final int totalPages;
  final VoidCallback onNext;
  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final screenHeight = MediaQuery.of(context).size.height;

    return Stack(
      children: [
        // Background image with gradient fade
        Positioned.fill(
          child: Stack(
            children: [
              // Image
              Positioned.fill(
                child: Image.asset(
                  data.imagePath,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    // Fallback: gradient background
                    return Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppTheme.primary.withValues(alpha: 0.08),
                            AppTheme.primary.withValues(alpha: 0.15),
                          ],
                        ),
                      ),
                      child: Center(
                        child: Icon(
                          data.icon,
                          size: 120,
                          color: AppTheme.primary.withValues(alpha: 0.3),
                        ),
                      ),
                    );
                  },
                ),
              ),
              // Gradient overlay (fade from bottom)
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.transparent,
                        Colors.white.withValues(alpha: 0.85),
                        Colors.white,
                        Colors.white,
                      ],
                      stops: const [0.0, 0.3, 0.55, 0.75, 1.0],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Content
        SafeArea(
          child: Column(
            children: [
              const Spacer(),
              // Text content
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    Text(
                      data.title,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.displaySmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        color: AppTheme.text,
                        height: 1.15,
                        letterSpacing: -0.5,
                        fontSize: 32,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      data.subtitle,
                      textAlign: TextAlign.center,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        color: AppTheme.mutedText,
                        fontWeight: FontWeight.w500,
                        height: 1.6,
                        letterSpacing: 0,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 36),

              // Page indicators
              _PageDots(count: totalPages, index: pageIndex),

              const SizedBox(height: 36),

              // Buttons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Next/Get Started button
                    ElevatedButton(
                      onPressed: onNext,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        textStyle: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.2,
                        ),
                      ),
                      child: Text(
                        pageIndex == totalPages - 1
                            ? l10n.t('landing.get_started')
                            : l10n.t('continue'),
                      ),
                    ),

                    // Login button (show on last page)
                    if (pageIndex == totalPages - 1) ...[
                      const SizedBox(height: 14),
                      TextButton(
                        onPressed: onLogin,
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.text,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(l10n.t('landing.already_have_account')),
                            const SizedBox(width: 6),
                            Text(
                              l10n.t('landing.login'),
                              style: TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ],
    );
  }
}

class _PageDots extends StatelessWidget {
  const _PageDots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (dotIndex) {
        final active = dotIndex == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 5),
          width: active ? 10 : 10,
          height: 10,
          decoration: BoxDecoration(
            color: active
                ? AppTheme.text
                : AppTheme.text.withValues(alpha: 0.25),
            shape: BoxShape.circle,
          ),
        );
      }),
    );
  }
}

class _LanguageSelector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final settings = AppSettingsScope.of(context);
    final l10n = AppLocalizations.of(context);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.border.withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: PopupMenuButton<String>(
        icon: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.language_rounded,
                color: AppTheme.primary,
                size: 20,
              ),
              const SizedBox(width: 6),
              Text(
                _getLanguageCode(settings.languageCode),
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppTheme.text,
                  fontSize: 14,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
        tooltip: l10n.t('select_language'),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        elevation: 8,
        itemBuilder: (context) {
          return AppLocalizations.supportedLocales.map((locale) {
            final langCode = locale.languageCode;
            final isSelected = settings.languageCode == langCode;
            return PopupMenuItem<String>(
              value: langCode,
              child: Row(
                children: [
                  Icon(
                    isSelected
                        ? Icons.check_circle_rounded
                        : Icons.language_rounded,
                    size: 20,
                    color: isSelected ? AppTheme.primary : AppTheme.mutedText,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    AppLocalizations.languageName(langCode),
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                      color: isSelected ? AppTheme.primary : AppTheme.text,
                    ),
                  ),
                ],
              ),
            );
          }).toList();
        },
        onSelected: (langCode) {
          settings.setLocale(langCode);
        },
      ),
    );
  }

  String _getLanguageCode(String code) {
    switch (code) {
      case 'am':
        return 'አማ';
      case 'om':
        return 'ORO';
      case 'ti':
        return 'ትግ';
      default:
        return 'EN';
    }
  }
}
