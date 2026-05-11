import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/state/request_status.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/date_formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_view.dart';
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
      appBar: AppBar(
        title: const Text('Policies'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: () => context.read<PolicyCubit>().loadPolicies(),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => context.read<PolicyCubit>().loadPolicies(),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            const SliverToBoxAdapter(child: _PolicyHeader()),
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
                  return const SliverFillRemaining(
                    child: EmptyState(
                      icon: Icons.policy_outlined,
                      title: 'No policies available',
                      message:
                          'Active and paused policies for your region will appear here.',
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  sliver: SliverList.builder(
                    itemCount: state.policies.length + (state.hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= state.policies.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: OutlinedButton.icon(
                            onPressed:
                                () => context.read<PolicyCubit>().loadPolicies(
                                  refresh: false,
                                ),
                            icon: const Icon(Icons.expand_more_rounded),
                            label: const Text('Load more'),
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
        builder:
            (_) => MultiBlocProvider(
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
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: BlocBuilder<ProfileCubit, ProfileState>(
        builder: (context, state) {
          final region = state.profile?.region ?? 'your region';
          return Container(
            margin: EdgeInsets.zero,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                colors: [
                  AppTheme.primary,
                  AppTheme.primary.withValues(alpha: 0.8),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
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
                        'Citizen workspace',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        region,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
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

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<PolicyCubit, PolicyState>(
      builder: (context, state) {
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(16, 2, 16, 8),
          child: Row(
            children: [
              _chip(context, 'All', 'all', state.filter),
              const SizedBox(width: 8),
              _chip(context, 'Active', 'active', state.filter),
              const SizedBox(width: 8),
              _chip(context, 'Paused', 'paused', state.filter),
            ],
          ),
        );
      },
    );
  }

  Widget _chip(
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      onSelected:
          (_) => context.read<PolicyCubit>().loadPolicies(status: value),
      selectedColor: AppTheme.primary,
      backgroundColor: Colors.white,
      shadowColor: Colors.black.withValues(alpha: 0.05),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide.none,
      ),
      labelStyle: TextStyle(
        color: active ? Colors.white : AppTheme.mutedText,
        fontWeight: FontWeight.w800,
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
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  policy.title,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              StatusPill(status: policy.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            policy.description,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppTheme.mutedText, height: 1.35),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              _Metric(icon: Icons.qr_code_2_rounded, text: policy.policyCode),
              if (policy.averageRating != null)
                _Metric(
                  icon: Icons.star_rounded,
                  text: policy.averageRating!.toStringAsFixed(1),
                ),
              _Metric(
                icon: Icons.how_to_vote_outlined,
                text: '${policy.totalVotes} votes',
              ),
              _Metric(
                icon: Icons.event_available_outlined,
                text: DateFormatters.compact(policy.endDate),
              ),
            ],
          ),
        ],
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
        Icon(icon, size: 17, color: AppTheme.primary),
        const SizedBox(width: 5),
        Text(
          text,
          style: const TextStyle(
            color: AppTheme.mutedText,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
