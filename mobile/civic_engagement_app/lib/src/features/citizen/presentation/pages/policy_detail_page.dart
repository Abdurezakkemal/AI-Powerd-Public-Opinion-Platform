import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/service_locator.dart';
import '../../../../core/state/request_status.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/services/translation_service.dart';
import '../../../../core/settings/app_settings_scope.dart';
import '../../domain/entities/policy.dart';
import '../../domain/entities/vote_value.dart';
import '../../domain/repositories/citizen_repository.dart';
import '../cubit/comment_cubit.dart';
import '../cubit/history_cubit.dart';
import '../cubit/policy_cubit.dart';
import '../cubit/vote_cubit.dart';
import '../widgets/approval_vote_widget.dart';
import '../widgets/binary_vote_widget.dart';
import '../widgets/comment_list_widget.dart';
import '../widgets/likert_vote_widget.dart';
import '../widgets/multiple_choice_vote_widget.dart';
import '../widgets/post_comment_widget.dart';
import '../widgets/ranked_choice_vote_widget.dart';
import '../widgets/rating_stars.dart';
import '../widgets/status_pill.dart';

class PolicyDetailPage extends StatefulWidget {
  const PolicyDetailPage({
    required this.policyId,
    required this.initialPolicy,
    super.key,
  });

  final String policyId;
  final Policy initialPolicy;

  @override
  State<PolicyDetailPage> createState() => _PolicyDetailPageState();
}

class _PolicyDetailPageState extends State<PolicyDetailPage> {
  bool _initialLoadAttempted = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted && !_initialLoadAttempted) {
        _initialLoadAttempted = true;
        context.read<PolicyCubit>().loadPolicy(widget.policyId);
        context.read<HistoryCubit>().loadHistory();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PolicyCubit, PolicyState>(
      builder: (context, state) {
        final selected = state.selectedPolicy?.id == widget.policyId
            ? state.selectedPolicy
            : null;
        final policy = selected ?? widget.initialPolicy;
        final failed =
            state.detailStatus == RequestStatus.failure && selected == null;

        return DefaultTabController(
          length: 2,
          child: Scaffold(
            backgroundColor: AppTheme.background,
            body: failed
                ? ErrorView(
                    message: state.message ?? 'Policy could not be loaded.',
                    onRetry: () => context.read<PolicyCubit>().loadPolicy(
                          widget.policyId,
                        ),
                  )
                : NestedScrollView(
                    headerSliverBuilder: (context, innerBoxIsScrolled) {
                      return [
                        // Custom Elevated Header
                        SliverToBoxAdapter(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: SafeArea(
                              bottom: false,
                              child: Column(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 8, 16, 10),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 44,
                                          height: 44,
                                          decoration: BoxDecoration(
                                            color: AppTheme.primary
                                                .withValues(alpha: 0.1),
                                            shape: BoxShape.circle,
                                          ),
                                          child: IconButton(
                                            onPressed: () =>
                                                Navigator.of(context).pop(),
                                            icon: const Icon(
                                                Icons.arrow_back_rounded,
                                                color: AppTheme.primary),
                                            tooltip: 'Back',
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            AppLocalizations.of(context)
                                                .t('policy_details'),
                                            style: const TextStyle(
                                              fontSize: 28,
                                              fontWeight: FontWeight.w900,
                                              color: AppTheme.text,
                                              letterSpacing: 0,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Tab Bar
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 0, 16, 10),
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.background,
                                        borderRadius: BorderRadius.circular(18),
                                      ),
                                      child: TabBar(
                                        indicator: BoxDecoration(
                                          color: AppTheme.primary
                                              .withValues(alpha: 0.08),
                                          borderRadius:
                                              BorderRadius.circular(14),
                                        ),
                                        indicatorSize: TabBarIndicatorSize.tab,
                                        dividerColor: Colors.transparent,
                                        labelColor: AppTheme.primary,
                                        unselectedLabelColor:
                                            AppTheme.mutedText,
                                        labelStyle: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14,
                                          letterSpacing: 0,
                                        ),
                                        unselectedLabelStyle: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                          letterSpacing: 0,
                                        ),
                                        tabs: [
                                          Tab(
                                            height: 48,
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Container(
                                                  padding:
                                                      const EdgeInsets.all(5),
                                                  decoration: BoxDecoration(
                                                    color: AppTheme.primary
                                                        .withValues(alpha: 0.1),
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: const Icon(
                                                      Icons
                                                          .info_outline_rounded,
                                                      size: 18),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                    AppLocalizations.of(context)
                                                        .t('overview')),
                                              ],
                                            ),
                                          ),
                                          Tab(
                                            height: 48,
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Container(
                                                  padding:
                                                      const EdgeInsets.all(5),
                                                  decoration: BoxDecoration(
                                                    color: AppTheme.primary
                                                        .withValues(alpha: 0.1),
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: const Icon(
                                                      Icons.forum_outlined,
                                                      size: 18),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                    AppLocalizations.of(context)
                                                        .t('discussion')),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ];
                    },
                    body: TabBarView(
                      children: [
                        RefreshIndicator(
                          onRefresh: () =>
                              context.read<PolicyCubit>().loadPolicy(
                                    widget.policyId,
                                  ),
                          color: AppTheme.primary,
                          backgroundColor: Colors.white,
                          child: ListView(
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                            children: [
                              if (state.detailStatus == RequestStatus.loading)
                                const Padding(
                                  padding: EdgeInsets.only(bottom: 16),
                                  child: LinearProgressIndicator(
                                      minHeight: 3,
                                      borderRadius:
                                          BorderRadius.all(Radius.circular(2))),
                                ),
                              _PolicyInfoCard(policy: policy),
                              const SizedBox(height: 16),
                              _VotingCard(
                                policy: policy,
                              ),
                            ],
                          ),
                        ),
                        _CommentsTab(policy: policy),
                      ],
                    ),
                  ),
          ),
        );
      },
    );
  }
}

class _DetailHeader extends StatefulWidget {
  const _DetailHeader({required this.policy});

  final Policy policy;

  @override
  State<_DetailHeader> createState() => _DetailHeaderState();
}

class _DetailHeaderState extends State<_DetailHeader> {
  String? _translatedTitle;
  String? _targetLanguage;
  bool _loading = false;
  bool _showTranslation = false;
  String? _error;

  Future<void> _translate(String targetLang) async {
    if (_loading) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final service = serviceLocator<TranslationService>();
      final translated = await service.translate(
        text: widget.policy.title,
        sourceLang: 'en',
        targetLang: targetLang,
      );

      if (!mounted) return;
      setState(() {
        _translatedTitle = translated;
        _targetLanguage = targetLang;
        _showTranslation = true;
      });
    } catch (error) {
      if (!mounted) return;
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

    if (selected != null && selected != 'en') {
      await _translate(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayTitle = _showTranslation && _translatedTitle != null
        ? _translatedTitle!
        : widget.policy.title;

    return AppCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  displayTitle,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w900,
                        height: 1.25,
                        letterSpacing: 0,
                      ),
                ),
              ),
              const SizedBox(width: 12),
              // Translation button
              PopupMenuButton<String>(
                enabled: !_loading,
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _translatedTitle != null
                        ? AppTheme.primary.withValues(alpha: 0.1)
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(
                          Icons.translate_rounded,
                          size: 20,
                          color: _translatedTitle != null
                              ? AppTheme.primary
                              : Colors.grey.shade600,
                        ),
                ),
                tooltip: AppLocalizations.of(context).t('translate'),
                itemBuilder: (context) {
                  final items = <PopupMenuEntry<String>>[];

                  if (_translatedTitle != null) {
                    items.add(
                      PopupMenuItem<String>(
                        value: 'toggle',
                        child: Row(
                          children: [
                            Icon(
                              _showTranslation
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              _showTranslation
                                  ? AppLocalizations.of(context)
                                      .t('show_original')
                                  : AppLocalizations.of(context)
                                      .t('show_translation'),
                            ),
                          ],
                        ),
                      ),
                    );
                    items.add(const PopupMenuDivider());
                  }

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
                    final isSelected = _targetLanguage == langCode;
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
                                fontWeight: isSelected
                                    ? FontWeight.w800
                                    : FontWeight.w600,
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
                  if (value == 'toggle') {
                    setState(() => _showTranslation = !_showTranslation);
                  } else if (value != 'en') {
                    _translate(value);
                  }
                },
              ),
              const SizedBox(width: 8),
              StatusPill(status: widget.policy.status),
            ],
          ),
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
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _InfoChip(
                icon: Icons.tag_rounded,
                label: widget.policy.policyCode,
              ),
              if (widget.policy.averageRating != null)
                _InfoChip(
                  icon: Icons.star_rounded,
                  label:
                      '${widget.policy.averageRating!.toStringAsFixed(1)} avg',
                  iconColor: Colors.amber.shade600,
                  backgroundColor: Colors.amber.shade50,
                  textColor: Colors.amber.shade900,
                ),
              _InfoChip(
                icon: Icons.how_to_vote_rounded,
                label: '${widget.policy.totalVotes} votes',
              ),
              if (widget.policy.topics != null &&
                  widget.policy.topics!.isNotEmpty)
                ...widget.policy.topics!.take(2).map(
                      (topic) => _InfoChip(
                        icon: Icons.label_outline_rounded,
                        label: topic,
                      ),
                    ),
            ],
          ),
        ],
      ),
    );
  }
}

// Consolidated Policy Info Card (Title + Description)
class _PolicyInfoCard extends StatefulWidget {
  const _PolicyInfoCard({required this.policy});

  final Policy policy;

  @override
  State<_PolicyInfoCard> createState() => _PolicyInfoCardState();
}

class _PolicyInfoCardState extends State<_PolicyInfoCard> {
  String? _translatedTitle;
  String? _translatedDescription;
  String? _targetLanguage;
  bool _loadingTitle = false;
  bool _loadingDescription = false;
  bool _showTitleTranslation = false;
  bool _showDescriptionTranslation = false;
  String? _error;

  Future<void> _translateTitle(String targetLang) async {
    if (_loadingTitle) return;

    setState(() {
      _loadingTitle = true;
      _error = null;
    });

    try {
      final service = serviceLocator<TranslationService>();
      final translated = await service.translate(
        text: widget.policy.title,
        sourceLang: 'en',
        targetLang: targetLang,
      );

      if (!mounted) return;
      setState(() {
        _translatedTitle = translated;
        _targetLanguage = targetLang;
        _showTitleTranslation = true;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = AppLocalizations.of(context).t('translation_failed');
      });
    } finally {
      if (mounted) setState(() => _loadingTitle = false);
    }
  }

  Future<void> _translateDescription(String targetLang) async {
    if (_loadingDescription) return;

    setState(() {
      _loadingDescription = true;
      _error = null;
    });

    try {
      final service = serviceLocator<TranslationService>();
      final translated = await service.translate(
        text: widget.policy.description,
        sourceLang: 'en',
        targetLang: targetLang,
      );

      if (!mounted) return;
      setState(() {
        _translatedDescription = translated;
        _targetLanguage = targetLang;
        _showDescriptionTranslation = true;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = AppLocalizations.of(context).t('translation_failed');
      });
    } finally {
      if (mounted) setState(() => _loadingDescription = false);
    }
  }

  Future<void> _translateBoth(String targetLang) async {
    await Future.wait([
      _translateTitle(targetLang),
      _translateDescription(targetLang),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final displayTitle = _showTitleTranslation && _translatedTitle != null
        ? _translatedTitle!
        : widget.policy.title;
    final displayDescription =
        _showDescriptionTranslation && _translatedDescription != null
            ? _translatedDescription!
            : widget.policy.description;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.03),
            blurRadius: 40,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title Section
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    displayTitle,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w900,
                          height: 1.25,
                          letterSpacing: 0,
                        ),
                  ),
                ),
                const SizedBox(width: 12),
                // Translation button
                PopupMenuButton<String>(
                  enabled: !_loadingTitle && !_loadingDescription,
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (_translatedTitle != null ||
                              _translatedDescription != null)
                          ? AppTheme.primary.withValues(alpha: 0.1)
                          : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: (_loadingTitle || _loadingDescription)
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(
                            Icons.translate_rounded,
                            size: 20,
                            color: (_translatedTitle != null ||
                                    _translatedDescription != null)
                                ? AppTheme.primary
                                : Colors.grey.shade600,
                          ),
                  ),
                  tooltip: l10n.t('translate'),
                  itemBuilder: (context) {
                    final items = <PopupMenuEntry<String>>[];

                    if (_translatedTitle != null ||
                        _translatedDescription != null) {
                      items.add(
                        PopupMenuItem<String>(
                          value: 'toggle',
                          child: Row(
                            children: [
                              Icon(
                                (_showTitleTranslation ||
                                        _showDescriptionTranslation)
                                    ? Icons.visibility_off_rounded
                                    : Icons.visibility_rounded,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Text(
                                (_showTitleTranslation ||
                                        _showDescriptionTranslation)
                                    ? l10n.t('show_original')
                                    : l10n.t('show_translation'),
                              ),
                            ],
                          ),
                        ),
                      );
                      items.add(const PopupMenuDivider());
                    }

                    items.add(
                      PopupMenuItem<String>(
                        enabled: false,
                        child: Text(
                          l10n.t('select_language'),
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
                      final isSelected = _targetLanguage == langCode;
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
                                  fontWeight: isSelected
                                      ? FontWeight.w800
                                      : FontWeight.w600,
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
                    if (value == 'toggle') {
                      setState(() {
                        _showTitleTranslation = !_showTitleTranslation;
                        _showDescriptionTranslation =
                            !_showDescriptionTranslation;
                      });
                    } else if (value != 'en') {
                      _translateBoth(value);
                    }
                  },
                ),
                const SizedBox(width: 8),
                StatusPill(status: widget.policy.status),
              ],
            ),
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
            const SizedBox(height: 24),

            // Info Chips
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _InfoChip(
                  icon: Icons.tag_rounded,
                  label: widget.policy.policyCode,
                ),
                if (widget.policy.averageRating != null)
                  _InfoChip(
                    icon: Icons.star_rounded,
                    label:
                        '${widget.policy.averageRating!.toStringAsFixed(1)} avg',
                    iconColor: Colors.amber.shade600,
                    backgroundColor: Colors.amber.shade50,
                    textColor: Colors.amber.shade900,
                  ),
                _InfoChip(
                  icon: Icons.how_to_vote_rounded,
                  label: '${widget.policy.totalVotes} votes',
                ),
                if (widget.policy.topics != null &&
                    widget.policy.topics!.isNotEmpty)
                  ...widget.policy.topics!.take(2).map(
                        (topic) => _InfoChip(
                          icon: Icons.label_outline_rounded,
                          label: topic,
                        ),
                      ),
              ],
            ),

            const SizedBox(height: 24),
            const Divider(height: 1),
            const SizedBox(height: 24),

            // About Section
            Text(
              l10n.t('policy.about_title'),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0,
                  ),
            ),
            const SizedBox(height: 16),
            Text(
              displayDescription,
              style: const TextStyle(
                fontSize: 15,
                height: 1.6,
                color: AppTheme.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DescriptionCard extends StatefulWidget {
  const _DescriptionCard({required this.policy});

  final Policy policy;

  @override
  State<_DescriptionCard> createState() => _DescriptionCardState();
}

class _DescriptionCardState extends State<_DescriptionCard> {
  String? _translatedDescription;
  String? _targetLanguage;
  bool _loading = false;
  bool _showTranslation = false;
  String? _error;

  Future<void> _translate(String targetLang) async {
    if (_loading) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final service = serviceLocator<TranslationService>();
      final translated = await service.translate(
        text: widget.policy.description,
        sourceLang: 'en',
        targetLang: targetLang,
      );

      if (!mounted) return;
      setState(() {
        _translatedDescription = translated;
        _targetLanguage = targetLang;
        _showTranslation = true;
      });
    } catch (error) {
      if (!mounted) return;
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

    if (selected != null && selected != 'en') {
      await _translate(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final displayDescription =
        _showTranslation && _translatedDescription != null
            ? _translatedDescription!
            : widget.policy.description;

    return AppCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  l10n.t('policy.about_title'),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0,
                      ),
                ),
              ),
              // Translation button
              PopupMenuButton<String>(
                enabled: !_loading,
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: _translatedDescription != null
                        ? AppTheme.primary.withValues(alpha: 0.1)
                        : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: _loading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Icon(
                          Icons.translate_rounded,
                          size: 18,
                          color: _translatedDescription != null
                              ? AppTheme.primary
                              : Colors.grey.shade600,
                        ),
                ),
                tooltip: AppLocalizations.of(context).t('translate'),
                itemBuilder: (context) {
                  final items = <PopupMenuEntry<String>>[];

                  if (_translatedDescription != null) {
                    items.add(
                      PopupMenuItem<String>(
                        value: 'toggle',
                        child: Row(
                          children: [
                            Icon(
                              _showTranslation
                                  ? Icons.visibility_off_rounded
                                  : Icons.visibility_rounded,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              _showTranslation
                                  ? AppLocalizations.of(context)
                                      .t('show_original')
                                  : AppLocalizations.of(context)
                                      .t('show_translation'),
                            ),
                          ],
                        ),
                      ),
                    );
                    items.add(const PopupMenuDivider());
                  }

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
                    final isSelected = _targetLanguage == langCode;
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
                                fontWeight: isSelected
                                    ? FontWeight.w800
                                    : FontWeight.w600,
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
                  if (value == 'toggle') {
                    setState(() => _showTranslation = !_showTranslation);
                  } else if (value != 'en') {
                    _translate(value);
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            displayDescription,
            style: TextStyle(
              color: Theme.of(context).textTheme.bodyMedium?.color,
              height: 1.6,
              fontSize: 15,
            ),
          ),
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
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.03),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                _DetailRow(
                  icon: Icons.map_outlined,
                  label: 'Regions',
                  value: widget.policy.targetRegions.isEmpty
                      ? 'Not specified'
                      : widget.policy.targetRegions.join(', '),
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.event_available_outlined,
                  label: 'Starts',
                  value: DateFormatters.short(widget.policy.startDate),
                ),
                const SizedBox(height: 12),
                _DetailRow(
                  icon: Icons.event_busy_outlined,
                  label: 'Ends',
                  value: DateFormatters.short(widget.policy.endDate),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VotingCard extends StatefulWidget {
  const _VotingCard({required this.policy});

  final Policy policy;

  @override
  State<_VotingCard> createState() => _VotingCardState();
}

class _VotingCardState extends State<_VotingCard> {
  dynamic _voteValue;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    _setInitialVoteValue();
  }

  @override
  void didUpdateWidget(covariant _VotingCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.policy.id != widget.policy.id ||
        oldWidget.policy.pollType != widget.policy.pollType) {
      _submitted = false;
      _setInitialVoteValue();
    }
  }

  void _setInitialVoteValue() {
    switch (widget.policy.pollType) {
      case 'rating':
      case 'likert':
        _voteValue = 5;
        break;
      case 'multipleChoice':
      case 'rankedChoice':
        _voteValue = <String>[];
        break;
      case 'binary':
      case 'approval':
      default:
        _voteValue = null;
        break;
    }
  }

  bool get _canSubmit {
    return VoteValueFormatter.isValid(
      _voteValue,
      widget.policy.pollType,
      maxSelections: widget.policy.maxSelections,
      maxRank: widget.policy.rankedChoiceMaxRank,
    );
  }

  String get _pollTypeLabel {
    final l10n = AppLocalizations.of(context);
    switch (widget.policy.pollType) {
      case 'binary':
        return l10n.t('vote.submit');
      case 'multipleChoice':
        return l10n.t('vote.submit');
      case 'likert':
        return l10n.t('vote.submit');
      case 'approval':
        return l10n.t('vote.submit');
      case 'rating':
        return l10n.t('vote.submit');
      case 'rankedChoice':
        return l10n.t('vote.submit');
      default:
        return l10n.t('vote.submit');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final policy = widget.policy;
    final title =
        policy.canVote ? l10n.t('vote.submit') : l10n.t('policy.status.closed');
    final message =
        policy.canVote ? l10n.t('vote.submit') : l10n.t('policy.status.closed');

    return BlocConsumer<VoteCubit, VoteState>(
      listener: (context, state) {
        final l10n = AppLocalizations.of(context);
        if (state.status == RequestStatus.success) {
          setState(() => _submitted = true);
          final message = state.message ??
              (state.alreadyVoted
                  ? l10n.t('vote.already_voted')
                  : l10n.t('vote.success'));
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: state.alreadyVoted
                  ? Colors.orange.shade700
                  : Colors.green.shade600,
            ),
          );
          context.read<PolicyCubit>().loadPolicy(policy.id);
          context.read<PolicyCubit>().loadPolicies();
          context.read<HistoryCubit>().loadHistory();
        } else if (state.status == RequestStatus.failure) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                state.message ?? l10n.t('vote.error'),
              ),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      },
      builder: (context, voteState) {
        final l10n = AppLocalizations.of(context);
        return BlocBuilder<HistoryCubit, HistoryState>(
          builder: (context, historyState) {
            final historyReady = historyState.status == RequestStatus.success;
            final alreadyVoted = _submitted ||
                historyState.history.any((item) => item.policyId == policy.id);
            final isLoading = voteState.status == RequestStatus.loading;
            final checkingHistory = policy.canVote && !historyReady;
            final canVote = policy.canVote && historyReady && !alreadyVoted;

            return AppCard(
              margin: EdgeInsets.zero,
              padding: const EdgeInsets.all(24),
              color: canVote ? AppTheme.primary.withValues(alpha: 0.05) : null,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        alreadyVoted
                            ? Icons.check_circle_rounded
                            : checkingHistory
                                ? Icons.manage_search_rounded
                                : policy.canVote
                                    ? Icons.feedback_rounded
                                    : Icons.pause_circle_filled_rounded,
                        color: alreadyVoted
                            ? Colors.green.shade600
                            : checkingHistory
                                ? Colors.orange.shade700
                                : policy.canVote
                                    ? AppTheme.primary
                                    : AppTheme.mutedText,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          alreadyVoted
                              ? l10n.t('vote.already_voted')
                              : checkingHistory
                                  ? l10n.t('vote.checking_history')
                                  : title,
                          style:
                              Theme.of(context).textTheme.titleLarge?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0,
                                  ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    alreadyVoted
                        ? l10n.t('vote.already_voted')
                        : checkingHistory
                            ? l10n.t('vote.checking_history_message')
                            : message,
                    style: TextStyle(
                      color: AppTheme.text.withValues(alpha: 0.7),
                      height: 1.5,
                      fontSize: 14,
                    ),
                  ),
                  if (canVote) ...[
                    const SizedBox(height: 24),
                    Text(
                      _pollTypeLabel,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                    const SizedBox(height: 18),
                    _buildVoteWidget(),
                  ],
                  const SizedBox(height: 24),
                  AppButton(
                    label: alreadyVoted
                        ? l10n.t('vote.already_voted')
                        : checkingHistory
                            ? l10n.t('vote.checking_history')
                            : l10n.t('vote.submit'),
                    icon: alreadyVoted
                        ? Icons.check_circle_outline_rounded
                        : checkingHistory
                            ? Icons.manage_search_rounded
                            : Icons.send_rounded,
                    loading: isLoading || checkingHistory,
                    onPressed: canVote && _canSubmit && !isLoading
                        ? () => context.read<VoteCubit>().submitVote(
                              policyId: policy.id,
                              value: _voteValue,
                            )
                        : null,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildVoteWidget() {
    switch (widget.policy.pollType) {
      case 'binary':
        return BinaryVoteWidget(
          value: _voteValue as String?,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'approval':
        return ApprovalVoteWidget(
          value: _voteValue as String?,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'likert':
        return LikertVoteWidget(
          value: _voteValue as int?,
          labels: widget.policy.likertLabels ?? [],
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'multipleChoice':
        return MultipleChoiceVoteWidget(
          options: widget.policy.pollOptions ?? [],
          selectedIds: _voteValue as List<String>,
          maxSelections: widget.policy.maxSelections ?? 1,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'rankedChoice':
        return RankedChoiceVoteWidget(
          options: widget.policy.pollOptions ?? [],
          rankedIds: _voteValue as List<String>,
          maxRank: widget.policy.rankedChoiceMaxRank ?? 3,
          onChanged: (value) => setState(() => _voteValue = value),
        );
      case 'rating':
      default:
        return Center(
          child: RatingStars(
            rating: _voteValue as int? ?? 5,
            onChanged: (value) => setState(() => _voteValue = value),
            size: 40,
          ),
        );
    }
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.label,
    this.iconColor,
    this.backgroundColor,
    this.textColor,
  });

  final IconData icon;
  final String label;
  final Color? iconColor;
  final Color? backgroundColor;
  final Color? textColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppTheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: iconColor ?? AppTheme.primary),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: textColor ?? AppTheme.primary,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppTheme.mutedText),
        const SizedBox(width: 12),
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.mutedText,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: AppTheme.text,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }
}

class _CommentsTab extends StatelessWidget {
  const _CommentsTab({required this.policy});

  final Policy policy;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => CommentCubit(serviceLocator<CitizenRepository>()),
      child: Builder(
        builder: (context) => Column(
          children: [
            PostCommentWidget(
              policyId: policy.id,
              onCommentPosted: () {
                print('[PolicyDetailPage] onCommentPosted callback triggered');
                print(
                    '[PolicyDetailPage] Reloading comments for policy: ${policy.id}');
                context.read<CommentCubit>().loadComments(
                      policyId: policy.id,
                      refresh: true,
                    );
              },
            ),
            Expanded(
              child: CommentListWidget(policyId: policy.id),
            ),
          ],
        ),
      ),
    );
  }
}
