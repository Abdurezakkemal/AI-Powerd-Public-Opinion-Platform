import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/layout/responsive_layout.dart';
import '../../../../core/state/request_status.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/policy_card_with_translation.dart';
import '../../domain/entities/policy.dart';
import '../cubit/history_cubit.dart';
import '../cubit/policy_cubit.dart';
import '../cubit/profile_cubit.dart';
import '../cubit/vote_cubit.dart';
import '../widgets/status_pill.dart';
import 'policy_detail_page.dart';

class PolicyListPage extends StatelessWidget {
  const PolicyListPage({super.key});

  @override
  Widget build(BuildContext context) {
    final pagePadding = ResponsiveLayout.pagePadding(context);
    final maxWidth = ResponsiveLayout.contentMaxWidth(context);
    final headerButtonSize = ResponsiveLayout.circularButtonSize(context);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: RefreshIndicator(
        onRefresh: () => context.read<PolicyCubit>().loadPolicies(),
        color: AppTheme.primary,
        backgroundColor: AppTheme.surfaceFor(context),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // Custom Elevated Header
            SliverToBoxAdapter(
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.surfaceFor(context),
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
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      pagePadding,
                      8,
                      pagePadding,
                      8,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          AppLocalizations.of(context).t('policies'),
                          style: TextStyle(
                            fontSize: ResponsiveLayout.headerTitleSize(context),
                            fontWeight: FontWeight.w900,
                            color: AppTheme.textFor(context),
                            letterSpacing: 0,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          width: headerButtonSize,
                          height: headerButtonSize,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: IconButton(
                            tooltip: 'Refresh',
                            onPressed: () =>
                                context.read<PolicyCubit>().loadPolicies(),
                            icon: const Icon(
                              Icons.refresh_rounded,
                              color: AppTheme.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 6)),
            const SliverToBoxAdapter(child: _PolicyHeader()),
            const SliverToBoxAdapter(child: SizedBox(height: 4)),
            const SliverToBoxAdapter(child: _FilterChips()),
            BlocBuilder<PolicyCubit, PolicyState>(
              builder: (context, state) {
                if (state.status == RequestStatus.loading &&
                    state.policies.isEmpty) {
                  return const SliverFillRemaining(
                    child: Center(child: CircularProgressIndicator()),
                  );
                }

                if (state.status == RequestStatus.failure &&
                    state.policies.isEmpty) {
                  return SliverFillRemaining(
                    child: ErrorView(
                      message: state.message ?? 'Failed to load policies.',
                      onRetry: () => context.read<PolicyCubit>().loadPolicies(),
                    ),
                  );
                }

                if (state.policies.isEmpty) {
                  return SliverFillRemaining(
                    child: EmptyState(
                      icon: Icons.policy_outlined,
                      title: AppLocalizations.of(context).t('policies.empty'),
                      message: AppLocalizations.of(context)
                          .t('policies.empty_message'),
                    ),
                  );
                }

                return SliverPadding(
                  padding: EdgeInsets.fromLTRB(
                    pagePadding,
                    0,
                    pagePadding,
                    110,
                  ),
                  sliver: SliverToBoxAdapter(
                    child: Center(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(maxWidth: maxWidth),
                        child: ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount:
                              state.policies.length + (state.hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index >= state.policies.length) {
                              return Padding(
                                padding: const EdgeInsets.only(top: 12),
                                child: OutlinedButton.icon(
                                  onPressed: () =>
                                      context.read<PolicyCubit>().loadPolicies(
                                            refresh: false,
                                          ),
                                  icon: const Icon(Icons.expand_more_rounded),
                                  label: Text(
                                    AppLocalizations.of(
                                      context,
                                    ).t('policies.load_more'),
                                  ),
                                ),
                              );
                            }
                            final policy = state.policies[index];
                            return _PolicyCard(
                              policy: policy,
                              onTap: () => _openPolicy(context, policy),
                            );
                          },
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _openPolicy(BuildContext context, Policy policy) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => MultiBlocProvider(
          providers: [
            BlocProvider.value(value: context.read<PolicyCubit>()),
            BlocProvider.value(value: context.read<VoteCubit>()),
            BlocProvider.value(value: context.read<HistoryCubit>()),
          ],
          child: PolicyDetailPage(
            policyId: policy.id,
            initialPolicy: policy,
          ),
        ),
      ),
    );
  }
}

class _PolicyHeader extends StatelessWidget {
  const _PolicyHeader();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: ResponsiveLayout.pagePadding(context),
      ),
      child: BlocBuilder<ProfileCubit, ProfileState>(
        builder: (context, state) {
          final region =
              state.profile?.region ?? l10n.t('policies.your_region');
          return Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: LinearGradient(
                colors: [
                  AppTheme.primary.withValues(alpha: 0.9),
                  AppTheme.primary.withValues(alpha: 0.65),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  blurRadius: 30,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: ResponsiveLayout.isTablet(context) ? 60 : 54,
                  height: ResponsiveLayout.isTablet(context) ? 60 : 54,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                        color: Colors.white.withValues(alpha: 0.2), width: 1),
                  ),
                  child: const Icon(
                    Icons.location_city_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.t('policies.citizen_workspace'),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0,
                          fontSize:
                              ResponsiveLayout.secondaryBodyFontSize(context),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        region,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0,
                              fontSize:
                                  ResponsiveLayout.headerTitleSize(context) - 6,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips();

  static const List<String> availableTopics = [
    'Health',
    'Education',
    'Water Supply',
    'Electricity',
    'Housing',
    'Transport',
    'Roads',
    'Digital Infrastructure',
    'Agriculture',
    'Environment',
    'Climate Change',
    'Economy',
    'Employment',
    'Small Business',
    'Industry',
    'Trade',
    'Tourism',
    'Social Protection',
    'Food Security',
    'Poverty Reduction',
    'Governance',
    'Justice',
    'Public Safety',
    'Urban Planning',
    'Rural Development',
    'Youth',
    'Women Affairs',
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final pagePadding = ResponsiveLayout.pagePadding(context);
    final maxWidth = ResponsiveLayout.contentMaxWidth(context);
    return BlocBuilder<PolicyCubit, PolicyState>(
      builder: (context, state) {
        return Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.symmetric(horizontal: pagePadding),
                  child: Row(
                    children: [
                      _statusChip(
                        context,
                        l10n.t('policies.all'),
                        'all',
                        state.filter,
                      ),
                      const SizedBox(width: 10),
                      _statusChip(
                        context,
                        l10n.t('policies.active'),
                        'active',
                        state.filter,
                      ),
                      const SizedBox(width: 10),
                      _statusChip(
                        context,
                        l10n.t('policies.closed'),
                        'paused',
                        state.filter,
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 1,
                        height: 24,
                        color: AppTheme.borderFor(context),
                      ),
                      const SizedBox(width: 10),
                      ActionChip(
                        onPressed: () =>
                            _showTopicFilterSheet(context, state.topicFilters),
                        avatar: const Icon(Icons.tune_rounded, size: 18),
                        label: Text(
                          state.topicFilters.isEmpty
                              ? l10n.t('policies.topics')
                              : '${state.topicFilters.length} ${l10n.t('policies.topics')}',
                        ),
                        backgroundColor: state.topicFilters.isEmpty
                            ? AppTheme.surfaceFor(context)
                            : AppTheme.primary.withValues(alpha: 0.1),
                        side: BorderSide(
                          color: state.topicFilters.isEmpty
                              ? AppTheme.borderFor(context)
                              : AppTheme.primary.withValues(alpha: 0.3),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        labelStyle: TextStyle(
                          color: state.topicFilters.isEmpty
                              ? AppTheme.textFor(context)
                              : AppTheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (state.topicFilters.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: EdgeInsets.symmetric(horizontal: pagePadding),
                    child: Row(
                      children: [
                        TextButton.icon(
                          onPressed: () =>
                              context.read<PolicyCubit>().clearTopicFilters(),
                          icon: const Icon(Icons.clear_all_rounded, size: 16),
                          label: Text(l10n.t('policies.clear')),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.redAccent,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            minimumSize: const Size(0, 32),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ...state.topicFilters.map((topic) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: Chip(
                              label: Text(topic),
                              deleteIcon:
                                  const Icon(Icons.close_rounded, size: 16),
                              onDeleted: () => context
                                  .read<PolicyCubit>()
                                  .removeTopicFilter(topic),
                              backgroundColor:
                                  AppTheme.primary.withValues(alpha: 0.08),
                              labelStyle: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                              deleteIconColor: AppTheme.primary,
                              side: BorderSide.none,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 2),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _statusChip(
    BuildContext context,
    String label,
    String value,
    String selected,
  ) {
    final active = selected == value;
    final selectedBackground = AppTheme.isDark(context)
        ? Theme.of(context).colorScheme.primary
        : AppTheme.textFor(context);
    final selectedForeground =
        AppTheme.isDark(context) ? const Color(0xFF06201B) : Colors.white;
    return ChoiceChip(
      label: Text(label),
      selected: active,
      showCheckmark: false,
      labelPadding: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      onSelected: (_) =>
          context.read<PolicyCubit>().loadPolicies(status: value),
      selectedColor: selectedBackground,
      backgroundColor: AppTheme.surfaceFor(context),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: active ? selectedBackground : AppTheme.borderFor(context),
        ),
      ),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      labelStyle: TextStyle(
        color: active ? selectedForeground : AppTheme.mutedTextFor(context),
        fontWeight: FontWeight.w700,
      ),
    );
  }

  void _showTopicFilterSheet(
      BuildContext context, List<String> selectedTopics) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surfaceFor(context),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (sheetContext) {
        final sheetHeight = MediaQuery.sizeOf(sheetContext).height * 0.72;
        return SafeArea(
          child: SizedBox(
            height: sheetHeight,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.t('policies.topics'),
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(sheetContext),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: availableTopics.map((topic) {
                          final isSelected = selectedTopics.contains(topic);
                          return FilterChip(
                            label: Text(topic),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                context.read<PolicyCubit>().addTopicFilter(
                                      topic,
                                    );
                              } else {
                                context.read<PolicyCubit>().removeTopicFilter(
                                      topic,
                                    );
                              }
                              Navigator.pop(sheetContext);
                            },
                            selectedColor:
                                AppTheme.primary.withValues(alpha: 0.15),
                            checkmarkColor: AppTheme.primary,
                            backgroundColor: Theme.of(context)
                                .colorScheme
                                .surfaceContainerHighest,
                            side: BorderSide(
                              color: isSelected
                                  ? AppTheme.primary
                                  : Colors.transparent,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            labelStyle: TextStyle(
                              color: isSelected
                                  ? AppTheme.primary
                                  : AppTheme.textFor(context),
                              fontWeight: FontWeight.w600,
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _PolicyCard extends StatelessWidget {
  const _PolicyCard({required this.policy, required this.onTap});

  final Policy policy;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: PolicyCardWithTranslation(
        title: policy.title,
        description: policy.description,
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusPill(status: policy.status),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    policy.targetRegions.isEmpty
                        ? l10n.t('policies.your_region')
                        : policy.targetRegions.take(2).join(', '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: AppTheme.mutedTextFor(context),
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.subtleFillFor(context),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AppTheme.borderFor(context).withValues(alpha: 0.75),
                ),
              ),
              child: Wrap(
                spacing: 20,
                runSpacing: 12,
                children: [
                  _Metric(icon: Icons.tag_rounded, text: policy.policyCode),
                  _Metric(
                    icon: Icons.event_rounded,
                    text: DateFormatters.compact(policy.endDate),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyle(
            color: AppTheme.textFor(context),
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
