import 'package:flutter/material.dart';

import '../../../../core/layout/responsive_layout.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/settings/app_settings_scope.dart';
import '../../../../core/theme/app_theme.dart';

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

class _LandingPageState extends State<LandingPage> with TickerProviderStateMixin {
  final _pageController = PageController();
  double _currentPage = 0.0;
  late AnimationController _fadeController;
  late AnimationController _scaleController;

  @override
  void initState() {
    super.initState();
    _pageController.addListener(() {
      setState(() {
        _currentPage = _pageController.page ?? 0.0;
      });
    });

    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    )..forward();

    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _fadeController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Stack(
        children: [
          // Page content
          PageView.builder(
            controller: _pageController,
            itemCount: pages.length,
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
                padding: EdgeInsets.symmetric(
                  horizontal: ResponsiveLayout.pagePadding(context),
                  vertical: 12,
                ),
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
    final bottomColor = theme.scaffoldBackgroundColor;
    final horizontalPadding = ResponsiveLayout.isTablet(context) ? 40.0 : 32.0;
    final buttonHorizontalPadding =
        ResponsiveLayout.isTablet(context) ? 40.0 : 28.0;
    final titleSize = ResponsiveLayout.heroTitleSize(context);
    final subtitleSize = ResponsiveLayout.bodyFontSize(context) + 1;
    final bottomSpacing = ResponsiveLayout.isCompact(context) ? 24.0 : 32.0;

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
                  fit: BoxFit.contain,
                  alignment: Alignment.topCenter,
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
                        bottomColor.withValues(alpha: 0.85),
                        bottomColor,
                        bottomColor,
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
                padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: ResponsiveLayout.isTablet(context)
                        ? 620
                        : double.infinity,
                  ),
                  child: Column(
                    children: [
                      Text(
                        data.title,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          color: AppTheme.textFor(context),
                          height: 1.15,
                          letterSpacing: -0.5,
                          fontSize: titleSize,
                        ),
                      ),
                      SizedBox(height: ResponsiveLayout.spacing(context, 18)),
                      Text(
                        data.subtitle,
                        textAlign: TextAlign.center,
                        style: theme.textTheme.bodyLarge?.copyWith(
                          color: AppTheme.mutedTextFor(context),
                          fontWeight: FontWeight.w500,
                          height: 1.6,
                          letterSpacing: 0,
                          fontSize: subtitleSize,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              SizedBox(height: ResponsiveLayout.spacing(context, 36)),

              // Page indicators
              _PageDots(count: totalPages, index: pageIndex),

              SizedBox(height: ResponsiveLayout.spacing(context, 36)),

              // Buttons
              Padding(
                padding:
                    EdgeInsets.symmetric(horizontal: buttonHorizontalPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Next/Get Started button
                    ElevatedButton(
                      onPressed: onNext,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(
                          vertical:
                              ResponsiveLayout.isCompact(context) ? 16 : 18,
                        ),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        textStyle: TextStyle(
                          fontSize: ResponsiveLayout.bodyFontSize(context) + 2,
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
                      SizedBox(height: ResponsiveLayout.spacing(context, 14)),
                      TextButton(
                        onPressed: onLogin,
                        style: TextButton.styleFrom(
                          foregroundColor: AppTheme.textFor(context),
                          padding: EdgeInsets.symmetric(
                            vertical:
                                ResponsiveLayout.isCompact(context) ? 12 : 16,
                          ),
                          textStyle: TextStyle(
                            fontSize:
                                ResponsiveLayout.bodyFontSize(context) + 1,
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

              SizedBox(height: bottomSpacing),
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
                ? AppTheme.textFor(context)
                : AppTheme.textFor(context).withValues(alpha: 0.25),
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
    final surfaceColor = AppTheme.surfaceFor(context);

    return Container(
      decoration: BoxDecoration(
        color: surfaceColor.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.borderFor(context).withValues(alpha: 0.6),
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
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textFor(context),
                  fontSize: ResponsiveLayout.secondaryBodyFontSize(context) + 1,
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
                    color: isSelected
                        ? AppTheme.primary
                        : AppTheme.mutedTextFor(context),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    AppLocalizations.languageName(langCode),
                    style: TextStyle(
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w600,
                      color: isSelected
                          ? AppTheme.primary
                          : AppTheme.textFor(context),
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
