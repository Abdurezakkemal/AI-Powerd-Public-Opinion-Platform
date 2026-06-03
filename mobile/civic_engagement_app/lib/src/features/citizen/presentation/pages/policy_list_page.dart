import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

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
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: RefreshIndicator(
        onRefresh: () => context.read<PolicyCubit>().loadPolicies(),
        color: AppTheme.primary,
        backgroundColor: Colors.white,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
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
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          AppLocalizations.of(context).t('policies'),
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.text,
                            letterSpacing: 0,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          width: 44,
                          height: 44,
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
            const SliverToBoxAdapter(child: SizedBox(height: 10)),
            const SliverToBoxAdapter(child: _PolicyHeader()),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
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
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 110),
                  sliver: SliverList.builder(
                    itemCount: state.policies.length + (state.hasMore ? 1 : 0),
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
                            label: Text(AppLocalizations.of(context)
                                .t('policies.load_more')),
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
      padding: const EdgeInsets.symmetric(horizontal: 20),
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
                  width: 54,
                  height: 54,
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
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        region,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0,
                              fontSize: 22,
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
    'Agriculture',
    'Water',
    'Infrastructure',
    'Health',
    'Education',
    'Transportation',
    'Environment',
    'Economy',
    'Security',
    'Technology',
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return BlocBuilder<PolicyCubit, PolicyState>(
      builder: (context, state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  _statusChip(
                      context, l10n.t('policies.all'), 'all', state.filter),
                  const SizedBox(width: 16),
                  _statusChip(context, l10n.t('policies.active'), 'active',
                      state.filter),
                  const SizedBox(width: 16),
                  _statusChip(context, l10n.t('policies.closed'), 'paused',
                      state.filter),
                  const SizedBox(width: 20),
                  Container(
                    width: 1,
                    height: 30,
                    color: AppTheme.border,
                  ),
                  const SizedBox(width: 16),
                  ActionChip(
                    onPressed: () =>
                        _showTopicFilterSheet(context, state.topicFilters),
                    avatar: const Icon(Icons.tune_rounded, size: 18),
                    label: Text(state.topicFilters.isEmpty
                        ? l10n.t('policies.topics')
                        : '${state.topicFilters.length} ${l10n.t('policies.topics')}'),
                    backgroundColor: state.topicFilters.isEmpty
                        ? Colors.white
                        : AppTheme.primary.withValues(alpha: 0.1),
                    side: BorderSide(
                      color: state.topicFilters.isEmpty
                          ? AppTheme.border
                          : AppTheme.primary.withValues(alpha: 0.3),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    materialTapTargetSize: MaterialTapTargetSize.padded,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    labelStyle: TextStyle(
                      color: state.topicFilters.isEmpty
                          ? AppTheme.text
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
                padding: const EdgeInsets.symmetric(horizontal: 20),
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
                          deleteIcon: const Icon(Icons.close_rounded, size: 16),
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
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 8),
          ],
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
    return ChoiceChip(
      label: Text(label),
      selected: active,
      showCheckmark: false,
      labelPadding: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      onSelected: (_) =>
          context.read<PolicyCubit>().loadPolicies(status: value),
      selectedColor: AppTheme.text,
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: active ? AppTheme.text : AppTheme.border),
      ),
      materialTapTargetSize: MaterialTapTargetSize.padded,
      labelStyle: TextStyle(
        color: active ? Colors.white : AppTheme.mutedText,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  void _showTopicFilterSheet(
      BuildContext context, List<String> selectedTopics) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
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
              const SizedBox(height: 16),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: availableTopics.map((topic) {
                  final isSelected = selectedTopics.contains(topic);
                  return FilterChip(
                    label: Text(topic),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        context.read<PolicyCubit>().addTopicFilter(topic);
                      } else {
                        context.read<PolicyCubit>().removeTopicFilter(topic);
                      }
                      Navigator.pop(sheetContext);
                    },
                    selectedColor: AppTheme.primary.withValues(alpha: 0.15),
                    checkmarkColor: AppTheme.primary,
                    backgroundColor: const Color(0xFFF0F4F8),
                    side: BorderSide(
                      color: isSelected ? AppTheme.primary : Colors.transparent,
                    ),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16)),
                    labelStyle: TextStyle(
                      color: isSelected ? AppTheme.primary : AppTheme.text,
                      fontWeight: FontWeight.w600,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
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
                    style: const TextStyle(
                      color: AppTheme.mutedText,
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
                color: AppTheme.primary.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Wrap(
                spacing: 20,
                runSpacing: 12,
                children: [
                  _Metric(icon: Icons.tag_rounded, text: policy.policyCode),
                  if (policy.averageRating != null)
                    _Metric(
                      icon: Icons.star_rounded,
                      text: policy.averageRating!.toStringAsFixed(1),
                      iconColor: Colors.amber.shade600,
                    ),
                  _Metric(
                    icon: Icons.how_to_vote_rounded,
                    text: '${policy.totalVotes} ${l10n.t('policy.votes')}',
                  ),
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
  const _Metric({required this.icon, required this.text, this.iconColor});

  final IconData icon;
  final String text;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: iconColor ?? AppTheme.primary),
        const SizedBox(width: 6),
        Text(
          text,
          style: const TextStyle(
            color: AppTheme.text,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
